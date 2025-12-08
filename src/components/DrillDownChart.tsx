import { useMemo, useState, useRef } from 'react';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { Transaction } from '../types';
import { Home } from 'lucide-react';
import TransactionList from './TransactionList';

interface Props {
  transactions: Transaction[];
  dateRange: { start: Date; end: Date };
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

const darkenColor = (hslString: string, amount = 40) => {
  const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+(\.\d+)?)%\)/);
  if (!match) return '#000';
  const h = match[1];
  const s = match[2];
  const l = Math.max(0, parseFloat(match[3]) - amount); 
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const getContrastingTextColor = (hslString: string) => {
  const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+(\.\d+)?)%\)/);
  if (!match) return '#334155';
  const h = parseInt(match[1]);
  const l = parseFloat(match[3]);
  const isHighLuminanceHue = (h > 40 && h < 190); 
  if (l > 65 || (isHighLuminanceHue && l > 45)) return '#0f172a'; 
  return '#ffffff'; 
};

export default function DrillDownChart({ transactions, dateRange }: Props) {
  const [viewRoot, setViewRoot] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Ref for auto-scrolling to list
  const transactionListRef = useRef<HTMLDivElement>(null);

  // We need to extract the color map from the tree construction to pass to the list
  const { fullTree, categoryColors } = useMemo(() => {
    const root = { 
      name: "Total", 
      id: "Total", 
      color: "#ffffff", 
      total: 0, 
      children: [] as any[] 
    };
    
    const groups: Record<string, any> = {};
    const colors: Record<string, string> = {}; // Capture colors for list view

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
      
      // Store group color for the list
      colors[group.name] = group.color;

      group.children.sort((a: any, b: any) => b.total - a.total);

      const childCount = group.children.length;
      group.children.forEach((child: any, i: number) => {
        const minL = base.l + 10; 
        const maxL = 92;
        const step = childCount > 1 ? (maxL - minL) / (childCount - 1) : 0;
        const newL = minL + (i * step);
        child.color = `hsl(${base.h}, ${base.s}%, ${newL}%)`;
        
        // Store child color if needed (though list usually uses parent color for grouping)
        colors[child.name] = child.color;
      });

      root.children.push(group);
    });

    return { fullTree: root, categoryColors: colors };
  }, [transactions]);

  // Derive the selected node object from the current tree using the ID
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    if (selectedNodeId === 'Total') return fullTree;
    if (selectedNodeId === 'DrillRoot') return fullTree; // Should not happen often but safe fallback

    // Search Groups (Depth 1)
    const group = fullTree.children.find((g: any) => g.id === selectedNodeId);
    if (group) return group;

    // Search Children (Depth 2)
    for (const g of fullTree.children) {
      const child = (g as any).children?.find((c: any) => c.id === selectedNodeId);
      if (child) return child;
    }
    
    return null;
  }, [fullTree, selectedNodeId]);

  const displayData = useMemo(() => {
    if (!viewRoot) return fullTree;
    const groupNode = fullTree.children.find(g => g.id === viewRoot);
    if (groupNode) {
        // WRAPPER STRATEGY:
        // Wrap the single group in a dummy root. 
        // This forces the "Group" to be rendered as Depth 1 (Inner Ring)
        // and its children as Depth 2 (Outer Ring).
        return { 
            id: 'DrillRoot',
            name: 'Total', // Hidden by overlay anyway
            color: '#ffffff',
            children: [groupNode],
            displayedTotal: groupNode.total, 
            loc: undefined 
        };
    }
    // Fallback if viewRoot no longer exists in current data
    return fullTree;
  }, [fullTree, viewRoot]);

  const scrollToTransactions = () => {
    setTimeout(() => {
      transactionListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleNodeClick = (node: any) => {
    // 1. Handle Center/Root Click (Depth 0)
    // In drill view, this is the "DrillRoot" wrapper.
    if (node.depth === 0) {
        if (viewRoot) {
            setViewRoot(null);
            setSelectedNodeId(null);
        }
        return;
    }

    // 2. Handle Group Click (Depth 1)
    // In drill view, this is the Inner Ring (the Parent Category).
    if (node.depth === 1) {
        if (viewRoot) {
             // We are zoomed in and clicked the inner ring (Parent). 
             // BEHAVIOR CHANGE: Instead of zooming out to total, we just reset 
             // selection to the Group View (deselecting any leaf).
             setSelectedNodeId(viewRoot);
        } else {
             // We are at Global Root, clicked a slice -> Zoom In
             setViewRoot(node.data.id);
             setSelectedNodeId(node.data.id);
        }
        return;
    }

    // 3. Handle Leaf Click (Depth 2+)
    setSelectedNodeId(node.data.id);
    scrollToTransactions();
  };

  const handleBackClick = () => {
    // BEHAVIOR CHANGE: Always go back to Total (Root)
    if (viewRoot) {
        setViewRoot(null);
        setSelectedNodeId(null);
    }
  };

  const handleListSelection = (name: string) => {
    // Case 1: We are at Root Level, user clicks a Group Card -> Zoom In
    if (!viewRoot) {
        const group = fullTree.children.find(g => g.name === name);
        if (group) {
            setViewRoot(group.id);
            setSelectedNodeId(group.id);
        }
        return;
    }

    // Case 2: We are Zoomed In, user clicks a Sub-Category Card -> Show Details
    const contextNode = selectedNode || displayData;
    // If displayData is our wrapper, the group is child[0]
    const searchRoot = (contextNode.id === 'DrillRoot') ? contextNode.children[0] : contextNode;

    if (searchRoot && searchRoot.children) {
      const child = searchRoot.children.find((c: any) => c.name === name);
      if (child) {
        setSelectedNodeId(child.id);
        scrollToTransactions();
      }
    }
  };

  const overlayTotal = viewRoot ? (displayData as any).displayedTotal : (fullTree as any).total;

  const getPercentage = (value: number) => {
      if (!overlayTotal || overlayTotal === 0) return '0.0';
      return ((value / overlayTotal) * 100).toFixed(1);
  };


  if (transactions.length === 0) return <div className="h-full flex items-center justify-center text-slate-400">No data for this period.</div>;

  const isLeafSelected = selectedNode && selectedNode.id !== viewRoot && selectedNode.id !== 'DrillRoot' && selectedNode.id !== 'Total';
  const isGroupZoomed = !!viewRoot;
  const showBackButton = isGroupZoomed; // Always show if zoomed in
  
  // Resolve Title for Center
  let centerTitle = "TOTAL";
  if (isLeafSelected && selectedNode) {
      centerTitle = selectedNode.name;
  } else if (viewRoot) {
      // Find the group name from fullTree to be safe
      const group = fullTree.children.find(g => g.id === viewRoot);
      if (group) centerTitle = group.name;
  }

  const centerAmount = isLeafSelected ? selectedNode.total : overlayTotal;

  // Fixed Label for Back Button
  const backLabel = "Back to Total";

  // Determine back button color style
  // Keep simple standard grey/white
  const backButtonStyle = {}; 

  // Determine what to show in the list
  const listProps = selectedNode && selectedNode.id !== 'DrillRoot' && selectedNode.id !== 'Total' ? {
      title: selectedNode.name,
      total: selectedNode.total,
      transactions: selectedNode.txns,
      color: selectedNode.color,
      groupBy: 'sub' as const
  } : {
      title: centerTitle === "TOTAL" ? "All Categories" : centerTitle,
      total: centerAmount,
      transactions: viewRoot 
        ? fullTree.children.find(g => g.id === viewRoot)?.txns || [] 
        : transactions,
      color: viewRoot ? categoryColors[centerTitle] : '#cbd5e1',
      groupBy: viewRoot ? 'sub' as const : 'group' as const
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-[600px] w-full relative">
        <ResponsiveSunburst
          data={displayData}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          id="id"
          value="loc"
          cornerRadius={2}
          theme={{ text: { fontSize: 14, fontWeight: 600 } }}
          borderWidth={((node: any) => {
             // Highlight selected leaf
             if (selectedNodeId && node.data.id === selectedNodeId && node.data.id !== viewRoot) return 5;
             return 1;
          }) as any}
          borderColor={(node: any) => {
             if (selectedNodeId && node.data.id === selectedNodeId && node.data.id !== viewRoot) {
                 return darkenColor(node.data.color, 40); 
             }
             return 'white'; 
          }}
          colors={(node: any) => node.data.color}
          inheritColorFromParent={false}
          enableArcLabels={true}
          arcLabel={(d: any) => { 
             // Logic to show label:
             // 1. If we are DrillRoot (depth 0), show nothing.
             if (d.depth === 0) return '';
             
             // 2. If standard leaf logic
             const isLeaf = !d.children || d.children.length === 0;
             if (!isLeaf) {
                 if (viewRoot && d.depth === 1) return ''; // Inner ring parent doesn't need label
                 return '';
             }

             const angle = (d.endAngle - d.startAngle) * (180 / Math.PI);
             if (angle < 10) return ''; 
             const pct = overlayTotal > 0 ? ((d.value / overlayTotal) * 100).toFixed(1) : '0.0';
             return `${pct}%`; 
          }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={(d: any) => getContrastingTextColor(d.color)}
          onClick={handleNodeClick}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tooltip={({ value, color, data }: any) => {
            if (data.id === 'DrillRoot') return <></>;
            return (
                <div className="bg-white p-2 border border-slate-200 shadow-lg rounded flex items-center gap-2 z-50">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-semibold text-slate-700">{data.name}:</span> 
                <span className="font-mono">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="text-xs text-slate-400 ml-1">
                    ({getPercentage(value)}%)
                </span>
                </div>
            );
          }}
        />
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center justify-center w-48 h-48 rounded-full pointer-events-none">
            <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                {showBackButton && (
                    <button 
                        onClick={handleBackClick}
                        className={`pointer-events-auto mb-2 flex items-center gap-1.5 pl-2 pr-3 py-1.5 text-[10px] uppercase font-bold tracking-wide rounded-full transition-all border ${Object.keys(backButtonStyle).length > 0 ? 'shadow-sm hover:brightness-110' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-slate-200'}`}
                        style={backButtonStyle}
                        title={backLabel}
                    >
                        <Home size={12} />
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

      <div ref={transactionListRef}>
        <TransactionList 
          {...listProps}
          dateRange={dateRange}
          onSelect={handleListSelection} 
          categoryColors={categoryColors} 
          onClose={() => {
              if (selectedNodeId && selectedNodeId !== viewRoot) {
                  setSelectedNodeId(viewRoot);
              } else {
                  setViewRoot(null);
                  setSelectedNodeId(null);
              }
          }}
        />
      </div>
    </div>
  );
};