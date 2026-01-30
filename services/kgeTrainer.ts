
import { KGEModel } from './kgeModels';
import { IndexedTriple } from './tripleExtractor';

export interface TrainConfig {
  epochs: number;
  learningRate: number;
  negSamples: number;
  batchSize: number;
  margin: number;
}

export interface TrainResult {
  lossHistory: number[];
  finalLoss: number;
  mrr: number;
  hitsAt10: number;
}

export const DEFAULT_CONFIG: TrainConfig = {
  epochs: 100,
  learningRate: 0.01,
  negSamples: 5,
  batchSize: 64,
  margin: 1.0,
};

/**
 * Train a KGE model using margin-based ranking loss with negative sampling.
 * Returns loss history and basic evaluation metrics.
 *
 * @param onProgress callback with (epoch, loss) — called every epoch
 */
export function trainModel(
  model: KGEModel,
  triples: IndexedTriple[],
  numEntities: number,
  config: TrainConfig = DEFAULT_CONFIG,
  onProgress?: (epoch: number, loss: number) => void,
): TrainResult {
  const { epochs, learningRate, negSamples, batchSize, margin } = config;
  const lossHistory: number[] = [];

  // Shuffle helper
  const shuffled = (arr: IndexedTriple[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const randEntity = () => Math.floor(Math.random() * numEntities);

  for (let epoch = 0; epoch < epochs; epoch++) {
    const data = shuffled(triples);
    let epochLoss = 0;
    let count = 0;

    for (let b = 0; b < data.length; b += batchSize) {
      const batch = data.slice(b, b + batchSize);
      model.zeroGrad();
      let batchLoss = 0;

      for (const triple of batch) {
        const posScore = model.score(triple.head, triple.relation, triple.tail);

        for (let n = 0; n < negSamples; n++) {
          // Corrupt head or tail
          const corruptHead = Math.random() < 0.5;
          const negHead = corruptHead ? randEntity() : triple.head;
          const negTail = corruptHead ? triple.tail : randEntity();

          // Skip if same as positive
          if (negHead === triple.head && negTail === triple.tail) continue;

          const negScore = model.score(negHead, triple.relation, negTail);
          // Margin ranking loss: max(0, margin - posScore + negScore)
          const loss = Math.max(0, margin - posScore + negScore);

          if (loss > 0) {
            batchLoss += loss;
            // Gradient: d(loss)/d(posScore) = -1, d(loss)/d(negScore) = +1
            model.accumulateGrad(triple.head, triple.relation, triple.tail, -1);
            model.accumulateGrad(negHead, triple.relation, negTail, 1);
          }
        }
        count++;
      }

      // SGD update with gradient clipping
      const params = model.allParams();
      const grads = model.allGrads();
      const scale = 1.0 / (batch.length * negSamples);
      for (let p = 0; p < params.length; p++) {
        const param = params[p];
        const grad = grads[p];
        for (let i = 0; i < param.length; i++) {
          const g = grad[i] * scale;
          // Clip gradient
          const clipped = Math.max(-1, Math.min(1, g));
          param[i] -= learningRate * clipped;
        }
      }

      epochLoss += batchLoss;
    }

    const avgLoss = count > 0 ? epochLoss / count : 0;
    lossHistory.push(avgLoss);
    if (onProgress) onProgress(epoch, avgLoss);
  }

  // Basic evaluation: MRR and Hits@10 on the training set (sample)
  const evalSample = triples.length > 200 ? triples.slice(0, 200) : triples;
  let recipRankSum = 0;
  let hits10 = 0;

  for (const triple of evalSample) {
    const posScore = model.score(triple.head, triple.relation, triple.tail);
    let rank = 1;
    // Sample 50 random corruptions for approximate ranking
    for (let n = 0; n < 50; n++) {
      const negTail = randEntity();
      if (negTail === triple.tail) continue;
      const negScore = model.score(triple.head, triple.relation, negTail);
      if (negScore >= posScore) rank++;
    }
    recipRankSum += 1.0 / rank;
    if (rank <= 10) hits10++;
  }

  return {
    lossHistory,
    finalLoss: lossHistory[lossHistory.length - 1] || 0,
    mrr: recipRankSum / evalSample.length,
    hitsAt10: hits10 / evalSample.length,
  };
}

/**
 * Compute 2D PCA projection of entity embeddings.
 */
export function pcaProject(model: KGEModel): { id: number; x: number; y: number }[] {
  const n = model.numEntities;
  const d = model.getEntityEmbedding(0).length; // actual float dimension

  // Collect all embeddings
  const data: number[][] = [];
  for (let i = 0; i < n; i++) {
    data.push(Array.from(model.getEntityEmbedding(i)));
  }

  // Center
  const mean = new Array(d).fill(0);
  for (const row of data) for (let j = 0; j < d; j++) mean[j] += row[j];
  for (let j = 0; j < d; j++) mean[j] /= n;
  for (const row of data) for (let j = 0; j < d; j++) row[j] -= mean[j];

  // Covariance matrix (d x d) — use only first min(d, 64) dimensions for speed
  const useDim = Math.min(d, 64);
  const cov = Array.from({ length: useDim }, () => new Float64Array(useDim));
  for (const row of data) {
    for (let i = 0; i < useDim; i++) {
      for (let j = i; j < useDim; j++) {
        cov[i][j] += row[i] * row[j];
      }
    }
  }
  for (let i = 0; i < useDim; i++) {
    for (let j = i; j < useDim; j++) {
      cov[i][j] /= n;
      cov[j][i] = cov[i][j];
    }
  }

  // Power iteration for top 2 eigenvectors
  const eigenvectors: number[][] = [];
  for (let ev = 0; ev < 2; ev++) {
    let vec = new Array(useDim).fill(0).map(() => Math.random() - 0.5);
    for (let iter = 0; iter < 100; iter++) {
      // Matrix-vector multiply
      const newVec = new Array(useDim).fill(0);
      for (let i = 0; i < useDim; i++) {
        for (let j = 0; j < useDim; j++) {
          newVec[i] += cov[i][j] * vec[j];
        }
      }
      // Deflate by previous eigenvectors
      for (const prev of eigenvectors) {
        let dot = 0;
        for (let i = 0; i < useDim; i++) dot += newVec[i] * prev[i];
        for (let i = 0; i < useDim; i++) newVec[i] -= dot * prev[i];
      }
      // Normalize
      let norm = 0;
      for (let i = 0; i < useDim; i++) norm += newVec[i] * newVec[i];
      norm = Math.sqrt(norm) || 1;
      for (let i = 0; i < useDim; i++) newVec[i] /= norm;
      vec = newVec;
    }
    eigenvectors.push(vec);
  }

  // Project
  const points = data.map((row, id) => {
    let x = 0, y = 0;
    for (let j = 0; j < useDim; j++) {
      x += row[j] * eigenvectors[0][j];
      y += row[j] * eigenvectors[1][j];
    }
    return { id, x, y };
  });

  // Normalize to [0, 1]
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  for (const p of points) {
    p.x = (p.x - minX) / rangeX;
    p.y = (p.y - minY) / rangeY;
  }

  return points;
}

/**
 * Find top-K nearest entities to a given entity by embedding cosine similarity.
 */
export function findSimilar(model: KGEModel, entityId: number, topK: number = 10): { id: number; similarity: number }[] {
  const emb = model.getEntityEmbedding(entityId);
  const results: { id: number; similarity: number }[] = [];

  for (let i = 0; i < model.numEntities; i++) {
    if (i === entityId) continue;
    const other = model.getEntityEmbedding(i);
    let dot = 0, normA = 0, normB = 0;
    for (let j = 0; j < emb.length; j++) {
      dot += emb[j] * other[j];
      normA += emb[j] * emb[j];
      normB += other[j] * other[j];
    }
    const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
    results.push({ id: i, similarity: sim });
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * Predict tails given a head and relation — rank all entities by score.
 */
export function predictLinks(model: KGEModel, head: number, relation: number, topK: number = 10): { id: number; score: number }[] {
  const results: { id: number; score: number }[] = [];
  for (let t = 0; t < model.numEntities; t++) {
    if (t === head) continue;
    results.push({ id: t, score: model.score(head, relation, t) });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}
