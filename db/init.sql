-- ─────────────────────────────────────────
-- Create Databases
-- ─────────────────────────────────────────
CREATE DATABASE users_db;
CREATE DATABASE products_db;
CREATE DATABASE orders_db;

-- ─────────────────────────────────────────
-- USERS DATABASE
-- ─────────────────────────────────────────
\c users_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Seed admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@shop.com', '$2b$10$rQZ7vYqGp3kL8mN2xK1e8.oH5VwTjA3fP6dR9sUiYcBqMlNtXvOwG', 'admin');

-- ─────────────────────────────────────────
-- PRODUCTS DATABASE
-- ─────────────────────────────────────────
\c products_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products(name);

-- Seed categories
INSERT INTO categories (id, name, description) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Electronics', 'Phones, laptops, gadgets and more'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Clothing', 'Fashion for men and women'),
('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Home & Kitchen', 'Everything for your home'),
('d4e5f6a7-b8c9-0123-defa-234567890123', 'Books', 'Books, ebooks and audiobooks'),
('e5f6a7b8-c9d0-1234-efab-345678901234', 'Sports', 'Sports and outdoor equipment');

-- Seed products
INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES
('iPhone 15 Pro', 'Latest Apple flagship with titanium design and A17 Pro chip', 999.99, 50, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'https://images.unsplash.com/photo-1592750945-d02208cce297?w=400&q=80'),
('Samsung Galaxy S24', 'Android powerhouse with AI features and 200MP camera', 849.99, 75, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80'),
('MacBook Air M3', '13-inch with M3 chip, 18-hour battery life', 1299.99, 30, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80'),
('Sony WH-1000XM5', 'Industry-leading noise canceling wireless headphones', 349.99, 100, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'),
('Nike Air Max 270', 'Comfortable running shoes with Max Air cushioning', 149.99, 200, 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'),
('Levi''s 501 Jeans', 'Classic straight fit jeans, timeless style', 59.99, 150, 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80'),
('Adidas Ultraboost 23', 'High-performance running shoe with Boost midsole', 189.99, 120, 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'https://images.unsplash.com/photo-1556906781-9b8f00a9c5b3?w=400&q=80'),
('Instant Pot Duo 7-in-1', 'Multi-use pressure cooker, slow cooker, rice cooker', 89.99, 80, 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'https://images.unsplash.com/photo-1556909114-f6e7ad4f3e28?w=400&q=80'),
('Dyson V15 Detect', 'Powerful cordless vacuum with laser dust detection', 699.99, 40, 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'),
('The Clean Coder', 'A Code of Conduct for Professional Programmers by Robert Martin', 29.99, 500, 'd4e5f6a7-b8c9-0123-defa-234567890123', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'),
('Atomic Habits', 'Tiny Changes, Remarkable Results by James Clear', 19.99, 400, 'd4e5f6a7-b8c9-0123-defa-234567890123', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'),
('Yoga Mat Pro', 'Non-slip professional yoga mat, 6mm thickness', 49.99, 300, 'e5f6a7b8-c9d0-1234-efab-345678901234', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80');

-- ─────────────────────────────────────────
-- ORDERS DATABASE
-- ─────────────────────────────────────────
\c orders_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address JSONB,
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
