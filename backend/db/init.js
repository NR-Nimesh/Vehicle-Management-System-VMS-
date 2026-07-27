require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Support both DB_USER and DB_USERNAME, strip surrounding quotes
const strip = (v) => v ? v.replace(/^['"]|['"]$/g, '') : v;

const DB_HOST = strip(process.env.DB_HOST) || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT) || 3306;
const DB_USER = strip(process.env.DB_USERNAME || process.env.DB_USER) || 'root';
const DB_PASS = strip(process.env.DB_PASSWORD) || '';
// Database name read from env (same as connection.js uses)
const DB_NAME = strip(process.env.DB_DATABASE) || 'vms_db';
const IS_REMOTE = DB_HOST !== 'localhost' && DB_HOST !== '127.0.0.1';

// Each statement is run individually so a failure in one doesn't block the rest
// For remote DBs (TiDB Cloud), skip CREATE DATABASE — the DB already exists
const getStatements = (dbName) => [
  ...(IS_REMOTE ? [] : [
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `USE \`${dbName}\``
  ]),
  `CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vin VARCHAR(64) UNIQUE,
    make VARCHAR(128),
    model VARCHAR(128),
    year INT,
    color VARCHAR(64),
    mileage INT,
    owner VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) UNIQUE,
    name VARCHAR(255),
    category VARCHAR(128),
    price DECIMAL(10,2) DEFAULT 0.00,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS service_charge_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_index INT NOT NULL,
    service_type VARCHAR(255) DEFAULT '',
    price DECIMAL(10,2) DEFAULT 0.00,
    green_count INT DEFAULT 0,
    red_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS business_profile (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    logo LONGTEXT,
    address TEXT,
    phone VARCHAR(64),
    email VARCHAR(255),
    tax_number VARCHAR(128),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS bills (
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
    service_type VARCHAR(255),
    services JSON,
    amount DECIMAL(10,2) DEFAULT 0.00,
    tax DECIMAL(10,2) DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    pending_amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    \`key\` VARCHAR(128) PRIMARY KEY,
    \`value\` VARCHAR(255)
  )`,
  `INSERT INTO settings (\`key\`, \`value\`) VALUES ('latest_invoice_counter','0')
    ON DUPLICATE KEY UPDATE \`value\` = \`value\``,
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

// Migration: safely add missing columns to existing tables (ALTER TABLE IF NOT EXISTS column is MySQL 8.0.3+)
// For compatibility with older MySQL/MariaDB, we wrap each in try/catch and ignore ER_DUP_FIELDNAME
const migrations = [
  // Add 'services' column to bills if it doesn't already exist
  `ALTER TABLE bills ADD COLUMN services JSON`,
  `ALTER TABLE bills ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0.00`,
  `ALTER TABLE bills ADD COLUMN pending_amount DECIMAL(10,2) DEFAULT 0.00`,
  `ALTER TABLE bills DROP COLUMN business_name`,
  `ALTER TABLE bills DROP COLUMN business_phone`,
  `ALTER TABLE bills DROP COLUMN business_email`,
  `ALTER TABLE bills DROP COLUMN business_logo`,
  `ALTER TABLE bills DROP COLUMN business_address`,
  `ALTER TABLE bills DROP COLUMN business_tax_number`,
  // Add status column to categories for soft-delete approval workflow
  `ALTER TABLE categories ADD COLUMN status ENUM('active','pending_deletion') NOT NULL DEFAULT 'active'`,
  // Ensure all existing categories are marked active
  `UPDATE categories SET status = 'active' WHERE status IS NULL OR status = ''`,
  // Make service_charge_history global
  `ALTER TABLE service_charge_history DROP FOREIGN KEY service_charge_history_ibfk_1`,
  `ALTER TABLE service_charge_history DROP FOREIGN KEY fk_1`,
  `ALTER TABLE service_charge_history DROP COLUMN item_id`,
  // Expenses table — create if not exists with all new columns
  `CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(128),
    description TEXT,
    amount DECIMAL(10,2) DEFAULT 0.00,
    type ENUM('Income','Expense','Transfer','Receivable','Payable') DEFAULT 'Expense',
    payment_method VARCHAR(64) DEFAULT 'Cash',
    account VARCHAR(64) DEFAULT 'Main'
  )`,
  // Migrate existing expenses table — add new columns if missing
  `ALTER TABLE expenses ADD COLUMN type ENUM('Income','Expense','Transfer','Receivable','Payable') DEFAULT 'Expense'`,
  `ALTER TABLE expenses ADD COLUMN payment_method VARCHAR(64) DEFAULT 'Cash'`,
  `ALTER TABLE expenses ADD COLUMN account VARCHAR(64) DEFAULT 'Main'`,
  // Accounts Receivable table
  `CREATE TABLE IF NOT EXISTS accounts_receivable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    invoice_id INT DEFAULT NULL,
    invoice_number VARCHAR(64) DEFAULT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) DEFAULT 0.00,
    due_date DATE DEFAULT NULL,
    description TEXT,
    status ENUM('Pending','Partially Paid','Paid') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  // Accounts Payable table
  `CREATE TABLE IF NOT EXISTS accounts_payable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    bill_number VARCHAR(64) DEFAULT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) DEFAULT 0.00,
    due_date DATE DEFAULT NULL,
    description TEXT,
    status ENUM('Pending','Partially Paid','Paid') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  // Cash Book categories table (separate from inventory categories)
  `CREATE TABLE IF NOT EXISTS cashbook_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type ENUM('Income','Expense') NOT NULL,
    icon VARCHAR(64) DEFAULT 'Tag',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`

];

async function initializeDatabase() {
  const sslOption = IS_REMOTE ? { ssl: { rejectUnauthorized: false } } : {};

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: IS_REMOTE ? DB_NAME : undefined,
    ...sslOption
  });

  // Run core table creation statements
  for (const sql of getStatements(DB_NAME)) {
    await connection.query(sql);
  }

  // Seed default admin user
  const [users] = await connection.query('SELECT id FROM users LIMIT 1');
  if (users.length === 0) {
    const adminPassword = await bcrypt.hash('0716192662', 10);
    await connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['wasantha', adminPassword, 'admin']);
    console.log('Default admin user seeded: wasantha');
  }

  // Seed default categories ONLY if the table is completely empty (i.e. fresh install)
  const [catCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
  if (catCount[0].count === 0) {
    await connection.query(`
      INSERT IGNORE INTO categories (name) VALUES
      ('Lubricants'), ('Brakes'), ('Filters'), ('Electrical'), ('Accessories'), ('Other')
    `);
    console.log('Default categories seeded.');
  }

  // Run migrations — each wrapped individually so one failure doesn't abort the rest
  for (const sql of migrations) {
    try {
      await connection.query(sql);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        // Column already exists (for ADD) or already dropped (for DROP) — safe to ignore
      } else {
        console.warn(`Migration warning (non-fatal): ${err.message}`);
      }
    }
  }

  await connection.end();
  console.log(`Database '${DB_NAME}' initialized successfully.`);

  // Seed cashbook_categories if empty — must happen AFTER migrations create the table
  // We use a fresh pool connection since initializeDatabase uses a single connection
}

module.exports = initializeDatabase;
