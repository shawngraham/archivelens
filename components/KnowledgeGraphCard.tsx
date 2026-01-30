
import React, { useMemo, useState, useCallback } from 'react';
import { Waypoints, Play, Loader2, Search, ArrowRight, ChevronDown, BarChart3, Scan, Info } from 'lucide-react';
import { DataRecord } from '../types';
import { extractTriples, buildIndex, indexTriples, Triple, EntityRelationIndex } from '../services/tripleExtractor';
import { createModel, KGEModel, ModelType } from '../services/kgeModels';
import { trainModel, pcaProject, findSimilar, predictLinks, TrainConfig, DEFAULT_CONFIG } from '../services/kgeTrainer';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  records: DataRecord[];
}

type QueryMode = 'similar' | 'predict';

interface TrainedState {
  model: KGEModel;
  index: EntityRelationIndex;
  triples: Triple[];
  projection: { id: number; x: number; y: number }[];
  lossHistory: number[];
  mrr: number;
  hitsAt10: number;
}

const MODEL_DESCRIPTIONS: Record<ModelType, string> = {
  DistMult: 'Diagonal bilinear model. Captures symmetric relations well (e.g., "shares_category_with"). Fast to train.',
  ComplEx: 'Complex-valued embeddings. Handles both symmetric and antisymmetric relations. Good all-rounder.',
  RotatE: 'Rotation-based model in complex space. Excels at composition, inversion, and hierarchical patterns.',
};

