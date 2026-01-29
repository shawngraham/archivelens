
import React, { useState } from 'react';
import JSZip from 'jszip';
import DashboardHeader from './components/DashboardHeader';
import Visualizations from './components/Visualizations';
import ProvocationsPanel from './components/ProvocationsPanel';
import RecordExplorer from './components/RecordExplorer';
import ManualModal from './components/ManualModal';
import ReadingRoom from './components/ReadingRoom';
import { MARITIME_DATASET, SETTLER_DIARY_DATASET } from './constants';
import { Dataset, DataRecord, Provocation } from './types';
import { parseCSV } from './services/csvParser';
import { LayoutGrid, ListFilter, BrainCircuit, Activity, BookOpen, Download, FolderArchive } from 'lucide-react';

const App: React.FC = () => {
  const [dataset, setDataset] = useState<Dataset>(MARITIME_DATASET);
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'reading' | 'vector'>('overview');
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [currentProvocations, setCurrentProvocations] = useState<Provocation[]>([]);

  const handleUpdateRecord = (id: string | number, updates: Partial<DataRecord>) => {
    setDataset(prev => ({
      ...prev,
      records: prev.records.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const handleUpdateProvocations = (provs: Provocation[]) => {
    setCurrentProvocations(provs);
  };

  const handleSelectSample = (type: 'maritime' | 'diary') => {
    setDataset(type === 'maritime' ? MARITIME_DATASET : SETTLER_DIARY_DATASET);
    setActiveTab('overview');
    setCurrentProvocations([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (parsed.records) {
            setDataset({
              name: file.name.split('.')[0],
              records: parsed.records,
              metadata: parsed.metadata || { description: "User uploaded JSON archive", source: "Local Disk", fields: [] }
            });
          }
        } else if (fileName.endsWith('.csv')) {
          const records = parseCSV(content);
          setDataset({
            name: file.name.split('.')[0],
            records: records,
            metadata: { description: "User uploaded CSV archive", source: "Local Disk", fields: [] }
          });
        }
      } catch (err) {
        alert("Parse Error: Ensure your file follows the format described in the Manual.");
      }
    };
    reader.readAsText(file);
  };

  const exportObsidianVault = async () => {
    const zip = new JSZip();
    const vaultFolder = zip.folder(`ArchiveLens_${dataset.name}_Vault`);

    // Create Index file
    let indexContent = `---\ntitle: ${dataset.name} Index\ndate_exported: ${new Date().toISOString()}\n---\n\n`;
    indexContent += `# ${dataset.name}\n\n${dataset.metadata.description}\n\n## Master Registry\n\n`;

    // Process each record into its own MD file
    dataset.records.forEach(r => {
      const fileName = `${r.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`;
      let md = `---\n`;
      md += `id: "${r.id}"\n`;
      md += `title: "${r.title.replace(/"/g, '\\"')}"\n`;
      md += `date: "${r.date || ''}"\n`;
      md += `category: "${r.category || ''}"\n`;
      md += `location: "${r.location || ''}"\n`;
      md += `value: ${r.value || 0}\n`;
      if (r.image_url) md += `image_url: "${r.image_url}"\n`;
      md += `tags:\n  - archive-record\n  - ${r.category?.toLowerCase().replace(/\s+/g, '-') || 'uncategorized'}\n`;
      md += `---\n\n`;
      
      md += `# ${r.title}\n\n`;
      
      if (r.image_url) {
        md += `![Source Image](${r.image_url})\n\n`;
      }

      md += `## Archival Description\n> ${r.description || 'No description available.'}\n\n`;
      md += `## Researcher Marginalia\n${r.annotation || '*No researcher notes inscribed for this record.*'}\n\n`;

      const siblings = dataset.records.filter(s => s.category === r.category && s.id !== r.id);
      if (siblings.length > 0) {
        md += `## Related Records (${r.category})\n`;
        siblings.forEach(s => {
          md += `- [[${s.title}]]\n`;
        });
        md += `\n`;
      }

      md += `## Navigation\n- [[_Archive Index|Back to Index]]\n`;

      vaultFolder?.file(fileName, md);
      indexContent += `- [[${r.title}]] (${r.date || 'Undated'})\n`;
    });

    if (currentProvocations.length > 0) {
      let provMd = `---\ntitle: Vector Space Provocations\n---\n\n# Latent Interrogations\n\n`;
      currentProvocations.forEach(p => {
        provMd += `### [${p.type.toUpperCase()}] ${p.observation}\n`;
        provMd += `> ${p.context}\n\n---\n`;
      });
      vaultFolder?.file("Vector Provocations.md", provMd);
      indexContent += `\n## Theoretical Interrogations\n- [[Vector Provocations|Provocations from the Vector Space]]\n`;
    }

    vaultFolder?.file("_Archive Index.md", indexContent);

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `ArchiveLens_${dataset.name}_Vault.zip`;
    link.click();
  };

  const exportCSV = () => {
    const headers = ['Record ID', 'Title', 'Date', 'Category', 'Description', 'Researcher Annotation', 'Image URL'];
    const rows = dataset.records.map(r => [
      `"${r.id}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.date || ''}"`,
      `"${r.category || ''}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${(r.annotation || '').replace(/"/g, '""')}"`,
      `"${r.image_url || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ArchiveLens_${dataset.name}_Synthesis.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      <DashboardHeader 
        datasetName={dataset.name} 
        onUploadClick={() => document.getElementById('archive-upload')?.click()} 
        onManualClick={() => setIsManualOpen(true)}
        onSelectSample={handleSelectSample}
      />
      <input 
        id="archive-upload" 
        type="file" 
        className="hidden" 
        accept=".json,.csv"
        onChange={handleFileUpload}
      />

      <ManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />

      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-8 bg-slate-900 p-1 rounded-xl w-fit border border-slate-800 flex-wrap shadow-2xl">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={18} /><span>Snapshot</span></button>
          <button onClick={() => setActiveTab('explorer')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'explorer' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><ListFilter size={18} /><span>Explorer</span></button>
          <button onClick={() => setActiveTab('reading')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'reading' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><BookOpen size={18} /><span>Reading Room</span></button>
          <button onClick={() => setActiveTab('vector')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'vector' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><BrainCircuit size={18} /><span>Vector Space</span></button>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <section className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
                <div className="flex-1 space-y-4 z-10">
                  <div className="flex items-center gap-2 text-amber-500"><Activity size={18} /><span className="text-xs font-bold uppercase tracking-widest">Active Interrogation</span></div>
                  <h2 className="text-3xl font-bold heritage-font leading-tight">{dataset.name}</h2>
                  <p className="text-slate-400 max-w-2xl text-lg leading-relaxed font-serif italic">{dataset.metadata.description}</p>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <div className="px-5 py-3 bg-slate-800/50 rounded-xl border border-slate-800 shadow-inner"><span className="block text-2xl font-bold text-slate-100">{dataset.records.length}</span><span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Interrogated</span></div>
                    <div className="flex gap-2 ml-auto">
                      <button onClick={exportCSV} className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all border border-slate-700"><Download size={18} />Synthesis</button>
                      <button onClick={exportObsidianVault} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-900/20"><FolderArchive size={18} />Obsidian Vault</button>
                    </div>
                  </div>
                </div>
              </section>
              <Visualizations records={dataset.records} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2"><ProvocationsPanel records={dataset.records} onUpdateProvocations={handleUpdateProvocations} /></div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg heritage-font">Recent Registry Entries</h3>
                    {dataset.records.slice(0, 3).map(r => (
                      <div key={r.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer group" onClick={() => setActiveTab('reading')}>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 group-hover:text-amber-400 font-bold mb-2 inline-block">{r.category}</span>
                        <h4 className="font-bold mb-1">{r.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{r.description}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}
          {activeTab === 'explorer' && <RecordExplorer records={dataset.records} />}
          {activeTab === 'reading' && <ReadingRoom records={dataset.records} onUpdateRecord={handleUpdateRecord} />}
          {activeTab === 'vector' && (
            <div className="max-w-4xl mx-auto space-y-8">
               <div className="text-center space-y-4 mb-12"><h2 className="text-4xl font-bold heritage-font">The Latent Narrative</h2><p className="text-slate-400 text-lg font-serif">Probing for archival silences using local vector models.</p></div>
               <ProvocationsPanel records={dataset.records} onUpdateProvocations={handleUpdateProvocations} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
