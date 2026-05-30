import api from '../api/axios';

// Create new FAQ (Admin only)
const createFaq = async (faqData) => {
  const response = await api.post('/faqs', faqData);
  return response.data;
};

// Get all FAQs
const getFaqs = async () => {
  const response = await api.get('/faqs');
  return response.data;
};

// Get single FAQ
const getFaqById = async (id) => {
  const response = await api.get(`/faqs/${id}`);
  return response.data;
};

// Update FAQ (Admin only)
const updateFaq = async (id, faqData) => {
  const response = await api.put(`/faqs/${id}`, faqData);
  return response.data;
};

// Delete FAQ (Admin only)
const deleteFaq = async (id) => {
  const response = await api.delete(`/faqs/${id}`);
  return response.data;
};

const faqService = {
  createFaq,
  getFaqs,
  getFaqById,
  updateFaq,
  deleteFaq
};

export default faqService;
