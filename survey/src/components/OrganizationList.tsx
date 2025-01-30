import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Checkbox, Button
} from '@mui/material';

export const OrganizationList: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    const response = await fetch('/api/organizations/tree');
    const data = await response.json();
    setOrganizations(data);
  };

  const handleDelete = async () => {
    for (const oCode of selectedOrgs) {
      await fetch(`/api/organizations/${oCode}/delete`, {
        method: 'POST'
      });
    }
    fetchOrganizations();
  };

  return (
    <div style={{ padding: '16px' }}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"><Checkbox /></TableCell>
              <TableCell>순번</TableCell>
              <TableCell>평가 집단명</TableCell>
              <TableCell>집단 인원</TableCell>
              <TableCell>상세현황</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.map((org, index) => (
              <TableRow key={org.oCode}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedOrgs.includes(org.oCode)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrgs([...selectedOrgs, org.oCode]);
                      } else {
                        setSelectedOrgs(selectedOrgs.filter(code => code !== org.oCode));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{org.fullName}</TableCell>
                <TableCell>{org.employeeCount}</TableCell>
                <TableCell>
                  <Button 
                    variant="contained"
                    onClick={() => window.location.href = `/organization/${org.oCode}/details`}
                  >
                    보기
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
        <Button variant="contained" onClick={() => window.location.href = '/organization/add'}>
          집단 추가
        </Button>
        <Button variant="contained" color="error" onClick={handleDelete}>
          삭제
        </Button>
        <Button variant="contained" onClick={() => fetch('/api/evaluations/assign-random', { method: 'POST' })}>
          랜덤 배정
        </Button>
      </div>
    </div>
  );
};
