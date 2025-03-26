import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  LinearProgress, 
  List, 
  ListItem, 
  ListItemText,
  CircularProgress,
  Alert,
  useTheme,
  Divider
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie } from 'recharts';
import { PieChart } from 'lucide-react';

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

// 사용자 정의 스타일
const styles = {
  title: {
    marginBottom: 3,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 4,
    padding: 3,
  },
  percentileContainer: {
    marginTop: 2,
    marginBottom: 2,
  },
  percentileItem: {
    marginBottom: 2,
  },
  percentileLabel: {
    fontWeight: 'medium',
    marginBottom: 1,
  },
  percentileValue: {
    fontWeight: 'bold',
    marginBottom: 1,
  },
  legendContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 2,
    gap: 2,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    marginRight: 1,
    borderRadius: 1,
  },
  chartContainer: {
    height: 400,
    marginTop: 2,
  },
  feedbackItem: {
    paddingY: 1,
    borderBottom: '1px solid #eee',
  },
};

const SurveyResultMUI: React.FC = () => {
  // TypeScript 타입과 함께 설문 결과 데이터를 저장하기 위한 상태
  const [resultData, setResultData] = useState<SurveyResultData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  
  // 데모용으로 직원 번호 플레이스홀더 사용
  const employeeNumber: number = 1020; // 보통은 로그인 상태에서 가져옴
  const periodId: number = 1;
  
  useEffect(() => {
    // 컴포넌트 마운트 시 설문 결과 데이터 가져오기
    const fetchSurveyResult = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(`/api/survey/result/${employeeNumber}/${periodId}`);
        
        if (!response.ok) {
          throw new Error('설문 결과를 가져오는 데 실패했습니다');
        }
        
        const data: SurveyResultData = await response.json();
        setResultData(data);
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
  }, [employeeNumber, periodId]);
  
  // 백분위에 따른 상태 색상 결정 - 수정됨
  // 낮은 백분위가 더 좋음 (0%가 최고, 100%가 최악)
  const getStatusColor = (percentile: number): string => {
    if (percentile < 10) return theme.palette.success.main; // 상위 10% 미만은 녹색
    if (percentile < 30) return theme.palette.warning.main; // 상위 10-30%는 노란색
    return theme.palette.error.main; // 상위 30% 초과는 빨간색
  };
  
  
// prepareCategoryData 메서드에 전체 평균 추가
const prepareCategoryData = (): CategoryData[] => {
  if (!resultData) return [];
  
  const categories = [
    ...new Set([
      ...Object.keys(resultData.selfScoresByCategory),
      ...Object.keys(resultData.othersScoresByCategory)
    ])
  ];
  
  const categoryData = categories.map(category => ({
    category,
    self: resultData.selfScoresByCategory[category] || 0,
    others: resultData.othersScoresByCategory[category] || 0
  }));

  // 전체 평균 계산
  const overallSelfAverage = categoryData.reduce((sum, item) => sum + item.self, 0) / categoryData.length;
  const overallOthersAverage = categoryData.reduce((sum, item) => sum + item.others, 0) / categoryData.length;

  return [
    ...categoryData,
    {
      category: '전체 평균',
      self: overallSelfAverage,
      others: overallOthersAverage
    }
  ];
};
  
  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <CircularProgress />
      <Typography ml={2}>결과를 불러오는 중입니다...</Typography>
    </Box>
  );
  
  if (error) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <Alert severity="error">오류: {error}</Alert>
    </Box>
  );
  
  if (!resultData) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <Alert severity="info">데이터가 없습니다.</Alert>
    </Box>
  );
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" sx={styles.title} align="center" gutterBottom>
        평가 결과 확인
      </Typography>
      
      {/* 요약 섹션 */}
      <Paper elevation={3} sx={styles.section}>
        <Box p={3}>
          <Typography variant="h5" component="h2" gutterBottom>
            평가 결과 종합
          </Typography>
          <Typography variant="body1">
            {resultData.employeeName} 님의 자가평가 점수는 {resultData.selfEvaluationScore} 점이고, 
            타인평가 점수는 {resultData.othersEvaluationScore} 점입니다.
          </Typography>
        </Box>
      </Paper>
      
      {/* 백분위 섹션 - 수정됨 */}
      <Paper elevation={3} sx={styles.section}>
        <Box p={3}>
          <Typography variant="h5" component="h2" gutterBottom>
            평가 수준 백분위
          </Typography>
          
          <Box sx={styles.percentileContainer}>
            {/* 전체 백분위 */}
            <Box sx={styles.percentileItem}>
              <Typography variant="subtitle1" sx={styles.percentileLabel}>
                전체 대상자 대비 백분위
              </Typography>
              <Typography variant="h6" sx={styles.percentileValue}>
                전체 상위 {Math.round(resultData.overallPercentile)}%
              </Typography>
              <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={100 - resultData.overallPercentile}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: theme.palette.grey[300],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getStatusColor(resultData.overallPercentile),
                      borderRadius: 5,
                    }
                  }}
                />
              </Box>
            </Box>
            
            {/* 동일 계급 백분위 */}
            <Box sx={styles.percentileItem}>
              <Typography variant="subtitle1" sx={styles.percentileLabel}>
                동일 계급 내 백분위
              </Typography>
              <Typography variant="h6" sx={styles.percentileValue}>
                동일 계급 내 상위 {Math.round(resultData.sameRankPercentile)}%
              </Typography>
              <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={100 - resultData.sameRankPercentile}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: theme.palette.grey[300],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getStatusColor(resultData.sameRankPercentile),
                      borderRadius: 5,
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
          
          {/* 범례 - 수정됨 */}
          <Box sx={styles.legendContainer}>
            <Box sx={styles.legendItem}>
              <Box sx={{ ...styles.legendColor, backgroundColor: theme.palette.error.main }}></Box>
              <Typography variant="body2">경고 (상위 30% 초과)</Typography>
            </Box>
            <Box sx={styles.legendItem}>
              <Box sx={{ ...styles.legendColor, backgroundColor: theme.palette.warning.main }}></Box>
              <Typography variant="body2">위험 (상위 10~30%)</Typography>
            </Box>
            <Box sx={styles.legendItem}>
              <Box sx={{ ...styles.legendColor, backgroundColor: theme.palette.success.main }}></Box>
              <Typography variant="body2">안전 (상위 10% 미만)</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* 카테고리 점수 섹션 */}
      <Paper elevation={3} sx={styles.section}>
        <Box p={3}>
          <Typography variant="h5" component="h2" gutterBottom>
            분야별 평가 수준
          </Typography>
          <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
          <Box sx={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prepareCategoryData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                />
                <YAxis />
                <Tooltip />
                <Legend 
                  payload={[
                    { value: '자가평가', type: 'square', color: theme.palette.primary.main },
                    { value: '타인평가', type: 'square', color: theme.palette.secondary.main }
                  ]}
                />
                <Bar dataKey="self" name="자가평가" fill={theme.palette.primary.main} />
                <Bar dataKey="others" name="타인평가" fill={theme.palette.secondary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
      </Grid>
          <Grid item xs={12} md={4}>
        <Box sx={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            
      {/* 피드백 섹션 */}
      <Paper elevation={3} sx={styles.section}>
        <Box p={3}>
          <Typography variant="h5" component="h2" gutterBottom>
            평가자 추가 의견
          </Typography>
          {resultData.textFeedback && resultData.textFeedback.length > 0 ? (
            <List>
              {resultData.textFeedback.map((feedback, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={styles.feedbackItem}>
                    <ListItemText primary={feedback} />
                  </ListItem>
                  {index < resultData.textFeedback.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center" py={2}>
              추가 의견이 없습니다.
            </Typography>
          )}
        </Box>
      </Paper>
          </ResponsiveContainer>
        </Box>
      </Grid>
      </Grid>
        </Box>
      </Paper>
      
    </Container>
  );
};

export default SurveyResultMUI;