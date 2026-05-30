const express = require('express');
const router = express.Router();
const { createQuestion, getQuestions, getQuestionById, getMyQuestions, deleteQuestion } = require('../controllers/questionController');
const { authenticateUser: protect, authorizeRoles } = require('../middleware/auth');
const admin = authorizeRoles('admin');

router.route('/')
  .post(protect, createQuestion)
  .get(protect, getQuestions);

router.get('/myquestions', protect, getMyQuestions);

router.route('/:id')
  .get(protect, getQuestionById)
  .delete(protect, admin, deleteQuestion);

module.exports = router;
