
import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, HelpCircle, EyeOff, Loader2, Zap, Terminal, RefreshCw } from 'lucide-react';
/* FORCED SWITCH: Strictly using the local Ollama service for AI sovereignty */
import { getVectorProvocations } from '../services/ollamaService';
import { DataRecord, Provocation } from '../types';

interface Props {
  records: DataRecord[];
  onUpdateProvocations?: (provs: Provocation[]) => void;
}

const ProvocationsPanel: React.FC<Props> = ({ records, onUpdateProvocations }) => {
  const [provocations, setProvocations] = useState<Provocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchProvocations = async () => {
    if (records.length === 0) return;
    setLoading(true);
    setError(false);
    try {
      const res = await getVectorProvocations(records);
      
      const dataArray = Array.isArray(res) ? res : [];
      
      const validProvs = dataArray.filter(p => p && typeof p === 'object' && p.observation);
      setProvocations(validProvs);
      if (onUpdateProvocations) {
        onUpdateProvocations(validProvs);
      }
      
      if (validProvs.length > 0 && validProvs[0].observation.includes("failed")) {
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvocations();
  }, [records]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'silence': return <EyeOff className="text-rose-400" size={18} />;
      case 'surprise': return <Sparkles className="text-amber-400" size={18} />;
      case 'contradiction': return <AlertCircle className="text-indigo-400" size={18} />;
      case 'elision': return <HelpCircle className="text-emerald-400" size={18} />;
      default: return <Sparkles className="text-amber-400" size={18} />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-500">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/30">
        <div className="flex items-center gap-2">
          <Zap className={`${loading ? 'animate-pulse' : ''} text-amber-500`} size={20} />
          <h2 className="font-semibold heritage-font text-lg">Local AI Provocations</h2>
        </div>
        <button 
          onClick={fetchProvocations}
          disabled={loading}
          className="text-xs font-medium text-slate-400 hover:text-white transition-all flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
          {error ? 'Retry Connection' : 'Re-probe Space'}
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {loading && provocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
              <Loader2 className="animate-spin w-12 h-12 text-amber-500 relative z-10" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Interrogating Latent Space</p>
              <p className="text-xs text-slate-500 font-mono">Waiting for local Ollama response...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {provocations.length === 0 && !loading && (
              <div className="py-12 text-center text-slate-600 space-y-2">
                <HelpCircle className="mx-auto opacity-20" size={48} />
                <p className="text-sm font-serif italic">The vector space yielded no immediate provocations.</p>
              </div>
            )}
            
            {provocations.map((p, idx) => (
              <div 
                key={idx} 
                className={`group p-5 bg-slate-950/50 border rounded-xl transition-all hover:translate-x-1 animate-in fade-in slide-in-from-left-2 duration-500 ${p.observation.includes("failed") ? 'border-rose-900/50 bg-rose-950/20 shadow-[0_0_15px_-5px_rgba(244,63,94,0.3)]' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/20'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-slate-900 rounded-lg border border-slate-800 group-hover:border-slate-600 transition-colors">
                    {getTypeIcon(p.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-500 group-hover:text-slate-300 transition-colors">{p.type}</span>
                    </div>
                    <h4 className="text-slate-100 font-bold leading-tight mb-3 heritage-font text-lg">{p.observation}</h4>
                    <p className="text-xs text-slate-400 italic font-serif leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
                      "{p.context}"
                    </p>
                    
                    {p.observation.includes("failed") && (
                      <div className="mt-4 bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 space-y-2 shadow-inner">
                        <div className="flex items-center gap-2 text-rose-500 uppercase font-black text-[9px]">
                          <Terminal size={12} /> 
                          Connection Diagnostics
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-500">
                          <li>Is Ollama running? (Check Activity Monitor/Task Manager)</li>
                          <li>Is CORS enabled? Use: <code className="bg-slate-800 px-1 rounded text-slate-300">OLLAMA_ORIGINS="*" ollama serve</code></li>
                          <li>Is 'llama3' installed? Use: <code className="bg-slate-800 px-1 rounded text-slate-300">ollama pull llama3</code></li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black">
            Archive Sovereignty Shield Active
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[9px] text-slate-500 font-bold uppercase">Local Processing Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvocationsPanel;
