import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, PieChart, TrendingUp, CalendarClock } from 'lucide-react';
import { Transaction } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

interface Props {
  title: string;
  total: number;
  transactions: Transaction[];
  color?: string;
  onSelect?: (categoryName: string) => void;
  onClose: () => void;
}

export default function TransactionList({ title, total, transactions, color = '#3b82f6', onSelect, onClose }: Props) {
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // 1. Group Data
  const groupedSubs = useMemo(() => {
    const groups: Record<string, { total: number; count: number; txns: Transaction[] }> = {};
    
    transactions.forEach(t => {
      const key = t.categorySub || 'Unspecified';
      if (!groups[key]) groups[key] = { total: 0, count: 0, txns: [] };
      
      groups[key].total += Math.abs(t.amount);
      groups[key].count += 1;
      groups[key].txns.push(t);
    });

    return Object.entries(groups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const isSingleCategory = groupedSubs.length === 1;
  const activeView = isSingleCategory ? 'list' : 'summary';

  // --- RENDER: Summary Cards ---
  const renderSummary = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      {groupedSubs.map((sub) => {
        const percent = total > 0 ? Math.min(100, (sub.total / total) * 100) : 0;
        const averageTxn = sub.total / sub.count;

        // Calculate Daily Average
        // We find the span between the first and last transaction in this group
        const dates = sub.txns.map(t => parseISO(t.date)).sort((a, b) => a.getTime() - b.getTime());
        const daysSpan = dates.length > 0 ? differenceInDays(dates[dates.length - 1], dates[0]) + 1 : 1;
        const averageDay = sub.total / daysSpan;
        
        return (
          <button
            key={sub.name}
            onClick={() => onSelect && onSelect(sub.name)}
            className="relative flex flex-col p-5 bg-white border border-slate-100 rounded-xl transition-all group text-left overflow-hidden hover:shadow-lg hover:-translate-y-0.5"
            style={{
                boxShadow: `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -1px rgb(0 0 0 / 0.05)`
            }}
          >
            {/* Dynamic Background Wash */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                style={{ backgroundColor: color }}
            />
            
            {/* Colored Accent Line - Thinner (w-1) */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-1 transition-all" 
                style={{ backgroundColor: color }} 
            />

            <div className="flex justify-between items-start w-full mb-4 z-10 pl-3">
              <div className="w-full">
                <div className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-700 transition-colors mb-2">
                  {sub.name}
                </div>
                
                {/* Metrics Grid */}
                <div className="flex flex-col gap-1.5">
                    {/* Primary Metric: Avg / Day (Bold) */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                            <CalendarClock size={12} />
                            <span>/ day</span>
                        </div>
                        <span>${averageDay.toFixed(2)}</span>
                    </div>

                    {/* Secondary Metric: Avg / Txn (Lighter) */}
                    {sub.count > 1 && (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                            <div className="flex items-center gap-1 px-1.5">
                                <TrendingUp size={12} />
                                <span>/ txn</span>
                            </div>
                            <span>${averageTxn.toFixed(0)}</span>
                        </div>
                    )}
                </div>
              </div>
              
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0"
              >
                <ChevronRight size={18} />
              </div>
            </div>
            
            <div className="mt-auto pl-3 z-10 w-full">
               <div className="flex items-baseline justify-between mb-2">
                   <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{sub.count} {sub.count === 1 ? 'txn' : 'txns'}</span>
                   <span 
                        className="font-mono font-bold text-xl"
                        style={{ color: color }} 
                   >
                    ${sub.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </span>
               </div>

               {/* Progress Bar Container */}
               <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%`, backgroundColor: color }} 
                    />
               </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  // --- RENDER: Transaction Rows ---
  const renderTable = () => (
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
                      style={{ backgroundColor: color }}
                  />
              </td>
              <td className="p-3 text-slate-600 whitespace-nowrap font-mono text-xs">{t.date}</td>
              <td className="p-3 text-slate-800 font-medium">
                  <div className="truncate max-w-[200px] sm:max-w-md">{t.description}</div>
              </td>
              <td className={`p-3 text-right font-mono font-bold ${t.amount > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                ${Math.abs(t.amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="mt-6 border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span>{title}</span>
            </h3>
            
            {activeView === 'list' && (
               <p className="text-sm text-slate-500">{transactions.length} transactions</p>
            )}
            {activeView === 'summary' && (
               <p className="text-sm text-slate-500 flex items-center gap-1">
                 <PieChart size={14} /> Breakdown by Category
               </p>
            )}
          </div>
        </div>

        <div className="font-mono text-xl font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
      
      {activeView === 'summary' ? renderSummary() : renderTable()}
    </div>
  );
}