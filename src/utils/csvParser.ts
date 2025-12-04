import Papa from 'papaparse';
import { Transaction } from '../types';

const cleanString = (str: string): string => {
  if (!str) return '';
  return str.trim();
};

const parseAmount = (val: string): number => {
  if (!val) return 0;
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
              if (!row['Date'] || !row['Amount']) return null;

              const cleanDesc = cleanString(row['Description']);
              
              // Logic: If empty, mark as <none>. Do not force 'Uncategorized'.
              let fullCategory = cleanString(row['Category']);
              if (!fullCategory) fullCategory = '<none>';
              
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
            .filter((t): t is Transaction => t !== null); 

          resolve(transactions);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
};