const KnowledgeGraphCard: React.FC<Props> = ({ records }) => {
  // Config state
  const [modelType, setModelType] = useState<ModelType>('ComplEx');
  const [dim, setDim] = useState(50);
  const [epochs, setEpochs] = useState(100);
  const [lr, setLr] = useState(0.01);

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trained, setTrained] = useState<TrainedState | null>(null);

  // Query state
  const [queryMode, setQueryMode] = useState<QueryMode>('similar');
  const [selectedEntity, setSelectedEntity] = useState<number | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<number | null>(null);
  const [queryResults, setQueryResults] = useState<{ id: number; score: number; name: string }[]>([]);
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(true);

  // Pre-compute triples for display
  const tripleInfo = useMemo(() => {
    const triples = extractTriples(records);
    const index = buildIndex(triples);
    return { triples, index };
  }, [records]);

  // Reset trained state when records change
  useMemo(() => {
    setTrained(null);
    setQueryResults([]);
    setSelectedEntity(null);
    setSelectedRelation(null);
  }, [records]);

  const handleTrain = useCallback(() => {
    setIsTraining(true);
    setTrainProgress(0);
    setQueryResults([]);

    // Use requestAnimationFrame to avoid blocking UI during training
    requestAnimationFrame(() => {
      const triples = extractTriples(records);
      const index = buildIndex(triples);
      const indexed = indexTriples(triples, index);

      const model = createModel(modelType, index.numEntities, index.numRelations, dim);
      const config: TrainConfig = {
        ...DEFAULT_CONFIG,
        epochs,
        learningRate: lr,
      };

      const result = trainModel(model, indexed, index.numEntities, config, (epoch, _loss) => {
        setTrainProgress(Math.round(((epoch + 1) / epochs) * 100));
      });

      const projection = pcaProject(model);

      setTrained({
        model,
        index,
        triples,
        projection,
        lossHistory: result.lossHistory,
        mrr: result.mrr,
        hitsAt10: result.hitsAt10,
      });
      setIsTraining(false);
      setShowConfig(false);
    });
  }, [records, modelType, dim, epochs, lr]);

  const handleQuerySimilar = useCallback((entityId: number) => {
    if (!trained) return;
    setSelectedEntity(entityId);
    setQueryMode('similar');
    const results = findSimilar(trained.model, entityId, 10);
    setQueryResults(results.map(r => ({
      id: r.id,
      score: r.similarity,
      name: trained.index.idToEntity.get(r.id) || `Entity ${r.id}`,
    })));
  }, [trained]);

  const handleQueryPredict = useCallback((headId: number, relId: number) => {
    if (!trained) return;
    setSelectedEntity(headId);
    setSelectedRelation(relId);
    setQueryMode('predict');
    const results = predictLinks(trained.model, headId, relId, 10);
    setQueryResults(results.map(r => ({
      id: r.id,
      score: r.score,
      name: trained.index.idToEntity.get(r.id) || `Entity ${r.id}`,
    })));
  }, [trained]);

  // Entities that are record titles (for the dropdowns)
  const recordEntities = useMemo(() => {
    if (!trained) return [];
    return records
      .map(r => {
        const name = String(r.title || r.id);
        const id = trained.index.entityToId.get(name);
        return id !== undefined ? { id, name } : null;
      })
      .filter(Boolean) as { id: number; name: string }[];
  }, [trained, records]);

  const relations = useMemo(() => {
    if (!trained) return [];
    const result: { id: number; name: string }[] = [];
    trained.index.relationToId.forEach((id, name) => result.push({ id, name }));
    return result;
  }, [trained]);

  // Category color map for projection
  const entityCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of records) {
      map.set(String(r.title || r.id), r.category || 'Uncategorized');
    }
    return map;
  }, [records]);

  const catColors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7'];
  const categories = useMemo(() => Array.from(new Set(records.map(r => r.category || 'Uncategorized'))), [records]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-emerald-400">
          <Waypoints size={18} />
          <h3 className="text-sm font-bold uppercase tracking-widest">Knowledge Graph Embeddings</h3>
        </div>
        <div className="flex items-center gap-3 text-[9px] uppercase font-bold text-slate-600 tracking-wider">
          <span>{tripleInfo.index.numEntities} entities</span>
          <div className="h-3 w-px bg-slate-800"></div>
          <span>{tripleInfo.index.numRelations} relations</span>
          <div className="h-3 w-px bg-slate-800"></div>
          <span>{tripleInfo.triples.length} triples</span>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="mb-6">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-slate-300 transition-colors mb-3"
        >
          <ChevronDown size={12} className={`transition-transform ${showConfig ? '' : '-rotate-90'}`} />
          Model Configuration
        </button>

        {showConfig && (
          <div className="space-y-4 bg-slate-950/50 border border-slate-800 rounded-lg p-4 animate-in fade-in duration-300">
            {/* Model selector */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Algorithm</label>
              <div className="grid grid-cols-3 gap-2">
                {(['DistMult', 'ComplEx', 'RotatE'] as ModelType[]).map(mt => (
                  <button
                    key={mt}
                    onClick={() => setModelType(mt)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                      modelType === mt
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-lg'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {mt}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 italic">{MODEL_DESCRIPTIONS[modelType]}</p>
            </div>

            {/* Hyperparameters */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Dimension</label>
                <input
                  type="range" min={16} max={128} step={2} value={dim}
                  onChange={e => setDim(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[10px] text-slate-400 font-mono">{dim}</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Epochs</label>
                <input
                  type="range" min={20} max={500} step={10} value={epochs}
                  onChange={e => setEpochs(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[10px] text-slate-400 font-mono">{epochs}</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Learning Rate</label>
                <select
                  value={lr}
                  onChange={e => setLr(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5"
                >
                  <option value={0.1}>0.1</option>
                  <option value={0.05}>0.05</option>
                  <option value={0.01}>0.01</option>
                  <option value={0.005}>0.005</option>
                  <option value={0.001}>0.001</option>
                </select>
              </div>
            </div>

            {/* Train button */}
            <button
              onClick={handleTrain}
              disabled={isTraining}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                isTraining
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 shadow-lg shadow-emerald-900/20 active:scale-[0.98]'
              }`}
            >
              {isTraining ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Training {modelType}... {trainProgress}%
                </>
              ) : (
                <>
                  <Play size={16} />
                  Train {modelType} Model
                </>
              )}
            </button>

            {/* Progress bar */}
            {isTraining && (
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${trainProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results — only shown after training */}
      {trained && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Metrics bar */}
          <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-emerald-400" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Evaluation</span>
            </div>
            <div className="flex-1 flex items-center gap-6 justify-end">
              <div>
                <span className="text-[9px] text-slate-600 uppercase font-bold tracking-wider">MRR</span>
                <span className="ml-2 text-sm font-bold text-slate-200">{trained.mrr.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-600 uppercase font-bold tracking-wider">Hits@10</span>
                <span className="ml-2 text-sm font-bold text-slate-200">{(trained.hitsAt10 * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-600 uppercase font-bold tracking-wider">Final Loss</span>
                <span className="ml-2 text-sm font-bold text-slate-200">{trained.lossHistory[trained.lossHistory.length - 1]?.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Two-column layout: embedding scatter + loss/query */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Embedding Scatter Plot */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Scan size={14} />
                <h4 className="text-[10px] uppercase tracking-widest font-bold">Entity Embedding Space (PCA)</h4>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden shadow-inner relative" style={{ height: 380 }}>
                <svg viewBox="0 0 500 400" className="w-full h-full">
                  {/* Grid */}
                  {[0.25, 0.5, 0.75].map(v => (
                    <React.Fragment key={v}>
                      <line x1={v * 480 + 10} y1={10} x2={v * 480 + 10} y2={390} stroke="#1e293b" strokeWidth={1} />
                      <line x1={10} y1={v * 380 + 10} x2={490} y2={v * 380 + 10} stroke="#1e293b" strokeWidth={1} />
                    </React.Fragment>
                  ))}

                  {/* Points */}
                  {trained.projection.map(point => {
                    const entityName = trained.index.idToEntity.get(point.id) || '';
                    const cat = entityCategoryMap.get(entityName) || '';
                    const catIdx = categories.indexOf(cat);
                    const isRecord = recordEntities.some(e => e.id === point.id);
                    const isHighlighted = queryResults.some(r => r.id === point.id) || selectedEntity === point.id;
                    const isHovered = hoverPoint === point.id;
                    const px = point.x * 480 + 10;
                    const py = point.y * 380 + 10;
                    const color = catIdx >= 0 ? catColors[catIdx % catColors.length] : '#475569';
                    const radius = isRecord ? (isHighlighted ? 7 : 5) : (isHighlighted ? 5 : 2.5);

                    return (
                      <g
                        key={point.id}
                        onMouseEnter={() => setHoverPoint(point.id)}
                        onMouseLeave={() => setHoverPoint(null)}
                        onClick={() => isRecord && handleQuerySimilar(point.id)}
                        className={isRecord ? 'cursor-pointer' : ''}
                      >
                        {isHighlighted && (
                          <circle cx={px} cy={py} r={radius + 4} fill={color} opacity={0.15} />
                        )}
                        <circle
                          cx={px} cy={py} r={radius}
                          fill={isHovered ? '#fbbf24' : isHighlighted ? '#a5f3fc' : color}
                          stroke={isHovered ? '#fff' : isHighlighted ? '#67e8f9' : '#0f172a'}
                          strokeWidth={isHovered ? 2 : isHighlighted ? 1.5 : 0.5}
                          opacity={isRecord ? 1 : 0.5}
                        />
                        {isHovered && (
                          <g className="animate-in fade-in duration-150">
                            <rect
                              x={px + 10} y={py - 14}
                              width={Math.min(entityName.length * 5.5 + 16, 160)} height={22}
                              rx={4} fill="#1e293b" stroke="#475569" strokeWidth={1}
                            />
                            <text x={px + 18} y={py + 1} fill="#e2e8f0" fontSize={9} fontWeight="bold">
                              {entityName.length > 26 ? entityName.slice(0, 24) + '...' : entityName}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              {/* Category legend */}
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {categories.slice(0, 8).map((cat, ci) => (
                    <div key={cat} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catColors[ci % catColors.length] }} />
                      <span className="text-[9px] text-slate-500 font-medium">{cat}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    <span className="text-[9px] text-slate-500 font-medium">Attribute nodes</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Loss curve + Query */}
            <div className="space-y-6">
              {/* Loss curve */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Training Loss</h4>
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3" style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trained.lossHistory.map((loss, epoch) => ({ epoch, loss }))}>
                      <XAxis dataKey="epoch" tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#334155' }} />
                      <YAxis tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#334155' }} width={40} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 10 }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Line type="monotone" dataKey="loss" stroke="#10b981" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Query interface */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Search size={14} />
                  <h4 className="text-[10px] uppercase tracking-widest font-bold">Query Embedding Space</h4>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setQueryMode('similar')}
                    className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      queryMode === 'similar'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    Similar Entities
                  </button>
                  <button
                    onClick={() => setQueryMode('predict')}
                    className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      queryMode === 'predict'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    Predict Links
                  </button>
                </div>

                {/* Query controls */}
                <div className="space-y-2">
                  <select
                    value={selectedEntity ?? ''}
                    onChange={e => {
                      const id = Number(e.target.value);
                      if (queryMode === 'similar') {
                        handleQuerySimilar(id);
                      } else if (selectedRelation != null) {
                        handleQueryPredict(id, selectedRelation);
                      } else {
                        setSelectedEntity(id);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2"
                  >
                    <option value="">Select an entity (record)...</option>
                    {recordEntities.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>

                  {queryMode === 'predict' && (
                    <div className="flex items-center gap-2">
                      <ArrowRight size={12} className="text-amber-500 shrink-0" />
                      <select
                        value={selectedRelation ?? ''}
                        onChange={e => {
                          const relId = Number(e.target.value);
                          setSelectedRelation(relId);
                          if (selectedEntity != null) {
                            handleQueryPredict(selectedEntity, relId);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2"
                      >
                        <option value="">Select a relation...</option>
                        {relations.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Results list */}
                {queryResults.length > 0 && (
                  <div className="max-h-[180px] overflow-y-auto custom-scrollbar space-y-1 bg-slate-950/40 border border-slate-800 rounded-lg p-2">
                    {queryResults.map((r, idx) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onMouseEnter={() => setHoverPoint(r.id)}
                        onMouseLeave={() => setHoverPoint(null)}
                        onClick={() => handleQuerySimilar(r.id)}
                      >
                        <span className="text-[9px] text-slate-600 font-mono w-4 text-right">{idx + 1}</span>
                        <span className="flex-1 text-xs text-slate-300 truncate">{r.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {queryMode === 'similar' ? `cos: ${r.score.toFixed(3)}` : `score: ${r.score.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-lg px-4 py-3 flex items-start gap-3">
            <Info size={14} className="text-slate-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed">
              <strong className="text-slate-500">How to read this:</strong> Each point represents an entity (record titles are larger circles, attribute values are smaller).
              The model learns to place entities that participate in similar relational patterns nearby in embedding space.
              Click any record node in the scatter plot, or use the dropdowns to query the embedding space.
              <strong className="text-slate-500"> Predict Links</strong> asks: "given this entity and relation, what entities would the model predict as completions?"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraphCard;
