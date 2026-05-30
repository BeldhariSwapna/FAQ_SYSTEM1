import api from '../api/axios';

// Create new question
const createQuestion = async (questionData) => {
  const response = await api.post('/questions', questionData);
  return response.data;
};

// Get all questions
const getQuestions = async () => {
  const response = await api.get('/questions');
  return response.data;
};

// Get user's questions
const getMyQuestions = async () => {
  const response = await api.get('/questions/myquestions');
  return response.data;
};

// Get single question by ID
const getQuestionById = async (id) => {
  const response = await api.get(`/questions/${id}`);
  return response.data;
};

// Delete question (Admin)
const deleteQuestion = async (id) => {
  const response = await api.delete(`/questions/${id}`);
  return response.data;
};

const questionService = {
  createQuestion,
  getQuestions,
  getMyQuestions,
  getQuestionById,
  deleteQuestion
};

export default questionService;
