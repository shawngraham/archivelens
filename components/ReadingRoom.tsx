
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Book, Quote, Hash, AlignLeft, Maximize2, Minimize2, Edit3, Save, Eye, Layers, ImageIcon, Network, Share2, Target, BarChart2, TrendingUp, ArrowUpDown } from 'lucide-react';
import { DataRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import KnowledgeGraphCard from './KnowledgeGraphCard';

interface Props {
  records: DataRecord[];
  onUpdateRecord: (id: string | number, updates: Partial<DataRecord>) => void;
}

const ReadingRoom: React.FC<Props> = ({ records, onUpdateRecord }) => {
  const [viewMode, setViewMode] = useState<'distant' | 'close'>('distant');
  const [expandedRecords, setExpandedRecords] = useState<Set<string | number>>(new Set());
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [tempAnnotation, setTempAnnotation] = useState("");
  const [hoverNode, setHoverNode] = useState<string | number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | number | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [lexicalMode, setLexicalMode] = useState<'frequency' | 'tfidf'>('frequency');
  const recordRefs = useRef<Record<string | number, HTMLDivElement | null>>({});

  // Reset local state when the dataset changes
  useEffect(() => {
    setViewMode('distant');
    setExpandedRecords(new Set());
    setEditingId(null);
    setTempAnnotation("");
    setHoverNode(null);
    setSelectedNodeId(null);
    setSelectedWord(null);
    setLexicalMode('frequency');
    recordRefs.current = {};
  }, [records]);

  // Scroll to selected record after switching to close witnessing
  useEffect(() => {
    if (viewMode === 'close' && selectedNodeId !== null) {
      const timeout = setTimeout(() => {
        recordRefs.current[selectedNodeId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setSelectedNodeId(null);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [viewMode, selectedNodeId]);

  const handleNodeClick = (id: string | number) => {
    setSelectedNodeId(id);
    setExpandedRecords(new Set([id]));
    setViewMode('close');
  };

  const toggleExpand = (id: string | number) => {
    const newSet = new Set(expandedRecords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRecords(newSet);
  };

  const startEditing = (record: DataRecord) => {
    setEditingId(record.id);
    setTempAnnotation(record.annotation || "");
  };

  const saveAnnotation = (id: string | number) => {
    onUpdateRecord(id, { annotation: tempAnnotation });
    setEditingId(null);
  };

  // TF-IDF & Relationship Logic + Force Atlas Layout
  const analysis = useMemo(() => {
    const stopWords = new Set(['the', 'and', 'was', 'for', 'with', 'from', 'this', 'that', 'were', 'had', 'been', 'which', 'their', 'they', 'there', 'some', 'those', 'also', 'upon', 'then', 'into', 'entry', 'notes', 'arrived', 'with', 'from']);
    
    const docTFs: Record<string | number, Record<string, number>> = {};
    const globalDF: Record<string, number> = {}; 

    // 1. Calculate TF-IDF
    records.forEach(r => {
      const text = `${r.title} ${r.description || ''} ${r.category || ''}`.toLowerCase();
      const words = text.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
      const freqs: Record<string, number> = {};
      const uniqueWordsInDoc = new Set<string>();
      words.forEach(w => {
        freqs[w] = (freqs[w] || 0) + 1;
        uniqueWordsInDoc.add(w);
      });
      uniqueWordsInDoc.forEach(w => { globalDF[w] = (globalDF[w] || 0) + 1; });
      docTFs[r.id] = freqs;
    });

    const numDocs = records.length;
    const docKeywords: Record<string | number, string[]> = {};
    records.forEach(r => {
      const tfs = docTFs[r.id];
      const scores = Object.entries(tfs).map(([word, count]) => {
        const tf = count / (Object.values(tfs).reduce((a, b) => a + b, 0) || 1);
        const idf = Math.log(numDocs / (globalDF[word] || 1));
        return { word, score: tf * idf };
      });
      docKeywords[r.id] = scores.sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.word);
    });

    // 2. Initial Node Data
    let nodes = records.map((r) => ({
      id: r.id,
      name: r.title,
      category: r.category,
      keywords: docKeywords[r.id] || [],
      x: 250 + (Math.random() - 0.5) * 100,
      y: 200 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      density: 0,
      size: 6 + (r.value ? Math.min(10, r.value / 100) : 4)
    }));

    // 3. Link Calculation & Density Ranking
    const links: any[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const commonWords = nodes[i].keywords.filter(w => nodes[j].keywords.includes(w));
        const sharedCategory = nodes[i].category === nodes[j].category;
        
        if (commonWords.length > 0 || sharedCategory) {
          const strength = commonWords.length * 1.5 + (sharedCategory ? 0.5 : 0);
          links.push({
            sourceIdx: i,
            targetIdx: j,
            strength,
            type: commonWords.length > 0 ? 'semantic' : 'taxonomic'
          });
          nodes[i].density += strength;
          nodes[j].density += strength;
        }
      }
    }

    // 4. Force Atlas Simulation (Simplified Deterministic)
    const iterations = 80;
    const k = Math.sqrt((500 * 400) / nodes.length);
    
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy || 1;
          const force = (k * k) / Math.sqrt(distSq);
          nodes[i].vx += (dx / Math.sqrt(distSq)) * force * 0.1;
          nodes[i].vy += (dy / Math.sqrt(distSq)) * force * 0.1;
        }
      }

      links.forEach(link => {
        const source = nodes[link.sourceIdx];
        const target = nodes[link.targetIdx];
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist * dist) / k;
        const fx = (dx / dist) * force * link.strength * 0.05;
        const fy = (dy / dist) * force * link.strength * 0.05;
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      });

      const sortedByDensity = [...nodes].sort((a, b) => b.density - a.density);
      nodes.forEach(node => {
        const rankIdx = sortedByDensity.findIndex(n => n.id === node.id);
        const percent = rankIdx / nodes.length;
        
        let targetRadius = 180;
        if (percent < 0.2) targetRadius = 50;
        else if (percent < 0.6) targetRadius = 120;

        const dx = node.x - 250;
        const dy = node.y - 200;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const radialForce = (dist - targetRadius) * 0.06;
        node.vx -= (dx / dist) * radialForce;
        node.vy -= (dy / dist) * radialForce;
        
        node.vx -= (dx / dist) * 0.25;
        node.vy -= (dy / dist) * 0.25;
      });

      nodes.forEach(node => {
        node.x += Math.max(-15, Math.min(15, node.vx));
        node.y += Math.max(-15, Math.min(15, node.vy));
        node.vx *= 0.5;
        node.vy *= 0.5;
        node.x = Math.max(50, Math.min(450, node.x));
        node.y = Math.max(50, Math.min(350, node.y));
      });
    }

    const topGlobalWords = Object.entries(globalDF).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

    // Enhanced lexical data: category breakdown per word
    const categories = Array.from(new Set(records.map(r => r.category || 'Uncategorized')));
    const wordCategoryDF: Record<string, Record<string, number>> = {};
    const wordRecordIds: Record<string, Set<string | number>> = {};
    records.forEach(r => {
      const cat = r.category || 'Uncategorized';
      const text = `${r.title} ${r.description || ''} ${r.category || ''}`.toLowerCase();
      const uniqueWords = new Set(text.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w)));
      uniqueWords.forEach(w => {
        if (!wordCategoryDF[w]) wordCategoryDF[w] = {};
        wordCategoryDF[w][cat] = (wordCategoryDF[w][cat] || 0) + 1;
        if (!wordRecordIds[w]) wordRecordIds[w] = new Set();
        wordRecordIds[w].add(r.id);
      });
    });

    // Aggregated TF-IDF importance per word (sum of TF-IDF scores across all docs)
    const globalTFIDF: Record<string, number> = {};
    records.forEach(r => {
      const tfs = docTFs[r.id];
      const totalTerms = Object.values(tfs).reduce((a, b) => a + b, 0) || 1;
      Object.entries(tfs).forEach(([word, count]) => {
        const tf = count / totalTerms;
        const idf = Math.log(numDocs / (globalDF[word] || 1));
        globalTFIDF[word] = (globalTFIDF[word] || 0) + tf * idf;
      });
    });

    // Build enhanced word list (top 20)
    const enrichedWordsByDF = Object.entries(globalDF)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, value]) => ({
        name,
        value,
        proportion: Math.round((value / numDocs) * 100),
        categories: wordCategoryDF[name] || {},
        tfidfScore: globalTFIDF[name] || 0,
        recordIds: Array.from(wordRecordIds[name] || [])
      }));

    const enrichedWordsByTFIDF = Object.entries(globalTFIDF)
      .filter(([w]) => globalDF[w] >= 2) // appear in at least 2 docs
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, score]) => ({
        name,
        value: globalDF[name] || 0,
        proportion: Math.round(((globalDF[name] || 0) / numDocs) * 100),
        categories: wordCategoryDF[name] || {},
        tfidfScore: score,
        recordIds: Array.from(wordRecordIds[name] || [])
      }));

    return {
      nodes,
      links: links.map(l => ({ ...l, source: nodes[l.sourceIdx], target: nodes[l.targetIdx] })),
      topGlobalWords,
      enrichedWordsByDF,
      enrichedWordsByTFIDF,
      categories
    };
  }, [records]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1 rounded-xl w-full max-w-md mx-auto shadow-2xl">
        <button onClick={() => setViewMode('distant')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${viewMode === 'distant' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Layers size={16} />Distant Analysis</button>
        <button onClick={() => setViewMode('close')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${viewMode === 'close' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Eye size={16} />Close Witnessing</button>
      </div>

      {viewMode === 'distant' ? (
        <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2 text-amber-500">
                  <Network size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Archive Topology (Layered Force-Atlas)</h3>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-400"></div><span className="text-[9px] uppercase font-bold text-slate-500">Semantic</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-600"></div><span className="text-[9px] uppercase font-bold text-slate-500">Taxonomic</span></div>
                </div>
              </div>

              <div className="h-[450px] w-full bg-slate-950/60 rounded-lg border border-slate-800 relative overflow-hidden shadow-inner">
                {/* Layer Guides */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <circle cx="250" cy="200" r="50" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                  <circle cx="250" cy="200" r="120" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                  <circle cx="250" cy="200" r="180" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                </svg>

                <svg viewBox="0 0 500 400" className="w-full h-full relative z-10">
                  {/* Link Layer - Elevated visibility */}
                  {analysis.links.map((link, i) => {
                    const isHovered = hoverNode === link.source.id || hoverNode === link.target.id;
                    return (
                      <line
                        key={i}
                        x1={link.source.x} y1={link.source.y}
                        x2={link.target.x} y2={link.target.y}
                        stroke={link.type === 'semantic' ? '#818cf8' : '#64748b'}
                        strokeWidth={isHovered ? 2.5 : Math.max(1, link.strength * 0.6)}
                        strokeOpacity={selectedWord ? 0.08 : isHovered ? 1.0 : 0.35}
                        className="transition-all duration-300"
                      />
                    );
                  })}
                  
                  {/* Node Layer */}
                  {analysis.nodes.map((node) => {
                    const wordData = selectedWord ? (lexicalMode === 'frequency' ? analysis.enrichedWordsByDF : analysis.enrichedWordsByTFIDF).find(w => w.name === selectedWord) : null;
                    const isWordHighlighted = wordData ? wordData.recordIds.includes(node.id) : false;
                    const isDimmed = selectedWord && !isWordHighlighted;
                    return (
                    <g
                      key={node.id}
                      onMouseEnter={() => setHoverNode(node.id)}
                      onMouseLeave={() => setHoverNode(null)}
                      onClick={() => handleNodeClick(node.id)}
                      className="cursor-pointer group"
                    >
                      <circle
                        cx={node.x} cy={node.y} r={node.size + 4}
                        fill={isWordHighlighted ? '#6366f130' : node.density > 2 ? '#818cf810' : 'transparent'}
                        className={`transition-all duration-500 ${hoverNode === node.id ? 'fill-amber-500/20 scale-150' : ''}`}
                      />
                      <circle
                        cx={node.x} cy={node.y} r={isWordHighlighted ? node.size + 2 : node.size}
                        fill={hoverNode === node.id ? '#fbbf24' : isWordHighlighted ? '#a5b4fc' : isDimmed ? '#334155' : node.density > 4 ? '#818cf8' : '#475569'}
                        stroke={hoverNode === node.id ? '#ffffff' : isWordHighlighted ? '#818cf8' : '#1e293b'}
                        strokeWidth={hoverNode === node.id ? 2 : isWordHighlighted ? 2 : 1}
                        opacity={isDimmed ? 0.25 : 1}
                        className="transition-all duration-300"
                      />
                      {hoverNode === node.id && (
                        <g className="animate-in fade-in zoom-in-95 duration-200">
                          <rect x={node.x + 12} y={node.y - 20} width={140} height={68} rx={8} fill="#1e293b" stroke="#475569" strokeWidth={1} className="shadow-2xl" />
                          <text x={node.x + 20} y={node.y - 2} fill="white" fontSize={10} fontWeight="bold" className="heritage-font">{node.name.slice(0, 18)}{node.name.length > 18 ? '...' : ''}</text>
                          <text x={node.x + 20} y={node.y + 12} fill="#94a3b8" fontSize={8} fontWeight="bold" className="uppercase tracking-widest">Density: {node.density.toFixed(1)}</text>
                          <text x={node.x + 20} y={node.y + 24} fill="#818cf8" fontSize={8} fontWeight="bold">Tags: {node.keywords.slice(0, 2).join(', ')}</text>
                          <text x={node.x + 20} y={node.y + 38} fill="#fbbf24" fontSize={7} fontWeight="bold" className="uppercase">Click to witness →</text>
                        </g>
                      )}
                    </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Hash size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Global Lexical Distribution</h3>
                </div>
                <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                  <button
                    onClick={() => { setLexicalMode('frequency'); setSelectedWord(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${lexicalMode === 'frequency' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <BarChart2 size={11} /> Frequency
                  </button>
                  <button
                    onClick={() => { setLexicalMode('tfidf'); setSelectedWord(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${lexicalMode === 'tfidf' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <TrendingUp size={11} /> TF-IDF Weight
                  </button>
                </div>
              </div>
              {selectedWord && (
                <div className="mb-3 flex items-center justify-between bg-indigo-950/30 border border-indigo-500/20 rounded-lg px-3 py-2">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                    Filtering topology by: <span className="text-indigo-200">"{selectedWord}"</span>
                    {' '}— {((lexicalMode === 'frequency' ? analysis.enrichedWordsByDF : analysis.enrichedWordsByTFIDF).find(w => w.name === selectedWord))?.recordIds.length || 0} records
                  </span>
                  <button onClick={() => setSelectedWord(null)} className="text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase">Clear</button>
                </div>
              )}
              <p className="text-[10px] text-slate-600 mb-3 font-medium">
                {lexicalMode === 'frequency'
                  ? 'Ranked by document frequency — how many records contain each term. Click a word to highlight its records in the topology.'
                  : 'Ranked by aggregated TF-IDF weight — terms that are both frequent and distinctive across the corpus. Click to highlight.'}
              </p>
              <div className="max-h-[420px] overflow-y-auto pr-1 custom-scrollbar space-y-1">
                {(lexicalMode === 'frequency' ? analysis.enrichedWordsByDF : analysis.enrichedWordsByTFIDF).map((word, idx) => {
                  const isSelected = selectedWord === word.name;
                  const maxVal = lexicalMode === 'frequency'
                    ? (analysis.enrichedWordsByDF[0]?.value || 1)
                    : (analysis.enrichedWordsByTFIDF[0]?.tfidfScore || 1);
                  const barWidth = lexicalMode === 'frequency'
                    ? (word.value / maxVal) * 100
                    : (word.tfidfScore / maxVal) * 100;
                  const catEntries = Object.entries(word.categories);
                  const catTotal = catEntries.reduce((sum, [, v]) => sum + v, 0);
                  // Stable category color palette
                  const catColors = ['#6366f1', '#818cf8', '#a5b4fc', '#4f46e5', '#c7d2fe', '#3730a3', '#e0e7ff', '#7c3aed', '#8b5cf6', '#a78bfa'];

                  return (
                    <div
                      key={word.name}
                      onClick={() => setSelectedWord(isSelected ? null : word.name)}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-indigo-500/15 border border-indigo-500/30' : 'hover:bg-slate-800/50 border border-transparent'}`}
                    >
                      <span className="text-[9px] text-slate-600 font-mono w-4 text-right">{idx + 1}</span>
                      <span className={`text-xs font-bold w-20 truncate transition-colors ${isSelected ? 'text-indigo-300' : 'text-slate-300 group-hover:text-slate-100'}`}>
                        {word.name}
                      </span>
                      <div className="flex-1 h-4 bg-slate-950/60 rounded overflow-hidden relative">
                        {/* Stacked category segments */}
                        <div className="absolute inset-0 flex" style={{ width: `${barWidth}%` }}>
                          {catEntries.map(([cat, count], ci) => (
                            <div
                              key={cat}
                              title={`${cat}: ${count} records`}
                              style={{
                                width: `${(count / catTotal) * 100}%`,
                                backgroundColor: catColors[analysis.categories.indexOf(cat) % catColors.length],
                                opacity: isSelected ? 1 : 0.7
                              }}
                              className="h-full transition-opacity group-hover:opacity-100"
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono w-12 text-right">
                        {lexicalMode === 'frequency' ? word.value : word.tfidfScore.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono w-10 text-right">
                        {word.proportion}%
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Category legend */}
              {analysis.categories.length > 1 && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-x-4 gap-y-1">
                  {analysis.categories.slice(0, 8).map((cat, ci) => {
                    const catColors = ['#6366f1', '#818cf8', '#a5b4fc', '#4f46e5', '#c7d2fe', '#3730a3', '#e0e7ff', '#7c3aed', '#8b5cf6', '#a78bfa'];
                    return (
                      <div key={cat} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: catColors[ci % catColors.length] }} />
                        <span className="text-[9px] text-slate-500 font-medium">{cat}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl border-t-2 border-t-amber-500/50">
              <Target className="text-amber-500" size={28} />
              <h4 className="font-bold heritage-font text-slate-100 text-lg">Density Layers</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-serif">
                ArchiveLens uses a <strong>Force Atlas</strong> algorithm to spatialize the archive. 
                Nodes are pulled towards the <strong>Inner Core</strong> if they exhibit high semantic connectivity, while 
                isolated artifacts drift towards the <strong>Archival Periphery</strong>.
              </p>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-indigo-400/30 border border-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.4)]"></div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Semantic Link (TF-IDF)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-slate-600/30 border border-slate-500"></div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Taxonomic Link (Category)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4 space-y-3">
                <p className="text-[9px] text-slate-600 uppercase font-black leading-tight">
                  Computational Method: TF-IDF word frequency cross-referencing + Force-Directed Layering
                </p>
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  <strong className="text-slate-400">Lexical Probe:</strong> Click any word in the distribution below to highlight matching records in the topology. Toggle between raw frequency and TF-IDF weight to shift between breadth and distinctiveness.
                </p>
              </div>
            </div>
          </div>
        </div>

          {/* Knowledge Graph Embeddings */}
          <KnowledgeGraphCard records={records} />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-widest bg-slate-800/20 shadow-inner">
            <div className="flex items-center gap-2">
               <Eye size={14} className="text-amber-500" />
               <span>Archive Witnessing Room</span>
            </div>
            <div className="flex items-center gap-4">
               <span>{records.length} Artifacts Prepared</span>
               <div className="h-3 w-px bg-slate-800"></div>
               <span className="text-amber-500/50">Close Reading Mode</span>
            </div>
          </div>
          <div className="space-y-4">
            {records.map(record => {
              const isExpanded = expandedRecords.has(record.id);
              const isEditing = editingId === record.id;
              return (
                <div key={record.id} ref={el => { recordRefs.current[record.id] = el; }} className={`bg-slate-900 border transition-all duration-500 rounded-xl overflow-hidden ${isExpanded ? 'border-amber-500/40 shadow-[0_0_30px_-10px_rgba(251,191,36,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}>
                  <div className="px-6 py-5 flex items-center justify-between cursor-pointer group select-none" onClick={() => toggleExpand(record.id)}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-amber-500/20 text-amber-500 shadow-inner scale-110' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}`}>
                        {record.image_url ? <ImageIcon size={18} /> : <Quote size={18} />}
                      </div>
                      <div>
                        <h4 className={`text-base font-bold transition-colors ${isExpanded ? 'text-amber-500' : 'text-slate-200'}`}>{record.title}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{record.date || 'Undated'} • {record.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       {record.annotation && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>}
                       {isExpanded ? <Minimize2 size={16} className="text-slate-500" /> : <Maximize2 size={16} className="text-slate-700 group-hover:text-slate-400" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                      <div className={`grid gap-8 ${record.image_url ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                        {record.image_url && (
                          <div className="space-y-3">
                            <h5 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
                              <ImageIcon size={10} /> Digital Facsimile
                            </h5>
                            <div className="aspect-[4/3] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center group relative">
                               <img src={record.image_url} alt={record.title} className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105" onError={(e) => (e.currentTarget.style.display = 'none')} />
                               <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none"></div>
                            </div>
                          </div>
                        )}
                        <div className="space-y-3">
                          <h5 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
                             <AlignLeft size={10} /> Inscribed Text
                          </h5>
                          <div className="text-xl font-serif italic text-slate-300 leading-relaxed bg-slate-950/50 p-8 rounded-2xl border border-slate-800/50 min-h-[200px] shadow-inner relative">
                            <Quote className="absolute top-4 left-4 text-slate-800" size={32} />
                            <p className="relative z-10">"{record.description || 'Nulla inscriptio.'}"</p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-6 space-y-4 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[10px] uppercase font-black text-indigo-400 tracking-[0.2em] flex items-center gap-2">
                             <Edit3 size={12} /> Researcher Marginalia
                          </h5>
                          {!isEditing && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); startEditing(record); }} 
                              className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-[10px] text-indigo-400 rounded-full border border-indigo-500/20 uppercase transition-all font-bold active:scale-95"
                            >
                              Inscribe Note
                            </button>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <textarea 
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-6 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[140px] font-sans shadow-inner leading-relaxed" 
                              placeholder="Commit your scholarly observations to the archive..."
                              value={tempAnnotation} 
                              onChange={(e) => setTempAnnotation(e.target.value)} 
                              autoFocus 
                            />
                            <div className="flex justify-end gap-3">
                              <button onClick={() => setEditingId(null)} className="px-5 py-2 text-xs text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest">Abandon</button>
                              <button onClick={() => saveAnnotation(record.id)} className="flex items-center gap-2 px-8 py-2.5 bg-amber-500 text-amber-950 rounded-xl text-xs font-bold hover:bg-amber-400 hover:shadow-amber-500/20 transition-all shadow-xl active:scale-95">
                                <Save size={14} /> Commit Marginalia
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-2xl p-6 min-h-[100px] shadow-inner relative group/note">
                            {record.annotation ? (
                              <p className="text-sm text-indigo-200/80 font-sans leading-relaxed whitespace-pre-wrap">{record.annotation}</p>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full py-4 opacity-30">
                                <Edit3 size={20} className="mb-2" />
                                <p className="text-xs text-slate-500 italic font-serif">Awaiting researcher inscription...</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingRoom;
