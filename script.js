document.addEventListener('DOMContentLoaded', function() {
    // Mode switching
    const modeBtns = document.querySelectorAll('.mode-btn');
    const sgpaForm = document.getElementById('sgpaForm');
    const cgpaForm = document.getElementById('cgpaForm');
    const resultDiv = document.getElementById('result');
    const cgpaResultDiv = document.getElementById('cgpaResult');

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (mode === 'sgpa') {
                sgpaForm.classList.remove('hidden');
                cgpaForm.classList.add('hidden');
                resultDiv.style.display = 'none';
                cgpaResultDiv.style.display = 'none';
            } else {
                sgpaForm.classList.add('hidden');
                cgpaForm.classList.remove('hidden');
                resultDiv.style.display = 'none';
                cgpaResultDiv.style.display = 'none';
            }
        });
    });

    // SGPA Form Handling
    const addSubjectBtn = document.getElementById('addSubject');
    const subjectsList = document.getElementById('subjectsList');

    // Show remove button for the first subject row if there are multiple rows
    updateRemoveButtons();

    // Add new subject row
    addSubjectBtn.addEventListener('click', () => {
        const subjectRow = document.createElement('div');
        subjectRow.className = 'subject-row';
        subjectRow.innerHTML = `
            <div class="form-group">
                <label>Subject Name:</label>
                <input type="text" name="subjects[]" required>
            </div>
            <div class="form-group">
                <label>Credits:</label>
                <input type="number" name="credits[]" min="1" max="5" required>
            </div>
            <div class="form-group">
                <label>Grade:</label>
                <select name="grades[]" required>
                    <option value="">Select Grade</option>
                    <option value="10.0">EX (91-100) - 10.0</option>
                    <option value="9.0">AA (86-90) - 9.0</option>
                    <option value="8.5">AB (81-85) - 8.5</option>
                    <option value="8.0">BB (76-80) - 8.0</option>
                    <option value="7.5">BC (71-75) - 7.5</option>
                    <option value="7.0">CC (66-70) - 7.0</option>
                    <option value="6.5">CD (61-65) - 6.5</option>
                    <option value="6.0">DD (56-60) - 6.0</option>
                    <option value="5.5">DE (51-55) - 5.5</option>
                    <option value="5.0">EE (40-50) - 5.0</option>
                    <option value="0.0">EF (<40) - 0.0</option>
                </select>
            </div>
            <button type="button" class="remove-btn" onclick="removeSubject(this)">×</button>
        `;
        subjectsList.appendChild(subjectRow);
        updateRemoveButtons();
    });

    // Form submission handling
    sgpaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        try {
            const response = await fetch('calculate.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                displaySGPAResult(data);
            } else {
                showError(data.error || 'An error occurred while calculating SGPA');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to calculate SGPA. Please try again.');
        }
    });

    // CGPA Form Handling
    const addSemesterBtn = document.getElementById('addSemester');
    const semestersList = document.getElementById('semestersList');

    addSemesterBtn.addEventListener('click', () => {
        const semesterRow = document.createElement('div');
        semesterRow.className = 'semester-row';
        semesterRow.innerHTML = `
            <div class="form-group">
                <label>Semester:</label>
                <select name="semesters[]" required>
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                </select>
            </div>
            <div class="form-group">
                <label>SGPA:</label>
                <input type="number" name="sgpas[]" step="0.01" min="0" max="10" required>
            </div>
            <div class="form-group">
                <label>Total Credits:</label>
                <input type="number" name="credits[]" min="1" required>
            </div>
            <button type="button" class="remove-btn" onclick="removeSemester(this)">×</button>
        `;
        semestersList.appendChild(semesterRow);
        updateRemoveSemesterButtons();
    });

    function removeSemester(button) {
        button.parentElement.remove();
        updateRemoveSemesterButtons();
    }

    function updateRemoveSemesterButtons() {
        const removeButtons = document.querySelectorAll('#semestersList .remove-btn');
        removeButtons.forEach(btn => {
            btn.style.display = removeButtons.length > 1 ? 'flex' : 'none';
        });
    }

    // Form Submissions
    cgpaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        try {
            const response = await fetch('calculate_cgpa.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                displayCGPAResult(data);
            } else {
                showError(data.error || 'An error occurred while calculating CGPA');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to calculate CGPA. Please try again.');
        }
    });

    function displaySGPAResult(data) {
        document.getElementById('resultName').textContent = data.studentName;
        document.getElementById('resultRoll').textContent = data.rollNumber;
        document.getElementById('resultSemester').textContent = data.semester;
        document.getElementById('resultSGPA').textContent = data.sgpa;

        // Generate marksheet
        const marksheetContent = document.getElementById('marksheetContent');
        marksheetContent.innerHTML = `
            <table class="marksheet-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Credits</th>
                        <th>Grade</th>
                        <th>Grade Points</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.subjects.map((subject, index) => `
                        <tr>
                            <td>${subject}</td>
                            <td>${data.credits[index]}</td>
                            <td>${data.grades[index]}</td>
                            <td>${data.gradePoints[index]}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2"><strong>Total Credits:</strong> ${data.totalCredits}</td>
                        <td colspan="2"><strong>SGPA:</strong> ${data.sgpa}</td>
                    </tr>
                </tfoot>
            </table>
        `;

        resultDiv.style.display = 'block';
        cgpaResultDiv.style.display = 'none';
    }

    function displayCGPAResult(data) {
        document.getElementById('cgpaResultName').textContent = data.studentName;
        document.getElementById('cgpaResultRoll').textContent = data.rollNumber;
        document.getElementById('resultCGPA').textContent = data.cgpa;

        // Generate semester breakdown
        const breakdownContent = document.getElementById('breakdownContent');
        breakdownContent.innerHTML = `
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Semester</th>
                        <th>SGPA</th>
                        <th>Credits</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.semesterBreakdown.map(record => `
                        <tr>
                            <td>Semester ${record.semester}</td>
                            <td>${record.sgpa}</td>
                            <td>${record.credits}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>CGPA: ${data.cgpa}</strong></td>
                        <td><strong>${data.totalCredits}</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;

        resultDiv.style.display = 'none';
        cgpaResultDiv.style.display = 'block';
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const activeForm = document.querySelector('form:not(.hidden)');
        activeForm.insertBefore(errorDiv, activeForm.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Print and Download Functions
    window.printMarksheet = function() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>SGPA Marksheet</title>
                    <link rel="stylesheet" href="style.css">
                    <style>
                        body { padding: 20px; }
                        .marksheet-table { width: 100%; border-collapse: collapse; }
                        .marksheet-table th, .marksheet-table td { 
                            padding: 10px; 
                            border: 1px solid #ddd; 
                            text-align: left; 
                        }
                        .marksheet-table th { background: #f5f5f5; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="calculator-card">
                        <h1>SGPA Marksheet</h1>
                        <div class="student-details">
                            <p><strong>Student Name:</strong> ${document.getElementById('resultName').textContent}</p>
                            <p><strong>Roll Number:</strong> ${document.getElementById('resultRoll').textContent}</p>
                            <p><strong>Semester:</strong> ${document.getElementById('resultSemester').textContent}</p>
                            <p><strong>SGPA:</strong> ${document.getElementById('resultSGPA').textContent}</p>
                        </div>
                        ${document.getElementById('marksheetContent').innerHTML}
                        <div class="no-print" style="text-align: center; margin-top: 20px;">
                            <button onclick="window.print()">Print</button>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    window.downloadMarksheet = function() {
        // Implementation for PDF download
        alert('PDF download functionality will be implemented here');
    };

    window.printCGPAReport = function() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>CGPA Report</title>
                    <link rel="stylesheet" href="style.css">
                    <style>
                        body { padding: 20px; }
                        .breakdown-table { width: 100%; border-collapse: collapse; }
                        .breakdown-table th, .breakdown-table td { 
                            padding: 10px; 
                            border: 1px solid #ddd; 
                            text-align: left; 
                        }
                        .breakdown-table th { background: #f5f5f5; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="calculator-card">
                        <h1>CGPA Report</h1>
                        <div class="student-details">
                            <p><strong>Student Name:</strong> ${document.getElementById('cgpaResultName').textContent}</p>
                            <p><strong>Roll Number:</strong> ${document.getElementById('cgpaResultRoll').textContent}</p>
                            <p><strong>CGPA:</strong> ${document.getElementById('resultCGPA').textContent}</p>
                        </div>
                        ${document.getElementById('breakdownContent').innerHTML}
                        <div class="no-print" style="text-align: center; margin-top: 20px;">
                            <button onclick="window.print()">Print</button>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    window.downloadCGPAReport = function() {
        // Implementation for PDF download
        alert('PDF download functionality will be implemented here');
    };
});

// Remove subject row
function removeSubject(button) {
    const subjectRow = button.parentElement;
    subjectRow.remove();
    updateRemoveButtons();
}

// Update remove buttons visibility
function updateRemoveButtons() {
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(button => {
        button.style.display = removeButtons.length > 1 ? 'flex' : 'none';
    });
}

// Form validation
function validateForm() {
    const form = document.getElementById('sgpaForm');
    const subjectRows = document.querySelectorAll('.subject-row');
    
    // Check if at least one subject is added
    if (subjectRows.length === 0) {
        showError('Please add at least one subject.');
        return false;
    }

    // Validate each subject row
    for (let row of subjectRows) {
        const inputs = row.querySelectorAll('input, select');
        for (let input of inputs) {
            if (!input.value) {
                showError('Please fill in all subject details.');
                input.focus();
                return false;
            }
        }

        // Validate credits
        const creditInput = row.querySelector('input[name="credits[]"]');
        const credits = parseInt(creditInput.value);
        if (credits < 1 || credits > 5) {
            showError('Credits must be between 1 and 5.');
            creditInput.focus();
            return false;
        }

        // Validate grade
        const gradeSelect = row.querySelector('select[name="grades[]"]');
        if (!gradeSelect.value) {
            showError('Please select a valid grade for all subjects.');
            gradeSelect.focus();
            return false;
        }
    }

    return true;
}

// Display result
function displayResult(data) {
    const resultContainer = document.getElementById('result');
    const resultName = document.getElementById('resultName');
    const resultRoll = document.getElementById('resultRoll');
    const resultSGPA = document.getElementById('resultSGPA');

    resultName.textContent = data.studentName;
    resultRoll.textContent = data.rollNumber;
    resultSGPA.textContent = data.sgpa.toFixed(2);

    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth' });
} 