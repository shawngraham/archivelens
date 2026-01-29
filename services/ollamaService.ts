
import { DataRecord, Provocation } from "../types";

/**
 * Communicates with a local Ollama instance (http://localhost:11434).
 * Requires OLLAMA_ORIGINS="*" environment variable for browser access.
 */
export const getVectorProvocations = async (data: DataRecord[]): Promise<Provocation[]> => {
  // Use a targeted slice of the dataset to provide context
  const dataSummary = JSON.stringify(data.slice(0, 15).map(r => ({
    title: r.title,
    date: r.date,
    category: r.category,
    desc: r.description?.slice(0, 80)
  })));
  
  const systemPrompt = `
You are an archival studies consultant helping a researcher interrogate their dataset critically.

Dataset fragment (${data.length} total records, showing first 15):
${dataSummary}

Generate 3 provocations that help the researcher read WITH, AGAINST, and ACROSS the grain of this archive.

For each provocation, consider:
- WITH THE GRAIN: What logic or worldview organized this collection? What did the creators think was worth preserving and why?
- AGAINST THE GRAIN: What absences, silences, or marginalizations does the structure reveal? Whose labor, voices, or experiences are rendered invisible?
- ACROSS THE GRAIN: What unexpected patterns, juxtapositions, or tensions emerge when records are read relationally rather than individually?

Focus on:
- Categorical violence (how naming/grouping flattens complexity)
- Temporal clustering (what events or periods are over/underrepresented)
- Descriptive asymmetries (whose stories get detail vs. summary treatment)
- Metadata as evidence (what do dates, categories, and absences reveal about the archive's creation context)

Return ONLY a JSON array:
[
  {"type": "silence", "observation": "specific observation", "context": "why this matters for interpretation"},
  {"type": "elision", "observation": "specific observation", "context": "what questions this raises"},
  {"type": "pattern", "observation": "specific observation", "context": "how this reframes the collection"}
]

Be specific. Name concrete categories, date ranges, or descriptive patterns from the data. Avoid generic observations that could apply to any archive.
`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3", 
        prompt: systemPrompt,
        stream: false,
        format: "json", // Instructs Ollama to force JSON mode
        options: {
          temperature: 0.6,
          num_ctx: 4096
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with status: ${response.status}`);
    }

    const result = await response.json();
    let rawContent = result.response;
    console.log("Raw Ollama response:", rawContent); 

    // Handle string responses that might contain markdown or extra whitespace
    if (typeof rawContent === 'string') {
      rawContent = rawContent.trim();
      // Remove markdown code blocks if present
      rawContent = rawContent.replace(/^```json\s*/, '').replace(/```$/, '');
      
      try {
        const parsed = JSON.parse(rawContent);
        // Ensure we return an array
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.error("Failed to parse Ollama JSON string:", rawContent);
        // Fallback to regex-based extraction
        const match = rawContent.match(/\[\s*\{.*\}\s*\]/s);
        if (match) return JSON.parse(match[0]);
        throw new Error("Invalid JSON structure in model response");
      }
    }

    return Array.isArray(rawContent) ? rawContent : [];
  } catch (error) {
    console.error("Ollama Service Error:", error);
    // Return a structured error provocation so the UI can display the issue
    return [{
      type: 'surprise',
      observation: "Local AI connection failed or returned invalid data.",
      context: "Ensure Ollama is running (OLLAMA_ORIGINS='*' ollama serve) and 'qwen3' is pulled. If you want to use a different model, modify the ollamaService.ts file to point to the desired model. Check browser console for detailed fetch errors."
    }];
  }
};
