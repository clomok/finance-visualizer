import Papa from 'papaparse';
import { Transaction } from '../types';

// Helper to sanitize basic strings to prevent XSS
const sanitizeString = (str: string): string => {
  if (!str) return '';
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
};

// Helper to parse "$ -28.00" or "-$28.00"
const parseAmount = (val: string): number => {
  if (!val) return 0;
  // Remove '$', ',', and spaces. Keep '-' and '.'
  const clean = val.replace(/[$,\s]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: Transaction[] = results.data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((row: any, index) => {
              // Validate required fields exist
              if (!row['Date'] || !row['Amount']) return null;

              const cleanDesc = sanitizeString(row['Description'] || 'Unknown');
              const fullCategory = sanitizeString(row['Category'] || 'Uncategorized');
              
              // Category Logic: "Group - Sub"
              const catParts = fullCategory.split(' - ');
              const categoryGroup = catParts[0].trim();
              const categorySub = catParts.length > 1 ? catParts[1].trim() : categoryGroup;

              return {
                id: `txn-${Date.now()}-${index}`,
                date: new Date(row['Date']).toISOString().split('T')[0],
                description: cleanDesc,
                category: fullCategory,
                categoryGroup,
                categorySub,
                amount: parseAmount(row['Amount'])
              };
            })
            .filter((t): t is Transaction => t !== null); // Remove failed rows

          resolve(transactions);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
};