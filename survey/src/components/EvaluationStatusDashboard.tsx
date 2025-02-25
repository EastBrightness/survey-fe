import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Grid,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowRight,
  Download,
  CheckCircle,
  Cancel,
  Info
} from '@mui/icons-material';

// Updated DepartmentStatus interface
interface DepartmentStatus {
  departmentName: string;
  selfEvaluationRate: number;
  selfEvaluationRemainRate: number;
  otherEvaluationRate: number;
  otherEvaluationRemainRate: number;
  totalSelfCount: number;
  completedSelfCount: number;
  remainingSelfCount: number;
  totalOthersCount: number;
  completedOthersCount: number;
  remainingOthersCount: number;
}

// Other interfaces remain the same
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

// API Service with the same methods
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
    const response = await fetch(`${testerNumber}`);
    return response.json();
  }
};

// Reusable progress component
const EvaluationProgressBar = ({ 
  completed, 
  total, 
  label, 
  color = 'primary' 
}: { 
  completed: number; 
  total: number; 
  label: string;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2">
          {completed}/{total} ({percentage}%)
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        color={color}
        sx={{ height: 10, borderRadius: 5 }}
      />
    </Box>
  );
};

// Excel Download Button Component (unchanged)
const ExcelDownloadButton = ({ url, label }: { url: string; label: string }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      
      // Content-Disposition 헤더에서 파일명 추출
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${label}.cell`;  // 기본 파일명
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download Excel:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  return (
    <Button
      variant="outlined"
      onClick={handleDownload}
      startIcon={<Download />}
      sx={{ mb: 2 }}
    >
      엑셀 다운로드
    </Button>
  );
};

// Expandable Row Component (unchanged)
interface ExpandableRowProps<T> {
  data: T;
  columns: { key: keyof T; label: string; render?: (value: any) => React.ReactNode }[];
  onExpand: (data: T) => Promise<any[]>;
  ExpandedComponent: React.FC<{ data: any[]; parentData: T }>;
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
          <IconButton size="small" onClick={handleExpand}>
            {isExpanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
          </IconButton>
          <Button variant="text" onClick={handleExpand}>
            상세보기
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={columns.length + 1}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, backgroundColor: '#f8f9fa', padding: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                expandedData.length > 0 && <ExpandedComponent data={expandedData} parentData={data} />
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// Evaluation Detail Table Component (unchanged)
const EvaluationTable: React.FC<{ data: EvaluationDetail[]; parentData: PersonStatus }> = ({ data, parentData }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <ExcelDownloadButton 
        url={`/api/excel/evaluation-detail/${parentData.employeeNumber}`}
        label="평가상세"
      />
    </Box>
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
  </Box>
);

// Person Table Component (unchanged)
const PersonTable: React.FC<{ data: PersonStatus[]; parentData: GroupStatus }> = ({ data, parentData }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <ExcelDownloadButton 
        url={`/api/excel/person/${parentData.groupName}`}
        label="개인현황"
      />
    </Box>
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
  </Box>
);

// Group Table Component (unchanged)
const GroupTable: React.FC<{ data: GroupStatus[]; parentData: DepartmentStatus }> = ({ data, parentData }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <ExcelDownloadButton 
        url={`/api/excel/group/${parentData.departmentName}`}
        label="그룹현황"
      />
    </Box>
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
  </Box>
);

// New Dashboard Summary Component
const DepartmentSummary: React.FC<{ data: DepartmentStatus }> = ({ data }) => (
  <Card sx={{ mb: 3, p: 2 }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      {data.departmentName} 평가 현황 요약
      <Tooltip title="이 데이터는 해당 부서 및 모든 하위 부서를 포함한 정보입니다">
        <IconButton size="small">
          <Info fontSize="small" />
        </IconButton>
      </Tooltip>
    </Typography>
    
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, height: '100%' }}>
          <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <CheckCircle color="primary" sx={{ mr: 1 }} />
            자가평가 현황
          </Typography>
          
          <EvaluationProgressBar 
            completed={data.completedSelfCount} 
            total={data.totalSelfCount} 
            label="자가평가 완료율" 
            color="primary"
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">전체 대상자</Typography>
              <Typography variant="h6">{data.totalSelfCount}명</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">완료</Typography>
              <Typography variant="h6" color="primary">{data.completedSelfCount}명</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">미완료</Typography>
              <Typography variant="h6" color="error">{data.remainingSelfCount}명</Typography>
            </Box>
          </Box>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, height: '100%' }}>
          <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <CheckCircle color="secondary" sx={{ mr: 1 }} />
            타인평가 현황
          </Typography>
          
          <EvaluationProgressBar 
            completed={data.completedOthersCount} 
            total={data.totalOthersCount} 
            label="타인평가 완료율" 
            color="secondary"
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">전체 건수</Typography>
              <Typography variant="h6">{data.totalOthersCount}건</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">완료</Typography>
              <Typography variant="h6" color="secondary">{data.completedOthersCount}건</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">미완료</Typography>
              <Typography variant="h6" color="error">{data.remainingOthersCount}건</Typography>
            </Box>
          </Box>
        </Box>
      </Grid>
    </Grid>
  </Card>
);

// Updated Main Dashboard Component
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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '64vh' }}>
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Typography color="error" sx={{ p: 2 }}>{error}</Typography>
  );
  
  if (!departmentData) return null;

  return (
    <Card>
      <CardContent>
        {/* New Summary Section */}
        <DepartmentSummary data={departmentData} />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ExcelDownloadButton 
            url={`/api/excel/department/${departmentData.departmentName}`}
            label="부서현황"
          />
        </Box>
        
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          하위 부서별 현황
        </Typography>
        
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
      </CardContent>
    </Card>
  );
};

export default EvaluationStatusDashboard;