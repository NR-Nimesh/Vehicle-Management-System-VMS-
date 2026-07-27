const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// ─── GET /api/expenses/summary ────────────────────────────────────────────────
// Returns aggregated totals for the Cash Book dashboard cards
router.get('/summary', async (req, res, next) => {
  try {
    // Total manual income (type = 'Income') from expenses table
    const [[incomeRow]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE type = 'Income'`
    );
    // Total expenses (type = 'Expense')
    const [[expenseRow]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE type = 'Expense'`
    );
    // Accounts Receivable (type = 'Receivable')
    const [[receivableRow]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE type = 'Receivable'`
    );
    // Accounts Payable (type = 'Payable')
    const [[payableRow]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses WHERE type = 'Payable'`
    );
    // Bank balance (type = 'Transfer' into bank, account = 'Bank')
    const [[bankRow]] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'Transfer' THEN amount ELSE 0 END), 0) AS total FROM expenses WHERE account = 'Bank'`
    );

    res.json({
      manualIncome: parseFloat(incomeRow.total) || 0,
      totalExpenses: parseFloat(expenseRow.total) || 0,
      accountsReceivable: parseFloat(receivableRow.total) || 0,
      receivableCount: parseInt(receivableRow.count) || 0,
      accountsPayable: parseFloat(payableRow.total) || 0,
      payableCount: parseInt(payableRow.count) || 0,
      bankBalance: parseFloat(bankRow.total) || 0,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/expenses ────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY date DESC, id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/expenses ───────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { date, category, description, amount, type, payment_method, account } = req.body;

    let expenseDate = new Date();
    if (date) expenseDate = new Date(date);
    const formattedDate = expenseDate.toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.query(
      `INSERT INTO expenses (date, category, description, amount, type, payment_method, account)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        formattedDate,
        category || 'Misc',
        description || '',
        amount || 0,
        type || 'Expense',
        payment_method || 'Cash',
        account || 'Main'
      ]
    );

    res.status(201).json({
      id: result.insertId,
      date: formattedDate,
      category,
      description,
      amount,
      type: type || 'Expense',
      payment_method: payment_method || 'Cash',
      account: account || 'Main'
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/expenses/:id ────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, category, description, amount, type, payment_method, account } = req.body;

    let expenseDate = date ? new Date(date) : new Date();
    const formattedDate = expenseDate.toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      `UPDATE expenses SET date=?, category=?, description=?, amount=?, type=?, payment_method=?, account=?
       WHERE id=?`,
      [
        formattedDate,
        category || 'Misc',
        description || '',
        amount || 0,
        type || 'Expense',
        payment_method || 'Cash',
        account || 'Main',
        id
      ]
    );

    res.json({ success: true, id: parseInt(id) });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/expenses/:id ─────────────────────────────────────────────────
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
