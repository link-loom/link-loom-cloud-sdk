import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box, Typography } from "@mui/material";
import { Verified as VerifiedIcon } from "@mui/icons-material";

import { useAppEngineSDK } from "@/features/app-engine/context/AppEngineSDK.context";
import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { categoryTitle, formatDate, isOwned, priceNote, priceShort, publisherOf } from "@/features/app-engine/app-store/app-store.format";
import { STORE_VIEWS } from "@/features/app-engine/app-store/app-store.routes";
import { STORE_PILL_SIZES, STORE_PILL_TONES, enumName } from "@/features/app-engine/app-store/app-store.enums";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { appChipSx, focusRingSx, overlineSx, surfaceSx, textLinkSx, visuallyHiddenSx } from "../app-store.styles";
import AppStoreActionButtonComponent from "../subcomponents/AppStoreActionButton.component";
import AppStoreAppGlyphComponent from "../subcomponents/AppStoreAppGlyph.component";
import AppStoreDeveloperDetailsComponent from "../subcomponents/AppStoreDeveloperDetails.component";
import AppStoreMediaGalleryComponent from "../subcomponents/AppStoreMediaGallery.component";
import AppStoreOwnerMenuComponent from "../subcomponents/AppStoreOwnerMenu.component";
import AppStorePillComponent from "../subcomponents/AppStorePill.component";
import { HeaderSkeleton, SkeletonBlock } from "../subcomponents/AppStoreSkeleton.component";
import { AppStoreEmptyState, AppStoreErrorState } from "../subcomponents/AppStoreStatus.component";

const MARKDOWN_SX = {
  fontSize: 14,
  lineHeight: 1.55,
  color: COLORS.textBody,
  "& p": { m: "0 0 10px" },
  "& p:last-child": { mb: 0 },
  "& ul, & ol": { my: 0.5, pl: 2.5 },
  "& code": { backgroundColor: COLORS.chip, px: 0.5, borderRadius: "3px", fontSize: 12 },
  "& a": { color: COLORS.accent },
  "& a:hover": { color: COLORS.accentHover },
};

// The facts panel: a muted panel inside the page's card, as many columns as its own width allows.
const INFO_PANEL_SX = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: "16px 20px",
  alignContent: "start",
  p: "18px 20px",
  borderRadius: "14px",
  backgroundColor: COLORS.surfaceMuted,
};

// The suite and category of an app, under its name: the suite a filled chip, the category an outlined one.
const tagSx = (filled) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75,
  px: "9px",
  py: "3px",
  borderRadius: "999px",
  border: `1px solid ${filled ? "transparent" : COLORS.hairline}`,
  backgroundColor: filled ? COLORS.chip : "transparent",
  color: filled ? COLORS.textBody : COLORS.textSecondary,
  fontSize: 11,
  fontWeight: filled ? 600 : 500,
  lineHeight: 1.4,
  textDecoration: "none",
  "&:hover": { borderColor: COLORS.hairlineStrong, color: COLORS.ink, textDecoration: "none" },
  ...focusRingSx,
});

const sectionTitleSx = { fontSize: 15, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink, mb: 1 };

function InfoItem({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="p" sx={{ fontSize: 11, lineHeight: 1.4, color: COLORS.textTertiary }}>
        {label}
      </Typography>
      <Typography component="div" sx={{ mt: "3px", fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: COLORS.ink, wordBreak: "break-word" }}>
        {children}
      </Typography>
    </Box>
  );
}

// The app page while it loads: its card with the header, the media row and the two columns.
function DetailSkeleton({ label }) {
  return (
    <Box role="status" aria-busy="true" sx={{ ...surfaceSx, p: { xs: 2, sm: 3, md: 4 } }}>
      <Box component="span" sx={visuallyHiddenSx}>
        {label}
      </Box>
      <Box sx={{ mb: 3.5 }}>
        <HeaderSkeleton glyph={96} action />
      </Box>
      <Box className="d-flex flex-wrap" sx={{ gap: 4 }}>
        <Box className="d-flex flex-column gap-2" sx={{ flex: "1.4 1 320px", minWidth: 0 }}>
          <SkeletonBlock width={80} height={14} sx={{ mb: 0.5 }} />
          <SkeletonBlock height={11} />
          <SkeletonBlock height={11} />
          <SkeletonBlock width="60%" height={11} />
        </Box>
        <SkeletonBlock height={150} radius="14px" sx={{ flex: "1 1 260px", width: "auto" }} />
      </Box>
    </Box>
  );
}

