<?php
// Database configuration
$db_host = 'localhost';
$db_user = 'your_username';
$db_pass = 'your_password';
$db_name = 'sgpa_calculator';

// Create connection
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create table if not exists
$sql = "CREATE TABLE IF NOT EXISTS sgpa_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(20) NOT NULL,
    sgpa DECIMAL(4,2) NOT NULL,
    created_at DATETIME NOT NULL
)";

if (!$conn->query($sql)) {
    die("Error creating table: " . $conn->error);
}
?> 