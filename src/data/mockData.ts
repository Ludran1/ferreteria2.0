import { Product, Quote, Sale } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Martillo de Carpintero 16oz',
    description: 'Martillo profesional con mango de fibra de vidrio',
    price: 185.00,
    category: 'Herramientas Manuales',
    sku: 'HM-001',
    barcode: '7501234567890',
  },
  {
    id: '2',
    name: 'Taladro Inalámbrico 20V',
    description: 'Taladro con batería de litio, incluye cargador',
    price: 1450.00,
    category: 'Herramientas Eléctricas',
    sku: 'HE-001',
    barcode: '7501234567891',
  },
  {
    id: '3',
    name: 'Cemento Gris 50kg',
    description: 'Cemento portland tipo I para construcción',
    price: 165.00,
    category: 'Materiales de Construcción',
    sku: 'MC-001',
    barcode: '7501234567892',
  },
  {
    id: '4',
    name: 'Pintura Vinílica Blanca 19L',
    description: 'Pintura lavable de alta calidad',
    price: 890.00,
    category: 'Pinturas',
    sku: 'PT-001',
    barcode: '7501234567893',
  },
  {
    id: '5',
    name: 'Tubo PVC 4" x 6m',
    description: 'Tubo para drenaje sanitario',
    price: 245.00,
    category: 'Plomería',
    sku: 'PL-001',
    barcode: '7501234567894',
  },
  {
    id: '6',
    name: 'Cable THW 12 AWG (100m)',
    description: 'Cable para instalación eléctrica',
    price: 1250.00,
    category: 'Electricidad',
    sku: 'EL-001',
    barcode: '7501234567895',
  },
  {
    id: '7',
    name: 'Llave Stilson 14"',
    description: 'Llave para tubería, mandíbulas de acero',
    price: 320.00,
    category: 'Herramientas Manuales',
    sku: 'HM-002',
    barcode: '7501234567896',
  },
  {
    id: '8',
    name: 'Varilla Corrugada 3/8" x 12m',
    description: 'Varilla de acero para construcción',
    price: 85.00,
    category: 'Materiales de Construcción',
    sku: 'MC-002',
    barcode: '7501234567897',
  },
];

export const mockCategories = [
  'Herramientas Manuales',
  'Herramientas Eléctricas',
  'Materiales de Construcción',
  'Pinturas',
  'Plomería',
  'Electricidad',
];

export const mockQuotes: Quote[] = [
  {
    id: 'COT-001',
    items: [
      { product: mockProducts[0], quantity: 5 },
      { product: mockProducts[2], quantity: 20 },
    ],
    customerName: 'Juan Pérez',
    customerPhone: '555-123-4567',
    date: new Date('2024-01-15'),
    status: 'pending',
    total: 4225.00,
  },
  {
    id: 'COT-002',
    items: [
      { product: mockProducts[1], quantity: 2 },
      { product: mockProducts[5], quantity: 1 },
    ],
    customerName: 'María García',
    customerEmail: 'maria@email.com',
    date: new Date('2024-01-14'),
    status: 'approved',
    total: 4150.00,
  },
];

export const mockSales: Sale[] = [
  {
    id: 'VTA-001',
    items: [
      { product: mockProducts[3], quantity: 3 },
      { product: mockProducts[4], quantity: 10 },
    ],
    customerName: 'Carlos López',
    date: new Date('2024-01-15'),
    total: 5120.00,
    paymentMethod: 'card',
    invoiceNumber: 'FAC-001',
  },
  {
    id: 'VTA-002',
    items: [
      { product: mockProducts[7], quantity: 50 },
    ],
    customerName: 'Construcciones ABC',
    date: new Date('2024-01-14'),
    total: 4250.00,
    paymentMethod: 'transfer',
    invoiceNumber: 'FAC-002',
  },
  {
    id: 'VTA-003',
    items: [
      { product: mockProducts[0], quantity: 2 },
      { product: mockProducts[6], quantity: 1 },
    ],
    customerName: 'Pedro Martínez',
    date: new Date('2024-01-13'),
    total: 690.00,
    paymentMethod: 'cash',
  },
];
