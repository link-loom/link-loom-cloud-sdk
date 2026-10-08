import React from "react";
import { Navigate, Route } from "react-router-dom";

import SupportCenterLayout from "../../../components/support/center/SupportCenterLayout.component";
import { SUPPORT_SEGMENTS } from "../../../components/support/center/support-center.navigation";
import SupportAssistantSubPage from "../../../components/support/center/sub-pages/SupportAssistantSubPage.component";
import SupportCaseDetailSubPage from "../../../components/support/center/sub-pages/SupportCaseDetailSubPage.component";
import SupportCasesSubPage from "../../../components/support/center/sub-pages/SupportCasesSubPage.component";
import SupportCategoriesSubPage from "../../../components/support/center/sub-pages/SupportCategoriesSubPage.component";
import SupportGuideDetailSubPage from "../../../components/support/center/sub-pages/SupportGuideDetailSubPage.component";
import SupportHubSubPage from "../../../components/support/center/sub-pages/SupportHubSubPage.component";
import SupportNewCaseSubPage from "../../../components/support/center/sub-pages/SupportNewCaseSubPage.component";

/**
 * The routes under a support center's layout, relative to where the layout is mounted: the index goes
 * to the hub and `incidents` to the case list, where a person sees what is open.
 */
export const supportCenterChildRoutes = () => (
  <>
    <Route index element={<Navigate to={SUPPORT_SEGMENTS.hub} replace />} />
    <Route path={SUPPORT_SEGMENTS.hub} element={<SupportHubSubPage />} />
    <Route path={SUPPORT_SEGMENTS.cases} element={<SupportCasesSubPage />} />
    <Route path={SUPPORT_SEGMENTS.newCase} element={<SupportNewCaseSubPage />} />
    <Route path={`${SUPPORT_SEGMENTS.case}/:id`} element={<SupportCaseDetailSubPage />} />
    <Route path={SUPPORT_SEGMENTS.assistant} element={<SupportAssistantSubPage />} />
    <Route path={SUPPORT_SEGMENTS.incidents} element={<Navigate to={`../${SUPPORT_SEGMENTS.cases}`} replace />} />
    <Route path={`${SUPPORT_SEGMENTS.guide}/:slug`} element={<SupportGuideDetailSubPage />} />
    <Route path={SUPPORT_SEGMENTS.categories} element={<SupportCategoriesSubPage />} />
  </>
);

/**
 * A product's whole help center as one route group for the host to place where it wants it:
 *
 *   <Route path="veripass/support">{supportCenterRoutes({ namespaceSlug: "veripass", ... })}</Route>
 *
 * The group is a layout route without a path, so the center works out its base path from the route it
 * sits in. `namespaceSlug` picks the support namespace; `productSlug` and `productDisplayName` name the
 * product in cases and diagnostics; `originSurface` says which webapp raised a case. `assistant` and
 * `renderBridge` are the host's, see `SupportCenterLayout`.
 */
const supportCenterRoutes = ({
  namespaceSlug,
  productSlug,
  productDisplayName,
  originSurface,
  assistant = null,
  renderBridge,
  labels,
  locale,
  baseUrl,
  environment,
}) => (
  <Route
    element={
      <SupportCenterLayout
        namespaceSlug={namespaceSlug}
        productSlug={productSlug}
        productDisplayName={productDisplayName}
        originSurface={originSurface}
        assistant={assistant}
        renderBridge={renderBridge}
        labels={labels}
        locale={locale}
        baseUrl={baseUrl}
        environment={environment}
      />
    }
  >
    {supportCenterChildRoutes()}
  </Route>
);

export default supportCenterRoutes;