/**
 * An app's page in the store: who makes it, what it costs and the one action it offers, its media,
 * what it does, the apps it works with and the facts a buyer checks (version, data access,
 * compliance, support). The technical blocks are folded under "For developers". Nothing here is
 * invented: ratings and adoption counts are not shown because the store does not have them.
 *
 * The page is one white card on the store's ground (the way back is in the tabs bar); the facts panel
 * and the developer section are nested surfaces inside it. While the app loads, the card's skeleton.
 */
function AppStoreAppDetailComponent({ slug }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { appStoreService } = useAppEngineSDK();
  const { labels, storePaths, revision, accessOf, isRemoved, navigateTo, reportView } = useAppStore();

  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const [app, setApp] = useState(null);

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const load = async () => {
    const response = await appStoreService.getApp({ slug });

    setIsLoading(false);

    if (!response?.success) {
      setApp(null);
      setLoadError(response?.status === 404 ? "not-found" : "failed");
      return;
    }

    setApp(response.result);
    setLoadError(null);
  };

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, revision]);

  useEffect(() => {
    reportView({ app, items: app ? [app] : [], totalItems: app ? 1 : 0 });
  }, [app, reportView]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (isLoading && (!app || app.slug !== slug)) {
    return <DetailSkeleton label={labels.loading} />;
  }

  if (!app || isRemoved(app)) {
    return loadError === "failed" ? (
      <AppStoreErrorState title={labels.loadFailed} retryLabel={labels.retry} onRetry={load} />
    ) : (
      <AppStoreEmptyState
        text={labels.detail.notFound}
        hint={labels.detail.notFoundHint}
        action={
          <AppStorePillComponent tone={STORE_PILL_TONES.neutral} size={STORE_PILL_SIZES.medium} onClick={() => navigateTo(STORE_VIEWS.discover)}>
            {labels.nav.discover}
          </AppStorePillComponent>
        }
      />
    );
  }

  const access = accessOf(app);
  const publisher = publisherOf(app);
  const store = app.store || {};
  const dataAccess = Array.isArray(store.data_access) ? store.data_access.filter(Boolean) : [];
  const compliance = Array.isArray(store.compliance) ? store.compliance.filter(Boolean) : [];
  const worksWith = Array.isArray(app.works_with_apps) ? app.works_with_apps : [];
  const version = app.active_version?.version || app.version;
  const updated = formatDate(labels, app.active_version?.published_at);

  return (
    <>
      <Box component="article" className="loom-store-fade" sx={{ ...surfaceSx, p: { xs: 2, sm: 3, md: 4 } }}>
        <Box component="header" className="d-flex flex-wrap align-items-start gap-4" sx={{ mb: 3.5 }}>
          <AppStoreAppGlyphComponent app={app} size={96} />
          <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <Box className="d-flex align-items-start gap-2">
              <Typography component="h1" sx={{ flex: 1, minWidth: 0, fontSize: { xs: 22, md: 26 }, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.1, color: COLORS.ink }}>
                {app.name}
              </Typography>
              {isOwned(access) && <AppStoreOwnerMenuComponent app={app} />}
            </Box>
            {(app.headline || app.subtitle) && (
              <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.45, color: COLORS.textSecondary, mt: 0.75 }}>
                {app.subtitle || app.headline}
              </Typography>
            )}
            <Box className="d-flex flex-wrap" sx={{ gap: 0.75, mt: 1.5, mb: 2 }}>
              {(app.suites || []).map((suite) => (
                <Box key={suite.slug} component={RouterLink} to={storePaths.suite(suite.slug)} sx={tagSx(true)}>
                  <Box component="span" sx={{ width: 8, height: 8, borderRadius: "3px", backgroundColor: suite.color || COLORS.accent }} />
                  {suite.name}
                </Box>
              ))}
              {app.category && (
                <Box component={RouterLink} to={storePaths.category(enumName(app.category))} sx={tagSx(false)}>
                  {categoryTitle(labels, app.category)}
                </Box>
              )}
            </Box>
            <Box className="d-flex flex-wrap align-items-center gap-3">
              <AppStoreActionButtonComponent app={app} onDetailPage />
              <Box>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink }}>
                  {priceShort(labels, app.pricing)}
                </Typography>
                <Typography component="p" sx={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textTertiary }}>
                  {priceNote(labels, { access, pricing: app.pricing })}
                </Typography>
              </Box>
            </Box>
          </Box>
          {publisher.name && (
            <Box sx={{ flex: "none", minWidth: 160 }}>
              <Typography component="p" sx={{ ...overlineSx, letterSpacing: "0.05em", fontWeight: 400 }}>
                {labels.detail.publisher}
              </Typography>
              <Box className="d-flex align-items-center gap-1" sx={{ mt: 0.5 }}>
                {publisher.url ? (
                  <Box component="a" href={publisher.url} target="_blank" rel="noopener noreferrer" sx={{ ...textLinkSx, fontSize: 18, fontWeight: 600, color: COLORS.ink }}>
                    {publisher.name}
                  </Box>
                ) : (
                  <Typography component="p" sx={{ fontSize: 18, fontWeight: 600, lineHeight: 1.3, color: COLORS.ink }}>
                    {publisher.name}
                  </Typography>
                )}
                {publisher.verified && <VerifiedIcon titleAccess={labels.detail.verified} sx={{ fontSize: 16, color: COLORS.successIcon }} />}
              </Box>
            </Box>
          )}
        </Box>

        <AppStoreMediaGalleryComponent resources={store.resources} />

        {/* Side by side while the card is wide enough, stacked below that: the card, not the window, decides. */}
        <Box className="d-flex flex-wrap align-items-start" sx={{ gap: 4 }}>
          <Box className="d-flex flex-column" sx={{ flex: "1.4 1 320px", minWidth: 0, gap: 3 }}>
            {app.description && (
              <Box component="section">
                <Typography component="h2" sx={sectionTitleSx}>
                  {labels.detail.about}
                </Typography>
                <Box sx={MARKDOWN_SX}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{app.description}</ReactMarkdown>
                </Box>
              </Box>
            )}
            {worksWith.length > 0 && (
              <Box component="section">
                <Typography component="h2" sx={sectionTitleSx}>
                  {labels.detail.worksWith}
                </Typography>
                <Box className="d-flex flex-wrap gap-2">
                  {worksWith.map((other) => (
                    <Box key={other.slug} component={RouterLink} to={storePaths.app(other.slug)} sx={{ ...appChipSx, fontSize: 12 }}>
                      <AppStoreAppGlyphComponent app={other} size={18} />
                      {other.name}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          <Box component="section" aria-label={labels.detail.information} sx={{ ...INFO_PANEL_SX, flex: "1 1 260px" }}>
            {version && <InfoItem label={labels.detail.version}>{version}</InfoItem>}
            {updated && <InfoItem label={labels.detail.updated}>{updated}</InfoItem>}
            {dataAccess.length > 0 && <InfoItem label={labels.detail.dataAccess}>{dataAccess.join(" · ")}</InfoItem>}
            {compliance.length > 0 && <InfoItem label={labels.detail.compliance}>{compliance.join(" · ")}</InfoItem>}
            {store.support_url && (
              <InfoItem label={labels.detail.support}>
                <Box component="a" href={store.support_url} target="_blank" rel="noopener noreferrer" sx={textLinkSx}>
                  {labels.detail.supportLink}
                </Box>
              </InfoItem>
            )}
            <InfoItem label={labels.detail.price}>
              {priceShort(labels, app.pricing)}
              <Typography component="span" sx={{ fontSize: 12, fontWeight: 400, color: COLORS.textTertiary, display: "block" }}>
                {priceNote(labels, { access, pricing: app.pricing })}
              </Typography>
            </InfoItem>
          </Box>
        </Box>

        <AppStoreDeveloperDetailsComponent app={app} />
      </Box>
    </>
  );
}

export default AppStoreAppDetailComponent;
