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
  createTheme,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Dialog,
  DialogActions,
  TextField,
  IconButton
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
import { PersonStandingIcon } from 'lucide-react';
import { Assessment, ListAlt, Person } from '@mui/icons-material';

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

interface Employee {
  employeeNumber: string;
  personName: string;
  organizationName: string;
  jobName: string;
  displayText: string;
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

// 조회 모드 타입
type ViewMode = 'statistics' | 'excelDownload' | 'personalSearch';

const Statistics: React.FC = () => {
  // 상태 관리
  const [years, setYears] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationPeriod[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('statistics');
  const [tabValue, setTabValue] = useState<number>(0);
  
  // 직원 검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [foundEmployees, setFoundEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

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

  // 대상 조직 목록 조회
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

  // 이름으로 직원 검색
  const searchEmployeeByName = async () => {
    if (!searchKeyword || searchKeyword.length < 2) {
      setError('검색어는 2글자 이상 입력해주세요.');
      return;
    }
    
    if (!filterParams.year || !filterParams.evaluationName) {
      setError('평가연도와 평가명(차수)를 먼저 선택해주세요.');
      return;
    }
    
    setSearchLoading(true);
    setError(null);
    
    try {
      // URL에 평가연도와, 평가명 파라미터 추가
      const response = await fetch(
        `/api/statistics/search-employee?name=${encodeURIComponent(searchKeyword)}&year=${encodeURIComponent(filterParams.year)}&evaluationName=${encodeURIComponent(filterParams.evaluationName)}`
      );
      
      if (!response.ok) {
        throw new Error('직원 검색 중 오류가 발생했습니다.');
      }
      
      const data: Employee[] = await response.json();
      setFoundEmployees(data);
      
      if (data.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('직원 검색 오류:', error);
      setError('직원 검색 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

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

  // 엑셀 다운로드
  const downloadExcel = async () => {
    try {
      setLoading(true);
      setError(null);
      
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

  // 개인별 엑셀 다운로드 - 평가회차 필터 적용
const downloadExcelByEmployee = async () => {
  if (!selectedEmployee) {
    setError('직원을 먼저 선택해주세요.');
    return;
  }
  
  if (!filterParams.year || !filterParams.evaluationName) {
    setError('평가연도와 평가명(차수)를 먼저 선택해주세요.');
    return;
  }
  
  try {
    setLoading(true);
    setError(null);
    
    // 요청 본문에 평가 회차 정보 추가
    const response = await fetch('/api/statistics/export-excel-by-employee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        employeeNumber: selectedEmployee.employeeNumber,
        year: filterParams.year,
        evaluationName: filterParams.evaluationName 
      }),
    });
    
    if (!response.ok) {
      throw new Error('엑셀 파일 다운로드 중 오류가 발생했습니다');
    }
    
    const blob = await response.blob();
    
    // 다운로드 처리
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${selectedEmployee.personName}_${filterParams.year}_${filterParams.evaluationName}_statistics.xlsx`;
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

  const handleChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFilterParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatistics();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEmployeeSelect = (employee: Employee | null) => {
    setSelectedEmployee(employee);
  };

  // 검색 키워드 변경 핸들러
  const handleSearchKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
    
    // 입력이 지워지면 검색 결과도 초기화
    if (!e.target.value) {
      setFoundEmployees([]);
    }
  };

  // 키 입력 이벤트 핸들러 (엔터 키 처리)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchEmployeeByName();
    }
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

  // 모드 전환 핸들러 수정 - 상태 초기화 기능 추가
  const handleViewModeChange = (newMode: ViewMode) => {
    // 다른 모드로 전환 시 검색 결과 및 선택된 직원 초기화
    if (viewMode !== newMode) {
      if (newMode !== 'personalSearch') {
        setFoundEmployees([]);
        setSelectedEmployee(null);
        setSearchKeyword('');
      }
      setError(null);
      setViewMode(newMode);
    }
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
          {/* 모드 선택 버튼 그룹 */}
          <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
            
          // 모드 버튼에 핸들러 적용
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant={viewMode === 'statistics' ? 'contained' : 'outlined'}
                onClick={() => handleViewModeChange('statistics')}
                startIcon={<Assessment />}
              >
                종합 분석 조회
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant={viewMode === 'excelDownload' ? 'contained' : 'outlined'}
                onClick={() => handleViewModeChange('excelDownload')}
                startIcon={<ListAlt />}
              >
                일괄 엑셀 다운로드
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant={viewMode === 'personalSearch' ? 'contained' : 'outlined'}
                onClick={() => handleViewModeChange('personalSearch')}
                startIcon={<Person />}
              >
                개인별 조회/다운로드
              </Button>
            </Grid>
          </Grid>
          </Paper>

          {/* 개인별 조회 모드 */}
          {viewMode === 'personalSearch' && (
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                개인별 검색 및 다운로드
              </Typography>
              <Grid container spacing={2} alignItems="center">
                {/* 평가연도 선택 */}
                <Grid item xs={12} sm={6} md={4}>
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
                <Grid item xs={12} sm={6} md={4}>
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

                <Grid item xs={12} sm={12} md={4}>
                  <FormControl fullWidth>
                    <TextField
                      label="직원 이름 검색"
                      value={searchKeyword}
                      onChange={handleSearchKeywordChange}
                      onKeyDown={handleKeyDown}
                      placeholder="이름을 2글자 이상 입력하세요"
                      InputProps={{
                        endAdornment: (
                          <Button
                            onClick={searchEmployeeByName}
                            disabled={searchLoading || !filterParams.year || !filterParams.evaluationName}
                            sx={{ minWidth: 'auto', p: 1 }}
                            variant="contained"
                            color="primary"
                          >
                            {searchLoading ? <CircularProgress size={20} /> : '검색'}
                          </Button>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>

                {foundEmployees.length > 0 && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="employee-select-label">검색된 직원 선택</InputLabel>
                      <Select
                        labelId="employee-select-label"
                        value={selectedEmployee ? selectedEmployee.employeeNumber : ''}
                        onChange={(e) => {
                          const empNumber = e.target.value;
                          const selected = foundEmployees.find(emp => emp.employeeNumber === empNumber) || null;
                          handleEmployeeSelect(selected);
                        }}
                        label="검색된 직원 선택"
                      >
                        {foundEmployees.map((employee) => (
                          <MenuItem key={employee.employeeNumber} value={employee.employeeNumber}>
                            {employee.organizationName} | {employee.jobName} | {employee.personName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {selectedEmployee && (
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body1">
                        <strong>선택된 직원:</strong> {selectedEmployee.organizationName} | {selectedEmployee.jobName} | {selectedEmployee.personName}
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {filterParams.year}년 {filterParams.evaluationName} 평가 결과
                        </Typography>
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={downloadExcelByEmployee}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
                      >
                        엑셀 다운로드
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}
          
          {/* 일반 필터 영역 - 개인별 조회 모드가 아닐 때만 표시 */}
          {viewMode !== 'personalSearch' && (
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Box component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" gutterBottom>
                  평가결과 {viewMode === 'statistics' ? '종합 분석 조회' : '일괄 엑셀 다운로드'}
                </Typography>
                
                <Grid container spacing={2} alignItems="center">
                  {/* 평가연도 선택 */}
                  <Grid item xs={12} sm={6} md={4}>
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
                  <Grid item xs={12} sm={6} md={4}>
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
                  <Grid item xs={12} sm={6} md={4}>
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
                  {viewMode === 'excelDownload' && (
                    <>
                      {/* 신분 선택 */}
                      <Grid item xs={12} sm={6} md={4}>
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
                      <Grid item xs={12} sm={6} md={4}>
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
                      <Grid item xs={12} sm={6} md={4}>
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
                  
                  {/* 조회 버튼 - 분석 모드일 때만 */}
                  {viewMode === 'statistics' && (
                    <Grid item xs={12} sm={6} md={6}>
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
                  )}
                  
                  {/* 엑셀 다운로드 버튼 - 엑셀 모드일 때만 */}
                  {viewMode === 'excelDownload' && (
                    <Grid item xs={12} sm={6} md={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        onClick={downloadExcel}
                        disabled={!filterParams.year || !filterParams.evaluationName || loading}
                        startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <FileDownloadIcon />}
                      >
                        엑셀 다운로드
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
          )}

          {error && (
            <Box sx={{ color: 'error.main', my: 2 }}>
              {error}
            </Box>
          )}
          
          {/* 통계 결과 영역 - 종합 분석 모드일 때만 */}
          {viewMode === 'statistics' && statistics && !loading && (
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
                        data={prepareQuestionData()}
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