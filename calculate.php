<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Function to calculate SGPA
function calculateSGPA($subjects, $credits, $grades) {
    $totalCredits = 0;
    $totalGradePoints = 0;

    for ($i = 0; $i < count($subjects); $i++) {
        $credit = intval($credits[$i]);
        $gradePoint = floatval($grades[$i]);
        
        // Validate credit range
        if ($credit < 1 || $credit > 5) {
            throw new Exception('Invalid credit value. Credits must be between 1 and 5.');
        }

        // Validate grade point
        $validGrades = [10.0, 9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.0, 0.0];
        if (!in_array($gradePoint, $validGrades)) {
            throw new Exception('Invalid grade point value: ' . $gradePoint);
        }
        
        $totalCredits += $credit;
        $totalGradePoints += ($credit * $gradePoint);
    }

    if ($totalCredits === 0) {
        return 0;
    }

    return $totalGradePoints / $totalCredits;
}

// Function to save to database
function saveToDatabase($studentName, $rollNumber, $sgpa) {
    try {
        if (!file_exists('db_config.php')) {
            return false;
        }
        
        require_once 'db_config.php';
        
        $stmt = $conn->prepare("INSERT INTO sgpa_records (student_name, roll_number, sgpa, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->bind_param("ssd", $studentName, $rollNumber, $sgpa);
        
        if ($stmt->execute()) {
            return true;
        }
        return false;
    } catch (Exception $e) {
        error_log("Database Error: " . $e->getMessage());
        return false;
    }
}

// Main execution
try {
    // Log the received data
    error_log("Received POST data: " . print_r($_POST, true));

    // Validate input
    if (!isset($_POST['studentName']) || !isset($_POST['rollNumber']) || 
        !isset($_POST['subjects']) || !isset($_POST['credits']) || !isset($_POST['grades'])) {
        throw new Exception('Missing required fields. Received: ' . implode(', ', array_keys($_POST)));
    }

    $studentName = trim($_POST['studentName']);
    $rollNumber = trim($_POST['rollNumber']);
    $subjects = $_POST['subjects'];
    $credits = $_POST['credits'];
    $grades = $_POST['grades'];

    // Validate student name
    if (empty($studentName)) {
        throw new Exception('Student name is required');
    }

    // Validate roll number
    if (empty($rollNumber)) {
        throw new Exception('Roll number is required');
    }

    // Validate arrays
    if (count($subjects) !== count($credits) || count($subjects) !== count($grades)) {
        throw new Exception('Invalid subject data. Subjects: ' . count($subjects) . 
                          ', Credits: ' . count($credits) . 
                          ', Grades: ' . count($grades));
    }

    // Calculate SGPA
    $sgpa = calculateSGPA($subjects, $credits, $grades);

    // Try to save to database (if configured)
    $saved = false;
    if (file_exists('db_config.php')) {
        $saved = saveToDatabase($studentName, $rollNumber, $sgpa);
    }

    // Return success response
    echo json_encode([
        'success' => true,
        'studentName' => $studentName,
        'rollNumber' => $rollNumber,
        'sgpa' => $sgpa,
        'saved' => $saved
    ]);

} catch (Exception $e) {
    // Log the error
    error_log("SGPA Calculator Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug_info' => [
            'php_version' => PHP_VERSION,
            'post_data' => $_POST,
            'error' => $e->getMessage()
        ]
    ]);
}
?> 