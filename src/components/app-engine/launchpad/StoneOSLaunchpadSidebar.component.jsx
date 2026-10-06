import React from "react";
import { GlobalStyles } from "@mui/material";
import { SidebarFooter, useSidebarCondensed } from "@link-loom/react-sdk";

import LaunchpadRailComponent from "./LaunchpadRail.component";
import { STONEOS_LAUNCHPAD_SIDEBAR_STYLES } from "./StoneOSLaunchpadSidebar.styles";

/**
 * The StoneOS Launchpad sidebar: the launchpad rail on the left, the host's navigation beside it and
 * the host's footer (the organization switcher) at the foot of the navigation's column.
 *
 * It owns the aside, the column math (navigation + rail + inset, 298px, or 128px condensed) and the
 * look of the navigation, and nothing of what is in it: `children` are the host's `<li>` modules,
 * rendered inside `#sidebar-menu`. Rows that are links use `SidebarLinkRow` (`@link-loom/react-sdk`);
 * a module that wants a small grey section label wraps its group in `ll-sidebar-section`.
 *
 * The layout engine of the host (Adminto's app.js) sets the size on the body and the sidebar follows
 * it. Every size and colour is a `--stos-*` token the host can redefine on `:root`.
 */
function StoneOSLaunchpadSidebar({ children, footer, baseUrl }) {
  const isCondensed = useSidebarCondensed();

  return (
    <>
      <GlobalStyles styles={STONEOS_LAUNCHPAD_SIDEBAR_STYLES} />
      <aside className="left-side-menu p-0">
        <div className="d-flex flex-column h-100">
          <div className="flex-grow-1 overflow-hidden stos-leftbar">
            <LaunchpadRailComponent baseUrl={baseUrl} />
            <div className="stos-leftbar__col">
              <div className="stos-leftbar__nav">
                <section id="sidebar-menu">
                  <ul id="side-menu">{children}</ul>
                </section>
                <div className="clearfix"></div>
              </div>

              {footer && <SidebarFooter condensed={isCondensed}>{footer}</SidebarFooter>}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default StoneOSLaunchpadSidebar;
