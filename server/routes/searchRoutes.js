const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const searchController = require('../controllers/searchController');
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

// Optional auth middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  authenticateUser(req, res, (err) => {
    next();
  });
};

router.post('/', searchLimiter, optionalAuth, searchController.search);
router.get('/suggestions', suggestionLimiter, searchController.suggestions);
module.exports = router;