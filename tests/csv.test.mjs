import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseProductsCsv,
  serializeProductsCsv,
  parseVariantsString,
  formatVariantsString,
} from '../lib/csv-core.mjs';

test('parseVariantsString and formatVariantsString round-trip cleanly', () => {
  const raw = '40mm x 4m:9800:12:SAN-40 | 63mm x 4m:15900:10:SAN-63';
  const parsed = parseVariantsString(raw);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].label, '40mm x 4m');
  assert.equal(parsed[0].price, 9800);
  assert.equal(parsed[0].stockQuantity, 12);
  assert.equal(parsed[0].sku, 'SAN-40');

  const formatted = formatVariantsString(parsed);
  assert.equal(formatted, '40mm x 4m:9800:12:SAN-40 | 63mm x 4m:15900:10:SAN-63');
});

test('parseProductsCsv handles semicolon delimiter, Argentine numbers, and variants', () => {
  const csv = [
    'sku;nombre;marca;rubro;unidad;precio;a_consultar;stock_disponible;cantidad_stock;alerta_stock;destacado;descripcion;variantes',
    'HER-999;Amoladora 900W;Bosch;Herramientas;unidad;115.500,50;no;si;7;2;si;"Amoladora profesional, 115mm";',
    'SAN-777;Caño Awaduct;Awaduct;Sanitarios;unidad;9800;no;si;22;5;no;Caño con O-Ring;40mm:9800:12:SAN-40 | 63mm:15900:10:SAN-63',
    'GAS-001;Carga Oxigeno;Mica;gases;carga;0;si;si;99;5;no;En el momento;',
  ].join('\r\n');

  const { rows, errors } = parseProductsCsv(csv);
  assert.equal(errors.length, 0);
  assert.equal(rows.length, 3);

  assert.equal(rows[0].sku, 'HER-999');
  assert.equal(rows[0].price, 115500.5);
  assert.equal(rows[0].category, 'herramientas');
  assert.equal(rows[0].featured, true);

  assert.equal(rows[1].variants.length, 2);
  assert.equal(rows[2].priceOnRequest, true);
});

test('serializeProductsCsv outputs BOM and round-trips through parseProductsCsv', () => {
  const products = [
    {
      id: 'p1',
      sku: 'TST-1',
      name: 'Llave Francesa 10"',
      brand: 'Bremen',
      category: 'herramientas',
      unit: 'unidad',
      price: 18500,
      priceOnRequest: false,
      inStock: true,
      stockQuantity: 9,
      minStockAlert: 2,
      featured: true,
      description: 'Acero cromo vanadio',
      variants: [],
    },
  ];

  const csv = serializeProductsCsv(products);
  assert.equal(csv.startsWith('\uFEFF'), true);
  const { rows, errors } = parseProductsCsv(csv);
  assert.equal(errors.length, 0);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sku, 'TST-1');
  assert.equal(rows[0].price, 18500);
});
