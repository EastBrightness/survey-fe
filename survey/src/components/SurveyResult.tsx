// SurveyResult.tsx
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../SurveyResult.css';

// Define the types for our survey result data
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

interface CategoryData {
  category: string;
  self: number;
  others: number;
}

const SurveyResult: React.FC = () => {
  // State for storing survey result data with TypeScript types
  const [resultData, setResultData] = useState<SurveyResultData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for D3 chart containers
  const barChartRef = useRef<SVGSVGElement | null>(null);
  
  // For demo purposes, we'll use a placeholder for the employee number and period ID
  const employeeNumber: number = 1020; // This would normally come from the login state
  const periodId: number = 1; // This would normally come from a selection or context
  
  useEffect(() => {
    // Fetch survey result data when the component mounts
    const fetchSurveyResult = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(`/api/survey/result/${employeeNumber}/${periodId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch survey results');
        }
        
        const data: SurveyResultData = await response.json();
        setResultData(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSurveyResult();
  }, [employeeNumber, periodId]); // Add periodId as a dependency
  
  // Create D3 bar chart when resultData changes
  useEffect(() => {
    if (resultData && barChartRef.current) {
      createBarChart();
    }
  }, [resultData]);
  
  // Determine the status color based on percentile
  const getStatusColor = (percentile: number): string => {
    if (percentile <= 10) return 'safe'; // Green for top 10%
    if (percentile <= 30) return 'warning'; // Yellow for top 10-30%
    return 'danger'; // Red for top 30-100%
  };
  
  // Prepare data for category comparison chart
  const prepareCategoryData = (): CategoryData[] => {
    if (!resultData) return [];
    
    const categories = [
      ...new Set([
        ...Object.keys(resultData.selfScoresByCategory),
        ...Object.keys(resultData.othersScoresByCategory)
      ])
    ];
    
    return categories.map(category => ({
      category,
      self: resultData.selfScoresByCategory[category] || 0,
      others: resultData.othersScoresByCategory[category] || 0
    }));
  };
  
  // Create the bar chart using D3
  const createBarChart = () => {
    if (!barChartRef.current || !resultData) return;
    
    // Clear any existing chart
    d3.select(barChartRef.current).selectAll('*').remove();
    
    const data = prepareCategoryData();
    
    // Set up chart dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 40 };
    const width = barChartRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create the SVG element
    const svg = d3.select(barChartRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Set up the x and y scales
    const x0 = d3.scaleBand()
      .domain(data.map(d => d.category))
      .rangeRound([0, width])
      .paddingInner(0.1);
    
    const x1 = d3.scaleBand()
      .domain(['self', 'others'])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.self, d.others)) as number])
      .nice()
      .rangeRound([height, 0]);
    
    const color = d3.scaleOrdinal()
      .domain(['self', 'others'])
      .range(['rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)']);
    
    // Add the x-axis
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');
    
    // Add the y-axis
    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).ticks(null, 's'))
      .append('text')
      .attr('x', 2)
      .attr('y', y(y.domain()[1] as number) || 0)
      .attr('dy', '0.32em')
      .attr('fill', '#000')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'start')
      .text('Score');
    
    // Create the grouped bars
    const categoryGroups = svg.append('g')
      .selectAll('g')
      .data(data)
      .enter().append('g')
      .attr('transform', d => `translate(${x0(d.category) || 0},0)`);
    
    // Add the self-evaluation bars
    categoryGroups.append('rect')
      .attr('class', 'bar self-bar')
      .attr('x', x1('self') || 0)
      .attr('y', d => y(d.self))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - y(d.self))
      .attr('fill', color('self') as string);
    
    // Add the others-evaluation bars
    categoryGroups.append('rect')
      .attr('class', 'bar others-bar')
      .attr('x', x1('others') || 0)
      .attr('y', d => y(d.others))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - y(d.others))
      .attr('fill', color('others') as string);
    
    // Add a legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(['자가평가', '타인평가'])
      .enter().append('g')
      .attr('transform', (d, i) => `translate(0,${i * 20})`);
    
    legend.append('rect')
      .attr('x', width - 19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', (d, i) => color(i === 0 ? 'self' : 'others') as string);
    
    legend.append('text')
      .attr('x', width - 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text(d => d);
  };
  
  // Handle window resize for responsive chart
  useEffect(() => {
    const handleResize = () => {
      if (resultData) {
        createBarChart();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [resultData]);
  
  if (loading) return <div className="loading">결과를 불러오는 중입니다...</div>;
  if (error) return <div className="error">오류: {error}</div>;
  if (!resultData) return <div className="no-data">데이터가 없습니다.</div>;
  
  return (
    <div className="survey-result-container">
      <h1 className="title">평가 결과 확인</h1>
      
      {/* Summary Section */}
      <section className="result-summary">
        <h2>평가 결과 종합</h2>
        <p className="summary-text">
          {resultData.employeeName} 님의 자가평가 점수는 {resultData.selfEvaluationScore} 점이고, 
          타인평가 점수는 {resultData.othersEvaluationScore} 점입니다.
        </p>
      </section>
      
      {/* Percentile Section */}
      <section className="percentile-section">
        <h2>평가 수준 백분위</h2>
        
        <div className="percentile-bars">
          {/* Overall Percentile */}
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
          
          {/* Same Rank Percentile */}
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
        
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color danger"></span>
            <span>경고 (상위 30% 이상)</span>
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
      
      {/* Category Scores Section */}
      <section className="category-scores">
        <h2>분야별 평가 수준</h2>
        <div className="chart-container">
          <svg ref={barChartRef} className="d3-bar-chart" width="100%" height="400"></svg>
        </div>
      </section>
      
      {/* Feedback Section */}
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

export default SurveyResult;