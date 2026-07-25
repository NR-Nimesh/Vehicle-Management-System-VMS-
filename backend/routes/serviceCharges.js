const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Get all service charge rows
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM service_charge_history ORDER BY service_index ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Add a new service charge row
router.post('/', async (req, res, next) => {
  try {
    // Get the next index globally
    const [indexRows] = await pool.query('SELECT MAX(service_index) as maxIndex FROM service_charge_history');
    const nextIndex = (indexRows[0].maxIndex || 0) + 1;
    
    const [result] = await pool.query(
      'INSERT INTO service_charge_history (service_index) VALUES (?)',
      [nextIndex]
    );
    const [rows] = await pool.query('SELECT * FROM service_charge_history WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update a service charge row
router.patch('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { service_type, price, green_count, red_count } = req.body;

  try {
    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];

    if (service_type !== undefined) {
      updates.push('service_type = ?');
      values.push(service_type);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(parseFloat(price) || 0);
    }
    if (green_count !== undefined) {
      updates.push('green_count = ?');
      values.push(parseInt(green_count, 10) || 0);
    }
    if (red_count !== undefined) {
      updates.push('red_count = ?');
      values.push(parseInt(red_count, 10) || 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE service_charge_history SET ${updates.join(', ')} WHERE id = ?`;

    const [result] = await pool.query(query, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Service charge not found' });

    const [rows] = await pool.query('SELECT * FROM service_charge_history WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete a service charge row
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM service_charge_history WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Service charge not found' });
    res.json({ message: 'Service charge deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
