import { useMemo, useState } from 'react';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

// 1. Define a rich palette of distinct hues (HSL format for easy shading)
// We avoid reusing colors by having a large set of distinct starting points.
const PALETTE = [
  { h: 217, s: 91, l: 50 }, // Blue
  { h: 142, s: 71, l: 40 }, // Green
  { h: 32,  s: 95, l: 50 }, // Orange
  { h: 270, s: 60, l: 55 }, // Purple
  { h: 340, s: 80, l: 50 }, // Pink
  { h: 180, s: 80, l: 35 }, // Teal
  { h: 45,  s: 95, l: 45 }, // Amber/Yellow (darkened for readability)
  { h: 0,   s: 75, l: 50 }, // Red
  { h: 195, s: 85, l: 45 }, // Cyan
  { h: 240, s: 50, l: 50 }, // Indigo
  { h: 80,  s: 70, l: 40 }, // Lime
  { h: 300, s: 60, l: 40 }, // Magenta
  { h: 20,  s: 80, l: 45 }, // Brown/Rust
  { h: 160, s: 60, l: 40 }, // Emerald
  { h: 200, s: 30, l: 40 }, // Slate/Grey Blue
];

const DrillDownChart = ({ transactions }: Props) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Transform flat transactions into Nivo tree structure with Custom Colors
  const data = useMemo(() => {
    const root = { 
      name: "Total", 
      color: "#ffffff", // Root center is white
      children: [] as any[] 
    };
    
    const groups: Record<string, any> = {};

    // 1. Group Data
    transactions.forEach(t => {
      const amount = Math.abs(t.amount); 
      if (amount === 0) return;

      if (!groups[t.categoryGroup]) {
        groups[t.categoryGroup] = { 
          name: t.categoryGroup, 
          children: [] 
        };
      }
      
      let child = groups[t.categoryGroup].children.find((c: any) => c.name === t.categorySub);
      if (!child) {
        child = { name: t.categorySub, loc: 0, txns: [] };
        groups[t.categoryGroup].children.push(child);
      }
      
      child.loc += amount;
      child.txns.push(t);
    });

    // 2. Convert to Array and Sort by Size (Largest Categories first)
    // This makes the chart look balanced and stable
    const sortedGroups = Object.values(groups).sort((a: any, b: any) => {
      const totalA = a.children.reduce((sum: number, c: any) => sum + c.loc, 0);
      const totalB = b.children.reduce((sum: number, c: any) => sum + c.loc, 0);
      return totalB - totalA;
    });

    // 3. Assign Colors Hierarchically
    sortedGroups.forEach((group, index) => {
      // Assign Base Color from Palette
      const base = PALETTE[index % PALETTE.length];
      group.color = `hsl(${base.h}, ${base.s}%, ${base.l}%)`;

      // Sort Children by size too
      group.children.sort((a: any, b: any) => b.loc - a.loc);

      // Assign Child Colors (Shades of Parent)
      const childCount = group.children.length;
      
      group.children.forEach((child: any, i: number) => {
        // Logic: Start at parent lightness + 10%, end at 90% lightness
        // This ensures the first child looks like the parent, and the last is very light
        const minL = base.l + 10; 
        const maxL = 92;
        
        // If only 1 child, just make it slightly lighter
        // If multiple, spread them out evenly
        const step = childCount > 1 ? (maxL - minL) / (childCount - 1) : 0;
        const newL = minL + (i * step);

        child.color = `hsl(${base.h}, ${base.s}%, ${newL}%)`;
      });

      root.children.push(group);
    });

    return root;
  }, [transactions]);

  // Selected Transactions Logic (unchanged)
  const selectedTransactions = useMemo(() => {
    if (!selectedPath) return null;
    const matchingTxns: Transaction[] = [];
    transactions.forEach(t => {
       // Nivo ID paths usually look like "Total.Food & Dining.Fast Food"
       // We check if the transaction parts are in that string
       if (selectedPath.includes(t.categorySub) && selectedPath.includes(t.categoryGroup)) {
         matchingTxns.push(t);
       }
    });
    return matchingTxns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPath, transactions]);

  if (transactions.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">No data for this period.</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="h-[600px] w-full relative">
        <ResponsiveSunburst
          data={data}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          id="name"
          value="loc"
          cornerRadius={2}
          borderWidth={1}
          borderColor="white" // Clean white separators
          
          // Use our custom calculated colors
          colors={(node: any) => node.data.color}
          inheritColorFromParent={false} // Important: Disable auto-inheritance so our specific shades work
          
          enableArcLabels={true}
          arcLabel={(d) => {
             // Only show label if the slice is big enough (> 5 degrees)
             const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
             return angle > 10 ? d.id.toString().split('.').pop()! : '';
          }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [ [ 'darker', 3 ] ] }} // Dark text for readability
          
          onClick={(node) => {
             const path = node.id.toString(); 
             setSelectedPath(path);
          }}
          
          // Tooltip customization
          tooltip={({ id, value, color }) => (
            <div className="bg-white p-2 border border-slate-200 shadow-lg rounded flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-semibold text-slate-700">
                {id.toString().split('.').pop()}: 
              </span> 
              <span className="font-mono">
                ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        />
        
        {/* Helper Overlay */}
        <div className="absolute top-0 left-0 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-3 py-1 text-xs text-slate-500 rounded border border-slate-200 shadow-sm inline-block">
            Click a slice to view transactions
          </div>
        </div>
      </div>

      {selectedPath && selectedTransactions && selectedTransactions.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-lg text-slate-800">
              Details: <span className="text-blue-600">{selectedPath.split('.').slice(1).join(' › ')}</span>
            </h3>
            <button 
              onClick={() => setSelectedPath(null)}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Clear Selection
            </button>
          </div>
          
          <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
            <table className="min-w-full text-sm text-left bg-white">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-600 whitespace-nowrap font-mono text-xs">{t.date}</td>
                    <td className="p-3 text-slate-800 font-medium">{t.description}</td>
                    <td className={`p-3 text-right font-mono font-bold ${t.amount > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                      ${Math.abs(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrillDownChart;