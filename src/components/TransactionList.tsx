import { ArrowLeft } from 'lucide-react';
import { Transaction } from '../types';

interface Props {
  title: string;
  total: number;
  transactions: Transaction[];
  color?: string;
  onClose: () => void;
}

export default function TransactionList({ title, total, transactions, color = '#3b82f6', onClose }: Props) {
  // Helper to get color for a specific row tag
  // If we have a specific color passed (from a chart slice), use it.
  // Otherwise, use a neutral gray.
  const getTagColor = () => color;

  return (
    <div className="mt-6 border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            title="Close Details"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              {title}
            </h3>
            <p className="text-sm text-slate-500">
              {transactions.length} transactions found
            </p>
          </div>
        </div>

        <div className="font-mono text-xl font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
      
      {/* Table Section */}
      <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm max-h-[500px] overflow-y-auto">
        <table className="min-w-full text-sm text-left bg-white relative">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 w-1"></th> 
              <th className="p-3">Date</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-3">
                    <div 
                        className="w-1.5 h-6 rounded-full group-hover:scale-y-110 transition-transform" 
                        style={{ backgroundColor: getTagColor() }}
                        title={t.category} 
                    />
                </td>
                <td className="p-3 text-slate-600 whitespace-nowrap font-mono text-xs">{t.date}</td>
                <td className="p-3 text-slate-800 font-medium">
                    <div className="truncate max-w-[200px] sm:max-w-md">{t.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t.category}</div>
                </td>
                <td className={`p-3 text-right font-mono font-bold ${t.amount > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                  ${Math.abs(t.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}