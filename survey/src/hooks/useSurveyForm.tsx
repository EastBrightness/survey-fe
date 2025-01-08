import { useState, useEffect } from 'react';
import { Question, Category, AnswerOptions } from '../types/survey.tsx';
import * as api from '../services/api';

export const useSurveyForm = (initialPeriodId: number) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [periodId, setPeriodId] = useState<number>(initialPeriodId);

  const categories: Category[] = [
    { value: "감수성", label: "감수성 영역" },
    { value: "법", label: "법 영역" }
  ];

  const answerOptions: AnswerOptions = {
    1: "매우 그렇다",
    2: "그렇다",
    3: "보통이다",
    4: "아니다",
    5: "매우 아니다"
  };

  useEffect(() => {
    fetchQuestions();
  }, [periodId]);

  const fetchQuestions = async () => {
    try {
      const data = await api.fetchQuestions(periodId);
      setQuestions(data);
    } catch (error) {
      console.error('질문 조회 중 오류 발생:', error);
      alert('질문을 불러오는데 실패했습니다.');
    }
  };

  const handleQuestionChange = (id: number, field: string, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (field === 'answers') {
          return {
            ...q,
            answers: { ...q.answers, [`answer${value.index + 1}`]: value.value }
          };
        }
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const addQuestion = async () => {
    const newQuestion: Question = {
      periodId,
      category: "감수성",
      content: "",
      answers: {
        answer1: "매우 그렇다",
        answer2: "그렇다",
        answer3: "보통이다",
        answer4: "아니다",
        answer5: "매우 아니다"
      }
    };

    try {
      const response = await api.createQuestion(newQuestion);
      setQuestions([...questions, response]);
    } catch (error) {
      console.error('질문 추가 중 오류 발생:', error);
      alert('질문 추가에 실패했습니다.');
    }
  };

  const deleteQuestion = async (id: number) => {
    try {
      await api.deleteQuestion(id);
      setQuestions(questions.filter(q => q.id !== id));
    } catch (error) {
      console.error('질문 삭제 중 오류 발생:', error);
      alert('질문 삭제에 실패했습니다.');
    }
  };

  const saveQuestion = async (question: Question) => {
    try {
      if (question.id) {
        await api.updateQuestion(question);
      } else {
        await api.createQuestion(question);
      }
    } catch (error) {
      console.error('질문 저장 중 오류 발생:', error);
      alert('질문 저장에 실패했습니다.');
    }
  };

  return {
    questions,
    periodId,
    setPeriodId,
    categories,
    answerOptions,
    handleQuestionChange,
    addQuestion,
    deleteQuestion,
    saveQuestion
  };
};
