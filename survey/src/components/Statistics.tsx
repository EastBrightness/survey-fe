import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container,
  AppBar,
  Toolbar,
  Typography,
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  CircularProgress,
  Tabs,
  Tab,
  SelectChangeEvent,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';

// 인터페이스 정의
interface EvaluationPeriod {
  id: number;
  standardYear: string;
  evaluationName: string;
  isDeleted: boolean;
}

interface Organization {
  oCode: string;
  orgName: string;
}

interface FilterParams {
  year: string;
  evaluationName: string;
  organizationCode: string;
  personType: string;
  grade: string;
  sex: string;
}

interface StatisticsData {
  averageSelfScore: number;
  averageOthersScore: number;
  selfCompletionRate: number;
  othersCompletionRate: number;
  gradeStatistics: Record<string, { self: number; others: number }>;
  personTypeStatistics: Record<string, { self: number; others: number }>;
  sexStatistics: Record<string, { self: number; others: number }>;
  organizationStatistics: Record<string, { self: number; others: number }>;
  questionStatistics: Record<string, { self: number; others: number }>;
}

// MUI 테마 생성
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// 차트 색상
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Statistics: React.FC = () => {
  // 상태 관리
  const [years, setYears] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationPeriod[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isExcelView, setIsExcelView] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);

   // 필터 옵션 상태
   const [filterOptions, setFilterOptions] = useState<{
    personTypes: string[];
    grades: string[];
    sexes: string[];
  }>({
    personTypes: [],
    grades: [],
    sexes: []
  });
  
  const [filterParams, setFilterParams] = useState<FilterParams>({
    year: '',
    evaluationName: '',
    organizationCode: 'all', // 'all'은 전체를 의미
    personType: '',
    grade: '',
    sex: ''
  });
  
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

   // 필터 옵션 불러오기
   useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/statistics/filters');
        if (!response.ok) {
          throw new Error('필터 옵션을 불러오는 중 오류 발생');
        }
        const data = await response.json();
        setFilterOptions(data);
      } catch (error) {
        console.error('필터 옵션을 불러오는 중 오류 발생:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  // 연도 목록 조회
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch('/api/statistics/years');
        if (!response.ok) {
          throw new Error('연도 목록을 불러오는 중 오류 발생');
        }
        const data = await response.json();
        setYears(data);
        if (data.length > 0) {
          setFilterParams(prev => ({ ...prev, year: data[0] }));
        }
      } catch (error) {
        console.error('연도 목록을 불러오는 중 오류 발생:', error);
      }
    };

    fetchYears();
  }, []);

  // 선택된 연도에 따라 평가명 목록 조회
  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!filterParams.year) return;
      
      try {
        const response = await fetch(`/api/statistics/evaluations?year=${filterParams.year}`);
        if (!response.ok) {
          throw new Error('평가 목록을 불러오는 중 오류 발생');
        }
        const data = await response.json();
        setEvaluations(data);
        if (data.length > 0) {
          setFilterParams(prev => ({ ...prev, evaluationName: data[0].evaluationName }));
        } else {
          setFilterParams(prev => ({ ...prev, evaluationName: '' }));
        }
      } catch (error) {
        console.error('평가 목록을 불러오는 중 오류 발생:', error);
      }
    };

    fetchEvaluations();
  }, [filterParams.year]);

  // 대상 조직 목록은 임시 데이터로 설정
  useEffect(() => {
    // 실제로는 API로 조직 목록을 가져와야 합니다.
    setOrganizations([
      { oCode: 'all', orgName: '전체' },
      { oCode: '11', orgName: '개발과' },
      { oCode: '12', orgName: '운영과' },
      { oCode: '111', orgName: '개발1팀' },
      { oCode: '112', orgName: '개발2팀' }
    ]);
  }, []);

  // 통계 데이터 요청
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/statistics/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterParams),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '통계 데이터를 불러오는 중 오류가 발생했습니다.');
      }
  
      const data = await response.json();
      setStatistics(data);
    } catch (err: any) {
      setError(err.message || '통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  
// 엑셀 다운로드 함수
const downloadExcel = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // fetch API로 변경
    const response = await fetch('/api/statistics/export-excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filterParams),
    });
    
    if (!response.ok) {
      throw new Error('엑셀 파일 다운로드 중 오류가 발생했습니다');
    }
    
    const blob = await response.blob();
    
    // 다운로드 처리
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'evaluation_statistics.xlsx';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (err) {
    console.error('엑셀 다운로드 오류:', err);
    setError('엑셀 파일 다운로드 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};

// 엑셀 다운로드 버튼 UI
{isExcelView && (
  <Grid item xs={6} sm={6} md={3}>
    <Button
      fullWidth
      variant="contained"
      color="success"
      onClick={downloadExcel}
      disabled={!filterParams.year || !filterParams.evaluationName || loading}
      startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <FileDownloadIcon />}
    >
      내려받기
    </Button>
  </Grid>
)}

  const handleChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFilterParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatistics();
  };

  const toggleExcelView = () => {
    setIsExcelView(!isExcelView);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const prepareQuestionData = () => {
    if (!statistics || !statistics.questionStatistics) return [];

    // 문항별로 자가평가와 타인평가 점수를 함께 표시
    return Object.entries(statistics.questionStatistics)
      .map(([questionId, scores]) => ({
        name: `문항 ${questionId}`,
        자가평가: scores.self || 0,
        타인평가: scores.others || 0
      }))
      .sort((a, b) => {
        // 문항 번호순으로 정렬 (문항 1, 문항 2, ...)
        const numA = parseInt(a.name.replace(/[^0-9]/g, ''));
        const numB = parseInt(b.name.replace(/[^0-9]/g, ''));
        return numA - numB;
      });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 헤더 */}
      <AppBar position="static" color="primary">
        <Container maxWidth="lg">
          <Toolbar>
            <EqualizerIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div">
              평가 통계 관리 시스템
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          {/* 필터 영역 */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Typography variant="h6" gutterBottom>
                평가결과 {isExcelView ? '일괄 조회' : '종합 분석 조회'}
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                {/* 평가연도 선택 */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>평가연도</InputLabel>
                    <Select
                      name="year"
                      value={filterParams.year}
                      label="평가연도"
                      onChange={handleChange}
                    >
                      {years.map((year) => (
                        <MenuItem key={year} value={year}>{year}년</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* 평가명(차수) 선택 */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>평가명(차수)</InputLabel>
                    <Select
                      name="evaluationName"
                      value={filterParams.evaluationName}
                      label="평가명(차수)"
                      onChange={handleChange}
                      disabled={!filterParams.year}
                    >
                      {evaluations.map((evaluation) => (
                        <MenuItem key={evaluation.id} value={evaluation.evaluationName}>
                          {evaluation.evaluationName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* 대상조직 선택 */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>대상조직</InputLabel>
                    <Select
                      name="organizationCode"
                      value={filterParams.organizationCode}
                      label="대상조직"
                      onChange={handleChange}
                    >
                      {organizations.map((org) => (
                        <MenuItem key={org.oCode} value={org.oCode}>
                          {org.orgName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* 엑셀 다운로드 모드일 때 추가 필터 보여주기 */}
                {isExcelView && (
                  <>
                    {/* 신분 선택 */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>신분</InputLabel>
                        <Select
                          name="personType"
                          value={filterParams.personType}
                          label="신분"
                          onChange={handleChange}
                        >
                          <MenuItem value="">전체</MenuItem>
                          {filterOptions.personTypes.map((type) => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* 계급 선택 */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>계급</InputLabel>
                        <Select
                          name="grade"
                          value={filterParams.grade}
                          label="계급"
                          onChange={handleChange}
                        >
                          <MenuItem value="">전체</MenuItem>
                          {filterOptions.grades.map((grade) => (
                            <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* 성별 선택 */}
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>성별</InputLabel>
                        <Select
                          name="sex"
                          value={filterParams.sex}
                          label="성별"
                          onChange={handleChange}
                        >
                          <MenuItem value="">전체</MenuItem>
                          {filterOptions.sexes.map((sex) => (
                            <MenuItem key={sex} value={sex}>{sex === 'M' ? '남성' : '여성'}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
                
                {/* 조회 버튼 */}
                <Grid item xs={6} sm={3} md={isExcelView ? 2 : 3}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={!filterParams.year || !filterParams.evaluationName || loading}
                    startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
                  >
                    조회
                  </Button>
                </Grid>
                
                {/* 엑셀 다운로드 버튼 (엑셀 모드일 때만) */}
                {isExcelView && (
                  <Grid item xs={6} sm={3} md={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={downloadExcel}
                      disabled={!filterParams.year || !filterParams.evaluationName || loading}
                      startIcon={<FileDownloadIcon />}
                    >
                      내려받기
                    </Button>
                  </Grid>
                )}
                
                {/* 모드 전환 버튼 */}
                <Grid item xs={12} sm={6} md={isExcelView ? 2 : 3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={toggleExcelView}
                  >
                    {isExcelView ? '분석 모드' : '엑셀 다운로드 모드'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {error && (
            <Box sx={{ color: 'error.main', my: 2 }}>
              {error}
            </Box>
          )}
          
          {/* 통계 결과 영역 */}
          {statistics && !loading && !isExcelView && (
            <>
              {/* 요약 정보 */}
              <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  평가 결과 종합
                </Typography>

                <Box sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 2 }}>
                  평가 결과 자가평가 평균 <Typography component="span" fontWeight="bold" color="primary">
                    {statistics.averageSelfScore.toFixed(2)}
                  </Typography>점, 
                  타인평가 평균 <Typography component="span" fontWeight="bold" color="primary">
                    {statistics.averageOthersScore.toFixed(2)}
                  </Typography>점입니다. 
                  평가 실시율은 자가평가 <Typography component="span" fontWeight="bold" color="primary">
                    {statistics.selfCompletionRate.toFixed(2)}
                  </Typography>%, 
                  타인평가 <Typography component="span" fontWeight="bold" color="primary">
                    {statistics.othersCompletionRate.toFixed(2)}
                  </Typography>%입니다.
                </Box>

                {/* 세부 정보 표시 그리드 */}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ bgcolor: 'primary.light', color: 'white', p: 2, borderRadius: 1 }}>
                      <Typography variant="subtitle2">자가평가 평균</Typography>
                      <Typography variant="h5">{statistics.averageSelfScore.toFixed(2)}점</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ bgcolor: 'secondary.light', color: 'white', p: 2, borderRadius: 1 }}>
                      <Typography variant="subtitle2">타인평가 평균</Typography>
                      <Typography variant="h5">{statistics.averageOthersScore.toFixed(2)}점</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ bgcolor: 'info.light', color: 'white', p: 2, borderRadius: 1 }}>
                      <Typography variant="subtitle2">자가평가 실시율</Typography>
                      <Typography variant="h5">{statistics.selfCompletionRate.toFixed(2)}%</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ bgcolor: 'success.light', color: 'white', p: 2, borderRadius: 1 }}>
                      <Typography variant="subtitle2">타인평가 실시율</Typography>
                      <Typography variant="h5">{statistics.othersCompletionRate.toFixed(2)}%</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* 차트 영역 */}
              <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs value={tabValue} onChange={handleTabChange} aria-label="statistics tabs">
                    <Tab label="계급별" />
                    <Tab label="신분별" />
                    <Tab label="성별" />
                    <Tab label="조직별" />
                    <Tab label="문항별" />
                  </Tabs>
                </Box>

                {/* 계급별 차트 */}
                {tabValue === 0 && (
                  <Box sx={{ height: 400 }}>
                    <Typography variant="h6" gutterBottom align="center">
                      계급별 평가 결과
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart
                        data={(() => {
                          // 함수 내부에서 직접 데이터 가공
                          if (!statistics || !statistics.gradeStatistics) return [];
                          
                          // 각 계급별 자가평가와 타인평가 점수 처리
                          const data = Object.entries(statistics.gradeStatistics)
                            .filter(([grade]) => grade !== '평균') // 평균 제외
                            .map(([grade, scores]) => ({
                              name: grade,
                              자가평가: scores.self,
                              타인평가: scores.others
                            }));
                          
                          // 평균 계산
                          const avgSelf = data.reduce((sum, item) => sum + item.자가평가, 0) / (data.length || 1);
                          const avgOthers = data.reduce((sum, item) => sum + item.타인평가, 0) / (data.length || 1);
                          
                          return [...data, {
                            name: '평균',
                            자가평가: Math.round(avgSelf * 100) / 100,
                            타인평가: Math.round(avgOthers * 100) / 100
                          }];
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="자가평가" fill="#8884d8">
                          <LabelList dataKey="자가평가" position="top" />
                        </Bar>
                        <Bar dataKey="타인평가" fill="#82ca9d">
                          <LabelList dataKey="타인평가" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}

                {/* 신분별 차트 */}
                {tabValue === 1 && (
                  <Box sx={{ height: 400 }}>
                    <Typography variant="h6" gutterBottom align="center">
                      신분별 평가 결과
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart
                        data={(() => {
                          // 함수 내부에서 직접 데이터 가공
                          if (!statistics || !statistics.personTypeStatistics) return [];
                          
                          // 각 신분별 자가평가와 타인평가 점수 처리
                          const data = Object.entries(statistics.personTypeStatistics)
                            .filter(([type]) => type !== '평균') // 평균 제외
                            .map(([type, scores]) => ({
                              name: type,
                              자가평가: scores.self,
                              타인평가: scores.others
                            }));
                          
                          // 평균 계산
                          const avgSelf = data.reduce((sum, item) => sum + item.자가평가, 0) / (data.length || 1);
                          const avgOthers = data.reduce((sum, item) => sum + item.타인평가, 0) / (data.length || 1);
                          
                          return [...data, {
                            name: '평균',
                            자가평가: Math.round(avgSelf * 100) / 100,
                            타인평가: Math.round(avgOthers * 100) / 100
                          }];
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="자가평가" fill="#8884d8">
                          <LabelList dataKey="자가평가" position="top" />
                        </Bar>
                        <Bar dataKey="타인평가" fill="#82ca9d">
                          <LabelList dataKey="타인평가" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}

                {/* 성별 차트 */}
                {tabValue === 2 && (
                  <Box sx={{ height: 400 }}>
                    <Typography variant="h6" gutterBottom align="center">
                      성별 평가 결과
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart
                        data={(() => {
                          // 함수 내부에서 직접 데이터 가공
                          if (!statistics || !statistics.sexStatistics) return [];
                          
                          // 성별(M/F)에 따른 자가평가와 타인평가 점수 처리
                          const data = Object.entries(statistics.sexStatistics)
                            .filter(([sex]) => sex !== '평균') // 평균 제외
                            .map(([sex, scores]) => ({
                              name: sex === 'M' ? '남성' : '여성',
                              자가평가: scores.self,
                              타인평가: scores.others
                            }));
                          
                          // 평균 계산
                          const avgSelf = data.reduce((sum, item) => sum + item.자가평가, 0) / (data.length || 1);
                          const avgOthers = data.reduce((sum, item) => sum + item.타인평가, 0) / (data.length || 1);
                          
                          return [...data, {
                            name: '평균',
                            자가평가: Math.round(avgSelf * 100) / 100,
                            타인평가: Math.round(avgOthers * 100) / 100
                          }];
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="자가평가" fill="#8884d8">
                          <LabelList dataKey="자가평가" position="top" />
                        </Bar>
                        <Bar dataKey="타인평가" fill="#82ca9d">
                          <LabelList dataKey="타인평가" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}

                {/* 조직별 차트 */}
                {tabValue === 3 && (
                  <Box sx={{ height: 400 }}>
                    <Typography variant="h6" gutterBottom align="center">
                      조직별 평가 결과
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart
                        data={(() => {
                          // 함수 내부에서 직접 데이터 가공
                          if (!statistics || !statistics.organizationStatistics) return [];
                          
                          // 조직별 자가평가와 타인평가 점수 처리
                          const data = Object.entries(statistics.organizationStatistics)
                            .filter(([org]) => org !== '평균') // 평균 제외
                            .map(([org, scores]) => ({
                              name: org,
                              자가평가: scores.self,
                              타인평가: scores.others
                            }));
                          
                          // 평균 계산
                          const avgSelf = data.reduce((sum, item) => sum + item.자가평가, 0) / (data.length || 1);
                          const avgOthers = data.reduce((sum, item) => sum + item.타인평가, 0) / (data.length || 1);
                          
                          return [...data, {
                            name: '평균',
                            자가평가: Math.round(avgSelf * 100) / 100,
                            타인평가: Math.round(avgOthers * 100) / 100
                          }];
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="자가평가" fill="#8884d8">
                          <LabelList dataKey="자가평가" position="top" />
                        </Bar>
                        <Bar dataKey="타인평가" fill="#82ca9d">
                          <LabelList dataKey="타인평가" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}

                {/* 문항별 차트 */}
                {tabValue === 4 && (
                  <Box sx={{ height: 400 }}>
                    <Typography variant="h6" gutterBottom align="center">
                      문항별 평가 결과
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart
                        data={(() => {
                          if (!statistics || !statistics.questionStatistics) return [];
                          
                          // 1. SELF와 OTHERS 타입별로 문항 분리
                          const selfQuestions: Record<string, number> = {};
                          const othersQuestions: Record<string, number> = {};
                          
                          Object.entries(statistics.questionStatistics).forEach(([questionId, scores]) => {
                            if (scores.self !== undefined) {
                              selfQuestions[questionId] = scores.self;
                            }
                            if (scores.others !== undefined) {
                              othersQuestions[questionId] = scores.others;
                            }
                          });
                          
                          // 2. 각 타입별로 questionId 기준 정렬
                          const sortedSelfQuestionIds = Object.keys(selfQuestions).sort((a, b) => parseInt(a) - parseInt(b));
                          const sortedOthersQuestionIds = Object.keys(othersQuestions).sort((a, b) => parseInt(a) - parseInt(b));
                          
                          // 3. 순서 기준으로 매칭하여 차트 데이터 생성
                          const chartData = [];
                          const maxLength = Math.max(sortedSelfQuestionIds.length, sortedOthersQuestionIds.length);
                          
                          for (let i = 0; i < maxLength; i++) {
                            const selfId = i < sortedSelfQuestionIds.length ? sortedSelfQuestionIds[i] : null;
                            const othersId = i < sortedOthersQuestionIds.length ? sortedOthersQuestionIds[i] : null;
                            
                            chartData.push({
                              name: `문항 ${i + 1}번`,
                              selfId: selfId,
                              othersId: othersId,
                              자가평가: selfId ? selfQuestions[selfId] : null,
                              타인평가: othersId ? othersQuestions[othersId] : null
                            });
                          }
                          
                          // 4. 평균 추가
                          const avgSelf = sortedSelfQuestionIds.length > 0 
                            ? sortedSelfQuestionIds.reduce((sum, qid) => sum + selfQuestions[qid], 0) / sortedSelfQuestionIds.length 
                            : 0;
                            
                          const avgOthers = sortedOthersQuestionIds.length > 0 
                            ? sortedOthersQuestionIds.reduce((sum, qid) => sum + othersQuestions[qid], 0) / sortedOthersQuestionIds.length 
                            : 0;
                          
                          chartData.push({
                            name: '평균',
                            selfId: null,
                            othersId: null,
                            자가평가: Math.round(avgSelf * 100) / 100,
                            타인평가: Math.round(avgOthers * 100) / 100
                          });
                          
                          return chartData;
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value, name, props) => value !== null ? value : '해당없음'} />
                        <Legend />
                        <Bar dataKey="자가평가" fill="#8884d8">
                          <LabelList dataKey="자가평가" position="top" formatter={(value) => value !== null ? value : ''} />
                        </Bar>
                        <Bar dataKey="타인평가" fill="#82ca9d">
                          <LabelList dataKey="타인평가" position="top" formatter={(value) => value !== null ? value : ''} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Statistics;