import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoNotDisturbAltOutlinedIcon from '@mui/icons-material/DoNotDisturbAltOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataGrid, StatusSelector, PopUp } from '@link-loom/react-sdk';
import SupportEmptyState from '../shared/SupportEmptyState.component';
import BackButton from '../../shared/BackButton.component';
import { SUPPORT_THEME } from '../defaults/support.theme';
import {
  SUPPORT_CASE_LIST_DEFAULTS,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  SEVERITY_CONFIG,
  USER_SELECTABLE_STATUSES,
  mergeDefaults,
} from '../defaults/support.defaults';

// ── Styled ────────────────────────────────────────────────────────────

const StyledTabs = styled(Tabs)({
  minHeight: '36px',
  borderBottom: `1px solid ${SUPPORT_THEME.surfaceContainer}`,
  '& .MuiTab-root': { minHeight: '36px', textTransform: 'none', fontSize: '0.8rem' },
  '& .MuiTabs-indicator': { height: '2px' },
});

const StyledTab = styled(Tab)({ minHeight: '36px' });

// ── Statuses ──────────────────────────────────────────────────────────
// Resolved at runtime from the `statuses` prop (fetched from backend).
// STATUS_CONFIG is used only as a fallback when the prop is not yet available.

// ── Helpers ───────────────────────────────────────────────────────────

const resolveStatusName = (rawStatus) => {
  const name = typeof rawStatus === 'object' ? rawStatus?.name : rawStatus;
  return (name || '').toLowerCase().replace(/\s+/g, '_');
};

const normalizeStatus = (rawStatus, statusMap = {}) => {
  if (typeof rawStatus === 'object' && rawStatus !== null) {
    const name = rawStatus.name || '';
    const backendEntry = statusMap[name] || STATUS_CONFIG[name] || {};
    return {
      id: name,
      name,
      title: rawStatus.title || backendEntry.label || backendEntry.title || name,
      color: rawStatus.color || backendEntry.color || SUPPORT_THEME.textMuted,
    };
  }
  const name = (rawStatus || '').toLowerCase().replace(/\s+/g, '_');
  const backendEntry = statusMap[name] || STATUS_CONFIG[name] || {};
  return {
    id: name,
    name,
    title: backendEntry.title || backendEntry.label || rawStatus || 'Unknown',
    color: backendEntry.color || SUPPORT_THEME.textMuted,
  };
};

const resolveSeverityColor = (severity) => {
  return SEVERITY_CONFIG?.[severity]?.color || SUPPORT_THEME.textMuted;
};

// ── Modal components ──────────────────────────────────────────────────

const CaseResolveModal = ({ supportCase, onConfirm, onCancel }) => (
  <section style={{ padding: '24px 24px 20px' }}>
    <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Resolve Case</h3>
    <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: 0 }}>
      Are you sure you want to resolve <strong>"{supportCase?.title}"</strong>?
      This case will be marked as resolved and no further action will be required.
    </p>
    <div className="d-flex justify-content-between mt-4">
      <button
        style={{ background: 'none', border: 'none', borderRadius: '8px', padding: '6px 16px', fontWeight: 500, color: '#6B7280', cursor: 'pointer' }}
        onClick={onCancel}
      >
        Cancel
      </button>
      <Button
        variant="contained"
        onClick={onConfirm}
        sx={{
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '8px',
          backgroundColor: '#16a34a',
          boxShadow: 'none',
          '&:hover': { backgroundColor: '#15803d', boxShadow: 'none' },
        }}
      >
        Resolve case
      </Button>
    </div>
  </section>
);

const CaseCloseModal = ({ supportCase, onConfirm, onCancel }) => (
  <section style={{ padding: '24px 24px 20px' }}>
    <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Close Case</h3>
    <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: 0 }}>
      Are you sure you want to close <strong>"{supportCase?.title}"</strong>?
      This case will be closed and archived.
    </p>
    <div className="d-flex justify-content-between mt-4">
      <button
        style={{ background: 'none', border: 'none', borderRadius: '8px', padding: '6px 16px', fontWeight: 500, color: '#6B7280', cursor: 'pointer' }}
        onClick={onCancel}
      >
        Cancel
      </button>
      <button
        style={{
          borderRadius: '8px',
          padding: '6px 16px',
          fontWeight: 500,
          cursor: 'pointer',
          color: '#b45309',
          backgroundColor: '#fef3c715',
          border: '1px solid #fcd34d',
        }}
        onClick={onConfirm}
      >
        Close case
      </button>
    </div>
  </section>
);

