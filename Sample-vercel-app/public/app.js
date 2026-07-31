document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('lookup-form');
  const rollInput = document.getElementById('roll-no');
  const nameInput = document.getElementById('student-name');
  
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  
  const messageContainer = document.getElementById('message-container');
  const messageText = document.getElementById('message-text');
  
  const resultsCard = document.getElementById('results-card');
  const resName = document.getElementById('res-name');
  const resRoll = document.getElementById('res-roll');
  const resStatus = document.getElementById('res-status');
  const resPercentage = document.getElementById('res-percentage');
  const resTotal = document.getElementById('res-total');
  const resGrade = document.getElementById('res-grade');
  
  const radialBar = document.getElementById('radial-bar');
  
  // Subject elements maps
  const subjects = ['maths', 'physics', 'chemistry', 'english', 'cs'];

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rollNo = rollInput.value.trim();
    const name = nameInput.value.trim();
    
    if (!rollNo || !name) {
      showError('Please enter both Roll Number and Full Name.');
      return;
    }
    
    await performLookup(rollNo, name);
  });

  // Setup sample chips action
  const chips = document.querySelectorAll('.profile-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', async () => {
      const roll = chip.getAttribute('data-roll');
      const name = chip.getAttribute('data-name');
      
      rollInput.value = roll;
      nameInput.value = name;
      
      // Highlight the active input fields visually
      rollInput.focus();
      nameInput.focus();
      
      await performLookup(roll, name);
    });
  });

  // Query Backend Function
  async function performLookup(rollNo, name) {
    setLoading(true);
    hideError();
    hideResults();
    
    try {
      // Build API query URL
      const url = `/api/lookup?roll_no=${encodeURIComponent(rollNo)}&name=${encodeURIComponent(name)}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to retrieve record.');
      }
      
      if (result.success && result.data) {
        renderStudentDashboard(result.data);
      } else {
        throw new Error('Invalid response structure from backend.');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Render Data inside UI Elements
  function renderStudentDashboard(student) {
    // Fill basic details
    resName.textContent = student.name;
    resRoll.textContent = student.roll_no;
    resTotal.textContent = `${student.total} / 500`;
    
    const percentage = student.percentage;
    resPercentage.textContent = `${percentage.toFixed(1)}%`;
    
    // Determine overall academic status and division grade
    let gradeStr = 'Passed';
    let statusClass = 'label-success';
    let isPassed = true;
    
    if (percentage >= 90) {
      gradeStr = 'Distinction (First Class with Distinction)';
    } else if (percentage >= 75) {
      gradeStr = 'First Class';
    } else if (percentage >= 60) {
      gradeStr = 'Second Class';
    } else if (percentage >= 40) {
      gradeStr = 'Pass Class';
    } else {
      gradeStr = 'Failed';
      statusClass = 'label-fail';
      isPassed = false;
    }
    
    resGrade.textContent = gradeStr;
    resStatus.textContent = isPassed ? 'PASSED' : 'FAILED';
    resStatus.className = `status-badge ${statusClass}`;
    
    // Animate radial progress ring
    // Total stroke-dasharray = 314.16 (2 * pi * r = 2 * 3.1416 * 50)
    const circlePerimeter = 314.16;
    const offset = circlePerimeter - (circlePerimeter * (percentage / 100));
    radialBar.style.strokeDashoffset = offset;
    
    // Choose radial color based on pass status
    if (isPassed) {
      if (percentage >= 90) {
        radialBar.style.stroke = '#f59e0b'; // Gold glow for distinction
      } else {
        radialBar.style.stroke = '#6366f1'; // Indigo standard
      }
    } else {
      radialBar.style.stroke = '#ef4444'; // Red for fail
    }

    // Fill Subject Scores and progress bars
    subjects.forEach(sub => {
      // Find key matching CSV names
      let dataKey = sub;
      if (sub === 'maths') dataKey = 'Maths';
      if (sub === 'physics') dataKey = 'Physics';
      if (sub === 'chemistry') dataKey = 'Chemistry';
      if (sub === 'english') dataKey = 'English';
      if (sub === 'cs') dataKey = 'Computer Science';
      
      const score = student.marks[dataKey] || 0;
      
      // Update text
      document.getElementById(`score-${sub}`).textContent = `${score}/100`;
      
      // Animate progress bar width
      const bar = document.getElementById(`bar-${sub}`);
      bar.style.width = '0%'; // Reset first
      setTimeout(() => {
        bar.style.width = `${score}%`;
      }, 50);
    });
    
    // Reveal Dashboard Card
    resultsCard.classList.remove('hidden');
  }

  // Loading States
  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnText.classList.add('hidden');
      btnLoader.classList.remove('hidden');
    } else {
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  }

  // Notification Helpers
  function showError(msg) {
    messageText.textContent = msg;
    messageContainer.classList.remove('hidden');
  }

  function hideError() {
    messageContainer.classList.add('hidden');
    messageText.textContent = '';
  }

  function hideResults() {
    resultsCard.classList.add('hidden');
  }
});
