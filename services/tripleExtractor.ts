
import { DataRecord } from '../types';

export interface Triple {
  head: string;
  relation: string;
  tail: string;
}

export interface EntityRelationIndex {
  entityToId: Map<string, number>;
  idToEntity: Map<number, string>;
  relationToId: Map<string, number>;
  idToRelation: Map<number, string>;
  numEntities: number;
  numRelations: number;
}

export interface IndexedTriple {
  head: number;
  relation: number;
  tail: number;
}

/**
 * Extract knowledge graph triples from archival records.
 * Each record becomes a head entity; its field values become tail entities
 * connected by the field name as a relation.
 */
export function extractTriples(records: DataRecord[]): Triple[] {
  const triples: Triple[] = [];
  const skipFields = new Set(['id', 'annotation', 'image_url']);

  for (const record of records) {
    const headEntity = String(record.title || record.id);

    // Category relation
    if (record.category) {
      triples.push({ head: headEntity, relation: 'has_category', tail: record.category });
    }

    // Location relation
    if (record.location) {
      triples.push({ head: headEntity, relation: 'located_in', tail: record.location });
    }

    // Date relation (extract year for grouping)
    if (record.date) {
      const year = record.date.slice(0, 4);
      if (year && /^\d{4}$/.test(year)) {
        triples.push({ head: headEntity, relation: 'dated_to', tail: year });
      }
    }

    // Value bracket relation (quantized)
    if (record.value != null && record.value > 0) {
      const bracket = quantizeValue(record.value, records);
      triples.push({ head: headEntity, relation: 'has_magnitude', tail: bracket });
    }

    // Description keyword extraction — top keywords become relations
    if (record.description) {
      const keywords = extractKeywords(record.description);
      for (const kw of keywords) {
        triples.push({ head: headEntity, relation: 'mentions', tail: kw });
      }
    }

    // Additional dynamic fields
    for (const [key, val] of Object.entries(record)) {
      if (skipFields.has(key) || ['title', 'date', 'category', 'description', 'location', 'value'].includes(key)) continue;
      if (val != null && val !== '' && typeof val === 'string') {
        const relation = `has_${key.toLowerCase().replace(/\s+/g, '_')}`;
        triples.push({ head: headEntity, relation, tail: val });
      }
    }

    // Inter-record links: same category
    for (const other of records) {
      if (other.id === record.id) continue;
      const otherEntity = String(other.title || other.id);
      if (record.category && other.category && record.category === other.category) {
        // Only add one direction (alphabetical) to avoid duplicates
        if (headEntity < otherEntity) {
          triples.push({ head: headEntity, relation: 'shares_category_with', tail: otherEntity });
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return triples.filter(t => {
    const key = `${t.head}|${t.relation}|${t.tail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Build integer-indexed lookups for entities and relations.
 */
export function buildIndex(triples: Triple[]): EntityRelationIndex {
  const entityToId = new Map<string, number>();
  const relationToId = new Map<string, number>();
  let entityCount = 0;
  let relationCount = 0;

  for (const t of triples) {
    if (!entityToId.has(t.head)) entityToId.set(t.head, entityCount++);
    if (!entityToId.has(t.tail)) entityToId.set(t.tail, entityCount++);
    if (!relationToId.has(t.relation)) relationToId.set(t.relation, relationCount++);
  }

  const idToEntity = new Map<number, string>();
  entityToId.forEach((id, name) => idToEntity.set(id, name));

  const idToRelation = new Map<number, string>();
  relationToId.forEach((id, name) => idToRelation.set(id, name));

  return {
    entityToId,
    idToEntity,
    relationToId,
    idToRelation,
    numEntities: entityCount,
    numRelations: relationCount,
  };
}

/**
 * Convert string triples to integer-indexed triples.
 */
export function indexTriples(triples: Triple[], index: EntityRelationIndex): IndexedTriple[] {
  return triples.map(t => ({
    head: index.entityToId.get(t.head)!,
    relation: index.relationToId.get(t.relation)!,
    tail: index.entityToId.get(t.tail)!,
  }));
}

// --- Helpers ---

const STOP_WORDS = new Set([
  'the', 'and', 'was', 'for', 'with', 'from', 'this', 'that', 'were', 'had',
  'been', 'which', 'their', 'they', 'there', 'some', 'those', 'also', 'upon',
  'then', 'into', 'have', 'has', 'are', 'not', 'but', 'its', 'more', 'will',
  'than', 'other', 'about', 'over', 'after', 'before', 'would', 'could',
  'should', 'being', 'when', 'what', 'where', 'while', 'each', 'these',
  'through', 'between', 'such', 'very', 'most', 'only', 'just', 'made',
]);

function extractKeywords(text: string, topN: number = 3): string[] {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}

function quantizeValue(value: number, records: DataRecord[]): string {
  const values = records.filter(r => r.value != null && r.value > 0).map(r => r.value!);
  if (values.length === 0) return 'unknown';
  const sorted = [...values].sort((a, b) => a - b);
  const q25 = sorted[Math.floor(sorted.length * 0.25)];
  const q75 = sorted[Math.floor(sorted.length * 0.75)];
  if (value <= q25) return 'low_magnitude';
  if (value >= q75) return 'high_magnitude';
  return 'mid_magnitude';
}
