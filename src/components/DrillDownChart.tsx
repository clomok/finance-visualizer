import { useMemo, useState } from 'react';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const DrillDownChart = ({ transactions }: Props) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Transform flat transactions into Nivo tree structure
  const data = useMemo(() => {
    const root = { name: "Expenses", color: "hsl(0, 0%, 100%)", children: [] as any[] };
    const groups: Record<string, any> = {};

    transactions.forEach(t => {
      // Invert amount for visualization if negative (spending)
      // Usually spending is negative in banks, positive in charts
      const amount = Math.abs(t.amount); 
      if (amount === 0) return;

      if (!groups[t.categoryGroup]) {
        groups[t.categoryGroup] = { name: t.categoryGroup, children: [] };
        root.children.push(groups[t.categoryGroup]);
      }
      
      // Check if child exists
      let child = groups[t.categoryGroup].children.find((c: any) => c.name === t.categorySub);
      if (!child) {
        child = { name: t.categorySub, loc: 0, txns: [] };
        groups[t.categoryGroup].children.push(child);
      }
      
      child.loc += amount;
      child.txns.push(t);
    });

    return root;
  }, [transactions]);

  // If a leaf is clicked, show transactions
  const selectedTransactions = useMemo(() => {
    if (!selectedPath) return null;
    // Simple lookup based on name matching
    // In a real app, use IDs to be safer, but names work for this structure
    const matchingTxns: Transaction[] = [];
    transactions.forEach(t => {
       // Check if this transaction belongs to the selected node
       // The Nivo ID path is usually "Expenses.Group.Sub"
       if (selectedPath.includes(t.categorySub) && selectedPath.includes(t.categoryGroup)) {
         matchingTxns.push(t);
       }
    });
    return matchingTxns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPath, transactions]);

  if (transactions.length === 0) return <div className="text-center p-10 text-slate-500">No data for this period.</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="h-[500px] w-full relative">
        <ResponsiveSunburst
          data={data}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          id="name"
          value="loc"
          cornerRadius={2}
          borderColor={{ theme: 'background' }}
          colors={{ scheme: 'nivo' }}
          childColor={{ from: 'color', modifiers: [ [ 'brighter', 0.1 ] ] }}
          enableArcLabels={true}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [ [ 'darker', 1.4 ] ] }}
          onClick={(node) => {
             // Toggle selection
             const path = node.id.toString(); // e.g. "Expenses.Food.FastFood"
             setSelectedPath(path);
          }}
        />
        <div className="absolute top-0 left-0 bg-white/80 p-2 text-xs text-slate-500 pointer-events-none">
          Click a section to see details below
        </div>
      </div>

      {selectedPath && selectedTransactions && (
        <div className="mt-8 border-t pt-4">
          <h3 className="font-bold text-lg mb-2">Details for selection</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedTransactions.map(t => (
                  <tr key={t.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">{t.date}</td>
                    <td className="p-2">{t.description}</td>
                    <td className="p-2 text-right font-mono">${Math.abs(t.amount).toFixed(2)}</td>
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