import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface Category {
  value: string;
  label: string;
}

interface Answers {
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  answer5: string;
}

interface Question {
  id?: number;
  periodId: number;
  category: string;
  content: string;
  answers: Answers;
}

interface AnswerChange {
  index: number;
  value: string;
}

const SurveyFormPressed: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [periodId, setPeriodId] = useState<number>(1);

  const categories: Category[] = [
    { value: "감수성", label: "감수성 영역" },
    { value: "법", label: "법 영역" }
  ];

  const answerOptions: Record<number, string> = {
    1: "매우 그렇다",
    2: "그렇다",
    3: "보통이다",
    4: "아니다",
    5: "매우 아니다"
  };

  useEffect(() => {
    fetchQuestions();
  }, [periodId]);

  const fetchQuestions = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/questions?periodId=${periodId}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data: Question[] = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('질문 조회 중 오류 발생:', error);
      alert('질문을 불러오는데 실패했습니다.');
    }
  };

  const handleQuestionChange = (id: number, field: string, value: string | AnswerChange): void => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (field === 'answers' && typeof value !== 'string') {
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

  const addQuestion = async (): Promise<void> => {
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
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuestion)
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      const data: Question = await response.json();
      setQuestions([...questions, data]);
    } catch (error) {
      console.error('질문 추가 중 오류 발생:', error);
      alert('질문 추가에 실패했습니다.');
    }
  };

  const deleteQuestion = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      setQuestions(questions.filter(q => q.id !== id));
    } catch (error) {
      console.error('질문 삭제 중 오류 발생:', error);
      alert('질문 삭제에 실패했습니다.');
    }
  };

  const saveQuestion = async (question: Question): Promise<void> => {
    try {
      const url = question.id ? `/api/questions/${question.id}` : '/api/questions';
      const method = question.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(question)
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
    } catch (error) {
      console.error('질문 저장 중 오류 발생:', error);
      alert('질문 저장에 실패했습니다.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold">설문조사 양식</h2>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-left font-medium text-gray-600 w-16">순서</th>
                <th className="p-4 text-left font-medium text-gray-600 w-40">카테고리</th>
                <th className="p-4 text-left font-medium text-gray-600">질문 내용</th>
                <th className="p-4 text-center font-medium text-gray-600 w-32">1번 보기</th>
                <th className="p-4 text-center font-medium text-gray-600 w-32">2번 보기</th>
                <th className="p-4 text-center font-medium text-gray-600 w-32">3번 보기</th>
                <th className="p-4 text-center font-medium text-gray-600 w-32">4번 보기</th>
                <th className="p-4 text-center font-medium text-gray-600 w-32">5번 보기</th>
                <th className="p-4 text-center font-medium text-gray-600 w-16">작업</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question, index) => (
                <tr key={question.id} className="border-t border-gray-200">
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">
                    <select
                      value={question.category}
                      onChange={(e) => {
                        handleQuestionChange(question.id!, 'category', e.target.value);
                        saveQuestion({ ...question, category: e.target.value });
                      }}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      value={question.content}
                      onChange={(e) => handleQuestionChange(question.id!, 'content', e.target.value)}
                      onBlur={() => saveQuestion(question)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  {[0, 1, 2, 3, 4].map((answerIndex) => (
                    <td key={answerIndex} className="p-4">
                      <select
                        value={question.answers[`answer${answerIndex + 1}` as keyof Answers]}
                        onChange={(e) => {
                          handleQuestionChange(question.id!, 'answers', {
                            index: answerIndex,
                            value: e.target.value
                          });
                          saveQuestion(question);
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(answerOptions).map(([value, label]) => (
                          <option key={value} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                  <td className="p-4">
                    <button
                      onClick={() => question.id && deleteQuestion(question.id)}
                      className="p-2 text-red-500 hover:text-red-700 focus:outline-none"
                      title="삭제"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button
          onClick={addQuestion}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          질문 추가
        </button>
        <button
      onClick={() => {
        questions.forEach(saveQuestion);
        alert('모든 질문이 저장되었습니다.');
      }}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
    >
      전체 저장
    </button>
      </div>
    </div>
  );
};

export default `SurveyFormPressed`;