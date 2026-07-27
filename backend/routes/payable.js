const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// GET /api/payable — list all (unpaid first)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM accounts_payable ORDER BY status != 'Paid', due_date ASC, id DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/payable — add new entry
router.post('/', async (req, res, next) => {
  try {
    const { supplier_name, bill_number, amount, due_date, description } = req.body;
    const amt = parseFloat(amount) || 0;
    const [result] = await pool.query(
      `INSERT INTO accounts_payable
        (supplier_name, bill_number, amount, paid_amount, remaining_amount, due_date, description, status)
       VALUES (?, ?, ?, 0, ?, ?, ?, 'Pending')`,
      [supplier_name, bill_number || null, amt, amt, due_date || null, description || '']
    );
    const [[row]] = await pool.query('SELECT * FROM accounts_payable WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PUT /api/payable/:id — edit
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplier_name, bill_number, amount, due_date, description } = req.body;
    const amt = parseFloat(amount) || 0;
    const [[existing]] = await pool.query('SELECT paid_amount FROM accounts_payable WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const paid = parseFloat(existing.paid_amount) || 0;
    const remaining = Math.max(0, amt - paid);
    const status = remaining <= 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending';
    await pool.query(
      `UPDATE accounts_payable
       SET supplier_name=?, bill_number=?, amount=?, remaining_amount=?, due_date=?, description=?, status=?
       WHERE id=?`,
      [supplier_name, bill_number || null, amt, remaining, due_date || null, description || '', status, id]
    );
    const [[row]] = await pool.query('SELECT * FROM accounts_payable WHERE id = ?', [id]);
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/payable/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM accounts_payable WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/payable/:id/pay — record a payment
router.post('/:id/pay', async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentAmt = parseFloat(req.body.payment_amount) || 0;
    if (paymentAmt <= 0) return res.status(400).json({ error: 'Payment amount must be > 0' });

    const [[existing]] = await pool.query('SELECT * FROM accounts_payable WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const newPaid = Math.min(parseFloat(existing.amount), parseFloat(existing.paid_amount) + paymentAmt);
    const newRemaining = Math.max(0, parseFloat(existing.amount) - newPaid);
    const newStatus = newRemaining <= 0 ? 'Paid' : 'Partially Paid';

    await pool.query(
      `UPDATE accounts_payable SET paid_amount=?, remaining_amount=?, status=?, updated_at=NOW() WHERE id=?`,
      [newPaid, newRemaining, newStatus, id]
    );
    const [[row]] = await pool.query('SELECT * FROM accounts_payable WHERE id = ?', [id]);
    res.json(row);
  } catch (err) { next(err); }
});

module.exports = router;
