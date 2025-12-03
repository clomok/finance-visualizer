import { useMemo, useState } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

type ChartType = 'line' | 'bar';

const TrendChart = ({ transactions }: Props) => {
  // 1. Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.categoryGroup));
    return Array.from(cats).sort();
  }, [transactions]);

  // 2. State for configuration
  const [config, setConfig] = useState<Record<string, { show: boolean, type: ChartType }>>({});

  // Initialize config when categories change
  useMemo(() => {
    setConfig(prev => {
      const newConfig = { ...prev };
      categories.forEach(c => {
        if (!newConfig[c]) {
          newConfig[c] = { show: true, type: 'line' };
        }
      });
      return newConfig;
    });
  }, [categories]);

  // 3. Prepare Data for Recharts
  // Structure: { date: '2023-01-01', 'Food': 100, 'Bills': 500 }
  const chartData = useMemo(() => {
    const groupedByDate: Record<string, any> = {};
    
    transactions.forEach(t => {
      if (!groupedByDate[t.date]) {
        groupedByDate[t.date] = { date: t.date };
      }
      if (!groupedByDate[t.date][t.categoryGroup]) {
        groupedByDate[t.date][t.categoryGroup] = 0;
      }
      // Sum absolute values
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

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

  return (
    <div className="flex flex-col h-full">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {categories.map((cat, idx) => {
              if (!config[cat]?.show) return null;
              const color = colors[idx % colors.length];
              
              if (config[cat].type === 'bar') {
                return <Bar key={cat} dataKey={cat} fill={color} stackId="a" />;
              } else {
                return <Line key={cat} type="monotone" dataKey={cat} stroke={color} strokeWidth={2} />;
              }
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-sm font-bold text-slate-500 mb-2">Category Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center justify-between bg-slate-50 p-2 rounded border">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={config[cat]?.show ?? true} 
                  onChange={() => toggleShow(cat)} 
                  className="mr-2"
                />
                <span className="text-sm truncate max-w-[100px]" title={cat}>{cat}</span>
              </div>
              
              {config[cat]?.show && (
                <button 
                  onClick={() => toggleType(cat)}
                  className="text-xs px-2 py-0.5 bg-white border rounded hover:bg-slate-100"
                >
                  {config[cat].type === 'line' ? 'Line' : 'Bar'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendChart;