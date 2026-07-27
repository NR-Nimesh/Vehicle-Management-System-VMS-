const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET /api/receivable — list all (unpaid first)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM accounts_receivable ORDER BY status != 'Paid', due_date ASC, id DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/receivable — add new entry
router.post('/', async (req, res, next) => {
  try {
    const { customer_name, invoice_id, invoice_number, amount, due_date, description } = req.body;
    const amt = parseFloat(amount) || 0;
    const [result] = await pool.query(
      `INSERT INTO accounts_receivable
        (customer_name, invoice_id, invoice_number, amount, paid_amount, remaining_amount, due_date, description, status)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'Pending')`,
      [customer_name, invoice_id || null, invoice_number || null, amt, amt, due_date || null, description || '']
    );
    const [[row]] = await pool.query('SELECT * FROM accounts_receivable WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PUT /api/receivable/:id — edit
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customer_name, invoice_id, invoice_number, amount, due_date, description } = req.body;
    const amt = parseFloat(amount) || 0;
    // Recalculate remaining based on existing paid_amount
    const [[existing]] = await pool.query('SELECT paid_amount FROM accounts_receivable WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const paid = parseFloat(existing.paid_amount) || 0;
    const remaining = Math.max(0, amt - paid);
    const status = remaining <= 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending';
    await pool.query(
      `UPDATE accounts_receivable
       SET customer_name=?, invoice_id=?, invoice_number=?, amount=?, remaining_amount=?, due_date=?, description=?, status=?
       WHERE id=?`,
      [customer_name, invoice_id || null, invoice_number || null, amt, remaining, due_date || null, description || '', status, id]
    );
    const [[row]] = await pool.query('SELECT * FROM accounts_receivable WHERE id = ?', [id]);
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/receivable/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM accounts_receivable WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/receivable/:id/pay — record a payment
router.post('/:id/pay', async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentAmt = parseFloat(req.body.payment_amount) || 0;
    if (paymentAmt <= 0) return res.status(400).json({ error: 'Payment amount must be > 0' });

    const [[existing]] = await pool.query('SELECT * FROM accounts_receivable WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const newPaid = Math.min(parseFloat(existing.amount), parseFloat(existing.paid_amount) + paymentAmt);
    const newRemaining = Math.max(0, parseFloat(existing.amount) - newPaid);
    const newStatus = newRemaining <= 0 ? 'Paid' : 'Partially Paid';

    await pool.query(
      `UPDATE accounts_receivable SET paid_amount=?, remaining_amount=?, status=?, updated_at=NOW() WHERE id=?`,
      [newPaid, newRemaining, newStatus, id]
    );
    const [[row]] = await pool.query('SELECT * FROM accounts_receivable WHERE id = ?', [id]);
    res.json(row);
  } catch (err) { next(err); }
});

module.exports = router;
