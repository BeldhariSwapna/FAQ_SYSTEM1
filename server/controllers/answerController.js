const Answer = require('../models/Answer');
const Question = require('../models/Question');

// Create a new answer
const createAnswer = async (req, res) => {
  const { content, questionId } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Answer content is required' });
  }

  try {
    const answer = await Answer.create({
      content,
      question: questionId,
      author: req.user._id
    });

    // Optionally update question status to answered
    await Question.findByIdAndUpdate(questionId, { status: 'answered' });

    res.status(201).json(answer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all answers for a specific question
const getAnswersByQuestionId = async (req, res) => {
  try {
    const answers = await Answer.find({ question: req.params.questionId })
      .populate('author', 'username')
      .sort({ createdAt: 1 }); // Oldest first
    res.json(answers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete answer (Admin only)
const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }
    await answer.deleteOne();
    res.json({ message: 'Answer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upvote an answer
const upvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    // Check if user already upvoted
    if (answer.upvotes.includes(req.user._id)) {
      // Remove upvote (toggle)
      answer.upvotes = answer.upvotes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      // Add upvote and remove downvote if exists
      answer.upvotes.push(req.user._id);
      answer.downvotes = answer.downvotes.filter(id => id.toString() !== req.user._id.toString());
    }
    await answer.save();
    res.json(answer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Downvote an answer
const downvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    // Check if user already downvoted
    if (answer.downvotes.includes(req.user._id)) {
      // Remove downvote (toggle)
      answer.downvotes = answer.downvotes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      // Add downvote and remove upvote if exists
      answer.downvotes.push(req.user._id);
      answer.upvotes = answer.upvotes.filter(id => id.toString() !== req.user._id.toString());
    }
    await answer.save();
    res.json(answer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAnswer,
  getAnswersByQuestionId,
  deleteAnswer,
  upvoteAnswer,
  downvoteAnswer
};
