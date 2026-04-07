import React from 'react';
import InboxIcon from '@mui/icons-material/Inbox';
import { SUPPORT_THEME } from '../defaults/support.defaults';

const SupportEmptyState = ({ message, icon: IconComponent, ...props }) => {
  const Icon = IconComponent || InboxIcon;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5" {...props}>
      <Icon sx={{ fontSize: 48, color: SUPPORT_THEME.textMuted, mb: 1 }} />
      <p className="text-muted mb-0 mt-2" style={{ fontSize: '14px' }}>
        {message || 'No data available'}
      </p>
    </div>
  );
};

export default SupportEmptyState;
