import axios from 'axios';
import { Question } from '../types/survey';

export const fetchQuestions = async (periodId: number): Promise<Question[]> => {
  const response = await axios.get(`/api/questions?periodId=${periodId}`);
  return response.data;
};

export const createQuestion = async (question: Question): Promise<Question> => {
  const response = await axios.post('/api/questions', question);
  return response.data;
};

export const updateQuestion = async (question: Question): Promise<Question> => {
  const response = await axios.put(`/api/questions/${question.id}`, question);
  return response.data;
};

export const deleteQuestion = async (id: number): Promise<void> => {
  await axios.delete(`/api/questions/${id}`);
};
