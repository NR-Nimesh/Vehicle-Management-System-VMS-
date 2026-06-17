const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// List items
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Get item
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Create item
router.post('/', async (req, res, next) => {
  const { code, name, category, price, stock } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO items (code, name, category, price, stock) VALUES (?,?,?,?,?)',
      [code, name, category, price || 0, stock || 0]
    );
    const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update item
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { code, name, category, price, stock } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE items SET code=?, name=?, category=?, price=?, stock=? WHERE id=?',
      [code, name, category, price || 0, stock || 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete item
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM items WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
});

// Migration endpoint to import items array from frontend
router.post('/_migrate/import', async (req, res, next) => {
  const items = req.body.items || [];
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Invalid items array' });
  try {
    const promises = items.map(it => {
      return pool.query('INSERT IGNORE INTO items (code, name, category, price, stock) VALUES (?,?,?,?,?)', [
        it.code || null,
        it.name || null,
        it.category || null,
        parseFloat(it.price) || 0,
        parseInt(it.stock, 10) || 0
      ]);
    });
    await Promise.all(promises);
    res.json({ imported: items.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
