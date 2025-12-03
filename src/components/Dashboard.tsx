import { useState, useMemo } from 'react';
import { Transaction, TimeFrame } from '../types';
import { filterByDate } from '../utils/dateUtils';
import DrillDownChart from './DrillDownChart';
import TrendChart from './TrendChart';

interface Props {
  data: Transaction[];
  fileName: string;
}

const Dashboard = ({ data, fileName }: Props) => {
  const [view, setView] = useState<'drill' | 'trend'>('drill');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Filter Data
  const filteredData = useMemo(() => {
    // 1. Get dates that match the timeframe
    const allDates = data.map(t => t.date);
    const validDates = new Set(
      filterByDate(
        allDates, 
        timeFrame, 
        customStart ? new Date(customStart) : undefined, 
        customEnd ? new Date(customEnd) : undefined
      )
    );
    // 2. Filter transactions
    return data.filter(t => validDates.has(t.date));
  }, [data, timeFrame, customStart, customEnd]);

  return (
    <div>
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">{fileName}</h2>
        
        <div className="flex gap-2 bg-slate-100 p-1 rounded">
          <button 
            className={`px-4 py-1 rounded ${view === 'drill' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            onClick={() => setView('drill')}
          >
            Category Drill-Down
          </button>
          <button 
            className={`px-4 py-1 rounded ${view === 'trend' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            onClick={() => setView('trend')}
          >
            Trend Analysis
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="bg-white p-4 rounded shadow-sm mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-semibold text-slate-500 uppercase mr-2">Time Frame:</span>
          {(['This Week', 'Last Week', 'This Month', 'Last Month', 'This Quarter', 'Last Quarter', 'This Year', 'Last Year'] as TimeFrame[]).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-3 py-1 text-sm rounded border ${timeFrame === tf ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {tf}
            </button>
          ))}
          <button
            onClick={() => setTimeFrame('Custom')}
            className={`px-3 py-1 text-sm rounded border ${timeFrame === 'Custom' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            Custom
          </button>

          {timeFrame === 'Custom' && (
            <div className="flex gap-2 ml-4 items-center">
              <input type="date" className="border rounded px-2 py-1 text-sm" onChange={e => setCustomStart(e.target.value)} />
              <span>to</span>
              <input type="date" className="border rounded px-2 py-1 text-sm" onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 rounded shadow-lg min-h-[500px]">
        {view === 'drill' 
          ? <DrillDownChart transactions={filteredData} /> 
          : <TrendChart transactions={filteredData} />
        }
      </div>
    </div>
  );
};

export default Dashboard;