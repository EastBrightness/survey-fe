import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../SurveyResult.css';

// 설문 결과 데이터에 대한 타입 정의
interface SurveyResultData {
  employeeName: string;
  selfEvaluationScore: number;
  othersEvaluationScore: number;
  overallPercentile: number;
  sameRankPercentile: number;
  selfScoresByCategory: Record<string, number>;
  othersScoresByCategory: Record<string, number>;
  textFeedback: string[];
}

// 카테고리 데이터 타입 정의
interface CategoryData {
  category: string;
  self: number;
  others: number;
}

const SurveyResultRecharts: React.FC = () => {
  // TypeScript 타입과 함께 설문 결과 데이터를 저장하기 위한 상태
  const [resultData, setResultData] = useState<SurveyResultData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  
  // 데모용으로 직원 번호 플레이스홀더 사용
  const employeeNumber: number = 1020; // 보통은 로그인 상태에서 가져옴
  
  useEffect(() => {
    // 컴포넌트 마운트 시 설문 결과 데이터 가져오기
    const fetchSurveyResult = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(`/api/survey/result/${employeeNumber}`);
        
        if (!response.ok) {
          throw new Error('설문 결과를 가져오는 데 실패했습니다');
        }
        
        const data: SurveyResultData = await response.json();
        setResultData(data);
        
        // 차트용 카테고리 데이터 준비
        const categories = [
          ...new Set([
            ...Object.keys(data.selfScoresByCategory),
            ...Object.keys(data.othersScoresByCategory)
          ])
        ];
        
        const formattedData = categories.map(category => ({
          category,
          self: data.selfScoresByCategory[category] || 0,
          others: data.othersScoresByCategory[category] || 0
        }));
        
        setCategoryData(formattedData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('알 수 없는 오류가 발생했습니다');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSurveyResult();
  }, [employeeNumber]);
  
  // 백분위에 따른 상태 색상 결정 - 수정됨
  // 낮은 백분위가 더 좋음 (0%가 최고, 100%가 최악)
  const getStatusColor = (percentile: number): string => {
    if (percentile < 10) return 'safe'; // 상위 10% 미만은 녹색
    if (percentile < 30) return 'warning'; // 상위 10-30%는 노란색
    return 'danger'; // 상위 30% 초과는 빨간색
  };
  
  if (loading) return <div className="loading">결과를 불러오는 중입니다...</div>;
  if (error) return <div className="error">오류: {error}</div>;
  if (!resultData) return <div className="no-data">데이터가 없습니다.</div>;
  
  return (
    <div className="survey-result-container">
      <h1 className="title">평가 결과 확인</h1>
      
      {/* 요약 섹션 */}
      <section className="result-summary">
        <h2>평가 결과 종합</h2>
        <p className="summary-text">
          {resultData.employeeName} 님의 자가평가 점수는 {resultData.selfEvaluationScore} 점이고, 
          타인평가 점수는 {resultData.othersEvaluationScore} 점입니다.
        </p>
      </section>
      
      {/* 백분위 섹션 - 수정됨 */}
      <section className="percentile-section">
        <h2>평가 수준 백분위</h2>
        
        <div className="percentile-bars">
          {/* 전체 백분위 */}
          <div className="percentile-item">
            <div className="percentile-label">전체 대상자 대비 백분위</div>
            <div className="percentile-value">
              전체 상위 {Math.round(resultData.overallPercentile)}%
            </div>
            <div className="percentile-bar-container">
              <div 
                className={`percentile-bar ${getStatusColor(resultData.overallPercentile)}`}
                style={{ width: `${100 - resultData.overallPercentile}%` }}
              ></div>
            </div>
          </div>
          
          {/* 동일 계급 백분위 */}
          <div className="percentile-item">
            <div className="percentile-label">동일 계급 내 백분위</div>
            <div className="percentile-value">
              동일 계급 내 상위 {Math.round(resultData.sameRankPercentile)}%
            </div>
            <div className="percentile-bar-container">
              <div 
                className={`percentile-bar ${getStatusColor(resultData.sameRankPercentile)}`}
                style={{ width: `${100 - resultData.sameRankPercentile}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* 범례 - 수정됨 */}
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color danger"></span>
            <span>경고 (상위 30% 초과)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color warning"></span>
            <span>위험 (상위 10~30%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color safe"></span>
            <span>안전 (상위 10% 미만)</span>
          </div>
        </div>
      </section>
      
      {/* Recharts를 사용한 카테고리 점수 섹션 */}
      <section className="category-scores">
        <h2>분야별 평가 수준</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={categoryData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ dy: 10 }}
              />
              <YAxis />
              <Tooltip />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                payload={[
                  { value: '자가평가', type: 'square', color: 'rgba(54, 162, 235, 0.7)' },
                  { value: '타인평가', type: 'square', color: 'rgba(255, 99, 132, 0.7)' }
                ]}
              />
              <Bar dataKey="self" name="자가평가" fill="rgba(54, 162, 235, 0.7)" />
              <Bar dataKey="others" name="타인평가" fill="rgba(255, 99, 132, 0.7)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      
      {/* 피드백 섹션 */}
      <section className="feedback-section">
        <h2>평가자 추가 의견</h2>
        {resultData.textFeedback && resultData.textFeedback.length > 0 ? (
          <ul className="feedback-list">
            {resultData.textFeedback.map((feedback, index) => (
              <li key={index} className="feedback-item">{feedback}</li>
            ))}
          </ul>
        ) : (
          <p className="no-feedback">추가 의견이 없습니다.</p>
        )}
      </section>
    </div>
  );
};

export default SurveyResultRecharts;