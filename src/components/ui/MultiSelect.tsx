import { useState, useRef, useEffect, ReactNode } from 'react';
import { Filter, X, Check, Lock, Layers } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (excluded: string[]) => void;
}

export const MultiSelect = ({ label, options, selected, onChange }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const toggleVirtualParent = (parentName: string, children: string[]) => {
    // Check if ALL children are currently selected
    const allSelected = children.every(child => selected.includes(child));
    
    if (allSelected) {
      // Unlock all
      onChange(selected.filter(s => !children.includes(s)));
    } else {
      // Lock all (add missing ones)
      const newSelected = [...selected];
      children.forEach(child => {
        if (!newSelected.includes(child)) newSelected.push(child);
      });
      onChange(newSelected);
    }
  };

  const clearFilters = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setIsOpen(false);
  };

  // Pre-process options to find orphans
  // If we have "Food - Tacos" but NOT "Food", we need to know so we can render a header
  const renderList: { type: 'header' | 'item' | 'virtual-header', value: string, children?: string[] }[] = [];
  
  let lastParent = '';
  // Helper to find all children of a parent group in the dataset
  const getChildrenOf = (parent: string) => options.filter(opt => opt.startsWith(parent + ' - '));

  options.forEach(option => {
    const isSub = option.includes(' - ');
    const parentName = isSub ? option.split(' - ')[0] : option;

    // Detect new Group
    if (parentName !== lastParent) {
      lastParent = parentName;
      
      // If the current item is a SUB, and the actual Parent is NOT in the list
      // We need to inject a Virtual Header
      if (isSub && !options.includes(parentName)) {
        renderList.push({ 
          type: 'virtual-header', 
          value: parentName, 
          children: getChildrenOf(parentName) 
        });
      }
    }
    
    // Determine if this item acts as a Header (Parent category) or Item (Sub category)
    renderList.push({ 
      type: isSub ? 'item' : 'header', 
      value: option,
      // If it's a header, we store its children so we can do the select-all logic
      children: isSub ? undefined : getChildrenOf(option)
    });
  });

  // Zebra styling tracker
  let subIndex = 0;
  let currentParentForStriping = '';

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
          selected.length > 0 
            ? 'bg-blue-50 text-blue-700 border-blue-200' 
            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Filter size={16} />
        {label}
        {selected.length > 0 && (
          <span className="ml-1 bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 max-h-[600px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 flex flex-col">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 flex justify-between items-center z-10">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Exclude Categories
            </span>
            {selected.length > 0 && (
              <button 
                onClick={clearFilters} 
                className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
              >
                <X size={10} /> Clear All
              </button>
            )}
          </div>

          <div className="py-0">
            {renderList.map((node, idx) => {
              const { type, value, children } = node;
              
              // Logic for Hierarchy
              const isSub = type === 'item';
              const parentName = isSub ? value.split(' - ')[0] : value;
              
              // Track striping
              if (parentName !== currentParentForStriping) {
                currentParentForStriping = parentName;
                subIndex = 0;
              }
              if (isSub) subIndex++;

              // Selection Logic
              const isSelected = selected.includes(value);
              
              // For Virtual Headers & Real Headers: Are all children selected?
              const areChildrenSelected = children && children.length > 0 
                ? children.every(c => selected.includes(c))
                : false;

              // If I am a child, is my parent selected (conceptually)?
              const isParentSelected = isSub ? selected.includes(parentName) : false; 
              
              // IMPORTANT: 
              // If type is 'virtual-header', it is NOT in the selected list ever (it doesn't exist).
              // Its "checked" state is derived purely from whether its children are checked.
              
              const isEffectivelySelected = type === 'virtual-header' 
                ? areChildrenSelected
                : isSelected || isParentSelected;

              // Styles
              let bgClass = 'bg-white';
              if (type === 'header' || type === 'virtual-header') {
                bgClass = 'bg-slate-200/80 border-b border-white sticky top-[33px] z-0'; // sticky headers!
              } else {
                bgClass = subIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/80';
              }

              if (isEffectivelySelected) bgClass = 'bg-red-50/90';

              const isDisabled = isParentSelected && type === 'item';

              return (
                <div 
                  key={`${value}-${idx}`}
                  onClick={() => {
                    if (type === 'virtual-header' && children) {
                      toggleVirtualParent(value, children);
                    } else if (type === 'header') {
                      toggleOption(value); // Standard toggle for real headers
                    } else if (!isDisabled) {
                      toggleOption(value);
                    }
                  }}
                  className={`
                    group flex items-center gap-3 px-3 py-2 transition-colors relative
                    ${bgClass}
                    ${type === 'item' ? 'hover:bg-blue-50' : 'hover:bg-slate-300'}
                    ${isSub ? 'pl-8' : ''} 
                    ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  `}
                >
                  <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0
                    ${isEffectivelySelected 
                      ? 'bg-red-500 border-red-500 text-white' 
                      : 'border-slate-400 bg-white group-hover:border-blue-400'
                    }
                  `}>
                    {type === 'virtual-header' && !isEffectivelySelected 
                      ? <Layers size={10} className="text-slate-400" /> // Icon for virtual groupings
                      : (isDisabled 
                          ? <Lock size={8} strokeWidth={4} className="opacity-75" /> 
                          : isEffectivelySelected && <Check size={10} strokeWidth={4} />
                        )
                    }
                  </div>
                  
                  <span className={`
                    text-sm select-none truncate
                    ${type === 'item' ? 'text-slate-600 font-normal' : 'text-slate-900 font-extrabold tracking-tight'}
                    ${isEffectivelySelected ? 'line-through opacity-50' : ''}
                    ${type === 'virtual-header' ? 'italic text-slate-700' : ''} 
                  `}>
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};