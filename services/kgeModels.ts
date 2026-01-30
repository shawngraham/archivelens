
/**
 * Knowledge Graph Embedding Models
 *
 * Implements DistMult, ComplEx, and RotatE scoring functions
 * with Float32Array-backed embeddings for browser performance.
 */

export type ModelType = 'DistMult' | 'ComplEx' | 'RotatE';

export interface KGEModel {
  name: ModelType;
  dim: number;
  numEntities: number;
  numRelations: number;
  score(head: number, relation: number, tail: number): number;
  getEntityEmbedding(id: number): Float32Array;
  getRelationEmbedding(id: number): Float32Array;
  /** All parameter arrays for the optimizer */
  allParams(): Float32Array[];
  /** Corresponding gradient arrays */
  allGrads(): Float32Array[];
  /** Zero out gradients */
  zeroGrad(): void;
  /** Accumulate gradients from a scored triple (called by trainer) */
  accumulateGrad(head: number, relation: number, tail: number, dScore: number): void;
}

// --- Initialization helper ---
function xavierInit(size: number, fanIn: number): Float32Array {
  const arr = new Float32Array(size);
  const scale = Math.sqrt(6.0 / fanIn);
  for (let i = 0; i < size; i++) {
    arr[i] = (Math.random() * 2 - 1) * scale;
  }
  return arr;
}

// ============================================================
// DistMult: score(h, r, t) = sum(h_i * r_i * t_i)
// ============================================================
export class DistMultModel implements KGEModel {
  name: ModelType = 'DistMult';
  dim: number;
  numEntities: number;
  numRelations: number;
  entityEmb: Float32Array;
  relationEmb: Float32Array;
  entityGrad: Float32Array;
  relationGrad: Float32Array;

  constructor(numEntities: number, numRelations: number, dim: number) {
    this.dim = dim;
    this.numEntities = numEntities;
    this.numRelations = numRelations;
    this.entityEmb = xavierInit(numEntities * dim, dim);
    this.relationEmb = xavierInit(numRelations * dim, dim);
    this.entityGrad = new Float32Array(numEntities * dim);
    this.relationGrad = new Float32Array(numRelations * dim);
  }

  score(h: number, r: number, t: number): number {
    const d = this.dim;
    const ho = h * d, ro = r * d, to = t * d;
    let s = 0;
    for (let i = 0; i < d; i++) {
      s += this.entityEmb[ho + i] * this.relationEmb[ro + i] * this.entityEmb[to + i];
    }
    return s;
  }

  getEntityEmbedding(id: number): Float32Array {
    return this.entityEmb.slice(id * this.dim, (id + 1) * this.dim);
  }

  getRelationEmbedding(id: number): Float32Array {
    return this.relationEmb.slice(id * this.dim, (id + 1) * this.dim);
  }

  allParams(): Float32Array[] { return [this.entityEmb, this.relationEmb]; }
  allGrads(): Float32Array[] { return [this.entityGrad, this.relationGrad]; }
  zeroGrad(): void { this.entityGrad.fill(0); this.relationGrad.fill(0); }

  accumulateGrad(h: number, r: number, t: number, dScore: number): void {
    const d = this.dim;
    const ho = h * d, ro = r * d, to = t * d;
    for (let i = 0; i < d; i++) {
      const hi = this.entityEmb[ho + i];
      const ri = this.relationEmb[ro + i];
      const ti = this.entityEmb[to + i];
      // d(score)/dh_i = r_i * t_i
      this.entityGrad[ho + i] += dScore * ri * ti;
      // d(score)/dr_i = h_i * t_i
      this.relationGrad[ro + i] += dScore * hi * ti;
      // d(score)/dt_i = h_i * r_i
      this.entityGrad[to + i] += dScore * hi * ri;
    }
  }
}

// ============================================================
// ComplEx: complex-valued embeddings
// score(h, r, t) = Re(sum(h * r * conj(t)))
// Storage: [real_0..real_{d-1}, imag_0..imag_{d-1}] per entity
// So actual storage per entity = 2*dim floats, but "dim" refers to complex dim
// ============================================================
export class ComplExModel implements KGEModel {
  name: ModelType = 'ComplEx';
  dim: number; // complex dimension
  numEntities: number;
  numRelations: number;
  entityEmb: Float32Array;   // size: numEntities * dim * 2
  relationEmb: Float32Array; // size: numRelations * dim * 2
  entityGrad: Float32Array;
  relationGrad: Float32Array;

