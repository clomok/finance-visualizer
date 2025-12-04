import { useMemo, useState } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps 
} from 'recharts';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { Transaction } from '../types';
import { Button } from './ui/Button';
import TransactionList from './TransactionList';
import { BarChart3, LineChart as LineChartIcon, CalendarDays, CalendarRange, Calendar } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  dateRange: { start: Date; end: Date }; 
}

type GroupBy = 'day' | 'week' | 'month';
type ChartType = 'stacked' | 'line';

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#14b8a6', '#eab308', '#ef4444', '#06b6d4', '#6366f1', 
  '#84cc16', '#d946ef', '#f97316', '#10b981', '#64748b'
];

const getColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
    const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

    return (
      <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 min-w-[200px]">
        <div className="mb-2 border-b border-slate-100 pb-2">
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Total: <span className="font-bold text-slate-900">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
        <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {sortedPayload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between text-xs gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full shadow-sm" 
                  style={{ backgroundColor: entry.color }} 
                />
                <span className="text-slate-600 font-medium truncate max-w-[120px]">
                  {entry.name}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-700">
                ${entry.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ transactions }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>('week');
  const [chartType, setChartType] = useState<ChartType>('stacked');
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  
  const [selectedSlice, setSelectedSlice] = useState<{
    label: string;
    total: number;
    txns: Transaction[];
    range: { start: Date; end: Date }; 
  } | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.categoryGroup));
    return Array.from(cats).sort();
  }, [transactions]);

  const categoryColors = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => map[c] = getColor(c));
    return map;
  }, [categories]);

  const getKey = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (groupBy === 'month') return format(startOfMonth(date), 'yyyy-MM-dd');
    if (groupBy === 'week') return format(startOfWeek(date), 'yyyy-MM-dd');
    return dateStr; 
  };

  const formatLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (groupBy === 'month') return format(date, 'MMMM yyyy'); // Full Month Name
    if (groupBy === 'week') return `Week of ${format(date, 'MMM d, yyyy')}`;
    return format(date, 'MMM d, yyyy');
  };

  const data = useMemo(() => {
    const groupedData: Record<string, any> = {};

    transactions.forEach(t => {
      const key = getKey(t.date);
      if (!groupedData[key]) {
        groupedData[key] = { 
          date: key,
          label: formatLabel(key),
          total: 0 
        };
        categories.forEach(c => groupedData[key][c] = 0);
      }
      const val = Math.abs(t.amount);
      groupedData[key][t.categoryGroup] += val;
      groupedData[key].total += val;
    });

    return Object.values(groupedData).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [transactions, groupBy, categories]);

  // Click Handler - Fix: Unwrap payload safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (eventData: any) => {
    // Recharts passes an event object. The real data is in .payload
    // Depending on version/chart type, it might be nested differently.
    const dataPoint = eventData.payload || eventData;
    
    if (!dataPoint || !dataPoint.date) return;

    const dateStr = dataPoint.date; 
    const dateObj = parseISO(dateStr);
    
    let rangeStart = dateObj;
    let rangeEnd = dateObj;

    if (groupBy === 'week') {
      rangeStart = startOfWeek(dateObj);
      rangeEnd = endOfWeek(dateObj);
    } else if (groupBy === 'month') {
      rangeStart = startOfMonth(dateObj);
      rangeEnd = endOfMonth(dateObj);
    } 

    const relevantTxns = transactions.filter(t => getKey(t.date) === dateStr);
    const total = relevantTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    setSelectedSlice({
      label: dataPoint.label, // "Week of Oct 12, 2025"
      txns: relevantTxns,
      total,
      range: { start: rangeStart, end: rangeEnd }
    });
  };

  const toggleCategory = (cat: string) => {
    const newHidden = new Set(hiddenCategories);
    if (newHidden.has(cat)) newHidden.delete(cat);
    else newHidden.add(cat);
    setHiddenCategories(newHidden);
  };

  if (data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400">No data for this period.</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2 tracking-wider">Group By</span>
          {(['day', 'week', 'month'] as GroupBy[]).map(g => (
             <Button 
                key={g}
                size="sm" 
                variant={groupBy === g ? 'primary' : 'ghost'} 
                onClick={() => { setGroupBy(g); setSelectedSlice(null); }}
                className="capitalize"
              >
                {g === 'day' && <Calendar size={14} className="mr-1" />}
                {g === 'week' && <CalendarRange size={14} className="mr-1" />}
                {g === 'month' && <CalendarDays size={14} className="mr-1" />}
                {g}
              </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2 tracking-wider">Type</span>
          <Button 
            size="sm" 
            variant={chartType === 'stacked' ? 'primary' : 'ghost'} 
            onClick={() => setChartType('stacked')}
          >
            <BarChart3 size={14} className="mr-1" /> Stacked
          </Button>
          <Button 
            size="sm" 
            variant={chartType === 'line' ? 'primary' : 'ghost'} 
            onClick={() => setChartType('line')}
          >
            <LineChartIcon size={14} className="mr-1" /> Lines
          </Button>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="label" 
              tick={{fill: '#64748b', fontSize: 12}} 
              tickLine={false} 
              axisLine={{stroke: '#cbd5e1'}} 
              minTickGap={30}
            />
            <YAxis 
              tick={{fill: '#64748b', fontSize: 12}} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Legend content={() => null} />
            
            {categories.map((cat) => {
              if (hiddenCategories.has(cat)) return null;
              const color = getColor(cat);

              if (chartType === 'stacked') {
                return (
                  <Bar 
                    key={cat} 
                    dataKey={cat} 
                    fill={color} 
                    stackId="a" 
                    radius={[0, 0, 0, 0]} 
                    // FIX: Pass the payload data correctly
                    onClick={(data) => handleBarClick(data)}
                    cursor="pointer"
                  />
                );
              } else {
                return (
                  <Line 
                    key={cat} 
                    type="monotone" 
                    dataKey={cat} 
                    stroke={color} 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 0, fill: color }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, onClick: (payload: any) => handleBarClick(payload.payload) }}
                  />
                );
              }
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Toggle Categories
          </h3>
          <button 
            onClick={() => setHiddenCategories(new Set())}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Show All
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const color = getColor(cat);
            const isHidden = hiddenCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`
                  flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all
                  ${isHidden 
                    ? 'bg-slate-50 text-slate-400 border-slate-200 opacity-75' 
                    : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:border-blue-300'
                  }
                `}
              >
                <div 
                  className={`w-2.5 h-2.5 rounded-full ${isHidden ? 'bg-slate-300' : ''}`} 
                  style={{ backgroundColor: isHidden ? undefined : color }}
                />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {selectedSlice && (
        <TransactionList 
          title={selectedSlice.label}
          total={selectedSlice.total}
          transactions={selectedSlice.txns}
          dateRange={selectedSlice.range} 
          groupBy="group" 
          categoryColors={categoryColors} 
          onClose={() => setSelectedSlice(null)}
        />
      )}

    </div>
  );
}