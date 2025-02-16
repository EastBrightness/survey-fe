import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/system';

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

const OrganizationManagement: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);
  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState<boolean>(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchEmployeeName, setSearchEmployeeName] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [deletedOrgs, setDeletedOrgs] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [loading, setLoading] = useState({
    employees: false,
    search: false,
    update: false,
    employeeUpdate: {} as { [key: string]: boolean }
  });

  useEffect(() => {
    loadOrganizations();
    loadDeletedOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations/tree');
      if (!response.ok) throw new Error('Failed to load organizations');
      const data = await response.json();
      // isDeleted가 false인 조직만 필터링
      const activeOrganizations = data.filter(org => !org.isDeleted);
      setOrganizations(activeOrganizations);
    } catch (err) {
      setError('조직 정보를 불러오는데 실패했습니다.');
    }
  };

  const loadDeletedOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations/deleted');
      if (!response.ok) throw new Error('Failed to load deleted organizations');
      const data = await response.json();
      setDeletedOrgs(data);
    } catch (err) {
      setError('삭제된 조직 정보를 불러오는데 실패했습니다.');
    }
  };

  const searchEmployees = async () => {
    if (!searchEmployeeName.trim()) return;

    setLoading(prev => ({ ...prev, search: true }));
    try {
      const response = await fetch(`/api/employees/search?name=${encodeURIComponent(searchEmployeeName)}`);
      if (!response.ok) throw new Error('Failed to search employees');
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError('직원 검색에 실패했습니다.');
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleAddEmployee = async (employee: Employee) => {
    try {
      const updatedEmployee = {
        ...employee,
        organizationName: selectedOrg,
        isDeleted: false,
        othersTested: false,
        othersTester: false
      };

      const response = await fetch(`/api/employees/${employee.employeeNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEmployee),
      });

      if (!response.ok) throw new Error('Failed to add employee');

      if (selectedOrg) {
        await fetchEmployees(selectedOrg);
      }
      setShowAddEmployeeModal(false);
      setSearchEmployeeName('');
      setSearchResults([]);
    } catch (err) {
      setError('직원 추가에 실패했습니다.');
    }
  };

  const handleRestoreOrganization = async (org: Organization) => {
    if (!org || !org.oCode) {
      setError('조직 코드가 유효하지 않습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${org.oCode}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to restore organization: ${response.status} - ${errorText}`);
      }

      await loadOrganizations();
      await loadDeletedOrganizations();
      setShowAddOrgModal(false);
    } catch (err) {
      setError(`조직 복원에 실패했습니다: ${err.message}`);
    }
  };

  const handleOrgToggle = async (oCode: string, isDeleted: boolean) => {
    try {
      const response = await fetch(`/api/organizations/${oCode}/toggle-status?isDeleted=${isDeleted}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle organization status');
      await loadOrganizations();
    } catch (err) {
      setError('조직 상태 변경에 실패했습니다.');
    }
  };

  const fetchEmployees = async (orgName: string) => {
    try {
      const response = await fetch(`/api/employees/organization/${encodeURIComponent(orgName)}`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
      setShowEmployeeModal(true);
    } catch (err) {
      setError('직원 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleRandomAssignment = async () => {
    try {
      const response = await fetch('/api/employees/assign-random', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to assign random evaluators');
      alert('평가자가 랜덤으로 배정되었습니다.');
    } catch (err) {
      setError('평가자 랜덤 배정에 실패했습니다.');
    }
  };

  const updateEmployee = async (employeeNumber: string, updates: Partial<Employee>) => {
    if (loading.employeeUpdate && loading.employeeUpdate[employeeNumber]) return;

    setLoading(prev => ({
      ...prev,
      employeeUpdate: { ...prev.employeeUpdate, [employeeNumber]: true }
    }));

    try {
      const currentEmployee = employees.find(emp => emp.employeeNumber === employeeNumber);
      if (!currentEmployee) throw new Error('Employee not found');

      const updatedData = {
        ...currentEmployee,
        ...updates
      };

      const response = await fetch(`/api/employees/${employeeNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update employee');

      const updatedEmployees = employees.map(emp =>
        emp.employeeNumber === employeeNumber ? { ...emp, ...updates } : emp
      );
      setEmployees(updatedEmployees);
      setError(null);
    } catch (err) {
      setError('직원 정보 업데이트에 실패했습니다.');
    } finally {
      setLoading(prev => ({
        ...prev,
        employeeUpdate: { ...prev.employeeUpdate, [employeeNumber]: false }
      }));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedOrgs.length) return;

    try {
      const orgResponse = await fetch('/api/organizations/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedOrgs),
      });

      if (!orgResponse.ok) throw new Error('Failed to delete organizations');

      setSelectedOrgs([]);
      await loadOrganizations();
      setError(null);
    } catch (err) {
      setError('조직 삭제에 실패했습니다.');
    }
  };

  const toggleEmployeeModal = (orgName: string) => {
    if (showEmployeeModal && selectedOrg === orgName) {
      setShowEmployeeModal(false);
      setSelectedOrg(null);
    } else {
      setSelectedOrg(orgName);
      fetchEmployees(orgName);
    }
  };

  const CustomTableContainer = styled(TableContainer)({
    maxWidth: '100%',
    margin: '0 auto',
  });

      // ... 이전 코드 계속

      return (
        <Box sx={{ p: 3, maxWidth: '100%' }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, marginRight: '1rem' }}>조직 관리</h1>
                </Box>
                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => selectedOrg && handleOrgToggle(selectedOrg, false)}
                        disabled={!selectedOrg}
                        sx={{ mr: 1 }}
                    >
                        집단 추가
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleBulkDelete}
                        disabled={selectedOrgs.length === 0}
                        sx={{ mr: 1 }}
                    >
                        선택 조직 삭제
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleRandomAssignment}
                        sx={{ mr: 1 }}
                    >
                        랜덤 배정
                    </Button>
                    <Button
                        variant="contained"
                        color="info"
                        onClick={() => setShowAddOrgModal(true)}
                    >
                        삭제된 조직
                    </Button>
                </Box>
            </Box>

            <CustomTableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>선택</TableCell>
                            <TableCell>순번</TableCell>
                            <TableCell>평가 집단명</TableCell>
                            <TableCell>집단 인원</TableCell>
                            <TableCell>상세현황</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {organizations.map((org, index) => (
                            <TableRow key={org.id} hover>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedOrgs.includes(org.fullName)}
                                        onChange={(e) => {
                                            setSelectedOrgs(prev =>
                                                e.target.checked
                                                    ? [...prev, org.fullName]
                                                    : prev.filter(name => name !== org.fullName)
                                            );
                                        }}
                                    />
                                </TableCell>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{org.fullName}</TableCell>
                                <TableCell>{org.employeeCount}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="text"
                                        color="primary"
                                        onClick={() => toggleEmployeeModal(org.fullName)}
                                        disabled={loading.employees}
                                    >
                                        {loading.employees ? '로딩중...' : (showEmployeeModal && selectedOrg === org.fullName ? '닫기' : '보기')}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CustomTableContainer>

            {/* 직원 모달 */}
            <Dialog open={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>조직원 상세 현황</DialogTitle>
                <DialogContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>순번</TableCell>
                                    <TableCell>소속</TableCell>
                                    <TableCell>직책</TableCell>
                                    <TableCell>계급</TableCell>
                                    <TableCell>성명</TableCell>
                                    <TableCell>인사상태</TableCell>
                                    <TableCell>근무기간</TableCell>
                                    <TableCell>타인평가 대상</TableCell>
                                    <TableCell>타인평가 참여</TableCell>
                                    <TableCell>편집</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.map((emp, index) => (
                                    <TableRow key={emp.id} hover>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{emp.organizationName}</TableCell>
                                        <TableCell>{emp.jobName}</TableCell>
                                        <TableCell>{emp.gradeName}</TableCell>
                                        <TableCell>{emp.personName}</TableCell>
                                        <TableCell>{emp.isDeleted ? '삭제됨' : '재직'}</TableCell>
                                        <TableCell>{emp.workingMonths}개월</TableCell>
                                        <TableCell>
                                            <Checkbox
                                                checked={emp.othersTested}
                                                onChange={() => updateEmployee(emp.employeeNumber, { othersTested: !emp.othersTested })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Checkbox
                                                checked={emp.othersTester}
                                                onChange={() => updateEmployee(emp.employeeNumber, { othersTester: !emp.othersTester })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                color="primary"
                                                onClick={() => {
                                                    setSelectedEmployee(emp);
                                                    setShowMoveModal(true);
                                                }}
                                            >
                                                이동
                                            </Button>
                                            <Button
                                                color="error"
                                                onClick={() => updateEmployee(emp.employeeNumber, { isDeleted: true })}
                                            >
                                                삭제
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEmployeeModal(false)}>닫기</Button>
                    <Button variant="contained" color="primary" onClick={() => setShowAddEmployeeModal(true)}>
                        인원 추가
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 조직 추가 모달 */}
            <Dialog open={showAddOrgModal} onClose={() => setShowAddOrgModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>삭제된 조직 목록</DialogTitle>
                <DialogContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>조직명</TableCell>
                                    <TableCell>전체 조직명</TableCell>
                                    <TableCell>액션</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {deletedOrgs.map((org) => (
                                    <TableRow key={org.id} hover>
                                        <TableCell>{org.orgName}</TableCell>
                                        <TableCell>{org.fullName}</TableCell>
                                        <TableCell>
                                            <Button
                                                color="primary"
                                                onClick={() => handleRestoreOrganization(org)}
                                            >
                                                선택
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddOrgModal(false)}>닫기</Button>
                </DialogActions>
            </Dialog>

            {/* 직원 추가 모달 */}
            <Dialog open={showAddEmployeeModal} onClose={() => setShowAddEmployeeModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>인원 추가</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            label="이름 입력"
                            variant="outlined"
                            fullWidth
                            value={searchEmployeeName}
                            onChange={(e) => setSearchEmployeeName(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={searchEmployees}
                            disabled={loading.search}
                        >
                            {loading.search ? <CircularProgress size={24} /> : '검색'}
                        </Button>
                    </Box>
                    {searchResults.length > 0 && (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>이름</TableCell>
                                        <TableCell>현재 소속</TableCell>
                                        <TableCell>액션</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {searchResults.map((emp) => (
                                        <TableRow key={emp.id} hover>
                                            <TableCell>{emp.personName}</TableCell>
                                            <TableCell>{emp.organizationName}</TableCell>
                                            <TableCell>
                                                <Button
                                                    color="primary"
                                                    onClick={() => handleAddEmployee(emp)}
                                                >
                                                    선택
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAddEmployeeModal(false)}>닫기</Button>
                </DialogActions>
            </Dialog>

            {/* 이동 모달 */}
            <Dialog open={showMoveModal} onClose={() => setShowMoveModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>조직 이동</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="org-select-label">조직 선택</InputLabel>
                        <Select
                            labelId="org-select-label"
                            id="org-select"
                            value=""
                            label="조직 선택"
                            onChange={async (e) => {
                                const newOrg = organizations.find(org => org.oCode === e.target.value);
                                if (newOrg && selectedEmployee) {
                                    await updateEmployee(selectedEmployee.employeeNumber, {
                                        organizationName: newOrg.fullName
                                    });
                                    setShowMoveModal(false);
                                }
                            }}
                        >
                            <MenuItem value=""><em>조직 선택</em></MenuItem>
                            {organizations.map(org => (
                                <MenuItem key={org.oCode} value={org.oCode}>{org.fullName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowMoveModal(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OrganizationManagement;
