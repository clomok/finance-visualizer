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

// Helper to create a darker border color from an HSL string
const darkenColor = (hslString: string, amount = 40) => {
  const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+(\.\d+)?)%\)/);
  if (!match) return '#000';
  const h = match[1];
  const s = match[2];
  const l = Math.max(0, parseFloat(match[3]) - amount); 
  return `hsl(${h}, ${s}%, ${l}%)`;
};

// Determine if text should be White or Dark Slate based on background brightness
const getContrastingTextColor = (hslString: string) => {
  const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+(\.\d+)?)%\)/);
  if (!match) return '#334155';

  const h = parseInt(match[1]);
  const s = parseInt(match[2]); 
  const l = parseFloat(match[3]);

  const isHighLuminanceHue = (h > 40 && h < 190); 
  
  if (l > 65 || (isHighLuminanceHue && l > 45)) {
    return '#0f172a'; 
  }
  return '#ffffff'; 
};

export default function DrillDownChart({ transactions }: Props) {
  const [viewRoot, setViewRoot] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const fullTree = useMemo(() => {
    const root = { 
      name: "Total", 
      id: "Total",
      color: "#ffffff", 
      total: 0, 
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
          total: 0,
          children: [],
          txns: []
        };
      }
      
      groups[t.categoryGroup].total += amount;
      groups[t.categoryGroup].txns.push(t);
      
      const childId = `${t.categoryGroup}.${t.categorySub}`;
      let child = groups[t.categoryGroup].children.find((c: any) => c.id === childId);
      if (!child) {
        child = { 
          name: t.categorySub, 
          id: childId,
          loc: 0, 
          total: 0,
          txns: [] 
        };
        groups[t.categoryGroup].children.push(child);
      }
      
      child.loc += amount;
      child.total += amount;
      child.txns.push(t);
    });

    const sortedGroups = Object.values(groups).sort((a: any, b: any) => b.total - a.total);

    sortedGroups.forEach((group, index) => {
      const base = PALETTE[index % PALETTE.length];
      group.color = `hsl(${base.h}, ${base.s}%, ${base.l}%)`;

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
    if (groupNode) {
        return { 
            ...groupNode, 
            displayedTotal: groupNode.total, 
            loc: undefined 
        };
    }
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
            setSelectedNode(node.data); 
        } else if (isLeaf) {
            setSelectedNode(node.data);
        }
    }
  };

  const handleBackClick = () => {
    if (selectedNode && selectedNode.id !== viewRoot) {
        setSelectedNode(viewRoot ? displayData : null);
        return;
    }
    if (viewRoot) {
        setViewRoot(null);
        setSelectedNode(null);
        return;
    }
  };

  const overlayTotal = viewRoot ? (displayData as any).displayedTotal : (fullTree as any).total;

  const getPercentage = (value: number) => {
      if (!overlayTotal || overlayTotal === 0) return '0.0';
      return ((value / overlayTotal) * 100).toFixed(1);
  };

  const getRowColor = (t: Transaction) => {
    if (selectedNode && selectedNode.children) {
        const childId = `${t.categoryGroup}.${t.categorySub}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const child = selectedNode.children.find((c: any) => c.id === childId);
        return child ? child.color : selectedNode.color;
    }
    return selectedNode?.color || '#cbd5e1';
  };

  if (transactions.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">No data for this period.</div>;

  const isLeafSelected = selectedNode && selectedNode.id !== viewRoot;
  const isGroupZoomed = !!viewRoot;
  const showBackButton = isLeafSelected || isGroupZoomed;
  
  let backLabel = "Back";
  if (isLeafSelected && viewRoot) backLabel = `Back to ${viewRoot}`;
  else if (isLeafSelected) backLabel = "Back to Total";
  else if (isGroupZoomed) backLabel = "Back to Total";

  const backButtonStyle = (isLeafSelected && viewRoot) ? {
      backgroundColor: (displayData as any).color,
      color: '#ffffff',
      borderColor: (displayData as any).color
  } : {};

  const centerTitle = isLeafSelected ? selectedNode.name : (viewRoot ? displayData.name : "TOTAL");
  const centerAmount = isLeafSelected ? selectedNode.total : overlayTotal;

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-[600px] w-full relative">
        <ResponsiveSunburst
          data={displayData}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          id="id"
          value="loc"
          cornerRadius={2}
          
          // INCREASED FONT SIZE VIA THEME
          theme={{
            text: {
                fontSize: 14,
                fontWeight: 600
            }
          }}

          borderWidth={(node: any) => {
             if (selectedNode && node.data.id === selectedNode.id && node.data.id !== viewRoot) return 5;
             return 1;
          }}
          borderColor={(node: any) => {
             if (selectedNode && node.data.id === selectedNode.id && node.data.id !== viewRoot) {
                 return darkenColor(node.data.color, 40); 
             }
             return 'white'; 
          }}
          
          colors={(node: any) => node.data.color}
          inheritColorFromParent={false}
          enableArcLabels={true}
          
          // REFINED LABEL LOGIC
          arcLabel={(d) => {
             // 1. Only show labels on the first visible ring (Depth 1)
             // Top Level: Depth 1 = Groups (Inner Ring)
             // Zoomed: Depth 1 = Sub-categories (Inner Ring relative to zoomed center)
             if (d.depth !== 1) return ''; 

             // 2. Hide if tiny
             const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
             if (angle < 10) return ''; 
             
             // 3. Show Percentage Only
             const pct = overlayTotal > 0 ? ((d.value / overlayTotal) * 100).toFixed(1) : '0.0';
             return `${pct}%`; 
          }}
          
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={(d: any) => getContrastingTextColor(d.color)}
          
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center justify-center w-48 h-48 rounded-full pointer-events-none">
            <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                
                {showBackButton && (
                    <button 
                        onClick={handleBackClick}
                        className={`
                            pointer-events-auto mb-2 flex items-center gap-1.5 pl-2 pr-3 py-1.5 text-[10px] uppercase font-bold tracking-wide rounded-full transition-all border
                            ${Object.keys(backButtonStyle).length > 0 
                                ? 'shadow-sm hover:brightness-110'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-slate-200'
                            }
                        `}
                        style={backButtonStyle}
                        title={backLabel}
                    >
                        <ArrowLeft size={12} />
                        {backLabel}
                    </button>
                )}

                <div className="text-lg font-bold text-slate-800 leading-tight mb-1 break-words max-w-[160px]">
                    {centerTitle}
                </div>
                <div className="text-sm font-mono text-slate-500 font-bold">
                    ${(centerAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
        </div>
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
                  onClick={() => {
                      if (selectedNode.id !== viewRoot) {
                          setSelectedNode(viewRoot ? displayData : null);
                      } else {
                          setViewRoot(null);
                          setSelectedNode(null);
                      }
                  }}
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
                  <th className="p-3 w-1"></th> 
                  <th className="p-3">Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedNode.txns.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t: Transaction) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                        <div 
                            className="w-1.5 h-6 rounded-full" 
                            style={{ backgroundColor: getRowColor(t) }}
                            title={t.categorySub} 
                        />
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap font-mono text-xs">{t.date}</td>
                    <td className="p-3 text-slate-800 font-medium">
                        <div>{t.description}</div>
                        {selectedNode.children && selectedNode.children.length > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{t.categorySub}</div>
                        )}
                    </td>
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