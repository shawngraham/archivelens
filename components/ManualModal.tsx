
import React from 'react';
// Added 'Network' to the imports to fix the missing name error
import { X, Code, FileJson, CheckCircle2, FileSpreadsheet, Book, LayoutGrid, ListFilter, BrainCircuit, Download, ImageIcon, Search, Microscope, BookOpen, Terminal, Database, Link, Share2, Info, FolderArchive, Zap, MousePointer2, Network, Waypoints } from 'lucide-react';

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
                  <Waypoints className="text-emerald-400" size={18} />
                  <h4>Knowledge Graph Embeddings</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Located in the Reading Room's Distant Analysis view. Transforms your archival records into a <strong>knowledge graph</strong> of (entity, relation, entity) triples, then trains a neural embedding model to learn latent relational structure. See below for details.
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

          {/* Knowledge Graph Embeddings Documentation */}
          <section className="space-y-6">
            <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-2">
              <Waypoints size={14} /> Knowledge Graph Embeddings — Deep Dive
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200">What Are Knowledge Graph Embeddings?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A knowledge graph represents information as <strong>(head, relation, tail)</strong> triples — for example,
                  <em className="text-slate-300"> (Treaty of Westphalia, has_category, Diplomatic)</em> or
                  <em className="text-slate-300"> (Ship Aurora, located_in, Liverpool)</em>.
                  Knowledge Graph Embedding (KGE) models learn low-dimensional vector representations for every entity and relation,
                  placing entities that participate in similar relational patterns close together in embedding space.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This allows the model to <strong>predict missing links</strong> ("what other entities might share this relation?"),
                  <strong> find similar entities</strong> by embedding proximity, and <strong>reveal latent structure</strong> that
                  categorical labels alone cannot capture.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200">How Triples Are Extracted</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ArchiveLens automatically converts your flat tabular records into a knowledge graph using <strong>field-based extraction</strong>:
                </p>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-800/50 text-slate-400 font-bold uppercase tracking-tighter">
                        <th className="px-4 py-2 border-b border-slate-800">Record Field</th>
                        <th className="px-4 py-2 border-b border-slate-800">Relation</th>
                        <th className="px-4 py-2 border-b border-slate-800">Example Triple</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300 font-mono text-[11px]">
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-emerald-400">category</td><td className="px-4 py-2">has_category</td><td className="px-4 py-2">(Ship Aurora, has_category, Cargo)</td></tr>
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-emerald-400">location</td><td className="px-4 py-2">located_in</td><td className="px-4 py-2">(Ship Aurora, located_in, Liverpool)</td></tr>
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-emerald-400">date</td><td className="px-4 py-2">dated_to</td><td className="px-4 py-2">(Ship Aurora, dated_to, 1842)</td></tr>
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-emerald-400">value</td><td className="px-4 py-2">has_magnitude</td><td className="px-4 py-2">(Ship Aurora, has_magnitude, high_magnitude)</td></tr>
                      <tr className="border-b border-slate-800/50"><td className="px-4 py-2 text-emerald-400">description</td><td className="px-4 py-2">mentions</td><td className="px-4 py-2">(Ship Aurora, mentions, cargo)</td></tr>
                      <tr><td className="px-4 py-2 text-emerald-400">shared category</td><td className="px-4 py-2">shares_category_with</td><td className="px-4 py-2">(Ship Aurora, shares_category_with, Ship Belinda)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200">Available Models</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase">DistMult</h5>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Diagonal bilinear model. Scores triples as <strong className="text-slate-400 font-mono">sum(h * r * t)</strong>.
                      Best for <strong>symmetric</strong> relations (e.g., "shares_category_with"). Fastest to train.
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase">ComplEx</h5>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Complex-valued embeddings. Scores via <strong className="text-slate-400 font-mono">Re(sum(h * r * conj(t)))</strong>.
                      Handles both <strong>symmetric and antisymmetric</strong> relations. Good default choice.
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase">RotatE</h5>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Models relations as <strong>rotations</strong> in complex space. Scores via <strong className="text-slate-400 font-mono">-||h ∘ r - t||</strong>.
                      Excels at <strong>hierarchical, compositional</strong>, and inversion patterns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200">Interpreting Results</h4>
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Embedding Scatter Plot:</strong> Entity embeddings projected to 2D via PCA.
                    Record entities appear as larger circles colored by category; attribute values (locations, dates, keywords)
                    appear as smaller dots. Clusters indicate entities with similar relational roles in the knowledge graph.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Similar Entities:</strong> Select a record to see its nearest neighbors
                    by cosine similarity in embedding space. Neighbors that share no explicit category or keyword links
                    suggest <strong>latent structural similarity</strong> — a form of distant reading beyond taxonomy.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Link Prediction:</strong> Select an entity and a relation type.
                    The model ranks all entities by how plausible the model considers the triple
                    <em className="text-slate-300"> (entity, relation, ?)</em>. High-scoring predictions that don't exist
                    in the original data point to <strong>possible undocumented connections</strong> — archival silences
                    that the embedding geometry makes legible.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Evaluation Metrics:</strong> <strong>MRR</strong> (Mean Reciprocal Rank)
                    measures how highly the model ranks true triples on average (closer to 1.0 = better).
                    <strong> Hits@10</strong> shows what percentage of true triples appear in the top 10 predictions.
                    These are computed on a sample of the training set for quick diagnostic feedback.
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-2">
                <h5 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Tips for Archival Use</h5>
                <ul className="text-[10px] text-slate-500 leading-relaxed space-y-1 list-disc list-inside">
                  <li>Start with <strong className="text-slate-400">ComplEx</strong> as a default — it handles the mix of symmetric and directed relations typical of archival data.</li>
                  <li>Use <strong className="text-slate-400">dimension 50</strong> and <strong className="text-slate-400">100 epochs</strong> as a baseline; increase for larger datasets.</li>
                  <li>A dropping loss curve indicates the model is learning structure. If loss plateaus high, try a larger dimension or more epochs.</li>
                  <li>Link prediction is most interesting for <strong className="text-slate-400">mentions</strong> and <strong className="text-slate-400">located_in</strong> relations — these can reveal thematic and geographic connections not explicit in the catalog.</li>
                  <li>No data leaves your browser. All computation runs locally in JavaScript.</li>
                </ul>
              </div>
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
