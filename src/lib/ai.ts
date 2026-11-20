// Optional "bring your own key" AI image generation. The key lives only in this
// browser's localStorage and is sent directly from the browser to the provider
// the user configured – there is no Hadsi Sketch server in between.
export interface AiConfig { endpoint: string; model: string; apiKey: string }

const KEY = 'hadsi.ai';
export const DEFAULT_AI: AiConfig = { endpoint: 'https://api.openai.com/v1/images/generations', model: 'gpt-image-1', apiKey: '' };

export function loadAi(): AiConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = { ...DEFAULT_AI, ...JSON.parse(raw) } as AiConfig;
    return c.apiKey ? c : null;
  } catch {
    return null;
  }
}
export function saveAi(c: AiConfig) { localStorage.setItem(KEY, JSON.stringify(c)); }
export function clearAi() { localStorage.removeItem(KEY); }

/** Calls an OpenAI-compatible images endpoint and returns a data URL (or remote URL). */
export async function generateAiImage(c: AiConfig, idea: string): Promise<string> {
  const prompt = `A single ${idea}, clean simple line-art illustration, bold outlines, plain white background, centered, no text, friendly style for a young artist`;
  const res = await fetch(c.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.apiKey}` },
    body: JSON.stringify({ model: c.model, prompt, size: '1024x1024', n: 1 }),
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { msg = (await res.json())?.error?.message ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  const data = await res.json();
  const item = data?.data?.[0];
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item?.url) {
    // Convert to a data URL so the canvas isn't tainted by cross-origin pixels.
    const blob = await (await fetch(item.url)).blob();
    return await new Promise<string>((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(blob); });
  }
  throw new Error('The AI service did not return an image.');
}
