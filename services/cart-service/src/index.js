require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 3003;

// Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

const CART_TTL = 7 * 24 * 60 * 60; // 7 days

// Helper
const getCartKey = (userId) => `cart:${userId}`;

// GET /health
app.get('/health', async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'healthy', service: 'cart-service', redis: 'connected' });
  } catch {
    res.status(503).json({ status: 'unhealthy', service: 'cart-service', redis: 'disconnected' });
  }
});

// GET /api/cart/:userId
app.get('/api/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const data = await redis.get(getCartKey(userId));
    const cart = data ? JSON.parse(data) : { items: [], total: 0 };
    res.json(cart);
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// POST /api/cart/:userId/add
app.post('/api/cart/:userId/add', async (req, res) => {
  const { userId } = req.params;
  const { productId, name, price, image_url, quantity = 1 } = req.body;

  if (!productId || !name || !price) {
    return res.status(400).json({ error: 'productId, name, and price are required' });
  }

  try {
    const data = await redis.get(getCartKey(userId));
    const cart = data ? JSON.parse(data) : { items: [] };

    const existingIdx = cart.items.findIndex(i => i.productId === productId);
    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += quantity;
    } else {
      cart.items.push({ productId, name, price: parseFloat(price), image_url, quantity });
    }

    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    await redis.setex(getCartKey(userId), CART_TTL, JSON.stringify(cart));
    res.json({ message: 'Item added to cart', cart });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/:userId/item/:productId — update quantity
app.put('/api/cart/:userId/item/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }

  try {
    const data = await redis.get(getCartKey(userId));
    if (!data) return res.status(404).json({ error: 'Cart not found' });

    const cart = JSON.parse(data);
    const idx = cart.items.findIndex(i => i.productId === productId);
    if (idx < 0) return res.status(404).json({ error: 'Item not found in cart' });

    cart.items[idx].quantity = quantity;
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    await redis.setex(getCartKey(userId), CART_TTL, JSON.stringify(cart));
    res.json({ message: 'Cart updated', cart });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:userId/item/:productId
app.delete('/api/cart/:userId/item/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  try {
    const data = await redis.get(getCartKey(userId));
    if (!data) return res.status(404).json({ error: 'Cart not found' });

    const cart = JSON.parse(data);
    cart.items = cart.items.filter(i => i.productId !== productId);
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    await redis.setex(getCartKey(userId), CART_TTL, JSON.stringify(cart));
    res.json({ message: 'Item removed', cart });
  } catch (err) {
    console.error('Remove item error:', err);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// DELETE /api/cart/:userId — clear entire cart
app.delete('/api/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await redis.del(getCartKey(userId));
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Cart Service running on port ${PORT}`);
});

module.exports = app;
