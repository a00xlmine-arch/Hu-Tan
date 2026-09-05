 'use strict';

function extractText(data) {
  if (typeof data === 'string') return data;

  const choices = data?.choices;
  if (Array.isArray(choices)) {
    const message = choices[0]?.message?.content;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) {
      return message.map((x) => typeof x === 'string' ? x : x?.text || '').join('');
    }
    if (typeof choices[0]?.text === 'string') return choices[0].text;
  }

  if (typeof data?.output_text === 'string') return data.output_text;
  if (Array.isArray(data?.output)) {
    const texts = data.output.flatMap((x) => Array.isArray(x?.content)
      ? x.content.map((y) => y?.text || '')
      : []);
    if (texts.length) return texts.join('');
  }

  for (const key of ['response', 'answer', 'text']) {
    if (typeof data?.[key] === 'string') return data[key];
  }

  return '';
}

class AIService {
  constructor(config) {
    this.config = config;
    this.history = new Map();
    this.queues = new Map();
  }

  enabled() {
    return Boolean(this.config.ai?.enabled && this.config.ai?.url);
  }

  async _ask({ threadID, userName, text }) {
    const cleanText = String(text || '').trim();
    if (!cleanText) throw new Error('اكتبي رسالة أولًا.');
    if (cleanText.length > Number(this.config.ai.maxPromptChars || 4000)) {
      throw new Error(`الرسالة طويلة جدًا؛ الحد هو ${this.config.ai.maxPromptChars} حرف.`);
    }

    const key = String(threadID);
    const history = this.history.get(key) || [];
    const messages = [
      { role: 'system', content: this.config.ai.feminineSystemPrompt },
      ...history.slice(-10),
      { role: 'user', content: `${userName}: ${cleanText}` }
    ];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(this.config.ai.timeoutMs || 30000));

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.config.ai.apiKey) headers.Authorization = `Bearer ${this.config.ai.apiKey}`;

      const payload = {
        messages,
        temperature: Number(this.config.ai.temperature ?? 0.85),
        max_tokens: Number(this.config.ai.maxTokens || 500)
      };
      if (this.config.ai.model) payload.model = this.config.ai.model;

      const response = await fetch(this.config.ai.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const raw = await response.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (_) {
        data = raw;
      }

      if (!response.ok) {
        const detail = typeof data === 'string' ? data : JSON.stringify(data);
        throw new Error(`AI HTTP ${response.status}: ${String(detail).slice(0, 220)}`);
      }

      const answer = String(extractText(data)).trim();
      if (!answer) throw new Error('خدمة الذكاء الاصطناعي أعادت ردًا فارغًا.');

      history.push(
        { role: 'user', content: `${userName}: ${cleanText}` },
        { role: 'assistant', content: answer }
      );
      this.history.set(key, history.slice(-20));
      return answer;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('انتهت مهلة خدمة الذكاء الاصطناعي.');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  ask(request) {
    if (!this.enabled()) return Promise.reject(new Error('الذكاء الاصطناعي غير مفعّل.'));

    const key = String(request.threadID);
    const previous = this.queues.get(key) || Promise.resolve();
    const run = previous.catch(() => undefined).then(() => this._ask(request));
    const tracked = run.finally(() => {
      if (this.queues.get(key) === tracked) this.queues.delete(key);
    });

    this.queues.set(key, tracked);
    return run;
  }

  clear(threadID) {
    const key = String(threadID);
    this.history.delete(key);
  }

  info() {
    return {
      enabled: this.enabled(),
      model: this.config.ai?.model || 'غير محدد',
      url: this.config.ai?.url || '',
      queuedThreads: this.queues.size
    };
  }
}

module.exports = AIService;
