import React from 'react';
import * as MuiIcons from '@mui/icons-material';
import BoltIcon from '@mui/icons-material/Bolt';

/**
 * Resolve an MUI icon name (e.g. "Gavel", "Calculate", "TableChart") to a
 * rendered JSX element. Falls back to a Bolt icon when the name is missing
 * or unknown in the currently installed version of `@mui/icons-material`.
 */
export function resolveIconByName(name) {
  if (!name || typeof name !== 'string') {
    return React.createElement(BoltIcon);
  }

  const IconComponent = MuiIcons[name];
  if (!IconComponent) {
    return React.createElement(BoltIcon);
  }

  return React.createElement(IconComponent);
}
