const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const fs = require('fs');
const path = require('path');

const saveBase64Image = (base64String) => {
  // Return the base64 string to be stored directly in the database
  // This is required for serverless environments like Vercel where the filesystem is read-only
  return base64String;
};

const formatInvoiceNumber = (counter) => `INV-${String(counter).padStart(4, '0')}`;

router.get('/next-invoice-number', async (req, res, next) => {
  try {
    const [[maxRow]] = await pool.query(
      "SELECT MAX(CAST(REGEXP_SUBSTR(invoice_number, '[0-9]+$') AS UNSIGNED)) AS maxNum FROM bills"
    );
    const [[settingsRow]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'latest_invoice_counter'");
    const settingsCounter = settingsRow ? parseInt(settingsRow.value, 10) || 0 : 0;
    const dbMax = maxRow?.maxNum || 0;
    const trueMax = Math.max(settingsCounter, dbMax);
    res.json({ nextInvoiceNumber: formatInvoiceNumber(trueMax + 1), latestInvoiceCounter: trueMax });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bills ORDER BY created_at DESC');
    const mapped = rows.map(row => ({
      ...row,
      services: typeof row.services === 'string' ? JSON.parse(row.services) : (row.services || [])
    }));
    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM bills WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Bill not found' });
    const row = rows[0];
    res.json({
      ...row,
      services: typeof row.services === 'string' ? JSON.parse(row.services) : (row.services || [])
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const {
    date,
    vehiclePhoto,
    vehicleNumber,
    vehicleModel,
    vehicleDescription,
    customerName,
    customerEmail,
    customerPhone,
    services,
    serviceType,
    amount,
    tax,
    discount,
    total,
    paidAmount,
    pendingAmount
  } = req.body;

  try {
    const finalVehiclePhoto = saveBase64Image(vehiclePhoto);

    // Auto-heal counter: derive true next number from the actual max invoice in the DB
    // This fixes cases where the counter fell behind (e.g. after manual inserts or bugs)
    const [[maxRow]] = await pool.query(
      "SELECT MAX(CAST(REGEXP_SUBSTR(invoice_number, '[0-9]+$') AS UNSIGNED)) AS maxNum FROM bills"
    );
    const [[settingsRow]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'latest_invoice_counter'");
    const settingsCounter = settingsRow ? parseInt(settingsRow.value, 10) || 0 : 0;
    const dbMax = maxRow?.maxNum || 0;
    // Use whichever is higher so we never collide with existing invoices
    const trueMax = Math.max(settingsCounter, dbMax);
    const nextValue = trueMax + 1;

    // Update the settings counter
    await pool.query(
      "INSERT INTO settings (`key`,`value`) VALUES ('latest_invoice_counter', ?) ON DUPLICATE KEY UPDATE `value` = ?",
      [nextValue, nextValue]
    );
    const finalInvoiceNumber = formatInvoiceNumber(nextValue);

    const [result] = await pool.query(
      `INSERT INTO bills (
        invoice_number, date, vehicle_photo, vehicle_number, vehicle_model,
        vehicle_description, customer_name, customer_email, customer_phone,
        services, service_type, amount,
        tax, discount, total, paid_amount, pending_amount
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        finalInvoiceNumber,
        date || null,
        finalVehiclePhoto || null,
        vehicleNumber || null,
        vehicleModel || null,
        vehicleDescription || null,
        customerName || null,
        customerEmail || null,
        customerPhone || null,
        services ? JSON.stringify(services) : null,
        serviceType || null,
        amount || 0,
        tax || 0,
        discount || 0,
        total || 0,
        paidAmount || 0,
        pendingAmount || 0
      ]
    );

    // Reduce stock for items included in the bill
    if (services && Array.isArray(services)) {
      for (const service of services) {
        if (service.itemId && service.quantity) {
          try {
            await pool.query(
              'UPDATE items SET stock = stock - ? WHERE id = ? AND stock >= ?',
              [service.quantity, service.itemId, service.quantity]
            );
          } catch (stockErr) {
            console.error('Error reducing stock for item:', service.itemId, stockErr);
          }
        }
      }
    }

    const [rows] = await pool.query('SELECT * FROM bills WHERE id = ?', [result.insertId]);
    const saved = rows[0];
    res.status(201).json({
      ...saved,
      services: typeof saved.services === 'string' ? JSON.parse(saved.services) : (saved.services || [])
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const {
    invoiceNumber,
    date,
    vehiclePhoto,
    vehicleNumber,
    vehicleModel,
    vehicleDescription,
    customerName,
    customerEmail,
    customerPhone,
    services,
    serviceType,
    amount,
    tax,
    discount,
    total,
    paidAmount,
    pendingAmount
  } = req.body;

  try {
    const finalVehiclePhoto = saveBase64Image(vehiclePhoto);

    const [result] = await pool.query(
      `UPDATE bills SET
        invoice_number = ?, date = ?, vehicle_photo = ?, vehicle_number = ?, vehicle_model = ?,
        vehicle_description = ?, customer_name = ?, customer_email = ?, customer_phone = ?,
        services = ?, service_type = ?, amount = ?,
        tax = ?, discount = ?, total = ?, paid_amount = ?, pending_amount = ?
      WHERE id = ?`,
      [
        invoiceNumber || null,
        date || null,
        finalVehiclePhoto || null,
        vehicleNumber || null,
        vehicleModel || null,
        vehicleDescription || null,
        customerName || null,
        customerEmail || null,
        customerPhone || null,
        services ? JSON.stringify(services) : null,
        serviceType || null,
        amount || 0,
        tax || 0,
        discount || 0,
        total || 0,
        paidAmount || 0,
        pendingAmount || 0,
        id
      ]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Bill not found' });
    const [rows] = await pool.query('SELECT * FROM bills WHERE id = ?', [id]);
    const updated = rows[0];
    res.json({
      ...updated,
      services: typeof updated.services === 'string' ? JSON.parse(updated.services) : (updated.services || [])
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM bills WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Bill not found' });
    res.json({ message: 'Bill deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
