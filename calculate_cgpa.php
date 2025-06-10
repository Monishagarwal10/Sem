<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Log received data
    error_log("Received POST data: " . print_r($_POST, true));

    // Validate required fields
    if (!isset($_POST['studentName']) || !isset($_POST['rollNumber']) || 
        !isset($_POST['semesters']) || !isset($_POST['sgpas']) || !isset($_POST['credits'])) {
        throw new Exception('Missing required fields');
    }

    // Validate array lengths
    if (count($_POST['semesters']) !== count($_POST['sgpas']) || 
        count($_POST['sgpas']) !== count($_POST['credits'])) {
        throw new Exception('Invalid data: array lengths do not match');
    }

    // Calculate CGPA
    $totalCredits = 0;
    $weightedSum = 0;
    $semesterBreakdown = [];

    for ($i = 0; $i < count($_POST['semesters']); $i++) {
        $semester = $_POST['semesters'][$i];
        $sgpa = floatval($_POST['sgpas'][$i]);
        $credits = intval($_POST['credits'][$i]);

        // Validate SGPA and credits
        if ($sgpa < 0 || $sgpa > 10) {
            throw new Exception("Invalid SGPA value for Semester $semester");
        }
        if ($credits <= 0) {
            throw new Exception("Invalid credits value for Semester $semester");
        }

        $weightedSum += ($sgpa * $credits);
        $totalCredits += $credits;

        $semesterBreakdown[] = [
            'semester' => $semester,
            'sgpa' => $sgpa,
            'credits' => $credits
        ];
    }

    if ($totalCredits === 0) {
        throw new Exception('Total credits cannot be zero');
    }

    $cgpa = $weightedSum / $totalCredits;
    $cgpa = round($cgpa, 2);

    // Prepare response
    $response = [
        'success' => true,
        'studentName' => $_POST['studentName'],
        'rollNumber' => $_POST['rollNumber'],
        'cgpa' => $cgpa,
        'totalCredits' => $totalCredits,
        'semesterBreakdown' => $semesterBreakdown
    ];

    // Try to save to database if configured
    if (file_exists('db_config.php')) {
        try {
            require_once 'db_config.php';
            $conn = new mysqli($host, $username, $password, $database);

            if ($conn->connect_error) {
                throw new Exception("Database connection failed: " . $conn->connect_error);
            }

            // Save CGPA record
            $stmt = $conn->prepare("INSERT INTO cgpa_records (student_name, roll_number, cgpa, total_credits, created_at) VALUES (?, ?, ?, ?, NOW())");
            $stmt->bind_param("ssdi", $_POST['studentName'], $_POST['rollNumber'], $cgpa, $totalCredits);
            $stmt->execute();
            $cgpaId = $conn->insert_id;

            // Save semester breakdown
            $stmt = $conn->prepare("INSERT INTO semester_records (cgpa_id, semester, sgpa, credits) VALUES (?, ?, ?, ?)");
            foreach ($semesterBreakdown as $record) {
                $stmt->bind_param("isdi", $cgpaId, $record['semester'], $record['sgpa'], $record['credits']);
                $stmt->execute();
            }

            $stmt->close();
            $conn->close();
        } catch (Exception $e) {
            error_log("Database error: " . $e->getMessage());
            // Continue with the response even if database save fails
        }
    }

    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in calculate_cgpa.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => [
            'php_version' => PHP_VERSION,
            'post_data' => $_POST
        ]
    ]);
}
?> 