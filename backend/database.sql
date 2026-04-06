-- Crisis Management & Alert System Database Schema

CREATE DATABASE IF NOT EXISTS crisis_management;
USE crisis_management;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'operator', 'viewer') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('critical', 'warning', 'info') NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status ENUM('active', 'resolved') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('high', 'medium', 'low') NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status ENUM('active', 'investigating', 'resolved') DEFAULT 'active',
    reported_by INT,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('alert', 'incident', 'system') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@crisis.system', '$2a$10$rXKvkW8fW8fW8fW8fW8fW.eKzW8fW8fW8fW8fW8fW8fW8fW8fW8fWO', 'admin');

-- Insert sample emergency contacts
INSERT INTO emergency_contacts (name, role, phone, email, department) VALUES 
('John Smith', 'Fire Chief', '+1-555-0101', 'john.smith@fire.dept', 'Fire Department'),
('Sarah Johnson', 'Police Commissioner', '+1-555-0102', 'sarah.johnson@police.dept', 'Police Department'),
('Dr. Michael Chen', 'Emergency Medical Director', '+1-555-0103', 'michael.chen@hospital.org', 'Medical Services'),
('Emily Rodriguez', 'Disaster Management Coordinator', '+1-555-0104', 'emily.rodriguez@disaster.mgmt', 'Emergency Management');

-- Insert sample alerts
INSERT INTO alerts (title, description, type, location, status, created_by) VALUES 
('Earthquake Alert - Magnitude 5.2', 'Seismic activity detected in the northern region. Immediate evacuation recommended.', 'critical', 'Northern District', 'active', 1),
('Flash Flood Warning', 'Heavy rainfall expected in the next 2 hours. Stay away from low-lying areas.', 'warning', 'Riverside Area', 'active', 1),
('Power Outage Notification', 'Scheduled maintenance will cause temporary power outage in select areas.', 'info', 'Downtown', 'resolved', 1);

-- Insert sample incidents
INSERT INTO incidents (title, description, severity, location, status, reported_by) VALUES 
('Building Fire - Commercial Complex', 'Fire reported on the 5th floor of the main commercial building. Emergency services dispatched.', 'high', '123 Main Street', 'active', 1),
('Medical Emergency - Shopping Mall', 'Multiple casualties reported. Medical teams on site providing assistance.', 'medium', 'Central Mall', 'investigating', 1),
('Traffic Accident - Highway', 'Minor collision on Highway 101. No serious injuries reported.', 'low', 'Highway 101, Mile 45', 'resolved', 1);

-- =============================================
-- NEW TABLES: Disaster Reports, Volunteers, Donations
-- =============================================

-- Disaster Reports Table
CREATE TABLE IF NOT EXISTS disaster_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('flood', 'fire', 'earthquake', 'cyclone', 'landslide', 'tsunami', 'drought', 'other') NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    status ENUM('reported', 'verified', 'responding', 'resolved') DEFAULT 'reported',
    severity ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
    image_url VARCHAR(500),
    reported_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    skills VARCHAR(255),
    location VARCHAR(255),
    availability ENUM('available', 'busy', 'offline') DEFAULT 'available',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Donations Table
CREATE TABLE IF NOT EXISTS donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_name VARCHAR(100) NOT NULL,
    donor_email VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(255),
    payment_method ENUM('razorpay', 'upi') DEFAULT 'razorpay',
    upi_reference VARCHAR(255),
    status ENUM('created', 'paid', 'failed') DEFAULT 'created',
    disaster_report_id INT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disaster_report_id) REFERENCES disaster_reports(id) ON DELETE SET NULL
);

-- Insert sample disaster reports
INSERT INTO disaster_reports (title, description, category, latitude, longitude, location_name, status, severity, reported_by) VALUES
('Major Flooding in Mumbai', 'Heavy monsoon rains have caused severe flooding in low-lying areas. Multiple residential areas affected.', 'flood', 19.0760, 72.8777, 'Mumbai, Maharashtra', 'responding', 'critical', 1),
('Forest Fire in Uttarakhand', 'Large forest fire spreading across 50 hectares. Nearby villages at risk.', 'fire', 30.0668, 79.0193, 'Uttarakhand', 'verified', 'high', 1),
('Earthquake Tremors in Delhi', 'Mild earthquake tremors felt across NCR region. No major damage reported yet.', 'earthquake', 28.6139, 77.2090, 'New Delhi', 'reported', 'medium', 1);

-- Insert sample volunteers
INSERT INTO volunteers (name, email, phone, skills, location, availability) VALUES
('Rahul Sharma', 'rahul@volunteer.org', '+91-9876543210', 'First Aid, Swimming, Driving', 'Mumbai, Maharashtra', 'available'),
('Priya Patel', 'priya@volunteer.org', '+91-9876543211', 'Medical, CPR, Counseling', 'Delhi, NCR', 'available'),
('Amit Kumar', 'amit@volunteer.org', '+91-9876543212', 'Logistics, Communication, Driving', 'Bangalore, Karnataka', 'busy'),
('Sneha Gupta', 'sneha@volunteer.org', '+91-9876543213', 'Cooking, First Aid, Teaching', 'Chennai, Tamil Nadu', 'available');
