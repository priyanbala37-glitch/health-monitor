CREATE DATABASE IF NOT EXISTS health_monitor;
USE health_monitor;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('staff', 'family') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE residents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender ENUM('M','F','O'),
  room_no VARCHAR(20),
  conditions TEXT,
  baseline_hr INT DEFAULT 75,
  baseline_spo2 INT DEFAULT 97,
  baseline_temp DECIMAL(4,1) DEFAULT 98.6,
  baseline_bp_sys INT DEFAULT 120,
  baseline_bp_dia INT DEFAULT 80,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vitals_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resident_id INT NOT NULL,
  heart_rate INT,
  spo2 INT,
  temperature DECIMAL(4,1),
  bp_systolic INT,
  bp_diastolic INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_anomaly BOOLEAN DEFAULT FALSE,
  anomaly_reason VARCHAR(255),
  FOREIGN KEY (resident_id) REFERENCES residents(id)
);

CREATE TABLE medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resident_id INT NOT NULL,
  med_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50),
  time_of_day TIME NOT NULL,
  frequency ENUM('daily','alternate','weekly') DEFAULT 'daily',
  FOREIGN KEY (resident_id) REFERENCES residents(id)
);

CREATE TABLE medicine_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id INT NOT NULL,
  scheduled_date DATE NOT NULL,
  status ENUM('pending','taken','missed') DEFAULT 'pending',
  marked_at TIMESTAMP NULL,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resident_id INT NOT NULL,
  type ENUM('vitals','missed_medicine') NOT NULL,
  message VARCHAR(255),
  severity ENUM('low','medium','high') DEFAULT 'medium',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resident_id) REFERENCES residents(id)
);