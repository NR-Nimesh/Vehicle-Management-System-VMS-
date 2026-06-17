const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// List all vehicles
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Get vehicle by id
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Create vehicle
router.post('/', async (req, res, next) => {
  const { vin, make, model, year, color, mileage, owner } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO vehicles (vin, make, model, year, color, mileage, owner) VALUES (?,?,?,?,?,?,?)',
      [vin, make, model, year || null, color || null, mileage || null, owner || null]
    );
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update vehicle
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { vin, make, model, year, color, mileage, owner } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE vehicles SET vin=?, make=?, model=?, year=?, color=?, mileage=?, owner=? WHERE id=?',
      [vin, make, model, year || null, color || null, mileage || null, owner || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle not found' });
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete vehicle
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM vehicles WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
