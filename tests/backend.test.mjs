import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createBackendApp } from '../backend/server.mjs';

async function startTestServer() {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mica-test-'));
  const dataFile = path.join(tmpDir, 'store.json');
  const app = createBackendApp({
    dataFile,
    disableSupabase: true,
    authSecret: 'test-secret-1234',
  });

  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  const address = app.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    close: async () => {
      await new Promise((resolve) => app.close(resolve));
      await fs.rm(tmpDir, { recursive: true, force: true });
    },
  };
}

test('backend API full workflow: auth, products, bulk CSV/%, stock, and comandas', async () => {
  const srv = await startTestServer();
  try {
    // 1. Health & public catalog
    const healthRes = await fetch(`${srv.baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.ok, true);
    assert.ok(health.productsCount >= 20);

    // 2. Unauthorized protection
    const unauthOrders = await fetch(`${srv.baseUrl}/api/pedidos`);
    assert.equal(unauthOrders.status, 401);

    const unauthCreate = await fetch(`${srv.baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    assert.equal(unauthCreate.status, 401);

    // 3. Admin login
    const loginRes = await fetch(`${srv.baseUrl}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: process.env.ADMIN_PASSWORD || 'mica2026' }),
    });
    assert.equal(loginRes.status, 200);
    const { token } = await loginRes.json();
    assert.ok(token);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 4. Create product & update stock
    const createRes = await fetch(`${srv.baseUrl}/api/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        sku: 'TST-900',
        name: 'Pinza Universal 8"',
        brand: 'Stanley',
        category: 'herramientas',
        unit: 'unidad',
        price: 12000,
        stockQuantity: 15,
      }),
    });
    assert.equal(createRes.status, 201);
    const { product: createdProd } = await createRes.json();
    assert.equal(createdProd.sku, 'TST-900');

    const stockRes = await fetch(`${srv.baseUrl}/api/stock`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ productId: createdProd.id, stockQuantity: 4, inStock: true }),
    });
    assert.equal(stockRes.status, 200);
    const { product: stockedProd } = await stockRes.json();
    assert.equal(stockedProd.stockQuantity, 4);

    // 5. Bulk CSV import (updates TST-900 by SKU and creates TST-901)
    const csvText = [
      'sku;nombre;marca;rubro;unidad;precio;a_consultar;stock_disponible;cantidad_stock',
      'TST-900;Pinza Universal 8" Pro;Stanley;herramientas;unidad;14000;no;si;20',
      'TST-901;Destornillador Phillips;Bremen;herramientas;unidad;5000;no;si;30',
    ].join('\n');

    const importRes = await fetch(`${srv.baseUrl}/api/products/bulk-import`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ csvText }),
    });
    assert.equal(importRes.status, 200);
    const importData = await importRes.json();
    assert.equal(importData.updated, 1);
    assert.equal(importData.created, 1);

    // 6. Bulk percentage price update (+10% on herramientas)
    const bumpRes = await fetch(`${srv.baseUrl}/api/products/bulk-price-update`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ percent: 10, category: 'herramientas', rounding: '10' }),
    });
    assert.equal(bumpRes.status, 200);
    const bumpData = await bumpRes.json();
    assert.ok(bumpData.updatedCount >= 2);
    const updated901 = bumpData.products.find((p) => p.sku === 'TST-901');
    assert.equal(updated901.price, 5500);

    // 7. Create comanda (public checkout) - backend recalculates authoritative price
    const orderRes = await fetch(`${srv.baseUrl}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Carlos Gómez',
        customerPhone: '1155554444',
        orderType: 'delivery',
        deliveryAddress: 'Av. Calchaquí 1234',
        paymentMethod: 'transferencia',
        items: [
          {
            productId: updated901.id,
            quantity: 2,
            price: 1, // Attempted price tampering should be ignored by backend
          },
        ],
      }),
    });
    assert.equal(orderRes.status, 200);
    const { pedido } = await orderRes.json();
    assert.equal(pedido.subtotal, 11000);
    assert.equal(pedido.deliveryCost, 2500);
    assert.equal(pedido.total, 13500);
    assert.equal(pedido.status, 'pendiente');
    assert.match(pedido.whatsappMessage, /COMANDA #/);

    // 8. Admin lists and updates comanda status
    const listOrdersRes = await fetch(`${srv.baseUrl}/api/pedidos`, { headers: authHeaders });
    assert.equal(listOrdersRes.status, 200);
    const listOrdersData = await listOrdersRes.json();
    assert.equal(listOrdersData.total, 1);

    const patchOrderRes = await fetch(`${srv.baseUrl}/api/pedidos/${pedido.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'confirmado' }),
    });
    assert.equal(patchOrderRes.status, 200);
    const patchedOrder = await patchOrderRes.json();
    assert.equal(patchedOrder.pedido.status, 'confirmado');
  } finally {
    await srv.close();
  }
});