  constructor(numEntities: number, numRelations: number, dim: number) {
    this.dim = dim;
    this.numEntities = numEntities;
    this.numRelations = numRelations;
    const eSize = numEntities * dim * 2;
    const rSize = numRelations * dim * 2;
    this.entityEmb = xavierInit(eSize, dim);
    this.relationEmb = xavierInit(rSize, dim);
    this.entityGrad = new Float32Array(eSize);
    this.relationGrad = new Float32Array(rSize);
  }

  score(h: number, r: number, t: number): number {
    const d = this.dim;
    const ho = h * d * 2, ro = r * d * 2, to = t * d * 2;
    let s = 0;
    for (let i = 0; i < d; i++) {
      // h = hr + i*hi, r = rr + i*ri, t = tr + i*ti
      const hr = this.entityEmb[ho + i], hi = this.entityEmb[ho + d + i];
      const rr = this.relationEmb[ro + i], ri = this.relationEmb[ro + d + i];
      const tr = this.entityEmb[to + i], ti = this.entityEmb[to + d + i];
      // h * r = (hr*rr - hi*ri) + i*(hr*ri + hi*rr)
      const prodR = hr * rr - hi * ri;
      const prodI = hr * ri + hi * rr;
      // Re(prod * conj(t)) = prodR*tr + prodI*ti
      s += prodR * tr + prodI * ti;
    }
    return s;
  }

  getEntityEmbedding(id: number): Float32Array {
    return this.entityEmb.slice(id * this.dim * 2, (id + 1) * this.dim * 2);
  }

  getRelationEmbedding(id: number): Float32Array {
    return this.relationEmb.slice(id * this.dim * 2, (id + 1) * this.dim * 2);
  }

  allParams(): Float32Array[] { return [this.entityEmb, this.relationEmb]; }
  allGrads(): Float32Array[] { return [this.entityGrad, this.relationGrad]; }
  zeroGrad(): void { this.entityGrad.fill(0); this.relationGrad.fill(0); }

  accumulateGrad(h: number, r: number, t: number, dScore: number): void {
    const d = this.dim;
    const ho = h * d * 2, ro = r * d * 2, to = t * d * 2;
    for (let i = 0; i < d; i++) {
      const hr = this.entityEmb[ho + i], himg = this.entityEmb[ho + d + i];
      const rr = this.relationEmb[ro + i], ri = this.relationEmb[ro + d + i];
      const tr = this.entityEmb[to + i], ti = this.entityEmb[to + d + i];

      const prodR = hr * rr - himg * ri;
      const prodI = hr * ri + himg * rr;

      // Grad w.r.t. t (real, imag)
      this.entityGrad[to + i] += dScore * prodR;
      this.entityGrad[to + d + i] += dScore * prodI;

      // Grad w.r.t. h (real, imag): d(score)/d(hr) = rr*tr + ri*ti
      this.entityGrad[ho + i] += dScore * (rr * tr + ri * ti);
      this.entityGrad[ho + d + i] += dScore * (-ri * tr + rr * ti);

      // Grad w.r.t. r (real, imag)
      this.relationGrad[ro + i] += dScore * (hr * tr + himg * ti);
      this.relationGrad[ro + d + i] += dScore * (-himg * tr + hr * ti);
    }
  }
}

// ============================================================
// RotatE: score = -||h ∘ r - t||
// r is constrained to unit-modulus complex numbers (phase only)
// Storage: entities = 2*dim (real+imag), relations = dim (phase angles)
// ============================================================
export class RotatEModel implements KGEModel {
  name: ModelType = 'RotatE';
  dim: number;
  numEntities: number;
  numRelations: number;
  entityEmb: Float32Array;   // numEntities * dim * 2
  relationPhase: Float32Array; // numRelations * dim (phase angles)
  entityGrad: Float32Array;
  relationGrad: Float32Array;
  private gamma: number; // margin

  constructor(numEntities: number, numRelations: number, dim: number) {
    this.dim = dim;
    this.numEntities = numEntities;
    this.numRelations = numRelations;
    this.gamma = 6.0;
    const eSize = numEntities * dim * 2;
    this.entityEmb = xavierInit(eSize, dim);
    // phases uniformly in [-pi, pi]
    this.relationPhase = new Float32Array(numRelations * dim);
    for (let i = 0; i < numRelations * dim; i++) {
      this.relationPhase[i] = (Math.random() * 2 - 1) * Math.PI;
    }
    this.entityGrad = new Float32Array(eSize);
    this.relationGrad = new Float32Array(numRelations * dim);
  }

