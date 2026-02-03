export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
  image?: string;
}

export interface QuoteItem {
  product: Product;
  quantity: number;
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
  paymentMethod: 'cash' | 'card' | 'transfer';
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
