const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me — get own profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/me — update own profile
router.put('/me', authMiddleware, [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('currentPassword').optional().notEmpty(),
  body('newPassword').optional().isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, currentPassword, newPassword } = req.body;
  const updates = [];
  const values = [];
  let paramCount = 1;

  try {
    // If changing password, verify current password first
    if (newPassword) {
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1', [req.user.userId]
      );
      const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const newHash = await bcrypt.hash(newPassword, 10);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(newHash);
    }

    if (name) { updates.push(`name = $${paramCount++}`); values.push(name); }
    if (email) { updates.push(`email = $${paramCount++}`); values.push(email); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.user.userId);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, updated_at`,
      values
    );

    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
