/**
 * CareFlow AI Symptom Chat Streaming Service (SSE / Fetch ReadableStream)
 */
export const aiChatService = {
  /**
   * Stream symptom exploration chat tokens in real-time
   * @param {Object} params
   * @param {string} params.message - Current user query / symptoms
   * @param {Array} params.history - Previous chat turns [{ role, message }]
   * @param {Function} params.onChunk - Callback for each incoming text delta
   * @param {Function} params.onComplete - Callback when stream finishes
   * @param {Function} params.onError - Callback on stream error
   */
  async streamChat({ message, history = [], onChunk, onComplete, onError }) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/ai/chat`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Inherits JWT httpOnly cookie
        body: JSON.stringify({
          message,
          history: history.slice(-10),
        }),
      });

      if (!response.ok) {
        let errMessage = 'Failed to connect to AI triage assistant.';
        try {
          const errData = await response.json();
          errMessage = errData.message || errMessage;
        } catch {
          // Response was not JSON
        }
        throw new Error(errMessage);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmed = block.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            try {
              const data = JSON.parse(jsonStr);
              if (data.text) {
                accumulatedText += data.text;
                if (onChunk) onChunk(data.text, accumulatedText);
              }
              if (data.done) {
                if (onComplete) onComplete(accumulatedText);
                return accumulatedText;
              }
            } catch {
              // Ignore unparseable SSE line
            }
          }
        }
      }

      if (onComplete) onComplete(accumulatedText);
      return accumulatedText;
    } catch (err) {
      console.error('[AI Chat Stream Client Error]:', err);
      if (onError) onError(err);
      throw err;
    }
  },
};
