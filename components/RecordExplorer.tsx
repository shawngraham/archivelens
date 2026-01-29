
import React, { useState } from 'react';
import { Search, ChevronRight, FileText, MapPin, Calendar } from 'lucide-react';
import { DataRecord } from '../types';

interface Props {
  records: DataRecord[];
}

const RecordExplorer: React.FC<Props> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | number | null>(records[0]?.id || null);

  const filtered = records.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRecord = records.find(r => r.id === selectedId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-[700px] flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text"
            placeholder="Search archival entries..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-slate-400">
          {filtered.length} of {records.length} records
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="w-1/3 border-r border-slate-800 overflow-y-auto custom-scrollbar bg-slate-950/20">
          {filtered.map(record => (
            <button
              key={record.id}
              onClick={() => setSelectedId(record.id)}
              className={`w-full text-left p-4 border-b border-slate-800/50 transition-colors group flex items-center justify-between ${selectedId === record.id ? 'bg-amber-500/10' : 'hover:bg-slate-800/50'}`}
            >
              <div>
                <h4 className={`text-sm font-semibold mb-1 ${selectedId === record.id ? 'text-amber-400' : 'text-slate-300'}`}>
                  {record.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider">
                  <span>{record.date}</span>
                  <span>•</span>
                  <span>{record.category}</span>
                </div>
              </div>
              <ChevronRight size={14} className={`transition-transform ${selectedId === record.id ? 'translate-x-1 text-amber-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
            </button>
          ))}
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-900 custom-scrollbar">
          {selectedRecord ? (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <FileText size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Entry Details</span>
                </div>
                <h2 className="text-4xl font-bold heritage-font leading-tight">{selectedRecord.title}</h2>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Inscribed Date</span>
                  </div>
                  <p className="text-slate-200">{selectedRecord.date || 'Undated'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Locus / Origin</span>
                  </div>
                  <p className="text-slate-200">{selectedRecord.location || 'Unknown'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Narrative Description</h3>
                <p className="text-lg leading-relaxed heritage-font text-slate-300 italic">
                  "{selectedRecord.description}"
                </p>
              </div>

              <div className="pt-8 border-t border-slate-800">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4">Metric Significance</h3>
                <div className="flex items-end gap-2">
                  <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (selectedRecord.value || 0) / 10)}%` }}
                    />
                  </div>
                  <span className="text-xl font-bold text-amber-500">{selectedRecord.value} <span className="text-xs text-slate-500 font-normal">units</span></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
              <FileText size={48} strokeWidth={1} />
              <p className="text-sm">Select a record to explore the archive</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordExplorer;
