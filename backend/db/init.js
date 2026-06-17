require('dotenv').config();
const mysql = require('mysql2/promise');

const schemaSql = `
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

CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) UNIQUE,
  name VARCHAR(255),
  category VARCHAR(128),
  price DECIMAL(10,2) DEFAULT 0.00,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  \`key\` VARCHAR(128) PRIMARY KEY,
  \`value\` VARCHAR(255)
);

INSERT INTO settings (\`key\`, \`value\`) VALUES
('latest_invoice_counter','0')
ON DUPLICATE KEY UPDATE \`value\` = \`value\`;
`;

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const connection = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  await connection.query(schemaSql);
  await connection.end();
}

module.exports = initializeDatabase;
