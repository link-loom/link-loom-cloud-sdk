import React, { useState, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SupportStatusBadge from '../shared/SupportStatusBadge.component';
import SupportSeverityBadge from '../shared/SupportSeverityBadge.component';
import SupportEmptyState from '../shared/SupportEmptyState.component';
import {
  SUPPORT_CASE_LIST_DEFAULTS,
  PRIORITY_CONFIG,
  mergeDefaults,
} from '../defaults/support.defaults';

const StyledTabs = styled(Tabs)({
  minHeight: '36px',
  '& .MuiTab-root': {
    minHeight: '36px',
    textTransform: 'none',
    fontSize: '13px',
  },
  '& .MuiTabs-indicator': {
    height: '2px',
  },
});

const StyledTab = styled(Tab)({
  minHeight: '36px',
});

const TableRow = styled('tr')(({ $clickable }) => ({
  cursor: $clickable ? 'pointer' : 'default',
  transition: 'background-color 0.1s',
  '&:hover': {
    backgroundColor: $clickable ? '#f8fafc' : 'transparent',
  },
}));

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
};

const SupportCaseList = ({
  ui,
  cases,
  onCaseClick,
  itemOnAction,
  ...props
}) => {
  const config = mergeDefaults(SUPPORT_CASE_LIST_DEFAULTS, ui);
  const theme = config.theme;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const allCases = cases || [];

  const resolveStatusName = (rawStatus) => {
    const name = typeof rawStatus === 'object' ? rawStatus?.name : rawStatus;
    return (name || '').toLowerCase().replace(/\s+/g, '_');
  };

  const tabCounts = useMemo(() => {
    const counts = { all: 0, open: 0, pending: 0, resolved: 0 };
    for (const supportCase of allCases) {
      counts.all += 1;
      const status = resolveStatusName(supportCase.status);
      if (status === 'open' || status === 'in_progress') counts.open += 1;
      else if (status === 'pending') counts.pending += 1;
      else if (status === 'resolved' || status === 'closed') counts.resolved += 1;
    }
    return counts;
  }, [allCases]);

  const filteredCases = useMemo(() => {
    return allCases.filter((supportCase) => {
      const status = resolveStatusName(supportCase.status);

      if (statusTab === 'open' && status !== 'open' && status !== 'in_progress') return false;
      if (statusTab === 'pending' && status !== 'pending') return false;
      if (statusTab === 'resolved' && status !== 'resolved' && status !== 'closed') return false;

      if (productFilter !== 'all' && supportCase.product !== productFilter) return false;
      if (priorityFilter !== 'all' && supportCase.priority !== priorityFilter) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (supportCase.title || '').toLowerCase().includes(query) ||
          (supportCase.case_id || '').toLowerCase().includes(query) ||
          (supportCase.product || '').toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allCases, statusTab, productFilter, priorityFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / config.rowsPerPage));
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * config.rowsPerPage,
    currentPage * config.rowsPerPage
  );

  const products = useMemo(() => {
    const uniqueProducts = new Set(allCases.map((c) => c.product).filter(Boolean));
    return Array.from(uniqueProducts);
  }, [allCases]);

  const handleCaseClick = (supportCase) => {
    if (onCaseClick) {
      onCaseClick(supportCase);
      return;
    }
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::case-view',
      namespace: 'link-loom-support',
      payload: { caseId: supportCase.id, supportCase },
    });
  };

  const handleCreateCase = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::report-issue',
      namespace: 'link-loom-support',
      payload: {},
    });
  };

  const handleExport = () => {
    if (!itemOnAction) return;
    itemOnAction({
      action: 'link-loom-support::cases-export',
      namespace: 'link-loom-support',
      payload: { cases: filteredCases },
    });
  };

  return (
    <div {...props}>
      {/* Header */}
      <header className="d-flex flex-row justify-content-between align-items-start mb-3">
        <div>
          <h3 className="fw-bold mb-0" style={{ color: theme.textPrimary }}>
            {config.title}
          </h3>
        </div>
        <div className="d-flex gap-2">
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExport}
            sx={{
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 500,
              borderColor: theme.border,
              color: theme.textSecondary,
              '&:hover': { borderColor: theme.textSecondary },
            }}
          >
            {config.exportLabel}
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={handleCreateCase}
            sx={{
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: theme.brandPrimary,
              '&:hover': { backgroundColor: '#334155' },
            }}
          >
            {config.createCaseLabel}
          </Button>
        </div>
      </header>

      {/* Search + Filters */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <TextField
          placeholder={config.searchPlaceholder}
          size="small"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setCurrentPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" className="text-muted" />
              </InputAdornment>
            ),
          }}
          sx={{ width: '280px', '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={productFilter}
            onChange={(event) => {
              setProductFilter(event.target.value);
              setCurrentPage(1);
            }}
            displayEmpty
            sx={{ fontSize: '13px' }}
          >
            <MenuItem value="all">{config.filterAllProducts}</MenuItem>
            {products.map((product) => (
              <MenuItem key={product} value={product}>
                {product}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={priorityFilter}
            onChange={(event) => {
              setPriorityFilter(event.target.value);
              setCurrentPage(1);
            }}
            displayEmpty
            sx={{ fontSize: '13px' }}
          >
            <MenuItem value="all">{config.filterPriority}</MenuItem>
            {Object.entries(PRIORITY_CONFIG).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {value.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {/* Tabs */}
      <StyledTabs
        value={statusTab}
        onChange={(event, value) => {
          setStatusTab(value);
          setCurrentPage(1);
        }}
        className="mb-3"
      >
        <StyledTab label={`${config.tabAll} (${tabCounts.all})`} value="all" />
        <StyledTab label={`${config.tabOpen} (${tabCounts.open})`} value="open" />
        <StyledTab label={`${config.tabPending} (${tabCounts.pending})`} value="pending" />
        <StyledTab label={`${config.tabResolved} (${tabCounts.resolved})`} value="resolved" />
      </StyledTabs>

      {/* Table */}
      {paginatedCases.length === 0 ? (
        <SupportEmptyState message={searchQuery ? config.noCases : config.noCasesHint} />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th
                    className="border-0 fw-semibold"
                    style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {config.headerCaseId}
                  </th>
                  <th
                    className="border-0 fw-semibold"
                    style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {config.headerTitle}
                  </th>
                  <th
                    className="border-0 fw-semibold"
                    style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {config.headerProduct}
                  </th>
                  <th
                    className="border-0 fw-semibold"
                    style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {config.headerStatus}
                  </th>
                  <th
                    className="border-0 fw-semibold"
                    style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {config.headerPriority}
                  </th>
                  <th
                    className="border-0 fw-semibold"
                    style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {config.headerCreated}
                  </th>
                  <th
                    className="border-0 fw-semibold"
                    style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {config.headerLastUpdate}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCases.map((supportCase) => (
                  <TableRow
                    key={supportCase.id}
                    $clickable
                    onClick={() => handleCaseClick(supportCase)}
                  >
                    <td className="align-middle" style={{ color: theme.brandAccent, fontWeight: 500 }}>
                      {supportCase.case_id || supportCase.id}
                    </td>
                    <td className="align-middle text-truncate" style={{ maxWidth: '250px', color: theme.textPrimary }}>
                      {supportCase.title}
                    </td>
                    <td className="align-middle">
                      {supportCase.product && (
                        <Chip
                          label={supportCase.product}
                          size="small"
                          sx={{
                            fontSize: '11px',
                            height: '22px',
                            backgroundColor: theme.surfaceSecondary,
                            color: theme.textSecondary,
                          }}
                        />
                      )}
                    </td>
                    <td className="align-middle">
                      <SupportStatusBadge status={supportCase.status} />
                    </td>
                    <td className="align-middle">
                      <SupportSeverityBadge severity={supportCase.priority || supportCase.severity} />
                    </td>
                    <td className="align-middle" style={{ color: theme.textSecondary, whiteSpace: 'nowrap' }}>
                      {formatDate(supportCase.created_at)}
                    </td>
                    <td className="align-middle" style={{ color: theme.textSecondary, whiteSpace: 'nowrap' }}>
                      {formatDate(supportCase.updated_at)}
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between mt-3 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: '12px', color: theme.textMuted }}>
                Showing {(currentPage - 1) * config.rowsPerPage + 1}-
                {Math.min(currentPage * config.rowsPerPage, filteredCases.length)} of{' '}
                {filteredCases.length}
              </span>
              <div className="d-flex align-items-center gap-1">
                <IconButton
                  size="small"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  sx={{ color: theme.textSecondary }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <span style={{ fontSize: '12px', color: theme.textSecondary, minWidth: '60px', textAlign: 'center' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <IconButton
                  size="small"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  sx={{ color: theme.textSecondary }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SupportCaseList;
