import { useMemo, useState } from 'react';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { Transaction } from '../types';
import { ArrowLeft } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

const PALETTE = [
  { h: 217, s: 91, l: 50 }, // Blue
  { h: 142, s: 71, l: 40 }, // Green
  { h: 32,  s: 95, l: 50 }, // Orange
  { h: 270, s: 60, l: 55 }, // Purple
  { h: 340, s: 80, l: 50 }, // Pink
  { h: 180, s: 80, l: 35 }, // Teal
  { h: 45,  s: 95, l: 45 }, // Amber/Yellow
  { h: 0,   s: 75, l: 50 }, // Red
  { h: 195, s: 85, l: 45 }, // Cyan
  { h: 240, s: 50, l: 50 }, // Indigo
  { h: 80,  s: 70, l: 40 }, // Lime
  { h: 300, s: 60, l: 40 }, // Magenta
  { h: 20,  s: 80, l: 45 }, // Brown/Rust
  { h: 160, s: 60, l: 40 }, // Emerald
  { h: 200, s: 30, l: 40 }, // Slate/Grey Blue
];

export default function DrillDownChart({ transactions }: Props) {
  const [viewRoot, setViewRoot] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const fullTree = useMemo(() => {
    const root = { 
      name: "Total", 
      id: "Total",
      color: "#ffffff", 
      // loc: undefined, // Root has no 'loc'. Nivo sums children.
      total: 0,       // Custom prop for UI Text
      children: [] as any[] 
    };
    
    const groups: Record<string, any> = {};

    transactions.forEach(t => {
      const amount = Math.abs(t.amount); 
      if (amount === 0) return;
      
      root.total += amount;

      if (!groups[t.categoryGroup]) {
        groups[t.categoryGroup] = { 
          name: t.categoryGroup, 
          id: t.categoryGroup,
          // loc: undefined, // Group has no 'loc'. Nivo sums children.
          total: 0,        // Custom prop for UI Text
          children: [] 
        };
      }
      
      // Track total for UI, but NOT for Chart Layout
      groups[t.categoryGroup].total += amount;
      
      const childId = `${t.categoryGroup}.${t.categorySub}`;
      let child = groups[t.categoryGroup].children.find((c: any) => c.id === childId);
      if (!child) {
        child = { 
          name: t.categorySub, 
          id: childId,
          loc: 0, // LEAF gets 'loc'. This drives the entire chart sizing.
          total: 0,
          txns: [] 
        };
        groups[t.categoryGroup].children.push(child);
      }
      
      child.loc += amount;
      child.total += amount;
      child.txns.push(t);
    });

    // Sort Groups by Total Size
    const sortedGroups = Object.values(groups).sort((a: any, b: any) => b.total - a.total);

    sortedGroups.forEach((group, index) => {
      const base = PALETTE[index % PALETTE.length];
      group.color = `hsl(${base.h}, ${base.s}%, ${base.l}%)`;

      // Sort Children
      group.children.sort((a: any, b: any) => b.total - a.total);

      const childCount = group.children.length;
      group.children.forEach((child: any, i: number) => {
        const minL = base.l + 10; 
        const maxL = 92;
        const step = childCount > 1 ? (maxL - minL) / (childCount - 1) : 0;
        const newL = minL + (i * step);
        child.color = `hsl(${base.h}, ${base.s}%, ${newL}%)`;
      });

      root.children.push(group);
    });

    return root;
  }, [transactions]);

  const displayData = useMemo(() => {
    if (!viewRoot) return fullTree;
    const groupNode = fullTree.children.find(g => g.id === viewRoot);
    if (groupNode) return { ...groupNode };
    return fullTree;
  }, [fullTree, viewRoot]);

  const handleNodeClick = (node: any) => {
    const isRoot = node.id === "Total" || node.id === viewRoot;
    const isGroup = (viewRoot ? node.depth === 0 : node.depth === 1); 
    const isLeaf = !node.children || node.children.length === 0;

    if (viewRoot) {
        if (isRoot) {
            setViewRoot(null);
            setSelectedNode(null);
        } else {
            setSelectedNode(node.data);
        }
    } else {
        if (isGroup && node.id !== "Total") {
            setViewRoot(node.id);
            setSelectedNode(null); 
        } else if (isLeaf) {
            setSelectedNode(node.data);
        }
    }
  };

  // Safe Total Calculation for Overlay Text
  // We use our custom 'total' property which is always accurate
  const overlayTotal = viewRoot ? (displayData as any).total : (fullTree as any).total;

  const getPercentage = (value: number) => {
      if (!overlayTotal || overlayTotal === 0) return '0.0';
      return ((value / overlayTotal) * 100).toFixed(1);
  };

  if (transactions.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">No data for this period.</div>;

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-[600px] w-full relative">
        <ResponsiveSunburst
          data={displayData}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          id="id"
          value="loc"
          cornerRadius={2}
          borderWidth={1}
          borderColor="white"
          colors={(node: any) => node.data.color}
          inheritColorFromParent={false}
          enableArcLabels={true}
          arcLabel={(d) => {
             const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
             return angle > 10 ? d.data.name : ''; 
          }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [ [ 'darker', 3 ] ] }}
          onClick={handleNodeClick}
          tooltip={({ id, value, color, data }) => (
            <div className="bg-white p-2 border border-slate-200 shadow-lg rounded flex items-center gap-2 z-50">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-semibold text-slate-700">{data.name}:</span> 
              <span className="font-mono">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-xs text-slate-400 ml-1">
                ({getPercentage(value)}%)
              </span>
            </div>
          )}
        />
        
        {/* CENTER OVERLAY */}
        {!selectedNode && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center justify-center w-48 h-48 rounded-full pointer-events-none">
                {viewRoot ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                        <button 
                            onClick={() => { setViewRoot(null); setSelectedNode(null); }}
                            className="pointer-events-auto mb-2 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                            title="Go Back"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="text-lg font-bold text-slate-800 leading-tight mb-1 break-words max-w-[160px]">
                            {displayData.name}
                        </div>
                        <div className="text-sm font-mono text-slate-500 font-bold">
                            ${(overlayTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Total Spend
                        </div>
                        <div className="text-xl font-mono font-bold text-slate-700">
                             ${(overlayTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {selectedNode && selectedNode.txns && (
        <div className="mt-4 border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              {selectedNode.name}
            </h3>
            <div className="flex items-center gap-4">
                <span className="font-mono text-slate-600 font-bold">
                    ${selectedNode.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Close Details
                </button>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm max-h-[400px] overflow-y-auto">
            <table className="min-w-full text-sm text-left bg-white relative">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedNode.txns.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t: Transaction) => (
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