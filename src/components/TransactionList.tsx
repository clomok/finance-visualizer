import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, PieChart, TrendingUp, CalendarClock, CalendarRange } from 'lucide-react';
import { Transaction } from '../types';
import { differenceInDays, format } from 'date-fns';

interface Props {
  title: string;
  total: number;
  transactions: Transaction[];
  color?: string;
  dateRange: { start: Date; end: Date };
  onSelect?: (categoryName: string) => void;
  onClose: () => void;
  groupBy?: 'group' | 'sub';
  categoryColors?: Record<string, string>; 
}

// Helper to ensure text colors are readable on white background
const getTextTint = (colorStr?: string) => {
  if (!colorStr) return undefined;
  
  // If it's HSL (from DrillDownChart), darken it to ensure readability
  if (colorStr.startsWith('hsl')) {
    const match = colorStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+(\.\d+)?)%\)/);
    if (match) {
      const h = match[1];
      const s = match[2];
      // Force luminance to be at most 45% for text
      let l = parseFloat(match[3]);
      if (l > 45) l = 45; 
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
  }
  // If it's Hex (from TrendChart) or other, return as is (usually already readable)
  return colorStr;
};

export default function TransactionList({ 
  title, 
  total, 
  transactions, 
  color = '#3b82f6', 
  dateRange, 
  onSelect, 
  onClose,
  groupBy = 'sub',
  categoryColors = {}
}: Props) {
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  // 1. Group Data
  const groupedSubs = useMemo(() => {
    const groups: Record<string, { total: number; count: number; txns: Transaction[] }> = {};
    
    transactions.forEach(t => {
      const key = groupBy === 'group' 
        ? t.categoryGroup 
        : (t.categorySub || 'Unspecified');

      if (!groups[key]) groups[key] = { total: 0, count: 0, txns: [] };
      
      groups[key].total += Math.abs(t.amount);
      groups[key].count += 1;
      groups[key].txns.push(t);
    });

    return Object.entries(groups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, groupBy]);

  // Calculate formatted date string for context
  const dateLabel = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return '';
    return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
  }, [dateRange]);

  const daysSpan = Math.max(1, differenceInDays(dateRange.end, dateRange.start) + 1);

  const isSingleCategory = groupedSubs.length === 1;
  const activeView = (isSingleCategory && groupBy === 'sub') || selectedSub ? 'list' : 'summary';

  const currentTransactions = selectedSub 
    ? groupedSubs.find(g => g.name === selectedSub)?.txns || []
    : (isSingleCategory ? transactions : []);
    
  const currentTitle = selectedSub || title;
  
  // Resolve Color
  const activeColor = selectedSub && categoryColors[selectedSub] ? categoryColors[selectedSub] : color;
  // If we are drilled down, the "Header Color" should match the sub-category
  const headerColor = selectedSub ? activeColor : color;

  const currentTotal = selectedSub 
    ? groupedSubs.find(g => g.name === selectedSub)?.total || 0
    : total;

  const handleBack = () => {
    if (selectedSub && (!isSingleCategory || groupBy === 'group')) {
      setSelectedSub(null);
    } else {
      onClose();
    }
  };

  // --- RENDER: Summary Cards ---
  const renderSummary = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
      {groupedSubs.map((sub) => {
        const percent = total > 0 ? Math.min(100, (sub.total / total) * 100) : 0;
        const averageTxn = sub.total / sub.count;
        const averageDay = sub.total / daysSpan;
        
        const cardColor = categoryColors[sub.name] || color;
        const textTint = getTextTint(cardColor); // Get darkened color for text
        
        return (
          <button
            key={sub.name}
            onClick={() => {
                if (onSelect) {
                    onSelect(sub.name);
                } else {
                    setSelectedSub(sub.name);
                }
            }}
            className="relative flex flex-col p-5 bg-white border border-slate-100 rounded-xl transition-all group text-left overflow-hidden hover:shadow-lg hover:-translate-y-0.5"
            style={{
                boxShadow: `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -1px rgb(0 0 0 / 0.05)`
            }}
          >
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                style={{ backgroundColor: cardColor }}
            />
            <div 
                className="absolute left-0 top-0 bottom-0 w-1 transition-all" 
                style={{ backgroundColor: cardColor }} 
            />

            <div className="flex justify-between items-start w-full mb-4 z-10 pl-3">
              <div className="w-full">
                <div className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-700 transition-colors mb-2">
                  {sub.name}
                </div>
                
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                            <CalendarClock size={12} />
                            <span>/ day</span>
                        </div>
                        <span>${averageDay.toFixed(2)}</span>
                    </div>

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
              
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
                <ChevronRight size={18} />
              </div>
            </div>
            
            <div className="mt-auto pl-3 z-10 w-full">
               <div className="flex items-baseline justify-between mb-2">
                   <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{sub.count} {sub.count === 1 ? 'txn' : 'txns'}</span>
                   <span className="font-mono font-bold text-xl" style={{ color: textTint }}>
                    ${sub.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </span>
               </div>
               <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: cardColor }} />
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
            <th className="p-3">Account</th>
            <th className="p-3">Description</th>
            <th className="p-3 text-right">Tags</th> 
            <th className="p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {currentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => {
            // Determine tint color for the category text
            const rawCatColor = categoryColors[t.categorySub] || categoryColors[t.categoryGroup];
            const textTint = getTextTint(rawCatColor);

            return (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-3">
                    <div 
                        className="w-1.5 h-6 rounded-full group-hover:scale-y-110 transition-transform" 
                        style={{ backgroundColor: activeColor }}
                    />
                </td>
                <td className="p-3 text-slate-600 whitespace-nowrap font-mono text-xs">{t.date}</td>
                <td className="p-3 text-slate-500 whitespace-nowrap text-xs">{t.account}</td>
                <td className="p-3 text-slate-800 font-medium">
                    <div className="truncate max-w-[200px] sm:max-w-md">{t.description}</div>
                    {/* Category with Color Tint */}
                    <div 
                      className={`text-[10px] mt-0.5 ${!textTint ? 'text-slate-400' : ''}`}
                      style={{ color: textTint }}
                    >
                      {t.categoryGroup} {t.categorySub && `› ${t.categorySub}`}
                    </div>
                </td>
                {/* Tags Column - Right Aligned next to Amount */}
                <td className="p-3 text-right">
                    {t.tags && t.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {t.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                </td>
                <td className={`p-3 text-right font-mono font-bold ${t.amount > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                  ${Math.abs(t.amount).toFixed(2)}
                </td>
              </tr>
            );
          })}
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
            onClick={handleBack}
            className={`p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors ${groupBy === 'group' && !selectedSub ? 'opacity-0 pointer-events-none' : ''}`}
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
                {/* Date Context Badge */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wide">
                    <CalendarRange size={10} />
                    {dateLabel}
                </div>
            </div>

            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: headerColor }} />
              {/* Breadcrumb Logic */}
              {selectedSub && (
                  <span className="text-slate-400 font-normal">{title} <span className="text-slate-300 mx-1">/</span></span>
              )}
              <span>{currentTitle}</span>
            </h3>
            
            {activeView === 'list' && (
               <p className="text-sm text-slate-500 ml-5">{currentTransactions.length} transactions</p>
            )}
            {activeView === 'summary' && (
               <p className="text-sm text-slate-500 flex items-center gap-1 ml-5">
                 <PieChart size={14} /> Breakdown by {groupBy === 'group' ? 'Category' : 'Sub-Category'}
               </p>
            )}
          </div>
        </div>

        <div className="font-mono text-xl font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          ${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </div>
      
      {activeView === 'summary' ? renderSummary() : renderTable()}
    </div>
  );
}