const express = require('express');
const router = express.Router();
const { createAnswer, getAnswersByQuestionId, deleteAnswer, upvoteAnswer, downvoteAnswer } = require('../controllers/answerController');
const { authenticateUser: protect, authorizeRoles } = require('../middleware/auth');
const admin = authorizeRoles('admin');

router.post('/', protect, createAnswer);
router.get('/:questionId', protect, getAnswersByQuestionId);
router.delete('/:id', protect, admin, deleteAnswer);

// Voting routes
router.put('/:id/upvote', protect, upvoteAnswer);
router.put('/:id/downvote', protect, downvoteAnswer);

module.exports = router;
