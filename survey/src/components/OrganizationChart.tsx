import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Checkbox,
  CircularProgress,
  Typography,
} from '@mui/material';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface Organization {
  organizationId: number;
  orgName: string;
  fullName: string;
  ocCode: string;
  upCode: string;
}

interface DisplayOrganizations {
  [key: string]: Organization[];
}

interface SelectedOrganizations {
  [key: number]: Organization;
}

interface OrganizationChartProps {
  periodId: string;
}

const OrganizationChart: React.FC<OrganizationChartProps> = ({ periodId }) => {
  const [organizations, setOrganizations] = useState<DisplayOrganizations>({});
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<SelectedOrganizations>({});
  const [selectedForSave, setSelectedForSave] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSubOrganizations = async (upCode: string): Promise<void> => {
    try {
      const response = await fetch(`/api/organizations?upCode=${upCode}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setOrganizations(prev => ({
        ...prev,
        [upCode]: data
      }));
    } catch (error) {
      console.error('Error fetching organizations:', error);
      // Fallback to empty array if fetch fails
      setOrganizations(prev => ({
        ...prev,
        [upCode]: []
      }));
    }
  };

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const getAllSubOrganizationIds = async (orgId: string): Promise<Set<number>> => {
    const result = new Set<number>();
    if (!organizations[orgId]) {
      await fetchSubOrganizations(orgId);
    }
    const children = organizations[orgId] || [];
    
    for (const child of children) {
      result.add(child.organizationId);
      const subChildren = await getAllSubOrganizationIds(child.organizationId.toString());
      subChildren.forEach(id => result.add(id));
    }
    
    return result;
  };

  const handleSelect = async (org: Organization, checked: boolean) => {
    if (checked) {
      setSelectedDisplay(prev => ({
        ...prev,
        [org.organizationId]: org
      }));
      
      const subOrgs = await getAllSubOrganizationIds(org.organizationId.toString());
      setSelectedForSave(prev => {
        const newSet = new Set(prev);
        subOrgs.forEach(id => newSet.add(id));
        newSet.add(org.organizationId);
        return newSet;
      });
    } else {
      setSelectedDisplay(prev => {
        const newSelected = { ...prev };
        delete newSelected[org.organizationId];
        return newSelected;
      });
      
      const subOrgs = await getAllSubOrganizationIds(org.organizationId.toString());
      setSelectedForSave(prev => {
        const newSet = new Set(prev);
        subOrgs.forEach(id => newSet.delete(id));
        newSet.delete(org.organizationId);
        return newSet;
      });
    }
  };

  const handleSave = async (): Promise<void> => {
    setLoading(true);
    try {
      const saveData = {
        organizationIds: Array.from(selectedForSave),
        periodId
      };

      await fetch('/api/organizations/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });

      console.log('화면에 표시된 조직:', Object.values(selectedDisplay).map(org => org.fullName));
      console.log('실제 저장될 조직 ID들:', Array.from(selectedForSave));
      console.log('저장 데이터:', saveData);
    } catch (error) {
      console.error('Error saving evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTree = (nodes: Organization[]) => (
    nodes.map((node) => (
      <TreeItem
        key={node.organizationId}
        itemId={node.organizationId.toString()}
        label={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={selectedForSave.has(node.organizationId)}
              onChange={(event) => handleSelect(node, event.target.checked)}
              onClick={(event) => event.stopPropagation()}
            />
            <Typography variant="body2">{node.orgName}</Typography>
          </div>
        }
      >
        {organizations[node.organizationId.toString()]?.length > 0 && renderTree(organizations[node.organizationId.toString()])}
      </TreeItem>
    ))
  );

  useEffect(() => {
    fetchSubOrganizations('1');
  }, []);

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Card style={{ width: '50%' }}>
        <CardHeader title="조직도" />
        <CardContent style={{ height: 500, overflowY: 'auto' }}>
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            expanded={expanded}
            onNodeToggle={handleToggle}
          >
            {renderTree(organizations['1'] || [])}
          </TreeView>
        </CardContent>
      </Card>
      
      <Card style={{ width: '50%' }}>
        <CardHeader title="선택한 조직집단" />
        <CardContent>
          <div style={{ height: 400, overflowY: 'auto' }}>
            {Object.values(selectedDisplay).map(org => (
              <Typography key={org.organizationId} variant="body2" style={{ marginBottom: '0.5rem' }}>
                {org.fullName}
              </Typography>
            ))}
          </div>
          
          <Button
            variant="contained"
            fullWidth
            style={{ marginTop: '1rem' }}
            onClick={handleSave}
            disabled={loading || selectedForSave.size === 0}
          >
            {loading ? <CircularProgress size={24} /> : '저장'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationChart;