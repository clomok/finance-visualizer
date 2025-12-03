import { useState, useRef, useEffect } from 'react';
import { Filter, X, Check, Lock } from 'lucide-react';

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

  const clearFilters = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setIsOpen(false);
  };

  // Variables to track grouping for zebra-striping logic during render
  let lastParent = '';
  let subIndex = 0;

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
            {options.map(option => {
              // 1. Detect Hierarchy & Grouping
              const isSub = option.includes(' - ');
              const parentName = isSub ? option.split(' - ')[0] : option;

              // Reset counter if we hit a new group
              if (parentName !== lastParent) {
                lastParent = parentName;
                subIndex = 0;
              }
              if (isSub) subIndex++;

              // 2. Logic for Selection
              const isExplicitlySelected = selected.includes(option);
              const isParentSelected = isSub ? selected.includes(parentName) : false;
              const isEffectivelySelected = isExplicitlySelected || isParentSelected;
              const isDisabled = isParentSelected;

              // 3. Styling Logic
              // Parents get a dark, solid background.
              // Subs get alternating stripes.
              let bgClass = 'bg-white';
              if (!isSub) {
                // Parent Header Style
                bgClass = 'bg-slate-200/80 border-b border-white'; 
              } else {
                // Zebra Stripe Logic for Subs
                bgClass = subIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/80';
              }

              // Selected State Override (Red Tint)
              if (isEffectivelySelected) {
                bgClass = 'bg-red-50/80'; 
              }

              return (
                <label 
                  key={option} 
                  className={`
                    group flex items-center gap-3 px-3 py-2 transition-colors relative
                    ${bgClass}
                    ${!isSub ? 'hover:bg-slate-300' : 'hover:bg-blue-50'}
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
                    {isDisabled 
                      ? <Lock size={8} strokeWidth={4} className="opacity-75" /> 
                      : isEffectivelySelected && <Check size={10} strokeWidth={4} />
                    }
                    
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={isEffectivelySelected} 
                      disabled={isDisabled}
                      onChange={() => !isDisabled && toggleOption(option)}
                    />
                  </div>
                  
                  <span className={`
                    text-sm select-none truncate
                    ${isSub ? 'text-slate-600 font-normal' : 'text-slate-900 font-extrabold tracking-tight'}
                    ${isEffectivelySelected ? 'line-through opacity-50' : ''}
                  `}>
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};