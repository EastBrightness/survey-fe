import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  TextField
} from '@mui/material';

interface EmployeeData {
  id: number;
  employeeNumber: string;
  personName: string;
  type: string;
  organizationName: string;
  selfYn: boolean;
  othersTester: boolean;
  completedSelf: boolean;
  completedOthers: boolean;
}

interface TestedEmployee {
  tested: string;
  tester: string;
  personName: string;
  organizationName: string;
  jobName: string;
  isCompleted: boolean;
}

interface Answer {
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  answer5: string;
}

interface Question {
  id: number;
  periodId: number;
  category: string;
  content: string;
  targetYn: boolean;
  answers: Answer;
}

interface SurveyResponse {
  questionId: number;
  selectedAnswer: number;
  testedNumber: string;
  textAnswer?: string;  // Optional text answer field
}

const SurveyComponent: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [testedEmployees, setTestedEmployees] = useState<TestedEmployee[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [currentEvaluation, setCurrentEvaluation] = useState<'SELF' | 'OTHERS' | null>(null);
  const [currentTested, setCurrentTested] = useState<TestedEmployee | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const EMPLOYEE_NUMBER = '2018';
  const CURRENT_PERIOD = 1;

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/employees/only/${EMPLOYEE_NUMBER}`);
      if (!response.ok) throw new Error('직원 정보를 불러오는데 실패했습니다.');
      const data: EmployeeData = await response.json();
      setEmployeeData(data);

      // 타인평가자인 경우 평가 대상자 목록 조회
      if (data.othersTester) {
        await fetchTestedEmployees();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestedEmployees = async (): Promise<void> => {
    try {
      // 평가자에게 할당된 피평가자 목록 조회
      const response = await fetch(`/api/eval-assigns/tester/${EMPLOYEE_NUMBER}`);
      if (!response.ok) throw new Error('평가 대상자 목록을 불러오는데 실패했습니다.');
      const data = await response.json();

      // 각 피평가자의 상세 정보(이름, 부서, 직책)를 가져오는 로직 추가
      const testedEmployeesWithInfo = await Promise.all(
        data.map(async (tested: any) => {
          try {
            const employeeResponse = await fetch(`/api/employees/only/${tested.tested}`);
            if (!employeeResponse.ok) throw new Error(`피평가자 ${tested.tested} 정보를 불러오는데 실패했습니다.`);
            const employeeData: EmployeeData = await employeeResponse.json();
            return {
              ...tested,
              personName: employeeData.personName,
              organizationName: employeeData.organizationName,
              jobName: employeeData.type, //jobName이 없어서 type으로 대체
              isCompleted: tested.isCompleted // EvalAssign에서 가져온 isCompleted 값 사용
            };
          } catch (err) {
            setError(err instanceof Error ? err.message : '피평가자 정보 로딩 실패');
            return tested; // 에러 발생 시 기존 정보 유지
          }
        })
      );

      setTestedEmployees(testedEmployeesWithInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : '평가 대상자 목록을 불러오는데 실패했습니다.');
    }
  };

  const fetchQuestions = async (type: 'SELF' | 'OTHERS', tested?: TestedEmployee): Promise<void> => {
    try {
      const response = await fetch(
        `/api/survey/questions?periodId=${CURRENT_PERIOD}&evaluationType=${type}`
      );
      if (!response.ok) throw new Error('설문 문항을 불러오는데 실패했습니다.');
      const data: Question[] = await response.json();
      setQuestions(data);
      setCurrentEvaluation(type);
      setCurrentTested(tested || null);
      setResponses({});
    } catch (err) {
      setError(err instanceof Error ? err.message : '설문 문항을 불러오는데 실패했습니다.');
    }
  };

  const handleResponseChange = (questionId: number, value: string): void => {
    setResponses(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    // Validate all questions are answered
    const unansweredQuestions = questions.some(q => !responses[q.id]);
    if (unansweredQuestions) {
      setError('아직 선택하지 않은 문항이 있습니다.');
      return;
    }

    try {
      const submissionData = {
        responses: Object.entries(responses).map(([questionId, answer]) => ({
          questionId: parseInt(questionId),
          selectedAnswer: parseInt(answer),
          testedNumber: currentTested?.tested,
          textAnswer: currentEvaluation === 'OTHERS' ? textAnswer : undefined
        })),
        evaluationType: currentEvaluation
      };

      const response = await fetch(
        `/api/survey/submit?respondentNumber=${EMPLOYEE_NUMBER}&periodId=${CURRENT_PERIOD}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData)
        }
      );

      if (!response.ok) throw new Error('설문 제출에 실패했습니다.');

      // 타인평가 완료 후 EvalAssign 상태 업데이트
      if (currentEvaluation === 'OTHERS' && currentTested) {
        await updateEvalAssignStatus(currentTested.tested, true);
      }

      setMessage('설문이 성공적으로 제출되었습니다.');
      await fetchEmployeeData();
      resetSurvey();
    } catch (err) {
      setError(err instanceof Error ? err.message : '설문 제출에 실패했습니다.');
    }
  };

  // EvalAssign 상태 업데이트 함수 추가
  const updateEvalAssignStatus = async (testedNumber: string, isCompleted: boolean): Promise<void> => {
    try {
      const response = await fetch(
        `/api/eval-assigns/${EMPLOYEE_NUMBER}/${testedNumber}?isCompleted=${isCompleted}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) throw new Error('평가 상태 업데이트에 실패했습니다.');
    } catch (err) {
      console.error('평가 상태 업데이트 오류:', err);
      // 여기서는 사용자에게 오류를 표시하지 않고 콘솔에만 기록
    }
  };

  const resetSurvey = (): void => {
    setCurrentEvaluation(null);
    setCurrentTested(null);
    setResponses({});
    setQuestions([]);
    setTextAnswer('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 6 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          직원 역량 평가
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {message && (
          <Alert severity="success" sx={{ mb: 4 }}>
            {message}
          </Alert>
        )}

        {!currentEvaluation && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 자가평가 섹션 - 완료 여부에 따라 다른 UI 표시 */}
            {employeeData?.selfYn && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    자가평가
                  </Typography>
                  <Typography color="textSecondary">
                    자신의 역량에 대한 평가를 진행합니다.
                  </Typography>
                </CardContent>
                <CardActions>
                  {employeeData.completedSelf ? (
                    <Typography 
                      color="success.main" 
                      sx={{ 
                        ml: 1,
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}
                    >
                      실시 완료
                    </Typography>
                  ) : (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => fetchQuestions('SELF')}
                    >
                      자가평가 실시하기
                    </Button>
                  )}
                </CardActions>
              </Card>
            )}

            {/* 타인평가 섹션 */}
            {employeeData?.othersTester && testedEmployees.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  타인평가 대상자 목록
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {testedEmployees.map((tested) => (
                    <Card key={tested.tested} variant="outlined">
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {tested.personName}
                        </Typography>
                        <Typography color="textSecondary">
                          {tested.organizationName}
                        </Typography>
                        <Typography color="textSecondary">
                          {tested.jobName}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        {tested.isCompleted ? (
                          <Typography 
                            color="success.main" 
                            sx={{ 
                              ml: 1,
                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}
                          >
                            평가 완료
                          </Typography>
                        ) : (
                          <Button
                            size="small"
                            color="primary"
                            onClick={() => fetchQuestions('OTHERS', tested)}
                          >
                            평가 실시하기
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            {/* 모든 평가 완료 시 메시지 */}
            {(employeeData?.completedSelf && 
              (!employeeData?.othersTester || 
                (testedEmployees.length > 0 && 
                  testedEmployees.every(t => t.isCompleted)))) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                모든 평가가 완료되었습니다.
              </Alert>
            )}
          </Box>
        )}

        {currentEvaluation && questions.length > 0 && (
          <Box sx={{ mt: 4 }}>
            {currentTested && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6">
                  평가 대상: {currentTested.personName}
                </Typography>
                <Typography color="textSecondary">
                  {currentTested.organizationName} / {currentTested.jobName}
                </Typography>
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            {questions.map((question) => (
              <FormControl key={question.id} component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel component="legend">
                  {question.content}
                </FormLabel>
                <RadioGroup
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <FormControlLabel
                      key={num}
                      value={num.toString()}
                      control={<Radio />}
                      label={question.answers[`answer${num}` as keyof Answer]}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            ))}

            {currentEvaluation === 'OTHERS' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <FormLabel>피평가자에 대한 의견을 자유롭게 작성해주세요</FormLabel>
                <TextField
                  multiline
                  rows={4}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </FormControl>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                onClick={resetSurvey}
              >
                취소
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
              >
                답변 전송
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SurveyComponent;