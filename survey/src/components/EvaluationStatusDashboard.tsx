import React, { useState, useEffect } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Collapse,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { ChevronDown, ChevronRight } from 'lucide-react';

// DepartmentStatus 인터페이스 수정
interface DepartmentStatus {
    departmentName: string;
    totalSelfEvaluators: number;
    totalOtherEvaluators: number;
    completedSelfEvaluations: number;
    completedOtherEvaluations: number;
    pendingSelfEvaluations: number;
    pendingOtherEvaluations: number;
    selfEvaluationRate: number;
    otherEvaluationRate: number;
}

// GroupStatus 인터페이스 수정
interface GroupStatus {
  groupName: string;
  totalSelfTargets: number;
  totalOtherTargets: number;
  completedSelf: number;
  completedOthers: number;
  selfEvaluationRate: number;
  otherEvaluationRate: number;
}

// PersonStatus 인터페이스 수정
interface PersonStatus {
  employeeNumber: string;
  personName: string;
  organizationName: string;
  jobName: string;
  gradeName: string;
  selfEvaluationTarget: boolean;
  otherEvaluationTarget: boolean;
  completedSelf: boolean;
  completedEvaluations: number;
  totalEvaluations: number;
}

interface EvaluationDetail {
  testedNumber: string;
  testedName: string;
  organization: string;
  position: string;
  grade: string;
  isCompleted: boolean;
}

// API 인터페이스 정의
interface Api {
  getDepartmentStatus: (departmentName: string) => Promise<DepartmentStatus>;
  getGroupStatus: (departmentName: string) => Promise<GroupStatus[]>;
  getPersonStatus: (organizationName: string) => Promise<PersonStatus[]>;
  getEvaluationDetail: (testerNumber: string) => Promise<EvaluationDetail[]>;
}

// API 구현
const api: Api = {
  getDepartmentStatus: async (departmentName: string) => {
    const response = await fetch(`/api/evaluation-status/department/${departmentName}`);
    return response.json();
  },
  getGroupStatus: async (departmentName: string) => {
    const response = await fetch(`/api/evaluation-status/group/${departmentName}`);
    return response.json();
  },
  getPersonStatus: async (organizationName: string) => {
    const response = await fetch(`/api/evaluation-status/person/${organizationName}`);
    return response.json();
  },
  getEvaluationDetail: async (testerNumber: string) => {
    const response = await fetch(`/api/evaluation-status/evaluation-detail/${testerNumber}`);
    return response.json();
  }
};


interface ExpandableRowProps<T> {
  initialData: T;
  onExpand: (data: T) => Promise<any[]>;
  columns: {
    key: string;
    label: string;
    render?: (value: any) => React.ReactNode;
  }[];
  expandedContent: React.FC<{ data: any[] }>;
}

const ExpandableRow = <T extends Record<string, any>>({ 
  initialData, 
  onExpand, 
  columns,
  expandedContent: ExpandedContent
}: ExpandableRowProps<T>) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedData, setExpandedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (!isExpanded && expandedData.length === 0) {
      setLoading(true);
      try {
        const data = await onExpand(initialData);
        setExpandedData(data);
      } catch (error) {
        console.error('Failed to load expanded data:', error);
      } finally {
        setLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <TableRow>
        {columns.map(({ key, render }) => (
          <TableCell key={key}>
            {render ? render(initialData[key]) : initialData[key]}
          </TableCell>
        ))}
        <TableCell>
          <Button
            onClick={handleExpand}
            startIcon={isExpanded ? <ChevronDown /> : <ChevronRight />}
          >
            상세보기
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={columns.length + 1} sx={{ p: 0 }}>
          <Collapse in={isExpanded}>
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <ExpandedContent data={expandedData} />
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// 평가 상세 테이블
const EvaluationTable: React.FC<{ data: EvaluationDetail[] }> = ({ data }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>평가대상자</TableCell>
          <TableCell>소속</TableCell>
          <TableCell>직책</TableCell>
          <TableCell>계급</TableCell>
          <TableCell>평가상태</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((evaluation, index) => (
          <TableRow key={index}>
            <TableCell>{evaluation.testedName}</TableCell>
            <TableCell>{evaluation.organization}</TableCell>
            <TableCell>{evaluation.position}</TableCell>
            <TableCell>{evaluation.grade}</TableCell>
            <TableCell>
              {evaluation.isCompleted ? '완료' : '미완료'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// 사람 목록 테이블
const PersonTable: React.FC<{ data: PersonStatus[] }> = ({ data }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>이름</TableCell>
          <TableCell>소속</TableCell>
          <TableCell>직책</TableCell>
          <TableCell>계급</TableCell>
          <TableCell>자가평가 상태</TableCell>
          <TableCell>타인평가 진행률</TableCell>
          <TableCell>작업</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((person) => (
          <ExpandableRow
            key={person.employeeNumber}
            initialData={person}
            columns={[
              { key: 'personName', label: '이름' },
              { key: 'organizationName', label: '소속' },
              { key: 'jobName', label: '직책' },
              { key: 'gradeName', label: '계급' },
              { 
                key: 'completedSelf', 
                label: '자가평가 상태',
                render: (value: boolean) => value ? '완료' : '미완료'
              },
              {
                key: 'otherEvaluationRate',
                label: '타인평가 진행률',
                render: (value: number) => `${value}%`
              }
            ]}
            onExpand={(person) => api.getEvaluationDetail(person.employeeNumber)}
            expandedContent={EvaluationTable}
          />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// 그룹 목록 테이블
const GroupTable: React.FC<{ data: GroupStatus[] }> = ({ data }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>그룹명</TableCell>
          <TableCell>자가평가 실시율</TableCell>
          <TableCell>타인평가 실시율</TableCell>
          <TableCell>작업</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((group) => (
          <ExpandableRow
            key={group.groupName}
            initialData={group}
            columns={[
              { key: 'groupName', label: '그룹명' },
              { 
                key: 'selfEvaluationRate', 
                label: '자가평가 실시율',
                render: (value: number) => `${value}%`
              },
              {
                key: 'otherEvaluationRate',
                label: '타인평가 실시율',
                render: (value: number) => `${value}%`
              }
            ]}
            onExpand={(group) => api.getPersonStatus(group.groupName)}
            expandedContent={PersonTable}
          />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const EvaluationStatusDashboard: React.FC = () => {
  const [departmentData, setDepartmentData] = useState<DepartmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await api.getDepartmentStatus('소스쿡 인천지부');
        setDepartmentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 에러가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">에러: {error}</Typography>;
  if (!departmentData) return null;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>부서명</TableCell>
            <TableCell>자가평가 실시율</TableCell>
            <TableCell>타인평가 실시율</TableCell>
            <TableCell>작업</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <ExpandableRow
            initialData={departmentData}
            columns={[
              { key: 'departmentName', label: '부서명' },
              { 
                key: 'selfEvaluationRate', 
                label: '자가평가 실시율',
                render: (value: number) => `${value}%`
              },
              {
                key: 'otherEvaluationRate',
                label: '타인평가 실시율',
                render: (value: number) => `${value}%`
              }
            ]}
            onExpand={(department) => api.getGroupStatus(department.departmentName)}
            expandedContent={GroupTable}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EvaluationStatusDashboard;
