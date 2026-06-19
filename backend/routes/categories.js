const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET all categories
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
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
      'INSERT INTO categories (name) VALUES (?)',
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

// DELETE - Delete category and all its items
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    // First, get the category name so we can delete matching items
    const [cats] = await pool.query('SELECT name FROM categories WHERE id = ?', [id]);
    if (!cats.length) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const categoryName = cats[0].name;

    // Delete all items belonging to this category
    await pool.query('DELETE FROM items WHERE category = ?', [categoryName]);

    // Delete the category itself
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ message: 'Category and all its items deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
