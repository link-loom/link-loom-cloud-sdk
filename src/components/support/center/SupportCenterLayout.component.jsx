import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useOutletContext, useResolvedPath } from "react-router-dom";
import { useAuth } from "@veripass/react-sdk";
import { OnPageLoaded } from "@link-loom/react-sdk";

import { SupportSDKProvider, useSupportSDK } from "../../../features/support/context/SupportSDK.context";
import { mergeDefaults } from "../../app-engine/defaults/appEngine.defaults";
import { getDiagnosticsLogs, installDiagnosticsCapture } from "./diagnostics-capture";
import { SUPPORT_ACTIONS, SUPPORT_SEGMENTS, resolveActionRoute } from "./support-center.navigation";
import { SUPPORT_CENTER_LABELS } from "./support-center.labels";
import SupportCenterNotice from "./SupportCenterNotice.component";
import SupportDiagnosticsModal from "./SupportDiagnosticsModal.component";

const RESOLVED_STATUS = { name: "resolved", title: "Resolved" };
const CLOSED_STATUS = { name: "closed", title: "Closed" };
const RECENT_CASES_PAGE_SIZE = 5;

function SupportCenterInner({
  namespaceSlug,
  productSlug,
  productDisplayName,
  originSurface,
  environment,
  assistant,
  renderBridge,
  labels,
}) {
  // Hooks
  const navigate = useNavigate();
  const { pathname: basePath } = useResolvedPath("");
  const hostContext = useOutletContext();
  const { user } = useAuth();
  const {
    supportNamespaceService,
    supportIssueCategoryService,
    supportCaseService,
    supportCaseMessageService,
    supportIncidentService,
    supportQuickGuideService,
  } = useSupportSDK();

  // Models
  const [namespace, setNamespace] = useState(null);
  const [categories, setCategories] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [caseStatuses, setCaseStatuses] = useState({});
  const [guides, setGuides] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseMessages, setCaseMessages] = useState([]);
  const [llmProviders, setLlmProviders] = useState([]);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [diagnosticsContext, setDiagnosticsContext] = useState(null);

  // UI States
  const [isLoading, setIsLoading] = useState(true);

  // Configs
  const organizationId = user?.payload?.organization_id;
  const userId = user?.identity;
  const userDisplayName = user?.payload?.profile?.display_name;

  const supportContext = {
    supportNamespaceSlug: namespaceSlug,
    productSlug,
    productDisplayName,
    organizationId,
    userId,
    userDisplayName,
    currentRoute: window.location.pathname,
    environment,
    originSurface,
    console_logs: getDiagnosticsLogs(),
  };

  // Component Functions
  const loadLlmProviders = () => {
    if (!assistant?.llmProviderService) {
      return;
    }

    // Deliberately not awaited with the rest: the list feeds only the assistant, and it is the one call
    // that leaves Link Loom Cloud. When that backend is unreachable the request burns the whole timeout,
    // and awaiting it would hold the entire center on "loading" even though everything else arrived.
    assistant.llmProviderService
      .getByParameters({ queryselector: "all" })
      .then((providersResponse) => setLlmProviders(providersResponse?.result?.items || []))
      .catch(() => setLlmProviders([]));
  };

  const fetchSupportData = async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      const namespaceResponse = await supportNamespaceService.getByParameters({ queryselector: "slug", search: namespaceSlug });
      const resolvedNamespace = namespaceResponse?.result?.items?.[0] || namespaceResponse?.result || null;
      setNamespace(resolvedNamespace);

      const namespaceId = resolvedNamespace?.id;
      if (!namespaceId) {
        setIsLoading(false);
        return;
      }

      loadLlmProviders();

      const [categoriesResponse, incidentsResponse, casesResponse, guidesResponse, statusesResponse] = await Promise.all([
        supportIssueCategoryService.getByParameters({ queryselector: "support-namespace-id", search: namespaceId }),
        supportIncidentService.getByParameters({ queryselector: "support-namespace-id", search: namespaceId }),
        supportCaseService.getByParameters({ queryselector: "requester-user-id", search: userId, pageSize: RECENT_CASES_PAGE_SIZE }),
        supportQuickGuideService.getByParameters({ queryselector: "support-namespace-id", search: namespaceId }),
        supportCaseService.getByParameters({ queryselector: "status" }),
      ]);

      setCategories(categoriesResponse?.result?.items || []);
      setIncidents(incidentsResponse?.result?.items || []);
      setRecentCases(casesResponse?.result?.items || []);
      setGuides(guidesResponse?.result?.items || []);
      setCaseStatuses(statusesResponse?.result || {});
    } catch (error) {
      console.error(`[SupportCenter:${namespaceSlug}] Error loading support data`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCaseMessages = async (caseId) => {
    try {
      const response = await supportCaseMessageService.getByParameters({ queryselector: "support-case-id", search: caseId });
      setCaseMessages(response?.result?.items || []);
    } catch (error) {
      console.error(`[SupportCenter:${namespaceSlug}] Error loading case messages`, error);
    }
  };

  const refreshCaseInList = (updatedCase) => {
    if (!updatedCase?.id) return;
    setRecentCases((previous) =>
      previous.map((supportCase) => (supportCase.id === updatedCase.id ? { ...supportCase, ...updatedCase } : supportCase)),
    );
  };

  const removeCaseFromList = (caseId) => {
    setRecentCases((previous) => previous.filter((supportCase) => supportCase.id !== caseId));
  };

  const handleCreateCase = async (caseData) => {
    try {
      const response = await supportCaseService.create({
        title: caseData.summary,
        summary: caseData.summary,
        details: caseData.details,
        severity: caseData.severity,
        business_impact: caseData.business_impact,
        issue_category_id: caseData.category_id,
        support_namespace_id: namespace?.id || namespaceSlug,
        organization_id: organizationId,
        requester_user_id: userId,
        origin_surface: originSurface,
        source_type: "manual_case",
        diagnostics_snapshot: {
          environment: supportContext.environment,
          current_route: supportContext.currentRoute,
          browser: caseData.browser,
          os: caseData.os,
          user_id: userId,
          organization_id: organizationId,
        },
      });

      if (!response?.success) return;

      const createdCase = response?.result;
      await fetchSupportData();

      if (!createdCase?.id) {
        navigate(`${basePath}/${SUPPORT_SEGMENTS.cases}`);
        return;
      }

      setSelectedCase(createdCase);
      fetchCaseMessages(createdCase.id);
      navigate(`${basePath}/${SUPPORT_SEGMENTS.case}/${createdCase.id}`);
    } catch (error) {
      console.error(`[SupportCenter:${namespaceSlug}] Error creating case`, error);
    }
  };

  const updateCaseStatus = async ({ caseId, supportCase, status }) => {
    try {
      const response = await supportCaseService.update({ id: caseId, status });
      if (!response?.success) return null;

      const updatedCase = { ...supportCase, status };
      refreshCaseInList(updatedCase);
      return updatedCase;
    } catch (error) {
      console.error(`[SupportCenter:${namespaceSlug}] Error updating case status`, error);
      return null;
    }
  };

  const finishCase = async ({ caseId, supportCase }, status) => {
    const updatedCase = await updateCaseStatus({ caseId, supportCase, status });
    if (!updatedCase) return;

    setSelectedCase((previous) => (previous?.id === caseId ? updatedCase : previous));
  };

  const handleCaseDelete = async ({ caseId }) => {
    try {
      const response = await supportCaseService.delete({ id: caseId });
      if (!response?.success) return;
      removeCaseFromList(caseId);
    } catch (error) {
      console.error(`[SupportCenter:${namespaceSlug}] Error deleting case`, error);
    }
  };

  const handleCaseReply = async (caseId, message) => {
    try {
      await supportCaseMessageService.create({
        support_case_id: caseId,
        author_type: "requester",
        author_user_id: userId,
        message_type: "comment",
        body: message,
      });

      await fetchCaseMessages(caseId);
    } catch (error) {
      console.error(`[SupportCenter:${namespaceSlug}] Error replying to case`, error);
    }
  };

  const openCase = (payload) => {
    setSelectedCase(payload?.supportCase);
    fetchCaseMessages(payload?.supportCase?.id);
  };

  // What an action does to the center besides taking the person somewhere (`resolveActionRoute`).
  const actionEffects = {
    [SUPPORT_ACTIONS.CASE_CREATE]: (payload) => handleCreateCase(payload?.caseData),
    [SUPPORT_ACTIONS.CASE_CLICK]: openCase,
    [SUPPORT_ACTIONS.CASE_VIEW]: openCase,
    [SUPPORT_ACTIONS.BACK_TO_HUB]: () => setSelectedCase(null),
    [SUPPORT_ACTIONS.CASE_UPDATE_STATUS]: updateCaseStatus,
    [SUPPORT_ACTIONS.CASE_RESOLVE]: (payload) => finishCase(payload, RESOLVED_STATUS),
    [SUPPORT_ACTIONS.CASE_CLOSE]: (payload) => finishCase(payload, CLOSED_STATUS),
    [SUPPORT_ACTIONS.CASE_DELETE]: handleCaseDelete,
    [SUPPORT_ACTIONS.CASE_REPLY]: (payload) => handleCaseReply(payload?.caseId, payload?.body),
    [SUPPORT_ACTIONS.CASE_UPDATE_METADATA]: () =>
      console.warn(`[SupportCenter:${namespaceSlug}] case-update-metadata not implemented yet`),
    [SUPPORT_ACTIONS.DIAGNOSTICS_VIEW]: (payload) => {
      setDiagnosticsContext(payload?.context || supportContext);
      setShowDiagnosticsModal(true);
    },
  };

  const handleItemOnAction = ({ action, payload }) => {
    actionEffects[action]?.(payload);

    const route = resolveActionRoute(action, payload);
    if (!route) return;

    navigate(`${basePath}${route}`);
  };

  // Lifecycle
  useEffect(() => {
    installDiagnosticsCapture();
  }, []);

  useEffect(() => {
    fetchSupportData();
  }, [organizationId, userId]);

  // Render
  if (isLoading) {
    return <SupportCenterNotice minHeight={400}>{labels.loading}</SupportCenterNotice>;
  }

  return (
    <>
      <Outlet
        context={{
          namespace,
          categories,
          incidents,
          recentCases,
          caseStatuses,
          guides,
          selectedCase,
          setSelectedCase,
          caseMessages,
          supportContext,
          handleItemOnAction,
          fetchCaseMessages,
          llmProviders,
          assistant,
          renderBridge,
          labels,
          setPageName: hostContext?.setPageName,
        }}
      />

      <SupportDiagnosticsModal
        isOpen={showDiagnosticsModal}
        setIsOpen={setShowDiagnosticsModal}
        context={diagnosticsContext}
        labels={labels.diagnostics}
      />
    </>
  );
}

/**
 * The help center of one product, mounted as a layout route: it loads the product's support namespace
 * (categories, incidents, guides, the person's cases) and hands it to the sub-pages through the outlet
 * context, then turns the `link-loom-support::*` actions they raise into navigation and case updates.
 * Its base path is the route it is mounted on, so a host can put it anywhere.
 *
 * `assistant` is optional and comes from the host — `{ executionService, llmProviderService,
 * components: { CognitiveEntry, ChatBubble, SystemResponse } }` — because the assistant runs on the
 * host's AI platform; without it the center offers no assistant. `renderBridge(subPageId, props)`
 * returns what the host wants rendered next to a sub-page (its Command Center context). `baseUrl` is
 * the Link Loom Cloud backend and `environment` the label printed in diagnostics; they fall back to the
 * host's Vite variables (`VITE_LOOM_CLOUD_BACKEND_URL`, `VITE_APP_BLACKWOOD_APPS_ENVIRONMENT`).
 */
function SupportCenterLayout({ baseUrl, locale = "en", labels, environment, ...centerProps }) {
  const copy = useMemo(() => mergeDefaults(SUPPORT_CENTER_LABELS[locale] || SUPPORT_CENTER_LABELS.en, labels), [locale, labels]);

  return (
    <SupportSDKProvider baseUrl={baseUrl}>
      {/* Nothing else lifts the host's loading overlay on a hard load into a support route, and it must
          sit outside the inner component's loading state so it lifts before the data arrives. */}
      <OnPageLoaded />
      <SupportCenterInner
        {...centerProps}
        environment={environment ?? import.meta.env?.VITE_APP_BLACKWOOD_APPS_ENVIRONMENT}
        labels={copy}
      />
    </SupportSDKProvider>
  );
}

export default SupportCenterLayout;
