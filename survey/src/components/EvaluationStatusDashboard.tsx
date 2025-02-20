import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, Collapse, Box, Typography, CircularProgress 
} from '@mui/material';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';

// Types
interface DepartmentStatus {
  departmentName: string;
  selfEvaluationRate: number;
  otherEvaluationRate: number;
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

// API Service
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

// Excel Download Button Component
const ExcelDownloadButton: React.FC<{ url: string; label: string }> = ({ url, label }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${label}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download Excel:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={<Download />}
      onClick={handleDownload}
      sx={{ mb: 2 }}
    >
      엑셀 다운로드
    </Button>
  );
};

// Evaluation Detail Table Component
const EvaluationTable: React.FC<{ data: EvaluationDetail[] }> = ({ data }) => (
  <Box sx={{ mt: 2 }}>
    <ExcelDownloadButton 
      url={`/api/excel/evaluation-detail/${data[0]?.testedNumber}`}
      label="평가상세"
    />
    <TableContainer component={Paper}>
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
          {data.map((detail, index) => (
            <TableRow key={index}>
              <TableCell>{detail.testedName}</TableCell>
              <TableCell>{detail.organization}</TableCell>
              <TableCell>{detail.position}</TableCell>
              <TableCell>{detail.grade}</TableCell>
              <TableCell>{detail.isCompleted ? '완료' : '미완료'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

// Expandable Row Component
interface ExpandableRowProps<T> {
  data: T;
  columns: { key: keyof T; label: string; render?: (value: any) => React.ReactNode }[];
  onExpand: (data: T) => Promise<any[]>;
  ExpandedComponent: React.FC<{ data: any[] }>;
}

const ExpandableRow = <T extends Record<string, any>>({ 
  data, 
  columns, 
  onExpand, 
  ExpandedComponent 
}: ExpandableRowProps<T>) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedData, setExpandedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (!isExpanded && expandedData.length === 0) {
      setLoading(true);
      try {
        const result = await onExpand(data);
        setExpandedData(result);
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
          <TableCell key={key as string}>
            {render ? render(data[key]) : data[key]}
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
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                expandedData.length > 0 && <ExpandedComponent data={expandedData} />
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// Main Dashboard Component
const EvaluationStatusDashboard: React.FC = () => {
  const [departmentData, setDepartmentData] = useState<DepartmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getDepartmentStatus('소스쿡 인천지부');
        setDepartmentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!departmentData) return null;

  return (
    <Box sx={{ p: 3 }}>
      <ExcelDownloadButton 
        url={`/api/excel/department/${departmentData.departmentName}`}
        label="부서현황"
      />
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
              data={departmentData}
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
              ExpandedComponent={GroupTable}
            />
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Group Table Component
const GroupTable: React.FC<{ data: GroupStatus[] }> = ({ data }) => (
  <Box>
    <ExcelDownloadButton 
      url={`/api/excel/group/${data[0]?.groupName}`}
      label="그룹현황"
    />
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
              data={group}
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
              ExpandedComponent={PersonTable}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

// Person Table Component
const PersonTable: React.FC<{ data: PersonStatus[] }> = ({ data }) => (
  <Box>
    <ExcelDownloadButton 
      url={`/api/excel/person/${data[0]?.organizationName}`}
      label="개인현황"
    />
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
              data={person}
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
              ExpandedComponent={EvaluationTable}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

export default EvaluationStatusDashboard;