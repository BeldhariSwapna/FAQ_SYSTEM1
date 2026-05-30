const Question = require('../models/Question');

// Create a new question
const createQuestion = async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const question = await Question.create({
      title,
      description,
      author: req.user._id
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all questions
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({}).populate('author', 'username email').sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single question by ID
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('author', 'username email');
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logged-in user's questions
const getMyQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete question (Admin only)
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    await question.deleteOne();
    res.json({ message: 'Question removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  getMyQuestions,
  deleteQuestion
};
