import { useMemo, useState, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';
import { Button } from './ui/Button';

interface Props {
  transactions: Transaction[];
}

type ChartType = 'line' | 'bar';

const TrendChart = ({ transactions }: Props) => {
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.categoryGroup));
    return Array.from(cats).sort();
  }, [transactions]);

  const [config, setConfig] = useState<Record<string, { show: boolean, type: ChartType }>>({});

  useEffect(() => {
    setConfig(prev => {
      const newConfig = { ...prev };
      let hasChanges = false;
      categories.forEach(c => {
        if (!newConfig[c]) {
          newConfig[c] = { show: true, type: 'line' };
          hasChanges = true;
        }
      });
      return hasChanges ? newConfig : prev;
    });
  }, [categories]);

  const chartData = useMemo(() => {
    const groupedByDate: Record<string, any> = {};
    
    transactions.forEach(t => {
      if (!groupedByDate[t.date]) {
        groupedByDate[t.date] = { date: t.date };
      }
      if (!groupedByDate[t.date][t.categoryGroup]) {
        groupedByDate[t.date][t.categoryGroup] = 0;
      }
      groupedByDate[t.date][t.categoryGroup] += Math.abs(t.amount);
    });

    return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  const toggleShow = (cat: string) => {
    setConfig(prev => ({ ...prev, [cat]: { ...prev[cat], show: !prev[cat].show } }));
  };

  const toggleType = (cat: string) => {
    setConfig(prev => ({ 
      ...prev, 
      [cat]: { ...prev[cat], type: prev[cat].type === 'line' ? 'bar' : 'line' } 
    }));
  };

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  if (transactions.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400">No transactions in this range.</div>;
  }

  return (
    <div className="flex flex-col h-full gap-8">
      <div className="h-[450px] w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
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
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {categories.map((cat, idx) => {
              if (!config[cat]?.show) return null;
              const color = colors[idx % colors.length];
              
              if (config[cat].type === 'bar') {
                return <Bar key={cat} dataKey={cat} fill={color} stackId="a" radius={[4, 4, 0, 0]} />;
              } else {
                return <Line key={cat} type="monotone" dataKey={cat} stroke={color} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />;
              }
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Compare Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat, idx) => {
             const color = colors[idx % colors.length];
             return (
              <div key={cat} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2 overflow-hidden">
                  <input 
                    type="checkbox" 
                    checked={config[cat]?.show ?? true} 
                    onChange={() => toggleShow(cat)} 
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    style={{ accentColor: color }}
                  />
                  <span className="text-sm font-medium text-slate-700 truncate" title={cat}>{cat}</span>
                </div>
                
                {config[cat]?.show && (
                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleType(cat)}
                    className="h-6 px-2 text-[10px] font-bold border border-slate-100 bg-slate-50 hover:bg-slate-100 ml-2"
                  >
                    {config[cat].type === 'line' ? 'LINE' : 'BAR'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrendChart;