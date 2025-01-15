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
  targetYn: boolean;
  answers: Answers;
}

interface AnswerChange {
  index: number;
  value: string;
}

const SurveyForm = () => {
  const [selfQuestions, setSelfQuestions] = useState<Question[]>([]);
  const [peerQuestions, setPeerQuestions] = useState<Question[]>([]);
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
      // 자가평가 질문 조회
      const selfResponse = await fetch(`/api/questions?periodId=${periodId}&targetYn=true`);
      if (!selfResponse.ok) throw new Error('Network response was not ok');
      const selfData: Question[] = await selfResponse.json();
      setSelfQuestions(selfData);

      // 타인평가 질문 조회
      const peerResponse = await fetch(`/api/questions?periodId=${periodId}&targetYn=false`);
      if (!peerResponse.ok) throw new Error('Network response was not ok');
      const peerData: Question[] = await peerResponse.json();
      setPeerQuestions(peerData);
    } catch (error) {
      console.error('질문 조회 중 오류 발생:', error);
      alert('질문을 불러오는데 실패했습니다.');
    }
  };

  const handleQuestionChange = (isSelf: boolean) => (id: number, field: string, value: string | AnswerChange): void => {
    const setQuestions = isSelf ? setSelfQuestions : setPeerQuestions;
    const questions = isSelf ? selfQuestions : peerQuestions;

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

  const deleteQuestion = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      setSelfQuestions(selfQuestions.filter(q => q.id !== id));
      setPeerQuestions(peerQuestions.filter(q => q.id !== id));
    } catch (error) {
      console.error('질문 삭제 중 오류 발생:', error);
      alert('질문 삭제에 실패했습니다.');
    }
  };

  const addQuestion = async (isSelf: boolean): Promise<void> => {
    const newQuestion: Question = {
      periodId,
      category: "감수성",
      content: "",
      targetYn: isSelf,
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
      if (isSelf) {
        setSelfQuestions([...selfQuestions, data]);
      } else {
        setPeerQuestions([...peerQuestions, data]);
      }
    } catch (error) {
      console.error('질문 추가 중 오류 발생:', error);
      alert('질문 추가에 실패했습니다.');
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
    <div className="w-full max-w-7xl mx-auto mt-8 space-y-8">
      {/* 자가평가 섹션 */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">자가평가 설문</h2>
        </div>
        <div className="p-6">
          <QuestionTable
            questions={selfQuestions}
            categories={categories}
            answerOptions={answerOptions}
            handleQuestionChange={handleQuestionChange(true)}
            deleteQuestion={deleteQuestion}
            saveQuestion={saveQuestion}
          />
          <div className="mt-4">
            <button
              onClick={() => addQuestion(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              자가평가 질문 추가
            </button>
          </div>
        </div>
      </div>

      {/* 타인평가 섹션 */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">타인평가 설문</h2>
        </div>
        <div className="p-6">
          <QuestionTable
            questions={peerQuestions}
            categories={categories}
            answerOptions={answerOptions}
            handleQuestionChange={handleQuestionChange(false)}
            deleteQuestion={deleteQuestion}
            saveQuestion={saveQuestion}
          />
          <div className="mt-4">
            <button
              onClick={() => addQuestion(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              타인평가 질문 추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// QuestionTable 컴포넌트는 동일하게 유지
const QuestionTable = ({ 
  questions, 
  categories, 
  answerOptions, 
  handleQuestionChange, 
  deleteQuestion,
  saveQuestion 
}) => (
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
);

export default SurveyForm;