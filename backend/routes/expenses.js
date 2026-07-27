const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// ─── GET /api/expenses/summary ────────────────────────────────────────────────
router.get('/summary', async (req, res, next) => {
  try {
    const [[incomeRow]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE type = 'Income'`
    );
    const [[expenseRow]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE type = 'Expense'`
    );
    // AR: sum remaining from accounts_receivable table
    const [[arRow]] = await pool.query(
      `SELECT COALESCE(SUM(remaining_amount), 0) AS total, COUNT(*) AS count
       FROM accounts_receivable WHERE status != 'Paid'`
    );
    // AP: sum remaining from accounts_payable table
    const [[apRow]] = await pool.query(
      `SELECT COALESCE(SUM(remaining_amount), 0) AS total, COUNT(*) AS count
       FROM accounts_payable WHERE status != 'Paid'`
    );
    // Bank balance: sum of Transfer-type entries into Bank account
    const [[bankRow]] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'Transfer' THEN amount ELSE 0 END), 0) AS total
       FROM expenses WHERE account = 'Bank'`
    );

    res.json({
      manualIncome:        parseFloat(incomeRow.total) || 0,
      totalExpenses:       parseFloat(expenseRow.total) || 0,
      accountsReceivable:  parseFloat(arRow.total) || 0,
      receivableCount:     parseInt(arRow.count) || 0,
      accountsPayable:     parseFloat(apRow.total) || 0,
      payableCount:        parseInt(apRow.count) || 0,
      bankBalance:         parseFloat(bankRow.total) || 0,
    });
  } catch (err) { next(err); }
});

// ─── CASHBOOK CATEGORIES ──────────────────────────────────────────────────────

// GET /api/expenses/categories
router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM cashbook_categories ORDER BY type, name'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/expenses/categories
router.post('/categories', async (req, res, next) => {
  try {
    const { name, type, icon } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
    const [result] = await pool.query(
      'INSERT INTO cashbook_categories (name, type, icon) VALUES (?, ?, ?)',
      [name.trim(), type, icon || 'Tag']
    );
    const [[row]] = await pool.query('SELECT * FROM cashbook_categories WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PUT /api/expenses/categories/:id
router.put('/categories/:id', async (req, res, next) => {
  try {
    const { name, type, icon } = req.body;
    await pool.query(
      'UPDATE cashbook_categories SET name=?, type=?, icon=? WHERE id=?',
      [name, type, icon || 'Tag', req.params.id]
    );
    const [[row]] = await pool.query('SELECT * FROM cashbook_categories WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/expenses/categories/:id
router.delete('/categories/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cashbook_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── GET /api/expenses ────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY date DESC, id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

// ─── POST /api/expenses ───────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { date, category, description, amount, type, payment_method, account } = req.body;
    let expenseDate = date ? new Date(date) : new Date();
    const formattedDate = expenseDate.toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.query(
      `INSERT INTO expenses (date, category, description, amount, type, payment_method, account)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [formattedDate, category || 'Misc', description || '', amount || 0,
       type || 'Expense', payment_method || 'Cash', account || 'Main']
    );
    res.status(201).json({
      id: result.insertId, date: formattedDate, category, description, amount,
      type: type || 'Expense', payment_method: payment_method || 'Cash', account: account || 'Main'
    });
  } catch (err) { next(err); }
});

// ─── PUT /api/expenses/:id ────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, category, description, amount, type, payment_method, account } = req.body;
    let expenseDate = date ? new Date(date) : new Date();
    const formattedDate = expenseDate.toISOString().slice(0, 19).replace('T', ' ');
    await pool.query(
      `UPDATE expenses SET date=?, category=?, description=?, amount=?, type=?, payment_method=?, account=? WHERE id=?`,
      [formattedDate, category || 'Misc', description || '', amount || 0,
       type || 'Expense', payment_method || 'Cash', account || 'Main', id]
    );
    res.json({ success: true, id: parseInt(id) });
  } catch (err) { next(err); }
});

// ─── DELETE /api/expenses/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
