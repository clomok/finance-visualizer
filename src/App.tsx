import { useState, useEffect } from 'react';
import { parseCSV } from './utils/csvParser';
import { saveFile, getAllFiles, deleteFile, clearAllFiles } from './utils/storage';
import { FileRecord } from './types';
import Dashboard from './components/Dashboard';
import { Trash2, Upload, FileSpreadsheet } from 'lucide-react';
import './index.css';

function App() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activeFile, setActiveFile] = useState<FileRecord | null>(null);

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
          id: crypto.randomUUID(),
          fileName: file.name,
          uploadDate: Date.now(),
          rowCount: data.length,
          data
        };
        await saveFile(record);
        await loadHistory();
        setActiveFile(record);
      } catch (err) {
        console.error("Parse error", err);
        alert("Error parsing file. Check format.");
      }
    }
  };

  const handleDelete = async (id: string) => {
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
      <div className="min-h-screen bg-slate-50 p-4">
        <button 
          onClick={() => setActiveFile(null)} 
          className="mb-4 text-blue-600 hover:underline">
          &larr; Back to File Selection
        </button>
        <Dashboard data={activeFile.data} fileName={activeFile.fileName} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 font-sans p-8">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">Finance Visualizer</h1>
        
        {/* Upload Area */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:bg-slate-50 transition mb-8">
          <label className="cursor-pointer flex flex-col items-center">
            <Upload className="w-12 h-12 text-blue-500 mb-2" />
            <span className="text-lg font-medium text-slate-600">Click to Import CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* History */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-xl font-semibold text-slate-700">Previous Imports</h2>
            {files.length > 0 && (
              <button onClick={handleNuke} className="text-red-500 text-sm hover:text-red-700 font-bold">
                Delete All
              </button>
            )}
          </div>

          {files.length === 0 && <p className="text-slate-400 italic">No files stored locally.</p>}

          <ul className="space-y-2">
            {files.map(f => (
              <li key={f.id} className="flex justify-between items-center bg-slate-50 p-3 rounded hover:bg-slate-100">
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setActiveFile(f)}>
                  <FileSpreadsheet className="text-green-600" />
                  <div>
                    <div className="font-medium text-slate-800">{f.fileName}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(f.uploadDate).toLocaleDateString()} • {f.rowCount} txns
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(f.id)} className="p-2 text-slate-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;