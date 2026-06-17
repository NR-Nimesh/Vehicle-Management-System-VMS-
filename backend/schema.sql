-- Vehicle Management System schema for MySQL (XAMPP)
CREATE DATABASE IF NOT EXISTS vms_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vms_db;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vin VARCHAR(64) UNIQUE,
  make VARCHAR(128),
  model VARCHAR(128),
  year INT,
  color VARCHAR(64),
  mileage INT,
  owner VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO vehicles (vin, make, model, year, color, mileage, owner) VALUES
('1HGBH41JXMN109186','Honda','Civic',2018,'Blue',45200,'Alice'),
('WP0AA2A97EL012345','Porsche','911',2020,'Red',12000,'Bob');

-- Items table for inventory (migrating from frontend localStorage)
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) UNIQUE,
  name VARCHAR(255),
  category VARCHAR(128),
  price DECIMAL(10,2) DEFAULT 0.00,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO items (code, name, category, price, stock) VALUES
('PART-1001','Oil Filter','Filters',9.99,120),
('PART-2002','Engine Air Filter','Filters',15.5,80);

-- Business profile stored in MySQL only
CREATE TABLE IF NOT EXISTS business_profile (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  logo LONGTEXT,
  address TEXT,
  phone VARCHAR(64),
  email VARCHAR(255),
  tax_number VARCHAR(128),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Billing records stored directly in vms_db
CREATE TABLE IF NOT EXISTS bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(64) UNIQUE,
  date DATE,
  vehicle_photo LONGTEXT,
  vehicle_number VARCHAR(64),
  vehicle_model VARCHAR(255),
  vehicle_description TEXT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(64),
  business_name VARCHAR(255),
  business_phone VARCHAR(64),
  business_email VARCHAR(255),
  business_logo LONGTEXT,
  business_address TEXT,
  business_tax_number VARCHAR(128),
  service_type VARCHAR(255),
  amount DECIMAL(10,2) DEFAULT 0.00,
  tax DECIMAL(10,2) DEFAULT 0.00,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(128) PRIMARY KEY,
  `value` VARCHAR(255)
);

INSERT IGNORE INTO settings (`key`, `value`) VALUES
('latest_invoice_counter', '0');
