import React from "react";
import { GlobalStyles } from "@mui/material";

import { LAUNCHPAD_THEME as THEME } from "../defaults/launchpad.theme";

const TOPBAR = THEME.topbarHeight;

// While a frame is on screen the host's `.content-page` is the frame's own ground: it starts right
// under the top bar and runs to the sidebar and to the right edge, with the StoneOS page colour behind
// it, whatever padding or margin the host's layout gives its other pages. The host's footer takes the
// sidebar's white, a hairline and the same 14px of air in every host (the App Store counts on a footer of about 50px), so it never reads as part of the page's blue-grey. `:has` keeps the
// rule on the pages that render a frame; the `html` in front outranks the host's own `.content-page` rules.
const PAGE_FRAME_STYLES = `
  .stos-page-frame {
    width: 100%;
    min-height: calc(100vh - ${TOPBAR});
    background: ${THEME.bgPage};
  }
  html body .content-page:has(.stos-page-frame) {
    margin-top: 0 !important;
    padding: ${TOPBAR} 0 0 !important;
    background: ${THEME.bgPage};
  }
  html body .content-page:has(.stos-page-frame) .content:has(> .stos-page-frame) {
    margin: 0 !important;
    padding: 0 !important;
  }
  html body .content-page:has(.stos-page-frame) .footer {
    background: var(--stos-bg-surface, #ffffff);
    border-top: 1px solid var(--stos-border, #e4e8ef);
    padding: 14px 24px;
  }
`;

/**
 * The ground of a StoneOS page (My apps, the App Store): the host's layout stays around it, and the
 * page takes the whole window between the sidebar and the edge, under the top bar, on its own
 * background. Hosts do not render it: `StoneOSAppsPage` and `StoneOSStorePage` do.
 */
function StoneOSPageFrame({ children }) {
  return (
    <>
      <GlobalStyles styles={PAGE_FRAME_STYLES} />
      <div className="stos-page-frame">{children}</div>
    </>
  );
}

export default StoneOSPageFrame;
