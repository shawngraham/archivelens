
import { DataRecord } from "../types";

export const parseCSV = (csvText: string): DataRecord[] => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Simple CSV parser that handles basic quotes
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const records: DataRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Regex to handle commas inside quotes
    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const record: any = {};
    
    headers.forEach((header, index) => {
      let val = values[index]?.trim().replace(/^"|"$/g, '') || "";
      
      // Attempt to cast known numeric fields
      if (header === 'value' || header === 'magnitude' || header === 'count') {
        const num = parseFloat(val);
        record[header] = isNaN(num) ? 0 : num;
      } else {
        // Special mapping for common headers
        if (header.toLowerCase() === 'image' || header.toLowerCase() === 'url' || header.toLowerCase() === 'image_url') {
           record['image_url'] = val;
        } else {
           record[header] = val;
        }
      }
    });

    // Ensure basic required fields exist for the UI
    if (!record.id) record.id = `csv-${i}`;
    if (!record.title) record.title = record.name || `Entry ${i}`;
    
    records.push(record as DataRecord);
  }

  return records;
};
