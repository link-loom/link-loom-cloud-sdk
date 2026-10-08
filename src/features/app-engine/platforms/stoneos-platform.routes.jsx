import React from "react";
import { Route, useParams, useResolvedPath } from "react-router-dom";

import { platformLabels, platformsForSettings } from "../../../components/app-engine/defaults/stoneos-platforms.catalog";
import PlatformHub from "../../../components/app-engine/platforms/PlatformHub.component";
import SupportCenterLayout from "../../../components/support/center/SupportCenterLayout.component";
import { supportCenterChildRoutes } from "../../support/center/support-center.routes";

const SUPPORT_PATH = "support";

const findPlatform = (platforms, platformId) => platforms.find((platform) => platform.id === platformId);

function PlatformHubRoute({ platforms, sectionsFor, locale, iconBasePath, labels }) {
  const { platformId } = useParams();
  const { pathname } = useResolvedPath("");
  const platform = findPlatform(platforms, platformId);

  if (!platform) {
    return null;
  }

  return (
    <PlatformHub
      platform={platform}
      locale={locale}
      sections={sectionsFor(platform)}
      supportPath={`${pathname}/${SUPPORT_PATH}`}
      iconBasePath={iconBasePath}
      labels={labels}
    />
  );
}

function PlatformSupportRoute({ platforms, support, locale }) {
  const { platformId } = useParams();
  const platform = findPlatform(platforms, platformId);

  if (!platform) {
    return null;
  }

  return (
    <SupportCenterLayout
      key={platform.id}
      {...support}
      locale={locale}
      namespaceSlug={platform.supportNamespaceSlug}
      productSlug={platform.id}
      productDisplayName={platformLabels(platform, locale).name}
    />
  );
}

/**
 * The routes of the StoneOS platforms, `platforms/:platformId` and `platforms/:platformId/support` with
 * its sub-pages, for the host to place under its own base route, next to its other domain routes:
 *
 *   <Route path="/client" element={<LayoutClient />}>{stoneOSPlatformRoutes({ sectionsFor })}</Route>
 *
 * The first is the hub of a platform; `sectionsFor(platform)` returns the cards the host has built for
 * it (`[{ to, title, description, Icon }]`, none while the host has not). The second is the platform's
 * help center, a `SupportCenterLayout` on the platform's support namespace; `support` carries what the
 * host gives every center (`assistant`, `renderBridge`, `originSurface`, `labels`, `baseUrl`). An id the
 * list does not have renders nothing. `labels` are the hub's.
 */
const stoneOSPlatformRoutes = ({
  platforms = platformsForSettings(),
  sectionsFor = () => [],
  support = {},
  locale = "en",
  iconBasePath,
  labels,
} = {}) => (
  <Route path="platforms">
    <Route
      path=":platformId"
      element={
        <PlatformHubRoute platforms={platforms} sectionsFor={sectionsFor} locale={locale} iconBasePath={iconBasePath} labels={labels} />
      }
    />
    <Route
      path={`:platformId/${SUPPORT_PATH}`}
      element={<PlatformSupportRoute platforms={platforms} support={support} locale={locale} />}
    >
      {supportCenterChildRoutes()}
    </Route>
  </Route>
);

export default stoneOSPlatformRoutes;
