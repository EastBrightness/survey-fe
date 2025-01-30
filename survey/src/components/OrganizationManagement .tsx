import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [loading, setLoading] = useState({ employees: false });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations/tree');
      if (!response.ok) throw new Error('Failed to load organizations');
      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      setError('조직 정보를 불러오는데 실패했습니다.');
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
    if (loading.employeeUpdate[employeeNumber]) return;
      
    setLoading(prev => ({
      ...prev,
      employeeUpdate: { ...prev.employeeUpdate, [employeeNumber]: true }
    }));
      
    try {
      // 현재 직원의 전체 데이터를 찾습니다
      const currentEmployee = employees.find(emp => emp.employeeNumber === employeeNumber);
      if (!currentEmployee) throw new Error('Employee not found');
  
      // 현재 데이터와 업데이트를 병합합니다
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
      // 조직 삭제
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


  return (
    <div className="p-6 max-w-6xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">조직 관리</h1>
        <div className="space-x-2">
          <button 
            onClick={() => selectedOrg && handleOrgToggle(selectedOrg, false)} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!selectedOrg}
          >
            집단 추가
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            disabled={selectedOrgs.length === 0}
          >
            선택 조직 삭제
          </button>
          <button 
            onClick={handleRandomAssignment}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            랜덤 배정
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">선택</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순번</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평가 집단명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">집단 인원</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세현황</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {organizations.map((org, index) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedOrgs.includes(org.fullName)}
                    onChange={(e) => {
                      setSelectedOrgs(prev => 
                        e.target.checked
                          ? [...prev, org.fullName]
                          : prev.filter(name => name !== org.fullName)
                      );
                    }}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4">{org.fullName}</td>
                <td className="px-6 py-4">{org.employeeCount}</td>
                <td className="px-6 py-4">
                <button
                    onClick={() => toggleEmployeeModal(org.fullName)}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                    disabled={loading.employees}
                  >
                    {loading.employees ? '로딩중...' : (showEmployeeModal && selectedOrg === org.fullName ? '닫기' : '보기')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">조직원 상세 현황</h2>
              <button 
                onClick={() => setShowEmployeeModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">순번</th>
                  <th className="px-4 py-2">소속</th>
                  <th className="px-4 py-2">직책</th>
                  <th className="px-4 py-2">계급</th>
                  <th className="px-4 py-2">성명</th>
                  <th className="px-4 py-2">인사상태</th>
                  <th className="px-4 py-2">근무기간</th>
                  <th className="px-4 py-2">타인평가 대상</th>
                  <th className="px-4 py-2">타인평가 참여</th>
                  <th className="px-4 py-2">편집</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{emp.organizationName}</td>
                    <td className="px-4 py-2">{emp.jobName}</td>
                    <td className="px-4 py-2">{emp.gradeName}</td>
                    <td className="px-4 py-2">{emp.personName}</td>
                    <td className="px-4 py-2">{emp.isDeleted ? '삭제됨' : '재직'}</td>
                    <td className="px-4 py-2">{emp.workingMonths}개월</td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={emp.othersTested}
                        onChange={() => updateEmployee(emp.employeeNumber, { othersTested: !emp.othersTested })}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={emp.othersTester}
                        onChange={() => updateEmployee(emp.employeeNumber, { othersTester: !emp.othersTester })}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setShowMoveModal(true);
                        }}
                        className="mr-2 text-blue-600 hover:text-blue-900"
                      >
                        이동
                      </button>
                      <button
                        onClick={() => updateEmployee(emp.employeeNumber, { isDeleted: true })}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">조직 이동</h2>
              <button 
                onClick={() => setShowMoveModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <select 
                className="w-full p-2 border rounded"
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
                <option value="">조직 선택</option>
                {organizations.map(org => (
                  <option key={org.oCode} value={org.oCode}>
                    {org.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;