  score(h: number, r: number, t: number): number {
    const d = this.dim;
    const ho = h * d * 2, ro = r * d, to = t * d * 2;
    let dist = 0;
    for (let i = 0; i < d; i++) {
      const hr = this.entityEmb[ho + i], hi = this.entityEmb[ho + d + i];
      const phase = this.relationPhase[ro + i];
      const rr = Math.cos(phase), ri = Math.sin(phase);
      // h ∘ r
      const rotR = hr * rr - hi * ri;
      const rotI = hr * ri + hi * rr;
      // diff with t
      const diffR = rotR - this.entityEmb[to + i];
      const diffI = rotI - this.entityEmb[to + d + i];
      dist += diffR * diffR + diffI * diffI;
    }
    return this.gamma - Math.sqrt(dist + 1e-8);
  }

  getEntityEmbedding(id: number): Float32Array {
    return this.entityEmb.slice(id * this.dim * 2, (id + 1) * this.dim * 2);
  }

  getRelationEmbedding(id: number): Float32Array {
    // Return phase angles — consumer can interpret
    return this.relationPhase.slice(id * this.dim, (id + 1) * this.dim);
  }

  allParams(): Float32Array[] { return [this.entityEmb, this.relationPhase]; }
  allGrads(): Float32Array[] { return [this.entityGrad, this.relationGrad]; }
  zeroGrad(): void { this.entityGrad.fill(0); this.relationGrad.fill(0); }

  accumulateGrad(h: number, r: number, t: number, dScore: number): void {
    const d = this.dim;
    const ho = h * d * 2, ro = r * d, to = t * d * 2;
    let dist = 0;
    for (let i = 0; i < d; i++) {
      const hre = this.entityEmb[ho + i], him = this.entityEmb[ho + d + i];
      const phase = this.relationPhase[ro + i];
      const rr = Math.cos(phase), ri = Math.sin(phase);
      const rotR = hre * rr - him * ri;
      const rotI = hre * ri + him * rr;
      const diffR = rotR - this.entityEmb[to + i];
      const diffI = rotI - this.entityEmb[to + d + i];
      dist += diffR * diffR + diffI * diffI;
    }
    const normDist = Math.sqrt(dist + 1e-8);
    // d(score)/d(dist) = -1/(2*normDist) * 2 = -1/normDist
    const dDist = -dScore / normDist;

    for (let i = 0; i < d; i++) {
      const hre = this.entityEmb[ho + i], him = this.entityEmb[ho + d + i];
      const phase = this.relationPhase[ro + i];
      const rr = Math.cos(phase), ri = Math.sin(phase);
      const rotR = hre * rr - him * ri;
      const rotI = hre * ri + him * rr;
      const diffR = rotR - this.entityEmb[to + i];
      const diffI = rotI - this.entityEmb[to + d + i];

      // Grad w.r.t. t
      this.entityGrad[to + i] += dDist * (-2 * diffR);
      this.entityGrad[to + d + i] += dDist * (-2 * diffI);

      // Grad w.r.t. h (through rotation)
      this.entityGrad[ho + i] += dDist * 2 * (diffR * rr + diffI * ri);
      this.entityGrad[ho + d + i] += dDist * 2 * (-diffR * ri + diffI * rr);

      // Grad w.r.t. phase: d(rotR)/d(phase) = -hr*sin - hi*cos, d(rotI)/d(phase) = hr*cos - hi*sin
      const dRotR_dPhase = -hre * ri - him * rr;
      const dRotI_dPhase = hre * rr - him * ri;
      this.relationGrad[ro + i] += dDist * 2 * (diffR * dRotR_dPhase + diffI * dRotI_dPhase);
    }
  }
}

/**
 * Factory function
 */
export function createModel(type: ModelType, numEntities: number, numRelations: number, dim: number): KGEModel {
  switch (type) {
    case 'DistMult': return new DistMultModel(numEntities, numRelations, dim);
    case 'ComplEx': return new ComplExModel(numEntities, numRelations, dim);
    case 'RotatE': return new RotatEModel(numEntities, numRelations, dim);
  }
}