const CaseDeleteModal = ({ supportCase, onConfirm, onCancel }) => (
  <section style={{ padding: '24px 24px 20px' }}>
    <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Delete Case</h3>
    <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: 0 }}>
      Are you sure you want to delete <strong>"{supportCase?.title}"</strong>?
      This action cannot be undone.
    </p>
    <div className="d-flex justify-content-between mt-4">
      <Button
        variant="text"
        onClick={onCancel}
        sx={{ textTransform: 'none', fontWeight: 500, borderRadius: '8px', color: '#6B7280' }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onConfirm}
        sx={{
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '8px',
          backgroundColor: '#9f1239',
          boxShadow: 'none',
          '&:hover': { backgroundColor: '#7f0f2e', boxShadow: 'none' },
        }}
      >
        Delete case
      </Button>
    </div>
  </section>
);

// ── Component ─────────────────────────────────────────────────────────

const SupportCaseList = ({
  ui,
  cases,
  namespaces,
  statuses,
  onCaseClick,
  itemOnAction,
  ...props
}) => {
  // Hooks
  const config = mergeDefaults(SUPPORT_CASE_LIST_DEFAULTS, ui);
  const theme = config.theme;

  // Models / State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [namespaceFilter, setNamespaceFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [activeCase, setActiveCase] = useState(null);

  // Configs
  const allCases = cases || [];
  const knownNamespaces = namespaces || [];

  // Build status maps from backend statuses (prop), falling back to STATUS_CONFIG
  const resolvedStatuses = (statuses && Object.keys(statuses).length > 0)
    ? statuses
    : Object.fromEntries(Object.entries(STATUS_CONFIG).map(([key, val]) => [key, { id: key, name: key, title: val.label, color: val.color }]));

  const userSelectableStatuses = Object.fromEntries(
    USER_SELECTABLE_STATUSES
      .filter((key) => Boolean(resolvedStatuses[key]))
      .map((key) => [key, resolvedStatuses[key]])
  );

  const namespaceOptions = [
    { id: 'all', title: config.filterAllProducts },
    ...knownNamespaces,
  ];

  const priorityOptions = [
    { value: 'all', label: config.filterPriority },
    ...Object.entries(PRIORITY_CONFIG).map(([key, val]) => ({ value: key, label: val.label })),
  ];

  const actions = [
    {
      id: 'copy',
      label: 'Copy Actions',
      type: 'group',
      items: [
        { id: 'copy-id', label: 'Copy Id' },
        { id: 'copy-link', label: 'Copy link' },
        { id: 'new-tab', label: 'New tab' },
      ],
    },
    {
      id: 'view',
      icon: <AssignmentOutlinedIcon className="me-1" fontSize="small" />,
      label: 'View details',
      type: 'action',
    },
    {
      id: 'resolve',
      icon: <CheckCircleOutlineIcon className="me-1" fontSize="small" />,
      label: 'Resolve',
      type: 'action',
    },
    {
      id: 'close-case',
      icon: <DoNotDisturbAltOutlinedIcon className="me-1" fontSize="small" />,
      label: 'Close',
      type: 'action',
    },
    {
      id: 'delete',
      icon: <DeleteOutlineIcon className="me-1" fontSize="small" />,
      label: 'Delete',
      type: 'action',
    },
  ];

  // Component Functions
  const resolveProductLabel = (supportCase) => {
    const ns = knownNamespaces.find((n) => n.id === supportCase.support_namespace_id);
    return ns?.title || ns?.slug || supportCase.origin_surface || null;
  };

  const tabCounts = useMemo(() => {
    const counts = { all: 0, open: 0, pending: 0, resolved: 0 };
    for (const supportCase of allCases) {
      counts.all += 1;
      const status = resolveStatusName(supportCase.status);
      if (status === 'open' || status === 'in_progress' || status === 'active') counts.open += 1;
      else if (status === 'pending' || status === 'waiting_on_customer' || status === 'waiting_on_support') counts.pending += 1;
      else if (status === 'resolved' || status === 'closed') counts.resolved += 1;
    }
    return counts;
  }, [allCases]);

  const filteredCases = useMemo(() => {
    return allCases.filter((supportCase) => {
      const status = resolveStatusName(supportCase.status);

      if (statusTab === 'open' && status !== 'open' && status !== 'in_progress' && status !== 'active') return false;
      if (statusTab === 'pending' && status !== 'pending' && status !== 'waiting_on_customer' && status !== 'waiting_on_support') return false;
      if (statusTab === 'resolved' && status !== 'resolved' && status !== 'closed') return false;

      const selectedNs = namespaceFilter?.id;
      if (selectedNs && selectedNs !== 'all' && supportCase.support_namespace_id !== selectedNs) return false;

      const selectedPriority = priorityFilter?.value;
      if (selectedPriority && selectedPriority !== 'all' && (supportCase.priority || supportCase.severity) !== selectedPriority) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (supportCase.title || '').toLowerCase().includes(query) ||
          (supportCase.id || '').toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allCases, statusTab, namespaceFilter, priorityFilter, searchQuery]);

  const openModal = (modal, supportCase) => {
    setActiveCase(supportCase);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveCase(null);
  };

  const handleCaseView = (supportCase) => {
    if (onCaseClick) { onCaseClick(supportCase); return; }
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::case-view',
      namespace: 'link-loom-support',
      payload: { caseId: supportCase.id, supportCase },
    });
  };

  const handleStatusSelected = (supportCase, status) => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::case-update-status',
      namespace: 'link-loom-support',
      payload: { caseId: supportCase.id, supportCase, status },
    });
  };

  const handleConfirmAction = (action) => {
    closeModal();
    if (!itemOnAction) return;
    itemOnAction({
      action: `link-loom-support::case-${action}`,
      namespace: 'link-loom-support',
      payload: { caseId: activeCase?.id, supportCase: activeCase },
    });
  };

  const handleCreateCase = () => {
    if (!itemOnAction) return;
    itemOnAction({ action: 'link-loom-support::report-issue', namespace: 'link-loom-support', payload: {} });
  };

  const handleBack = () => {
    if (!itemOnAction) return;
    itemOnAction({ action: 'link-loom-support::back-to-hub', payload: {} });
  };

  const getCaseUrl = (supportCase) => `${window.location.origin}/client/support/cases/${supportCase?.id}`;

  const handleMenuItemClick = (action, supportCase) => {
    switch (action) {
      case 'view':
        handleCaseView(supportCase);
        break;
      case 'resolve':
        openModal('resolve', supportCase);
        break;
      case 'close-case':
        openModal('close-case', supportCase);
        break;
      case 'delete':
        openModal('delete', supportCase);
        break;
      case 'copy-id':
        if (supportCase?.id && navigator.clipboard) {
          navigator.clipboard.writeText(supportCase.id);
        }
        break;
      case 'copy-link':
        if (navigator.clipboard) {
          navigator.clipboard.writeText(getCaseUrl(supportCase));
        }
        break;
      case 'new-tab':
        window.open(getCaseUrl(supportCase), '_blank');
        break;
      default:
        break;
    }
  };

  const columns = [
    {
      field: 'title',
      headerName: config.headerTitle,
      flex: 3,
      minWidth: 200,
      renderCell: (params) => (
        <section className="w-100 text-truncate d-flex align-items-center gap-2">
          <StatusSelector
            status={normalizeStatus(params.row.status, resolvedStatuses)}
            statuses={userSelectableStatuses}
            size="small"
            statusSelected={(status) => handleStatusSelected(params.row, status)}
          />
          <span style={{ fontWeight: 600, fontSize: '0.825rem', color: theme.textPrimary }}>{params.row.title}</span>
        </section>
      ),
    },
    {
      field: 'support_namespace_id',
      headerName: config.headerProduct,
      flex: 1.5,
      minWidth: 120,
      renderCell: (params) => {
        const productLabel = resolveProductLabel(params.row);
        return productLabel ? (
          <Chip
            label={productLabel}
            size="small"
            sx={{
              fontSize: '0.7rem',
              height: '20px',
              maxWidth: '100%',
              backgroundColor: SUPPORT_THEME.surfaceContainerLow,
              color: SUPPORT_THEME.textSecondary,
            }}
          />
        ) : '—';
      },
    },
    {
      field: 'priority',
      headerName: config.headerPriority,
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        const severityValue = params.row.priority || params.row.severity;
        const severityColor = resolveSeverityColor(severityValue);
        return severityValue ? (
          <Chip
            label={severityValue}
            size="small"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              height: '20px',
              textTransform: 'capitalize',
              color: severityColor,
              backgroundColor: `${severityColor}18`,
              border: `1px solid ${severityColor}`,
              '& .MuiChip-label': { px: '8px' },
            }}
          />
        ) : '—';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'string',
      sortable: false,
      disableColumnMenu: true,
      editable: false,
      renderCell: 'actions',
    },
  ];

  // Render
  return (
    <article className="card shadow" {...props}>
      <section className="card-body">
        <BackButton onClick={handleBack}>Back to Support Hub</BackButton>
        <header className="d-flex flex-row justify-content-between">
          <section>
            <h4 className="mt-0 mb-1">{config.title}</h4>
            <p className="text-muted font-14 mb-3">{config.subtitle}</p>
          </section>
          <section className="align-items-sm-baseline d-flex">
            <button className="btn btn-dark" onClick={handleCreateCase}>
              <AddIcon className="me-1" fontSize="small" />
              {config.createCaseLabel}
            </button>
          </section>
        </header>

        <section className="content">
          {/* Search + Filters */}
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <TextField
              placeholder={config.searchPlaceholder}
              size="small"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" className="text-muted" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: '240px', '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
            />

            <Autocomplete
              options={namespaceOptions}
              getOptionLabel={(option) => option.title || ''}
              value={namespaceFilter || namespaceOptions[0]}
              onChange={(event, newValue) => setNamespaceFilter(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              size="small"
              disableClearable
              sx={{ width: 155, '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
              renderInput={(params) => <TextField {...params} label={config.filterAllProducts} />}
            />

            <Autocomplete
              options={priorityOptions}
              getOptionLabel={(option) => option.label || ''}
              value={priorityFilter || priorityOptions[0]}
              onChange={(event, newValue) => setPriorityFilter(newValue)}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              size="small"
              disableClearable
              sx={{ width: 135, '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
              renderInput={(params) => <TextField {...params} label={config.filterPriority} />}
            />
          </div>

          {/* Tabs */}
          <StyledTabs
            value={statusTab}
            onChange={(event, value) => setStatusTab(value)}
            className=""
          >
            <StyledTab label={`${config.tabAll} (${tabCounts.all})`} value="all" />
            <StyledTab label={`${config.tabOpen} (${tabCounts.open})`} value="open" />
            <StyledTab label={`${config.tabPending} (${tabCounts.pending})`} value="pending" />
            <StyledTab label={`${config.tabResolved} (${tabCounts.resolved})`} value="resolved" />
          </StyledTabs>

          {/* Table */}
          {filteredCases.length === 0 ? (
            <SupportEmptyState message={searchQuery ? config.noCases : config.noCasesHint} />
          ) : (
            <DataGrid
              columns={columns}
              rows={filteredCases}
              actions={actions}
              enableActions
              onMenuItemClick={handleMenuItemClick}
              pageSizeOptions={[10, 20, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: config.rowsPerPage, page: 0 } } }}
              disableRowSelectionOnClick
              className="border-0"
            />
          )}
        </section>
      </section>

      {/* Modals */}
      <PopUp
        id="support-case-modal"
        isOpen={Boolean(activeModal)}
        setIsOpen={(isOpen) => { if (!isOpen) closeModal(); }}
        className="col-lg-4 col-md-8 col-12"
        styles={{ closeButtonColor: 'text-black-50', borderRadius: '16px', overflow: 'hidden' }}
      >
        {activeModal === 'resolve' && (
          <CaseResolveModal
            supportCase={activeCase}
            onConfirm={() => handleConfirmAction('resolve')}
            onCancel={closeModal}
          />
        )}
        {activeModal === 'close-case' && (
          <CaseCloseModal
            supportCase={activeCase}
            onConfirm={() => handleConfirmAction('close')}
            onCancel={closeModal}
          />
        )}
        {activeModal === 'delete' && (
          <CaseDeleteModal
            supportCase={activeCase}
            onConfirm={() => handleConfirmAction('delete')}
            onCancel={closeModal}
          />
        )}
      </PopUp>
    </article>
  );
};

export default SupportCaseList;
