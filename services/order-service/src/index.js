require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3004;

// DB Pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres123',
  database: process.env.POSTGRES_DB || 'orders_db',
  max: 20,
});

// Initialize DB
const initDB = async () => {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled')),
      shipping_address JSONB,
      payment_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  `);
  console.log('✅ Orders DB initialized');
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', service: 'order-service', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'unhealthy', service: 'order-service' });
  }
});

// POST /api/orders — create order
app.post('/api/orders', [
  body('userId').notEmpty().withMessage('userId is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { userId, items, shippingAddress, paymentId } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, payment_id, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, totalAmount, JSON.stringify(shippingAddress), paymentId || null, paymentId ? 'paid' : 'pending']
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.productId, item.product_name, item.quantity, item.unit_price, item.unit_price * item.quantity]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Order created', order });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// GET /api/orders/user/:userId — order history
app.get('/api/orders/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name,
          'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price
        )) as items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id — order detail
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PUT /api/orders/:id/status — update order status
app.put('/api/orders/:id/status', [
  body('status').isIn(['pending','paid','processing','shipped','delivered','cancelled']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Status updated', order: result.rows[0] });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Start
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`✅ Order Service running on port ${PORT}`));
}).catch(err => {
  console.error('❌ DB init failed:', err);
  process.exit(1);
});

module.exports = app;
