import React from 'react';
import { styled } from '@mui/material/styles';
import { SEVERITY_CONFIG } from '../defaults/support.defaults';

const BadgePill = styled('span')(({ $color, $bg }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: 1.4,
  color: $color,
  backgroundColor: $bg,
  whiteSpace: 'nowrap',
}));

const SupportSeverityBadge = ({ severity, ...props }) => {
  const normalizedSeverity = (severity || '').toLowerCase();
  const config = SEVERITY_CONFIG[normalizedSeverity] || SEVERITY_CONFIG.low;

  return (
    <BadgePill $color={config.color} $bg={config.bg} {...props}>
      {config.label}
    </BadgePill>
  );
};

export default SupportSeverityBadge;
