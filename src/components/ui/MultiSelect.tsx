import { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[]; // These are the items we want to KEEP or EXCLUDE? 
                      // Pattern: Usually we pass the "value" state. 
                      // For this specific use case, we will pass the "excluded" list.
  onChange: (excluded: string[]) => void;
}

export const MultiSelect = ({ label, options, selected, onChange }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
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
      // Remove from excluded list (meaning -> include it back)
      onChange(selected.filter(item => item !== option));
    } else {
      // Add to excluded list
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
        <div className="absolute top-full mt-2 right-0 w-64 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
          <div className="flex justify-between items-center px-2 py-1 mb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Exclude Categories</span>
            {selected.length > 0 && (
              <button onClick={clearFilters} className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={10} /> Clear
              </button>
            )}
          </div>
          <div className="space-y-1">
            {options.map(option => (
              <label 
                key={option} 
                className={`flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                  selected.includes(option) ? 'bg-red-50 text-slate-400' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={selected.includes(option)} 
                  onChange={() => toggleOption(option)}
                  className="rounded border-slate-300 text-red-500 focus:ring-red-200"
                />
                <span className={selected.includes(option) ? 'line-through decoration-slate-400' : ''}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};