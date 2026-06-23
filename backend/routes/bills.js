const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const fs = require('fs');
const path = require('path');

const saveBase64Image = (base64String) => {
  if (!base64String || !base64String.startsWith('data:image')) {
    return base64String;
  }
  try {
    const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64String;
    }
    let extension = matches[1];
    if (extension === 'jpeg') extension = 'jpg';
    
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `vehicle_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
    const uploadPath = path.join(__dirname, '../uploads', filename);
    
    // Ensure directory exists
    if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
      fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });
    }

    fs.writeFileSync(uploadPath, buffer);
    return `http://localhost:${process.env.PORT || 5000}/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    return base64String;
  }
};

const formatInvoiceNumber = (counter) => `INV-${String(counter).padStart(4, '0')}`;

router.get('/next-invoice-number', async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'latest_invoice_counter'");
    const current = rows.length ? parseInt(rows[0].value, 10) || 0 : 0;
    res.json({ nextInvoiceNumber: formatInvoiceNumber(current + 1), latestInvoiceCounter: current });
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
    invoiceNumber,
    date,
    vehiclePhoto,
    vehicleNumber,
    vehicleModel,
    vehicleDescription,
    customerName,
    customerEmail,
    customerPhone,
    businessName,
    businessPhone,
    businessEmail,
    businessLogo,
    businessAddress,
    businessTaxNumber,
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
    let finalInvoiceNumber = invoiceNumber;
    const [counterRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'latest_invoice_counter'");
    const current = counterRows.length ? parseInt(counterRows[0].value, 10) || 0 : 0;

    if (!finalInvoiceNumber) {
      const nextValue = current + 1;
      await pool.query("INSERT INTO settings (`key`,`value`) VALUES ('latest_invoice_counter', ?) ON DUPLICATE KEY UPDATE `value` = ?", [nextValue, nextValue]);
      finalInvoiceNumber = formatInvoiceNumber(nextValue);
    } else {
      const match = finalInvoiceNumber.match(/(\d+)$/);
      if (match) {
        const providedCounter = parseInt(match[1], 10);
        if (providedCounter > current) {
          await pool.query("INSERT INTO settings (`key`,`value`) VALUES ('latest_invoice_counter', ?) ON DUPLICATE KEY UPDATE `value` = ?", [providedCounter, providedCounter]);
        }
      }
    }

    const [result] = await pool.query(
      `INSERT INTO bills (
        invoice_number, date, vehicle_photo, vehicle_number, vehicle_model,
        vehicle_description, customer_name, customer_email, customer_phone,
        business_name, business_phone, business_email, business_logo,
        business_address, business_tax_number, services, service_type, amount,
        tax, discount, total, paid_amount, pending_amount
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        businessName || null,
        businessPhone || null,
        businessEmail || null,
        businessLogo || null,
        businessAddress || null,
        businessTaxNumber || null,
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
    businessName,
    businessPhone,
    businessEmail,
    businessLogo,
    businessAddress,
    businessTaxNumber,
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
        business_name = ?, business_phone = ?, business_email = ?, business_logo = ?,
        business_address = ?, business_tax_number = ?, services = ?, service_type = ?, amount = ?,
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
        businessName || null,
        businessPhone || null,
        businessEmail || null,
        businessLogo || null,
        businessAddress || null,
        businessTaxNumber || null,
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
