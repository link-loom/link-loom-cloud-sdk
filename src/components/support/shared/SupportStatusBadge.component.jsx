import React from 'react';
import { styled } from '@mui/material/styles';
import { STATUS_CONFIG } from '../defaults/support.defaults';

const BadgePill = styled('span')(({ $color, $bg }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '3px 10px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: 1.4,
  color: $color,
  backgroundColor: $bg,
  whiteSpace: 'nowrap',
}));

const StatusDot = styled('span')(({ $color }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: $color,
  flexShrink: 0,
}));

const SupportStatusBadge = ({ status, ...props }) => {
  const statusName = typeof status === 'object' ? status?.name : status;
  const normalizedStatus = (statusName || '').toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.open;

  return (
    <BadgePill $color={config.color} $bg={config.bg} {...props}>
      <StatusDot $color={config.color} />
      {config.label}
    </BadgePill>
  );
};

export default SupportStatusBadge;
