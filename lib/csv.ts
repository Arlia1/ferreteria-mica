import { parseProductsCsv as parseCsvCore, serializeProductsCsv as serializeCsvCore } from './csv-core.mjs';
import { Product } from './types';

export interface ParsedCsvProductRow {
  sku: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  price: number;
  priceOnRequest: boolean;
  inStock: boolean;
  stockQuantity: number;
  minStockAlert: number;
  featured: boolean;
  description: string;
  variants: Array<{
    id: string;
    label: string;
    sku?: string;
    price: number;
    stockQuantity: number;
    inStock: boolean;
  }>;
  image?: string;
}

export function parseProductsCsv(csvText: string): { rows: ParsedCsvProductRow[]; errors: string[] } {
  return parseCsvCore(csvText) as { rows: ParsedCsvProductRow[]; errors: string[] };
}

export function serializeProductsCsv(products: Product[], delimiter = ';'): string {
  return serializeCsvCore(products, delimiter);
}

export const CSV_TEMPLATE_SAMPLE = [
  'sku;nombre;marca;rubro;unidad;precio;a_consultar;stock_disponible;cantidad_stock;alerta_stock;destacado;descripcion;variantes;imagen',
  'HER-TAL-500;Taladro Electrico 500W;Stanley;herramientas;unidad;69500;no;si;8;2;si;Taladro compacto velocidad variable;;',
  'BUL-TOR-MAD;Tornillo Madera Dorado (x100);Tel;buloneria;pack;3200;no;si;40;10;no;Caja por 100 unidades;4x30mm:3200:20:BUL-430 | 5x50mm:4800:20:BUL-550;',
  'GAS-OXI-1;Carga de Oxigeno 1 m3;Ferreteria Mica;gases;carga;0;si;si;99;5;no;Recarga en el momento en el local;;',
].join('\r\n');
