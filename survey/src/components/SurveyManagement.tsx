import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { Download, Mail } from '@mui/icons-material';

interface Organization {
  id: number;
  orgName: string;
  fullName: string;
  oCode: string;
  upCode: string;
  employeeCount: number;
  isDeleted: boolean;
}

interface Employee {
  id: number;
  employeeNumber: string;
  personName: string;
  type: string;
  organizationName: string;
  gradeName: string;
  repGradeName: string;
  jobName: string;
  jobDate: string;
  isDeleted: boolean;
  selfYn: boolean;
  othersTested: boolean;
  othersTester: boolean;
  completedSelf: boolean;
  completedOthers: boolean;
  workingMonths: number;
}



const SurveyManagement = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selfMessage, setSelfMessage] = useState('');
  const [othersMessage, setOthersMessage] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [globalSelfMessage, setGlobalSelfMessage] = useState('');
  const [globalOthersMessage, setGlobalOthersMessage] = useState('');
  const [incompleteCount, setIncompleteCount] = useState({ self: 0, others: 0 });


  useEffect(() => {
    fetchOrganizations();
    fetchIncompleteCount();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/control/organizations');
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      showNotification('Failed to fetch organizations', 'error');
    }
  };

  const fetchEmployees = async () => {
    if (!selectedOrg) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${selectedOrg}`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      showNotification('Failed to fetch employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    if (employees.length === 0) return;
    
    try {
      const response = await fetch(`/api/export/${selectedOrg}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_status_${selectedOrg}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showNotification('Failed to download Excel file', 'error');
    }
  };

  const sendEmails = async (type:string) => {
    const message = type === 'self' ? selfMessage : othersMessage;
    if (!message) {
      showNotification('Please enter a message', 'error');
      return;
    }

    try {
      const response = await fetch('/api/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: selectedOrg,
          message,
          type,
        }),
      });
      
      if (response.ok) {
        showNotification(`Emails sent successfully to incomplete ${type} evaluations`, 'success');
        if (type === 'self') setSelfMessage('');
        else setOthersMessage('');
      }
    } catch (error) {
      showNotification('Failed to send emails', 'error');
    }
  };

  const showNotification = (message:string, type:string) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const fetchIncompleteCount = async () => {
    try {
      const response = await fetch('/api/incomplete-count');
      const data = await response.json();
      setIncompleteCount(data);
    } catch (error) {
      showNotification('Failed to fetch incomplete counts', 'error');
    }
  };

  
  const sendGlobalEmails = async (type:string) => {
    const message = type === 'self' ? globalSelfMessage : globalOthersMessage;
    if (!message) {
      showNotification('Please enter a message', 'error');
      return;
    }

    try {
      const response = await fetch('/api/send-global-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          type,
        }),
      });
      
      if (response.ok) {
        showNotification(`Emails sent successfully to all incomplete ${type} evaluations`, 'success');
        if (type === 'self') setGlobalSelfMessage('');
        else setGlobalOthersMessage('');
        fetchIncompleteCount(); // 카운트 갱신
      }
    } catch (error) {
      showNotification('Failed to send emails', 'error');
    }
  };



  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardHeader title="설문 관리 대시보드" />
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    displayEmpty
                    sx={{ width: 240 }}
                  >
                    <MenuItem value="">Select Organization</MenuItem>
                    {organizations.map((org) => (
                      <MenuItem key={org.id} value={org.id}>{org.orgName}</MenuItem>
                    ))}
                  </Select>
                  <Button 
                    variant="contained"
                    onClick={fetchEmployees}
                    disabled={!selectedOrg || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={downloadExcel}
                    disabled={employees.length === 0}
                    startIcon={<Download />}
                  >
                    Download Excel
                  </Button>
                </Box>

                {employees.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>사원번호.</TableCell>
                            <TableCell>이름</TableCell>
                            <TableCell>부서</TableCell>
                            <TableCell>자가평가 실시여부</TableCell>
                            <TableCell>타인평가 실시여부</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {employees.map((emp) => (
                            <TableRow key={emp.id}>
                              <TableCell>{emp.employeeNumber}</TableCell>
                              <TableCell>{emp.personName}</TableCell>
                              <TableCell>{emp.organizationName}</TableCell>
                              <TableCell>{emp.completedSelf ? '완료' : '미완료'}</TableCell>
                              <TableCell>{emp.completedOthers ? '완료' : '미완료'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>자가평가 미실시자 알림메일</Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          value={selfMessage}
                          onChange={(e) => setSelfMessage(e.target.value)}
                          placeholder="Enter message for incomplete self evaluations"
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          onClick={() => sendEmails('self')}
                          disabled={!selfMessage}
                          startIcon={<Mail />}
                        >
                          Send
                        </Button>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>타인평가 미실시자 알림메일</Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          value={othersMessage}
                          onChange={(e) => setOthersMessage(e.target.value)}
                          placeholder="Enter message for incomplete other evaluations"
                          fullWidth
                        />
                        <Button
                          variant="contained"
                          onClick={() => sendEmails('others')}
                          disabled={!othersMessage}
                          startIcon={<Mail />}
                        >
                          Send
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="전체 관리" />
              <CardContent>
                <Box sx={{ display: 'flex', gap: 6 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>자가평가 미실시자</Typography>
                    <Typography variant="body1" gutterBottom>
                      총 미실시자 수: {incompleteCount.self}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        value={globalSelfMessage}
                        onChange={(e) => setGlobalSelfMessage(e.target.value)}
                        placeholder="Enter message for all incomplete self evaluations"
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        onClick={() => sendGlobalEmails('self')}
                        disabled={!globalSelfMessage}
                        startIcon={<Mail />}
                      >
                        Send
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>타인평가 미실시자</Typography>
                    <Typography variant="body1" gutterBottom>
                      총 미실시자 수: {incompleteCount.others}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        value={globalOthersMessage}
                        onChange={(e) => setGlobalOthersMessage(e.target.value)}
                        placeholder="Enter message for all incomplete other evaluations"
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        onClick={() => sendGlobalEmails('others')}
                        disabled={!globalOthersMessage}
                        startIcon={<Mail />}
                      >
                        Send
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

        {notification.show && (
          <Alert severity={notification.type === 'error' ? 'error' : 'success'} sx={{ mt: 2 }}>
            {notification.message}
          </Alert>
        )}
      </Box>
    </Box>
  );
};


export default SurveyManagement;