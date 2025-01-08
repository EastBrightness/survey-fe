import React from 'react';
import { Trash2 } from 'lucide-react';
import { useSurveyForm } from '../hooks/useSurveyForm';
import { Question } from '../types/survey';

const SurveyForm: React.FC = () => {
  const {
    questions = [],
    categories,
    answerOptions,
    handleQuestionChange,
    addQuestion,
    deleteQuestion,
    saveQuestion
  } = useSurveyForm(1); // 초기 periodId 값으로 1을 사용

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
              {Array.isArray(questions) && questions.map((question: Question, index: number) => (
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
                        value={question.answers[`answer${answerIndex + 1}` as keyof typeof question.answers]}
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
                      onClick={() => deleteQuestion(question.id!)}
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

export default SurveyForm;
