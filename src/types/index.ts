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
  quoteNumber?: string;
}

export interface Sale {
  id: string;
  items: QuoteItem[];
  customerName: string;
  date: Date;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'yape' | 'plin';
  paymentType?: 'contado' | 'credito';
  clientId?: string;
  balance?: number;
  invoiceNumber?: string;
}

export interface Client {
  id: string;
  name: string;
  documentType?: string;
  documentId?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  saleId?: string;
  amount: number;
  paymentMethod: string;
  date: Date;
  notes?: string;
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
  paymentType?: 'contado' | 'credito';
}

export interface UserMetadata {
  role?: 'admin' | 'employee';
  allowedSections?: string[];
}
