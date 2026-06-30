const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { isAdmin } = require('../middleware/auth');

// GET all active categories (hidden from users when pending deletion)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM categories WHERE status = 'active' ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST - Create a new category
router.post('/', async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO categories (name, status) VALUES (?, 'active')",
      [name.trim()]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    next(err);
  }
});

// DELETE - Mark category as pending deletion (soft delete) — any authenticated user
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [cats] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!cats.length) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await pool.query(
      "UPDATE categories SET status = 'pending_deletion' WHERE id = ?",
      [id]
    );
    res.json({ message: 'Category marked as pending deletion', id: Number(id) });
  } catch (err) {
    next(err);
  }
});

// ── Admin-only routes ─────────────────────────────────────────────────────────

// GET all categories pending deletion (admin only)
router.get('/pending-deletion', isAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM categories WHERE status = 'pending_deletion' ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id/approve — Admin permanently deletes the category and its items
router.patch('/:id/approve', isAdmin, async (req, res, next) => {
  const { id } = req.params;
  try {
    const [cats] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!cats.length) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const categoryName = cats[0].name;
    // Delete all items belonging to this category
    await pool.query('DELETE FROM items WHERE category = ?', [categoryName]);
    // Permanently delete the category
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category and all its items permanently deleted', id: Number(id) });
  } catch (err) {
    next(err);
  }
});

// PATCH /:id/reject — Admin restores category back to active
router.patch('/:id/reject', isAdmin, async (req, res, next) => {
  const { id } = req.params;
  try {
    const [cats] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!cats.length) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await pool.query(
      "UPDATE categories SET status = 'active' WHERE id = ?",
      [id]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
