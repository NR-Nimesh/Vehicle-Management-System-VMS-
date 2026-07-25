const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Get all expenses
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY date DESC, id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Add new expense
router.post('/', async (req, res, next) => {
  try {
    const { date, category, description, amount } = req.body;
    
    // Support string or date objects
    let expenseDate = new Date();
    if (date) {
      expenseDate = new Date(date);
    }
    
    // Format to MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
    const formattedDate = expenseDate.toISOString().slice(0, 19).replace('T', ' ');
    
    const [result] = await pool.query(
      'INSERT INTO expenses (date, category, description, amount) VALUES (?, ?, ?, ?)',
      [formattedDate, category || 'Misc', description || '', amount || 0]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      date: formattedDate, 
      category, 
      description, 
      amount 
    });
  } catch (err) {
    next(err);
  }
});

// Delete expense (optional, just in case)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
