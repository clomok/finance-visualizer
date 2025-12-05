export interface Transaction {
  id: string; // Generated or from CSV
  date: string; // ISO format YYYY-MM-DD
  description: string;
  category: string;
  categoryGroup: string; // Top level
  categorySub: string;   // Bottom level
  account: string;       // Added Account field
  amount: number;
}

export interface FileRecord {
  id: string;
  fileName: string;
  uploadDate: number; // timestamp
  rowCount: number;
  data: Transaction[];
}

export type TimeFrame = 'This Week' | 'Last Week' | 'This Month' | 'Last Month' | 'This Quarter' | 'Last Quarter' | 'This Year' | 'Last Year' | 'Custom';