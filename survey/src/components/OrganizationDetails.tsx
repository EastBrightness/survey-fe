import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Checkbox, Button
} from '@mui/material';

export const OrganizationDetails: React.FC<{ oCode: string }> = ({ oCode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, [oCode]);

  const fetchEmployees = async () => {
    const response = await fetch(`/api/organizations/${oCode}/employees`);
    const data = await response.json();
    setEmployees(data);
  };

  const handleMove = async (employeeNumber: string) => {
    // Show organization selection modal
    // After selection:
    await fetch(`/api/employees/${employeeNumber}/move`, {
      method: 'POST',
      body: JSON.stringify({ newOCode: 'selected-ocode' })
    });
    fetchEmployees();
  };

  return (
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
            <TableCell>현 소속 근무기간</TableCell>
            <TableCell>타인평가 대상</TableCell>
            <TableCell>타인평가 참여</TableCell>
            <TableCell>편집</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((emp, index) => (
            <TableRow key={emp.employeeNumber}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{emp.organizationName}</TableCell>
              <TableCell>{emp.jobName}</TableCell>
              <TableCell>{emp.gradeName}</TableCell>
              <TableCell>{emp.personName}</TableCell>
              <TableCell>재직</TableCell>
              <TableCell>{/* Calculate tenure */}</TableCell>
              <TableCell>
                <Checkbox
                  checked={emp.othersTested}
                  onChange={async (e) => {
                    await fetch(`/api/employees/${emp.employeeNumber}/others-tested`, {
                      method: 'POST',
                      body: JSON.stringify({ value: e.target.checked })
                    });
                    fetchEmployees();
                  }}
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={emp.othersTester}
                  onChange={async (e) => {
                    await fetch(`/api/employees/${emp.employeeNumber}/others-tester`, {
                      method: 'POST',
                      body: JSON.stringify({ value: e.target.checked })
                    });
                    fetchEmployees();
                  }}
                />
              </TableCell>
              <TableCell>
                <Button variant="contained" onClick={() => handleMove(emp.employeeNumber)}>이동</Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  style={{ marginLeft: '8px' }}
                  onClick={async () => {
                    await fetch(`/api/employees/${emp.employeeNumber}/delete`, {
                      method: 'POST'
                    });
                    fetchEmployees();
                  }}
                >
                  삭제
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};