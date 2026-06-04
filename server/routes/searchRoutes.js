const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const searchController = require('../controllers/searchController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateUser } = require('../middleware/auth');

const router = Router();

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many search requests. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const suggestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many requests. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Bypasses authenticateUser entirely — manually decodes token so errors never block the request
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) req.user = user;
    }
  } catch (_) {
    // invalid/expired token — just skip, don't block
  }
  next();
};

router.post('/', searchLimiter, optionalAuth, searchController.search);
router.get('/suggestions', suggestionLimiter, searchController.suggestions);
// server-side recent searches (authenticated)
router.get('/recent', authenticateUser, searchController.getRecentSearches);
router.post('/recent', authenticateUser, searchController.saveRecentSearch);

module.exports = router;