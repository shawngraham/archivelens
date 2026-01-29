
import React from 'react';
import { Database, Upload, BookOpen, ChevronDown } from 'lucide-react';

interface Props {
  onUploadClick: () => void;
  onManualClick: () => void;
  onSelectSample: (type: 'maritime' | 'diary') => void;
  datasetName: string;
}

const DashboardHeader: React.FC<Props> = ({ onUploadClick, onManualClick, onSelectSample, datasetName }) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
          <Database className="text-amber-500 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight heritage-font">ArchiveLens</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">{datasetName}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium bg-slate-800/50 border border-slate-700 rounded-lg"
          >
            <span>Switch Demo</span>
            <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => { onSelectSample('maritime'); setIsDropdownOpen(false); }}
                className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-800 hover:text-amber-500 border-b border-slate-800 transition-colors"
              >
                18thc Maritime Ledger
              </button>
              <button 
                onClick={() => { onSelectSample('diary'); setIsDropdownOpen(false); }}
                className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-800 hover:text-amber-500 transition-colors"
              >
                1861 Settler Diary
              </button>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-700" />

        <button 
          onClick={onManualClick}
          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <BookOpen size={16} />
          <span>Manual</span>
        </button>
        
        <button 
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 rounded-md text-sm font-medium"
        >
          <Upload size={16} />
          <span>New Archive</span>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
