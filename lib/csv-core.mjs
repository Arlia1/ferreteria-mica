// Pure JS CSV parser/serializer (Zero-Dependencies, shared between backend & frontend)

const HEADER_ALIASES = {
  sku: 'sku',
  codigo: 'sku',
  code: 'sku',
  nombre: 'name',
  name: 'name',
  producto: 'name',
  title: 'name',
  marca: 'brand',
  brand: 'brand',
  rubro: 'category',
  categoria: 'category',
  category: 'category',
  unidad: 'unit',
  unit: 'unit',
  precio: 'price',
  price: 'price',
  precio_lista: 'price',
  a_consultar: 'priceOnRequest',
  consultar: 'priceOnRequest',
  price_on_request: 'priceOnRequest',
  priceonrequest: 'priceOnRequest',
  stock_disponible: 'inStock',
  disponible: 'inStock',
  in_stock: 'inStock',
  instock: 'inStock',
  cantidad_stock: 'stockQuantity',
  stock: 'stockQuantity',
  cantidad: 'stockQuantity',
  stock_quantity: 'stockQuantity',
  stockquantity: 'stockQuantity',
  alerta_stock: 'minStockAlert',
  min_stock_alert: 'minStockAlert',
  destacado: 'featured',
  featured: 'featured',
  descripcion: 'description',
  description: 'description',
  variantes: 'variants',
  variants: 'variants',
  imagen: 'image',
  image: 'image',
};

const VALID_UNITS = new Set(['unidad', 'metro', 'kg', 'litro', 'caja', 'pack', 'carga']);

export function slugifyText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeHeader(raw) {
  const clean = slugifyText(raw).replace(/-/g, '_');
  return HEADER_ALIASES[clean] || clean;
}

function parseBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  const clean = String(value ?? '').trim().toLowerCase();
  if (!clean) return fallback;
  if (['1', 'true', 'si', 'sí', 'yes', 's', 'y', 'activo', 'disponible'].includes(clean)) return true;
  if (['0', 'false', 'no', 'n', 'inactivo', 'agotado'].includes(clean)) return false;
  return fallback;
}

function parseNumber(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const raw = String(value ?? '').trim().replace(/\$/g, '').replace(/\s+/g, '');
  if (!raw) return fallback;
  // Handle Argentine format like 12.500,50 vs 12500.50
  let normalized = raw;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (raw.includes(',') && !raw.includes('.')) {
    normalized = raw.replace(',', '.');
  }
  const num = Number(normalized);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

export function detectCsvDelimiter(firstLine) {
  const line = String(firstLine || '');
  let semicolons = 0;
  let commas = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (ch === ';') semicolons++;
      if (ch === ',') commas++;
    }
  }
  return semicolons >= commas ? ';' : ',';
}

export function splitCsvRows(text, delimiter) {
  const clean = String(text || '').replace(/^\uFEFF/, '');
  const firstBreak = clean.search(/\r?\n/);
  const firstLine = firstBreak === -1 ? clean : clean.slice(0, firstBreak);
  const sep = delimiter || detectCsvDelimiter(firstLine);

  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"' && cell.length === 0) {
      inQuotes = true;
    } else if (ch === sep) {
      row.push(cell);
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

export function parseVariantsString(raw) {
  const str = String(raw || '').trim();
  if (!str) return [];
  return str
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk, idx) => {
      const parts = chunk.split(':').map((p) => p.trim());
      const label = parts[0] || `Opción ${idx + 1}`;
      const price = parseNumber(parts[1], 0);
      const stockQuantity = Math.max(0, Math.round(parseNumber(parts[2], 10)));
      const sku = parts[3] || '';
      return {
        id: slugifyText(label) || `var-${idx + 1}`,
        label,
        sku,
        price,
        stockQuantity,
        inStock: stockQuantity > 0,
      };
    });
}

export function formatVariantsString(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return '';
  return variants
    .map((v) => {
      const parts = [v.label || '', Number(v.price || 0), Number(v.stockQuantity ?? 0)];
      if (v.sku) parts.push(v.sku);
      return parts.join(':');
    })
    .join(' | ');
}

export function parseProductsCsv(csvText) {
  const rawRows = splitCsvRows(csvText);
  if (rawRows.length < 2) {
    return { rows: [], errors: ['El archivo CSV debe incluir fila de encabezados y al menos un producto.'] };
  }

  const headers = rawRows[0].map(normalizeHeader);
  const rows = [];
  const errors = [];

  for (let r = 1; r < rawRows.length; r++) {
    const cells = rawRows[r];
    const obj = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = (cells[idx] ?? '').trim();
    });

    const name = obj.name || '';
    if (!name) {
      errors.push(`Fila ${r + 1}: falta el nombre del producto.`);
      continue;
    }

    const rawCategory = slugifyText(obj.category || 'herramientas') || 'herramientas';
    const rawUnit = slugifyText(obj.unit || 'unidad');
    const unit = VALID_UNITS.has(rawUnit) ? rawUnit : 'unidad';
    const variants = parseVariantsString(obj.variants);
    const price = variants.length > 0 && !obj.price ? variants[0].price : parseNumber(obj.price, 0);
    const stockQuantity = Math.max(
      0,
      Math.round(
        parseNumber(
          obj.stockQuantity,
          variants.length > 0 ? variants.reduce((acc, v) => acc + (v.stockQuantity || 0), 0) : 10
        )
      )
    );
    const inStock = obj.inStock !== undefined && obj.inStock !== ''
      ? parseBool(obj.inStock, stockQuantity > 0)
      : stockQuantity > 0;
    const priceOnRequest = parseBool(obj.priceOnRequest, false);
    const sku = obj.sku || `FM-${slugifyText(name).slice(0, 12).toUpperCase()}`;

    rows.push({
      sku,
      name,
      brand: obj.brand || 'Genérico',
      category: rawCategory,
      unit,
      price,
      priceOnRequest,
      inStock,
      stockQuantity,
      minStockAlert: Math.max(0, Math.round(parseNumber(obj.minStockAlert, 3))),
      featured: parseBool(obj.featured, false),
      description: obj.description || '',
      variants,
      image: obj.image || '',
    });
  }

  return { rows, errors };
}

function escapeCsvCell(value, delimiter) {
  const str = String(value ?? '');
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function serializeProductsCsv(products, delimiter = ';') {
  const headers = [
    'sku',
    'nombre',
    'marca',
    'rubro',
    'unidad',
    'precio',
    'a_consultar',
    'stock_disponible',
    'cantidad_stock',
    'alerta_stock',
    'destacado',
    'descripcion',
    'variantes',
    'imagen',
  ];

  const lines = [headers.join(delimiter)];

  for (const p of products || []) {
    const row = [
      p.sku || p.id || '',
      p.name || '',
      p.brand || '',
      p.category || 'herramientas',
      p.unit || 'unidad',
      Number(p.price || 0),
      p.priceOnRequest ? 'si' : 'no',
      p.inStock !== false ? 'si' : 'no',
      Number(p.stockQuantity ?? 0),
      Number(p.minStockAlert ?? 3),
      p.featured ? 'si' : 'no',
      p.description || '',
      formatVariantsString(p.variants),
      p.image || '',
    ].map((cell) => escapeCsvCell(cell, delimiter));

    lines.push(row.join(delimiter));
  }

  return '\uFEFF' + lines.join('\r\n');
}
