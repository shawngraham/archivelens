
import React from 'react';
// Added 'Network' to the imports to fix the missing name error
import { X, Code, FileJson, CheckCircle2, FileSpreadsheet, Book, LayoutGrid, ListFilter, BrainCircuit, Download, ImageIcon, Search, Microscope, BookOpen, Terminal, Database, Link, Share2, Info, FolderArchive, Zap, MousePointer2, Network } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ManualModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <BookOpen className="text-amber-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold heritage-font">ArchiveLens: User Manual & Data Protocol</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Comprehensive Scholarly Documentation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          {/* Philosophical Overview */}
          <section className="space-y-4">
            <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
              <Info size={14} /> The Interrogative Stance
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed italic font-serif bg-slate-950/30 p-6 rounded-lg border-l-4 border-amber-500/50 shadow-inner">
              "ArchiveLens is a tool for critical bibliography and digital humanities. It treats the dataset not as a fixed repository of truth, but as a site of active interrogation. We prioritize the 'unseen'—the silences, the elisions, and the statistical outliers that traditional archival summaries often smooth over. By combining local vector space analysis with topological mapping, we enable researchers to find connections beyond the reach of traditional taxonomies."
            </p>
          </section>

          {/* Data Protocol Section */}
          <section className="space-y-6">
            <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
              <Database size={14} /> Data Formatting Requirements
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <p className="text-xs text-slate-400">Ensure your CSV or JSON files contain the following key fields. Column headers are case-insensitive, but exact matches are preferred.</p>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-800/50 text-slate-400 font-bold uppercase tracking-tighter">
                        <th className="px-4 py-2 border-b border-slate-800">Field</th>
                        <th className="px-4 py-2 border-b border-slate-800">Type</th>
                        <th className="px-4 py-2 border-b border-slate-800">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300 font-mono">
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-indigo-400">id</td><td className="px-4 py-2">String/Num</td><td className="px-4 py-2">Primary key for the record.</td></tr>
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-indigo-400">title</td><td className="px-4 py-2">String</td><td className="px-4 py-2">Display name (e.g., Vessel Name, Person Name).</td></tr>
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-indigo-400">date</td><td className="px-4 py-2">ISO Date</td><td className="px-4 py-2">YYYY-MM-DD or YYYY. Used for temporal magnitude charts.</td></tr>
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-indigo-400">category</td><td className="px-4 py-2">String</td><td className="px-4 py-2">Primary classification group.</td></tr>
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-indigo-400">description</td><td className="px-4 py-2">Text</td><td className="px-4 py-2">Detailed transcription or archival note.</td></tr>
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-indigo-400">value</td><td className="px-4 py-2">Number</td><td className="px-4 py-2">Magnitude (e.g., currency, tonnage, count).</td></tr>
                      <tr><td className="px-4 py-2 text-indigo-400">image_url</td><td className="px-4 py-2">URL</td><td className="px-4 py-2">Direct link to a digital facsimile image.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-inner">
                  <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2"><FileJson size={12} /> JSON Structure</h4>
                  <pre className="text-[10px] text-slate-400 font-mono leading-relaxed overflow-x-auto">
{`{
  "name": "Archive Name",
  "records": [
    {
      "id": "REC001",
      "title": "Artifact A",
      "value": 150,
      ...
    }
  ],
  "metadata": {
    "description": "...",
    "source": "..."
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Core Functionality */}
          <section className="space-y-8">
            <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
              <Zap size={14} /> Core Functionality
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-100">
                  <LayoutGrid className="text-amber-500" size={18} />
                  <h4>Archive Snapshot</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The dashboard overview provides quantitative macro-analysis. <strong>Classification Distribution</strong> shows where the majority of documentation is focused, while the <strong>Temporal Magnitude</strong> area chart highlights documenting surges—ideal for identifying historical document density shifts.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-100">
                  <ListFilter className="text-indigo-400" size={18} />
                  <h4>Record Explorer</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A high-speed search and retrieval interface. Includes <strong>Metric Significance</strong> bars that normalize record values against the corpus average, allowing you to instantly identify statistical outliers.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-100">
                  <Network className="text-emerald-400" size={18} />
                  <h4>Distant Reading (Topological Network)</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Located in the Reading Room. This custom visualizer uses <strong>TF-IDF</strong> analysis to create a semantic network. Records are linked by shared lexical signatures rather than just shared categories, revealing latent sub-archives.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-100">
                  <ImageIcon className="text-rose-400" size={18} />
                  <h4>Close Witnessing & Marginalia</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A parallel viewing mode that places digital facsimiles next to transcriptions. Use the <strong>Researcher Marginalia</strong> panel to commit persistent scholarly notes to any record, which are saved in the session and included in all exports.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-100">
                  <BrainCircuit className="text-amber-500" size={18} />
                  <h4>Vector Space Provocations</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Powered by <strong>Local Ollama models</strong>. This engine probes the dataset for "Archival Silences"—identifying where documentation stops or whose voices are notably omitted based on historical context.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-100">
                  <FolderArchive className="text-indigo-400" size={18} />
                  <h4>Obsidian Vault Export</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generates a ZIP archive containing individual Markdown files for every record. Each file includes <strong>YAML Frontmatter</strong> for structured data and automatic <strong>[[Wikilinks]]</strong> to related records in the same category.
                </p>
              </div>
            </div>
          </section>

          {/* Technical Requirements - OLLAMA SPECIFIC */}
          <section className="p-8 bg-slate-800/30 border border-slate-700 rounded-2xl space-y-6 shadow-2xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Terminal size={14} /> Local AI Sovereignity: Ollama Setup
            </h3>
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                To protect archival privacy, ArchiveLens uses a <strong>Local-Only</strong> AI model. No data ever leaves your computer. Follow these steps to enable AI features:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-amber-500 font-bold text-xs">1</div>
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-200 uppercase mb-1">Install Ollama</h5>
                      <p className="text-[10px] text-slate-500">Download from ollama.com and ensure the background service is active.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-amber-500 font-bold text-xs">2</div>
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-200 uppercase mb-1">Enable CORS</h5>
                      <p className="text-[10px] text-slate-500">Critical: Browsers block requests to local servers unless OLLAMA_ORIGINS is set.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-[11px] space-y-4 shadow-inner">
                  <div className="space-y-1">
                    <span className="text-amber-500 font-bold uppercase tracking-tighter text-[9px]">Run Command (Mac/Linux)</span>
                    <p className="text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">OLLAMA_ORIGINS="*" ollama serve</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-amber-500 font-bold uppercase tracking-tighter text-[9px]">Required Model</span>
                    <p className="text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">ollama pull llama3</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic border-t border-slate-800 pt-4">
                Note: ArchiveLens communicates with Ollama at <strong>http://localhost:11434</strong>. If the connection fails, check your Firewall or OLLAMA_ORIGINS setting.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase font-bold">
            <span className="flex items-center gap-1"><MousePointer2 size={10} /> Point & Click Discovery</span>
            <span className="flex items-center gap-1"><Terminal size={10} /> Local AI Sovereignty</span>
          </div>
          <button 
            onClick={onClose}
            className="px-12 py-3 bg-amber-500 text-amber-950 rounded-lg text-sm font-bold hover:bg-amber-400 transition-all shadow-xl shadow-amber-900/20 flex items-center gap-2 active:scale-95"
          >
            <CheckCircle2 size={16} /> Enter the Archive
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualModal;
