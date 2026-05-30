const { AppError } = require('../middleware/errorHandler');
const { searchSimilar, getSuggestions, generateAnswer } = require('../services/searchService');

const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

exports.search = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return next(new AppError('Query is required', 400));
    }

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      return next(new AppError('Query must be at least 3 characters', 400));
    }
    if (trimmed.length > 300) {
      return next(new AppError('Query must not exceed 300 characters', 400));
    }

    const cached = searchCache.get(trimmed);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ success: true, ...cached.data });
    }

    const sources = await searchSimilar(trimmed, 5);
    const { answer, confidence } = await generateAnswer(trimmed, sources);
    console.log(`Query: "${trimmed}" | Sources: ${sources.length} | Confidence: ${confidence}`);

    const data = {
      answer,
      confidence,
      sources: sources.map(s => ({
        faqId: s.faqId,
        question: s.question,
        category: s.category,
        score: s.score,
        answer: s.document ? s.document.replace(s.question, '').trim() : '',
      })),
      similar: sources.map(s => ({
        faqId: s.faqId,
        question: s.question,
        score: s.score,
      })),
      timestamp: new Date().toISOString(),
    };

    searchCache.set(trimmed, { data, timestamp: Date.now() });
    // Auto-save unresolved queries
if (req.user && (sources.length === 0 || confidence < 0.4)) {
  try {
    const Query = require('../models/Query');
    const existing = await Query.findOne({
      question: { $regex: trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
      status: 'pending'
    });
    if (!existing) {
      await Query.create({
        user: req.user._id,
        question: trimmed,
        category: 'general',
        status: 'pending'
      });
    }
  } catch (e) {}
}

    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

exports.suggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.json({ success: true, results: [] });
    }

    const trimmed = q.trim();
    if (trimmed.length < 2) {
      return res.json({ success: true, results: [] });
    }
    if (trimmed.length > 300) {
      return res.json({ success: true, results: [] });
    }

    const results = await getSuggestions(trimmed);
    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
};
