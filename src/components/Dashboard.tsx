import { useState, useMemo } from 'react';
import { Transaction, TimeFrame } from '../types';
import { filterByDate } from '../utils/dateUtils';
import DrillDownChart from './DrillDownChart';
import TrendChart from './TrendChart';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Calendar, PieChart, TrendingUp } from 'lucide-react';

interface Props {
  data: Transaction[];
  fileName: string;
}

const TIME_FRAMES: TimeFrame[] = [
  'This Week', 'Last Week', 
  'This Month', 'Last Month', 
  'This Quarter', 'Last Quarter', 
  'This Year', 'Last Year'
];

const Dashboard = ({ data, fileName }: Props) => {
  const [view, setView] = useState<'drill' | 'trend'>('drill');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Filter Data Logic
  const filteredData = useMemo(() => {
    const allDates = data.map(t => t.date);
    const validDates = new Set(
      filterByDate(
        allDates, 
        timeFrame, 
        customStart ? new Date(customStart) : undefined, 
        customEnd ? new Date(customEnd) : undefined
      )
    );
    return data.filter(t => validDates.has(t.date));
  }, [data, timeFrame, customStart, customEnd]);

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{fileName}</h1>
          <p className="text-slate-500 text-sm">
            {filteredData.length} transactions found in period
          </p>
        </div>
        
        <div className="flex p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
          <button 
            onClick={() => setView('drill')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'drill' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart size={16} />
            Drill-Down
          </button>
          <button 
            onClick={() => setView('trend')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              view === 'trend' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={16} />
            Trends
          </button>
        </div>
      </div>

      {/* Controls Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-2 text-slate-500">
              <Calendar size={18} />
              <span className="text-sm font-semibold uppercase tracking-wide">Time Frame:</span>
            </div>
            
            {TIME_FRAMES.map(tf => (
              <Button
                key={tf}
                size="sm"
                variant={timeFrame === tf ? 'primary' : 'secondary'}
                onClick={() => setTimeFrame(tf)}
                className="whitespace-nowrap"
              >
                {tf}
              </Button>
            ))}
            
            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />

            <Button
              size="sm"
              variant={timeFrame === 'Custom' ? 'primary' : 'secondary'}
              onClick={() => setTimeFrame('Custom')}
            >
              Custom
            </Button>

            {timeFrame === 'Custom' && (
              <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-lg border border-slate-200 ml-2 animate-in fade-in slide-in-from-left-4">
                <input 
                  type="date" 
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                  onChange={e => setCustomStart(e.target.value)} 
                />
                <span className="text-slate-400 text-xs">to</span>
                <input 
                  type="date" 
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                  onChange={e => setCustomEnd(e.target.value)} 
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Visualization Card */}
      <Card className="min-h-[600px] flex flex-col">
        <CardHeader 
          title={view === 'drill' ? "Category Breakdown" : "Spending Trends"} 
          action={<span className="text-xs text-slate-400 font-mono">LIVE PREVIEW</span>}
        />
        <CardContent className="flex-1">
          {view === 'drill' 
            ? <DrillDownChart transactions={filteredData} /> 
            : <TrendChart transactions={filteredData} />
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;