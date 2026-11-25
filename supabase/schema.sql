-- ==============================================================================
-- FERRETERIA MICA - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TABLA: products (Catalogo de Productos y Variantes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'unidad',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  price_on_request BOOLEAN NOT NULL DEFAULT FALSE,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_alert INTEGER NOT NULL DEFAULT 3 CHECK (min_stock_alert >= 0),
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  image TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLA: orders (Comandas de Clientes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'takeaway')),
  delivery_address TEXT NOT NULL DEFAULT '',
  delivery_notes TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'debito', 'transferencia')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  has_consult_items BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado')),
  whatsapp_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- TABLA: store_settings (Configuracion General de Ferreteria Mica)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  whatsapp_number TEXT NOT NULL DEFAULT '5491157124625',
  delivery_cost NUMERIC(12, 2) NOT NULL DEFAULT 2500,
  free_delivery_threshold NUMERIC(12, 2) NOT NULL DEFAULT 50000,
  same_day_delivery_cutoff TEXT NOT NULL DEFAULT '17:00',
  is_open_override TEXT NOT NULL DEFAULT 'auto' CHECK (is_open_override IN ('auto', 'open', 'closed')),
  announcement TEXT NOT NULL DEFAULT 'Envios en el dia en Quilmes Oeste y zonas cercanas. Mas de 25 anos de trayectoria.',
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_passwords JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_settings_updated_at ON store_settings;
CREATE TRIGGER trigger_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO store_settings (id, whatsapp_number, delivery_cost, free_delivery_threshold)
VALUES ('default', '5491157124625', 2500, 50000)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica de productos" ON products FOR SELECT USING (true);
CREATE POLICY "Escritura administrativa de productos" ON products FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Creacion publica de comandas" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Gestion administrativa de comandas" ON orders FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Lectura publica de configuracion" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Escritura administrativa de configuracion" ON store_settings FOR ALL USING (auth.role() = 'service_role');
