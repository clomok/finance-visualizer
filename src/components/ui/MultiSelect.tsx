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
    // Logic: If we are toggling a Parent, we don't need to touch the children 
    // because the UI (and Filter Logic) handles the inheritance automatically.
    
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

          <div className="py-1">
            {options.map(option => {
              // 1. Detect Hierarchy
              const isSub = option.includes(' - ');
              const parentName = isSub ? option.split(' - ')[0] : null;

              // 2. Determine Selection State
              const isExplicitlySelected = selected.includes(option);
              const isParentSelected = parentName ? selected.includes(parentName) : false;
              
              // 3. Effective State (Visible State)
              // It is checked if YOU clicked it OR if your PARENT is clicked
              const isEffectivelySelected = isExplicitlySelected || isParentSelected;

              // 4. Interaction State
              // If parent is selected, the child is "Locked" (you can't uncheck it without unchecking parent)
              const isDisabled = isParentSelected;

              return (
                <label 
                  key={option} 
                  className={`
                    group flex items-center gap-3 px-3 py-2 transition-colors relative
                    ${isEffectivelySelected ? 'bg-red-50/50' : 'hover:bg-slate-50'}
                    ${isSub ? 'pl-8' : 'bg-slate-50/30'} 
                    ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  `}
                >
                  <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0
                    ${isEffectivelySelected 
                      ? 'bg-red-500 border-red-500 text-white' 
                      : 'border-slate-300 bg-white group-hover:border-blue-400'
                    }
                  `}>
                    {/* Icon Logic: Show Check normally, but Lock if inherited from parent */}
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
                    ${isSub ? 'text-slate-500 font-normal' : 'text-slate-800 font-bold'}
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