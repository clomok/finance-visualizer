import { useState, useEffect, useMemo } from 'react';
import { parseCSV } from './utils/csvParser';
import { saveFile, getAllFiles, deleteFile, clearAllFiles } from './utils/storage';
import { FileRecord } from './types';
import Dashboard from './components/Dashboard';
import { Trash2, Upload, FileSpreadsheet, Home, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardContent } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { MultiSelect } from './components/ui/MultiSelect';
import { generateUUID } from './utils/uuid';

function App() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activeFile, setActiveFile] = useState<FileRecord | null>(null);
  
  // Global Filters
  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(true);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);

  // STRICT FILTER LIST: Only show categories that actually exist in the data rows.
  // UPDATE: Force <none> to the bottom.
  const allCategories = useMemo(() => {
    if (!activeFile) return [];
    
    const uniqueSet = new Set<string>();
    
    activeFile.data.forEach(t => {
      if (t.category) uniqueSet.add(t.category);
    });

    // 1. Sort everything alphabetically first
    const sorted = Array.from(uniqueSet).sort();

    // 2. Find and move <none> to the bottom
    const noneIndex = sorted.indexOf('<none>');
    if (noneIndex !== -1) {
      sorted.splice(noneIndex, 1); // Remove it from its current spot
      sorted.push('<none>');       // Add it to the very end
    }

    return sorted;
  }, [activeFile]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const loaded = await getAllFiles();
    setFiles(loaded.sort((a, b) => b.uploadDate - a.uploadDate));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const data = await parseCSV(file);
        const record: FileRecord = {
          id: generateUUID(),
          fileName: file.name,
          uploadDate: Date.now(),
          rowCount: data.length,
          data
        };
        await saveFile(record);
        await loadHistory();
        setActiveFile(record);
        setExcludedCategories([]); 
      } catch (err) {
        console.error("Parse error", err);
        alert("Error parsing file. Check format.");
      }
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this file?")) {
      await deleteFile(id);
      loadHistory();
      if (activeFile?.id === id) setActiveFile(null);
    }
  };

  const handleNuke = async () => {
    if (confirm("DELETE ALL FILES? This cannot be undone.") && confirm("Are you REALLY sure?")) {
      await clearAllFiles();
      loadHistory();
      setActiveFile(null);
    }
  };

  if (activeFile) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 w-full md:w-auto">
                <Button 
                  onClick={() => setActiveFile(null)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm px-3 aspect-square flex items-center justify-center shrink-0"
                  title="Return to File Selection"
                >
                  <Home size={20} />
                </Button>
                
                <div className="h-8 w-px bg-slate-200 shrink-0" />

                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 text-sm truncate">{activeFile.fileName}</h2>
                  <p className="text-xs text-slate-500">{activeFile.rowCount} transactions</p>
                </div>
             </div>

             <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-end">
                <MultiSelect 
                  label="Filter Categories" 
                  options={allCategories} 
                  selected={excludedCategories} 
                  onChange={setExcludedCategories} 
                />

                <div className="h-8 w-px bg-slate-200 hidden md:block" />

                <div className="flex p-1 bg-slate-100/50 border border-slate-200 rounded-lg">
                    <button
                      onClick={() => setShowIncome(!showIncome)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        showIncome 
                          ? 'bg-green-100 text-green-700 shadow-sm border border-green-200' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      <TrendingUp size={16} />
                      <span className="hidden sm:inline">Income</span>
                    </button>
                    <div className="w-1" />
                    <button
                      onClick={() => setShowExpense(!showExpense)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        showExpense 
                          ? 'bg-red-100 text-red-700 shadow-sm border border-red-200' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      <TrendingDown size={16} />
                      <span className="hidden sm:inline">Expenses</span>
                    </button>
                </div>
             </div>
          </div>

          <Dashboard 
            data={activeFile.data} 
            showIncome={showIncome}
            showExpense={showExpense}
            excludedCategories={excludedCategories}
          />
        </div>
      </div>
    );
  }

  // Upload Screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 font-sans p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader 
          title="Finance Visualizer" 
          action={files.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleNuke}>
              Delete All
            </Button>
          )} 
        />
        <CardContent className="space-y-8">
          <div className="group border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer relative">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="flex flex-col items-center pointer-events-none">
              <div className="bg-blue-50 p-4 rounded-full mb-4 group-hover:bg-blue-100 transition">
                <Upload className="w-8 h-8 text-blue-500" />
              </div>
              <span className="text-lg font-medium text-slate-700">Drop your CSV here</span>
              <span className="text-sm text-slate-400 mt-1">or click to browse</span>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200 text-sm flex items-center justify-center font-medium">
            <span role="img" aria-label="info" className="mr-2 text-xl">⚠️</span>
            <p>No file is ever uploaded to a server.</p>
            <p>All your data stays 100% offline and in your browser only.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Usage Notes</h2>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 text-sm space-y-2">
              <p>To use this visualizer, export your transactions from <span className="font-bold">Tiller</span> as a <span className="font-bold">CSV</span> file and upload it using the input above.</p>
              <p>This visualizer is currently designed to be used with <span className="font-bold">2 tiers of categories</span> separated by a hyphen. For example:</p>
              <ul className="list-disc list-inside ml-4">
                <li><code>Parent - Child</code> (e.g.  <code>Food - Groceries</code>)</li>
              </ul>
              <p>You are not required to use multi-tiered categories, but the feature is currently fully supported for 2 tiers of categories.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Next Changes</h2>
            <ul className="list-disc list-inside bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 text-sm space-y-1">
              <li>Enable 3 tiers of category support.</li>
              <li>Integrate groups as top-level category.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Previous Imports</h2>
            {files.length === 0 && (
              <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-slate-100">
                No files found. Upload one to get started.
              </div>
            )}

            <div className="grid gap-3">
              {files.map(f => (
                <div 
                  key={f.id} 
                  onClick={() => setActiveFile(f)}
                  className="group flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-2.5 rounded-lg">
                      <FileSpreadsheet className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-blue-700 transition">{f.fileName}</div>
                      <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                        <span>{new Date(f.uploadDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{f.rowCount} rows</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => handleDelete(f.id, e)} 
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-slate-500 text-sm">
        Built with ❤️ by <a href="https://menu.thekylestyle.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium">Kyle</a>
      </p>
    </div>
  );
}

export default App;