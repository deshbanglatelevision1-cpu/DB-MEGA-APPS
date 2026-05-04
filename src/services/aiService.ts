export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function chatWithAI(messages: ChatMessage[]) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    
    if (!response.ok) throw new Error('AI Chat failed');
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw error;
  }
}

export async function aiSearch(query: string) {
  try {
    const response = await fetch('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) throw new Error('AI Search failed');
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("AI Search Error:", error);
    throw error;
  }
}
