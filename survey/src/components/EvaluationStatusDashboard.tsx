import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Box,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import { 
  ChevronRight,
  Groups,
  PersonOutline,
  Assessment,
  ArrowBack
} from '@mui/icons-material';
// types.ts
interface DepartmentStatus {
    departmentName: string;
    selfEvaluationRate: number;
    selfEvaluationRemainRate: number;
    otherEvaluationRate: number;
    otherEvaluationRemainRate: number;
  }
  
  interface GroupStatus {
    groupName: string;
    selfEvaluationRate: number;
    otherEvaluationRate: number;
  }
  
  interface PersonStatus {
    employeeNumber: string;
    personName: string;
    organizationName: string;
    jobName: string;
    gradeName: string;
    selfEvaluationTarget: boolean;
    otherEvaluationTarget: boolean;
    completedSelf: boolean;
    otherEvaluationRate: number;
  }
  
  interface EvaluationDetail {
    testedNumber: string;
    testedName: string;
    organization: string;
    position: string;
    grade: string;
    isCompleted: boolean;
  }
  
  // api.ts
  const api = {
    getDepartmentStatus: async (departmentName: string): Promise<DepartmentStatus> => {
      const response = await fetch(`/api/evaluation-status/department/${departmentName}`);
      return response.json();
    },
    
    getGroupStatus: async (departmentName: string): Promise<GroupStatus[]> => {
      const response = await fetch(`/api/evaluation-status/group/${departmentName}`);
      return response.json();
    },
    
    getPersonStatus: async (organizationName: string): Promise<PersonStatus[]> => {
      const response = await fetch(`/api/evaluation-status/person/${organizationName}`);
      return response.json();
    },
    
    getEvaluationDetail: async (testerNumber: string): Promise<EvaluationDetail[]> => {
      const response = await fetch(`/api/evaluation-status/evaluation-detail/${testerNumber}`);
      return response.json();
    }
  };
  
  // components/DepartmentView.tsx
  interface DepartmentViewProps {
    data: DepartmentStatus;
    onSelect: (data: DepartmentStatus) => void;
  }
  
  const DepartmentView: React.FC<DepartmentViewProps> = ({ data, onSelect }) => (
    <Card elevation={3}>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{data.departmentName}</Typography>
            <Groups />
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle1" gutterBottom>자가평가</Typography>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography color="textSecondary">실시율</Typography>
                <Typography color="success.main">{data.selfEvaluationRate}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography color="textSecondary">미실시율</Typography>
                <Typography color="error.main">{data.selfEvaluationRemainRate}%</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle1" gutterBottom>타인평가</Typography>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography color="textSecondary">실시율</Typography>
                <Typography color="success.main">{data.otherEvaluationRate}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography color="textSecondary">미실시율</Typography>
                <Typography color="error.main">{data.otherEvaluationRemainRate}%</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        <Button 
          variant="contained" 
          fullWidth 
          endIcon={<ChevronRight />}
          onClick={() => onSelect(data)}
          sx={{ mt: 2 }}
        >
          상세보기
        </Button>
      </CardContent>
    </Card>
  );
  
  // components/GroupView.tsx
  interface GroupViewProps {
    data: GroupStatus;
    onSelect: (data: GroupStatus) => void;
  }
  
  const GroupView: React.FC<GroupViewProps> = ({ data, onSelect }) => (
    <Card elevation={3}>
    <CardHeader 
      title={
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{data.groupName}</Typography>
          <PersonOutline />
        </Box>
      }
    />
    <CardContent>
      <List>
        <ListItem>
          <ListItemText 
            primary="자가평가 실시율"
            secondary={
              <Typography color="success.main">{data.selfEvaluationRate}%</Typography>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="타인평가 실시율"
            secondary={
              <Typography color="success.main">{data.otherEvaluationRate}%</Typography>
            }
          />
        </ListItem>
      </List>
      <Button 
        variant="contained" 
        fullWidth 
        endIcon={<ChevronRight />}
        onClick={() => onSelect(data)}
        sx={{ mt: 2 }}
      >
        상세보기
      </Button>
    </CardContent>
  </Card>
  );
  
  // components/PersonView.tsx
  interface PersonViewProps {
    data: PersonStatus;
    onSelect: (data: PersonStatus) => void;
  }
  
  const PersonView: React.FC<PersonViewProps> = ({ data, onSelect }) => (
    <Card elevation={3}>
      <CardHeader 
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{data.personName}</Typography>
            <Assessment />
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box mb={2}>
              <Typography color="textSecondary">소속</Typography>
              <Typography>{data.organizationName}</Typography>
            </Box>
            <Box mb={2}>
              <Typography color="textSecondary">직책</Typography>
              <Typography>{data.jobName}</Typography>
            </Box>
            <Box mb={2}>
              <Typography color="textSecondary">계급</Typography>
              <Typography>{data.gradeName}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Divider />
            <List>
              <ListItem>
                <ListItemText 
                  primary="자가평가 대상"
                  secondary={data.selfEvaluationTarget ? "대상" : "비대상"}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="타인평가 대상"
                  secondary={data.otherEvaluationTarget ? "대상" : "비대상"}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="자가평가 상태"
                  secondary={
                    <Typography 
                      color={data.completedSelf ? "success.main" : "error.main"}
                    >
                      {data.completedSelf ? "완료" : "미완료"}
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="타인평가 진행률"
                  secondary={`${data.otherEvaluationRate}%`}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
        <Button 
          variant="contained" 
          fullWidth 
          endIcon={<ChevronRight />}
          onClick={() => onSelect(data)}
          sx={{ mt: 2 }}
        >
          평가 현황 보기
        </Button>
      </CardContent>
    </Card>
  );
  
  // components/EvaluationView.tsx
  interface EvaluationViewProps {
    data: EvaluationDetail[];
  }
  
  const EvaluationView: React.FC<EvaluationViewProps> = ({ data }) => (
    <Paper elevation={3}>
      <Box p={3}>
        <Typography variant="h6" gutterBottom>타인평가 진행현황</Typography>
        <List>
          {data.map((evaluation, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={
                  <Typography variant="subtitle1">{evaluation.testedName}</Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {evaluation.organization} | {evaluation.position} | {evaluation.grade}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={evaluation.isCompleted ? "success.main" : "error.main"}
                    >
                      {evaluation.isCompleted ? "완료" : "미완료"}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
  
  // EvaluationStatusDashboard.tsx
  type ViewType = 'department' | 'group' | 'person' | 'evaluation';
  
  const EvaluationStatusDashboard: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>('department');
    const [departmentData, setDepartmentData] = useState<DepartmentStatus | null>(null);
    const [groupData, setGroupData] = useState<GroupStatus[]>([]);
    const [personData, setPersonData] = useState<PersonStatus[]>([]);
    const [evaluationData, setEvaluationData] = useState<EvaluationDetail[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<DepartmentStatus | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<GroupStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
  
    const loadDepartmentData = async (departmentName: string): Promise<void> => {
      try {
        setLoading(true);
        const data = await api.getDepartmentStatus(departmentName);
        setDepartmentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 에러가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
  
    const loadGroupData = async (departmentName: string): Promise<void> => {
      try {
        setLoading(true);
        const data = await api.getGroupStatus(departmentName);
        setGroupData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 에러가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
  
    const loadPersonData = async (organizationName: string): Promise<void> => {
      try {
        setLoading(true);
        const data = await api.getPersonStatus(organizationName);
        setPersonData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 에러가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
  
    const loadEvaluationData = async (testerNumber: string): Promise<void> => {
      try {
        setLoading(true);
        const data = await api.getEvaluationDetail(testerNumber);
        setEvaluationData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 에러가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
  
    const handleDepartmentSelect = (department: DepartmentStatus): void => {
      setSelectedDepartment(department);
      setCurrentView('group');
      loadGroupData(department.departmentName);
    };
  
    const handleGroupSelect = (group: GroupStatus): void => {
      setSelectedGroup(group);
      setCurrentView('person');
      loadPersonData(group.groupName);
    };
  
    const handlePersonSelect = (person: PersonStatus): void => {
      setCurrentView('evaluation');
      loadEvaluationData(person.employeeNumber);
    };
  
    const handleBack = (): void => {
      switch (currentView) {
        case 'group':
          setCurrentView('department');
          setSelectedDepartment(null);
          break;
        case 'person':
          setCurrentView('group');
          setSelectedGroup(null);
          break;
        case 'evaluation':
          setCurrentView('person');
          break;
      }
    };
  
    useEffect(() => {
      loadDepartmentData('소스쿡 인천지부');
    }, []);
  
    if (loading) return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  
    if (error) return (
      <Box p={3}>
        <Typography color="error">에러: {error}</Typography>
      </Box>
    );
  
    return (
      <Box p={3}>
        {currentView !== 'department' && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ mb: 3 }}
          >
            뒤로가기
          </Button>
        )}
  
        <Grid container spacing={3}>
          {currentView === 'department' && departmentData && (
            <Grid item xs={12} md={6} lg={4}>
              <DepartmentView 
                data={departmentData} 
                onSelect={handleDepartmentSelect} 
              />
            </Grid>
          )}
  
          {currentView === 'group' && groupData.map(group => (
            <Grid item xs={12} md={6} lg={4} key={group.groupName}>
              <GroupView 
                data={group} 
                onSelect={handleGroupSelect} 
              />
            </Grid>
          ))}
  
          {currentView === 'person' && personData.map(person => (
            <Grid item xs={12} md={6} lg={4} key={person.employeeNumber}>
              <PersonView 
                data={person} 
                onSelect={handlePersonSelect} 
              />
            </Grid>
          ))}
  
          {currentView === 'evaluation' && (
            <Grid item xs={12}>
              <EvaluationView data={evaluationData} />
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };
  
  export default EvaluationStatusDashboard;