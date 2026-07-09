export interface Document {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  url?: string;
}

export interface Receipt {
  id: string;
  number: string;
  invoiceId?: string;
  clientId?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  createdAt?: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  status: string;
  total: number;
  amountPaid?: number;
  amountRemaining?: number;
  createdAt: string;
  dueDate?: string;
  type?: string;
  items?: string | any[];
  receipts?: Receipt[];
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  rccm?: string;
  city?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
  totalInvoiced?: number;
  totalPaid?: number;
  totalRemaining?: number;
  invoices?: Invoice[];
  documents?: Document[];
}
