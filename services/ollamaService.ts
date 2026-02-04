import { DataRecord, Provocation } from "../types";

const getDistributedSample = (records: DataRecord[], sampleSize: number = 15): DataRecord[] => {
  if (records.length <= sampleSize) return records;
  const sampled: DataRecord[] = [];
  const step = (records.length - 1) / (sampleSize - 1);
  for (let i = 0; i < sampleSize; i++) {
    const index = Math.floor(i * step);
    sampled.push(records[index]);
  }
  return sampled;
};

export const synthesizeDatasetDescription = async (records: DataRecord[]): Promise<string> => {
  const sample = getDistributedSample(records, 15);
  const dataSummary = JSON.stringify(sample.map(r => ({
    title: r.title,
    date: r.date,
    category: r.category,
    desc: r.description?.slice(0, 80)
  })));

  const prompt = `You are an archival studies scholar. Given this sample of ${records.length} records, write one sentence (max 35 words) describing the subject and geography. Do not use quotes or preamble.
  
  Records: ${dataSummary}`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-r1:8b",
        prompt,
        stream: false,
        options: { temperature: 0.3 }
      })
    });

    const result = await response.json();
    // Scrub DeepSeek thinking blocks
    return result.response.replace(/<think>[\s\S]*?<\/think>/g, '').trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    return "An archival dataset awaiting scholarly description.";
  }
};

export const getVectorProvocations = async (data: DataRecord[]): Promise<Provocation[]> => {
  const sample = getDistributedSample(data, 18);
  const dataSummary = JSON.stringify(sample.map(r => ({
    title: r.title,
    date: r.date,
    category: r.category,
    desc: r.description?.slice(0, 100)
  })));
  
  const systemPrompt = `
You are an archival studies consultant looking at 18 sample records from a set of ${data.length}.

DATA SAMPLE:
${dataSummary}

Generate 3 provocations (WITH, AGAINST, and ACROSS the grain).

CRITICAL INSTRUCTIONS:
1. DO NOT fixate on chronological gaps or "silences in dates" or id numbers unless extreme. Assume gaps are simply not in this sample.
2. FOCUS ON "Substantive Silences" in the "description" field: What types of people or emotions are missing from the descriptions? 
3. FOCUS ON CATEGORIZATION: How do "category" labels flatten complex items? 
4. FOCUS ON LANGUAGE: Look for passive voice or colonial terminology.

Return ONLY a JSON array:
[
  {"type": "logic", "observation": "...", "context": "..."},
  {"type": "silence", "observation": "...", "context": "..."},
  {"type": "pattern", "observation": "...", "context": "..."}
]`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-r1:8b", 
        prompt: systemPrompt,
        stream: false,
        format: "json", // Forces Ollama to try to wrap response in JSON
        options: { temperature: 0.6, num_ctx: 4096 }
      })
    });

    if (!response.ok) throw new Error("Ollama Offline");

    const result = await response.json();
    let rawContent = result.response.trim();

    // --- NEW ROBUST CLEANING LAYER ---
    // 1. Remove the <think> block entirely
    rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '');

    // 2. Find the first '[' and last ']' to ignore any text the model put outside the JSON
    const startBracket = rawContent.indexOf('[');
    const endBracket = rawContent.lastIndexOf(']');
    
    if (startBracket !== -1 && endBracket !== -1) {
      rawContent = rawContent.substring(startBracket, endBracket + 1);
    }

    try {
      const parsed = JSON.parse(rawContent);
      return Array.isArray(parsed) ? parsed : (parsed.provocations || [parsed]);
    } catch (parseError) {
      console.warn("Parsing failed, raw content was:", rawContent);
      throw new Error("JSON malformed");
    }

  } catch (error) {
    console.error("Service Error:", error);
    return [{
      type: 'surprise',
      observation: "The AI is thinking too deeply to respond clearly.",
      context: "Try 'Re-probing' again. This happens when the reasoning model includes too much internal commentary for the parser to handle."
    }];
  }
};