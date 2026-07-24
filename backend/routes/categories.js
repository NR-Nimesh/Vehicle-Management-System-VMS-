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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
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

// DELETE - Mark category as pending deletion (soft delete) for users, or hard delete for admins
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const [cats] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!cats.length) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    if (req.user && req.user.role === 'admin') {
      // Direct hard delete by admin
      const categoryName = cats[0].name;
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('UPDATE items SET category = NULL WHERE category = ?', [categoryName]);
        await conn.query('DELETE FROM categories WHERE id = ?', [id]);
        await conn.commit();
        res.json({ message: 'Category permanently deleted directly', id: Number(id), directDelete: true });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } else {
      // Soft delete by user
      await pool.query(
        "UPDATE categories SET status = 'pending_deletion' WHERE id = ?",
        [id]
      );
      res.json({ message: 'Category marked as pending deletion', id: Number(id) });
    }
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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id/approve — Admin permanently deletes the category and unlinks its items
router.patch('/:id/approve', isAdmin, async (req, res, next) => {
  const { id } = req.params;
  try {
    const [cats] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!cats.length) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const categoryName = cats[0].name;
    
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Safely unlink all items belonging to this category
      await conn.query('UPDATE items SET category = NULL WHERE category = ?', [categoryName]);
      // Permanently delete the category
      await conn.query('DELETE FROM categories WHERE id = ?', [id]);
      await conn.commit();
      res.json({ message: 'Category permanently deleted and items unlinked', id: Number(id) });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
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
