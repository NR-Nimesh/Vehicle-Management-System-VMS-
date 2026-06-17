const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM business_profile ORDER BY id ASC LIMIT 1');
    if (!rows.length) {
      return res.json({
        name: '',
        logo: '',
        address: '',
        phone: '',
        email: '',
        tax_number: ''
      });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  const { name, logo, address, phone, email, tax_number } = req.body;
  try {
    await pool.query(
      `INSERT INTO business_profile (id, name, logo, address, phone, email, tax_number)
       VALUES (1,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         logo = VALUES(logo),
         address = VALUES(address),
         phone = VALUES(phone),
         email = VALUES(email),
         tax_number = VALUES(tax_number)`,
      [name || null, logo || null, address || null, phone || null, email || null, tax_number || null]
    );

    const [rows] = await pool.query('SELECT * FROM business_profile ORDER BY id ASC LIMIT 1');
    res.json(rows[0] || {
      name: '',
      logo: '',
      address: '',
      phone: '',
      email: '',
      tax_number: ''
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
