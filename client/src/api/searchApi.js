import api from './axios';

const suggestionsCache = new Map();
const searchCache = new Map();

export async function searchFAQs(query) {
  const key = query.toLowerCase().trim();
  if (searchCache.has(key)) return searchCache.get(key);
  const { data } = await api.post('/search', { query });
  searchCache.set(key, data);
  return data;
}

export async function getSuggestions(query) {
  const key = query.toLowerCase().trim();
  if (suggestionsCache.has(key)) return suggestionsCache.get(key);
  const { data } = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
  suggestionsCache.set(key, data);
  return data;
}

export async function askFAQ(query, history = []) {
  const { data } = await api.post('/faqs/ask', { query, history });
  return data;
}

export async function sendFeedback(faqId, helpful) {
  const { data } = await api.post('/faqs/feedback', { faqId, helpful });
  return data;
}

export async function getRecentSearches() {
  const { data } = await api.get('/search/recent');
  return data;
}

export async function saveRecentSearch(query) {
  const { data } = await api.post('/search/recent', { query });
  return data;
}