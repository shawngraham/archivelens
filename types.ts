
export interface DataRecord {
  id: string | number;
  title: string;
  date?: string;
  category?: string;
  description?: string;
  location?: string;
  value?: number;
  annotation?: string; // User-added observation
  image_url?: string; // Optional link to source images
  [key: string]: any;
}

export interface Dataset {
  name: string;
  records: DataRecord[];
  metadata: {
    description: string;
    source: string;
    fields: string[];
  };
}

export interface Provocation {
  type: 'silence' | 'surprise' | 'contradiction' | 'elision';
  observation: string;
  context: string;
}
