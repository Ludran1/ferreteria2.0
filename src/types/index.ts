export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  barcode?: string;
  additionalBarcodes?: string[];
  image?: string;
}

export interface QuoteItem {
  product: Product;
  quantity: number;
  customPrice?: number; // Precio personalizado por ítem
}

export interface Quote {
  id: string;
  items: QuoteItem[];
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  total: number;
}

export interface Sale {
  id: string;
  items: QuoteItem[];
  customerName: string;
  date: Date;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'yape' | 'plin';
  invoiceNumber?: string;
}

export interface RemissionGuide {
  id: string;
  saleId: string;
  customerName: string;
  address: string;
  items: QuoteItem[];
  date: Date;
  status: 'pending' | 'delivered';
}

export interface BusinessInfo {
  name: string;
  rfc: string;
  address: string;
  phone: string;
  email: string;
}

export interface PrintableDocumentData {
  type: 'quote' | 'sale' | 'remission';
  documentNumber: string;
  date: Date;
  customerName: string;
  customerPhone?: string;
  address?: string; // For remission guides
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'yape' | 'plin';
}
