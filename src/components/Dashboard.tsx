import { useState, useMemo } from 'react';
import { Transaction, TimeFrame } from '../types';
import { filterByDate, getDateRange } from '../utils/dateUtils';
import DrillDownChart from './DrillDownChart';
import TrendChart from './TrendChart';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Calendar, PieChart, TrendingUp } from 'lucide-react';

interface Props {
  data: Transaction[];
  showIncome: boolean;
  showExpense: boolean;
  excludedCategories: string[];
}

const TIME_FRAMES: TimeFrame[] = [
  'This Week', 'Last Week', 
  'This Month', 'Last Month', 
  'This Quarter', 'Last Quarter', 
  'This Year', 'Last Year'
];

const Dashboard = ({ data, showIncome, showExpense, excludedCategories }: Props) => {
  const [view, setView] = useState<'drill' | 'trend'>('drill');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // 1. Calculate the Date Range Object for metrics
  const dateRange = useMemo(() => {
    return getDateRange(
      timeFrame, 
      customStart ? new Date(customStart) : undefined, 
      customEnd ? new Date(customEnd) : undefined
    );
  }, [timeFrame, customStart, customEnd]);

  // 2. Filter Data
  const filteredData = useMemo(() => {
    const allDates = data.map(t => t.date);
    // Use the filter utility (which uses the same logic as getDateRange internally)
    const validDates = new Set(
      filterByDate(
        allDates, 
        timeFrame, 
        customStart ? new Date(customStart) : undefined, 
        customEnd ? new Date(customEnd) : undefined
      )
    );

    const excludedSet = new Set(excludedCategories);

    return data.filter(t => {
      if (!validDates.has(t.date)) return false;
      if (excludedSet.has(t.categoryGroup)) return false;
      if (excludedSet.has(t.category)) return false;
      if (t.amount < 0 && !showExpense) return false;
      if (t.amount >= 0 && !showIncome) return false;
      return true;
    });
  }, [data, timeFrame, customStart, customEnd, showIncome, showExpense, excludedCategories]);

  const { totalIncome, totalExpense } = useMemo(() => {
    return filteredData.reduce((acc, t) => {
      if (t.amount >= 0) acc.totalIncome += t.amount;
      else acc.totalExpense += Math.abs(t.amount);
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
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

            <div className="flex p-1 bg-slate-100 rounded-lg shadow-inner self-start md:self-center">
              <button 
                onClick={() => setView('drill')}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === 'drill' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <PieChart size={16} />
                Drill-Down
              </button>
              <button 
                onClick={() => setView('trend')}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === 'trend' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <TrendingUp size={16} />
                Trends
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[600px] flex flex-col">
        <CardHeader 
          title={view === 'drill' ? "Category Breakdown" : "Spending Trends"} 
          action={
            <div className="flex gap-4 text-sm">
               {showIncome && <span className="text-green-600 font-medium">Income: ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
               {showExpense && <span className="text-red-600 font-medium">Expenses: ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
            </div>
          }
        />
        <CardContent className="flex-1">
          {view === 'drill' 
            ? <DrillDownChart transactions={filteredData} dateRange={dateRange} /> 
            : <TrendChart transactions={filteredData} />
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;