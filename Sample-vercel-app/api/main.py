import os
import csv
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Student Marks Lookup API",
    description="A simple API to search for student marks using Roll Number and Name.",
    version="1.0.0"
)

# Enable CORS for local testing and cross-origin queries
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve path relative to this file: api/main.py -> ../data/students.csv
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'data', 'students.csv')

def load_students_data():
    students = []
    if not os.path.exists(CSV_PATH):
        return students
    
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Strip keys and values to ensure clean data lookup
            cleaned_row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
            students.append(cleaned_row)
    return students

# Cache in memory
STUDENTS_DB = load_students_data()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database_connected": os.path.exists(CSV_PATH),
        "total_records": len(STUDENTS_DB)
    }

@app.get("/api/lookup")
def lookup_student(
    roll_no: str = Query(..., description="Roll Number of the student"),
    name: str = Query(..., description="Full Name of the student")
):
    if not roll_no or not name:
        raise HTTPException(
            status_code=400,
            detail="Both Roll Number and Name are required for lookup."
        )
    
    # Normalize query inputs
    search_roll = roll_no.strip().lower()
    search_name = name.strip().lower()

    # Search for the student record
    for student in STUDENTS_DB:
        row_roll = student.get("Roll No", "").strip().lower()
        row_name = student.get("Name", "").strip().lower()
        
        if row_roll == search_roll and row_name == search_name:
            # Return student details
            return {
                "success": True,
                "data": {
                    "roll_no": student.get("Roll No"),
                    "name": student.get("Name"),
                    "marks": {
                        "Maths": int(student.get("Maths", 0)),
                        "Physics": int(student.get("Physics", 0)),
                        "Chemistry": int(student.get("Chemistry", 0)),
                        "English": int(student.get("English", 0)),
                        "Computer Science": int(student.get("Computer Science", 0))
                    },
                    "total": int(student.get("Total", 0)),
                    "percentage": float(student.get("Percentage", 0))
                }
            }

    # If student is not found
    raise HTTPException(
        status_code=404,
        detail=f"No record found matching Roll No '{roll_no}' and Name '{name}'."
    )

# Serve static files from /public for local testing (not active on production Vercel)
if not os.environ.get("VERCEL"):
    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    public_path = os.path.join(BASE_DIR, 'public')

    @app.get("/")
    def read_root():
        index_path = os.path.join(BASE_DIR, 'public', 'index.html')
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="index.html not found")

    # Mount AFTER the explicit route so registered routes take priority
    if os.path.exists(public_path):
        app.mount("/static", StaticFiles(directory=public_path), name="public")
