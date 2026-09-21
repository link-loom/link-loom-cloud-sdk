import React, { useEffect, useState } from "react";
import { Box, Dialog, DialogActions, DialogContent, LinearProgress, Typography } from "@mui/material";
import { CheckCircle as CheckCircleIcon, Verified as VerifiedIcon } from "@mui/icons-material";

import { useAppEngineSDK } from "@/features/app-engine/context/AppEngineSDK.context";
import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import useLaunchpadApps from "@/features/app-engine/launchpad/useLaunchpadApps.hook";
import fetchAllPages from "@/services/utils/fetchAllPages";
import { STORE_PILL_SIZES, STORE_PILL_TONES } from "@/features/app-engine/app-store/app-store.enums";
import { isPaid, isUsable, priceNote, priceText, publisherOf, suiteKindTitle } from "@/features/app-engine/app-store/app-store.format";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { STORE_DIALOG_SX, storePaperSx } from "../app-store.styles";
import AppStoreAppGlyphComponent from "./AppStoreAppGlyph.component";
import AppStorePillComponent from "./AppStorePill.component";
import AppStoreSuiteGlyphComponent from "./AppStoreSuiteGlyph.component";

// The dialog's two buttons: the way out (outlined) and the step forward (solid accent).
const SecondaryPill = (props) => <AppStorePillComponent tone={STORE_PILL_TONES.neutral} size={STORE_PILL_SIZES.medium} {...props} />;
const PrimaryPill = (props) => <AppStorePillComponent tone={STORE_PILL_TONES.accent} size={STORE_PILL_SIZES.medium} {...props} />;

const STEPS = { confirm: "confirm", progress: "progress", done: "done", failed: "failed" };

function Bullet({ children }) {
  return (
    <Box className="d-flex align-items-start gap-2">
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: COLORS.accent, flex: "none", mt: "7px" }} />
      <Typography component="p" sx={{ fontSize: 13, lineHeight: 1.5, color: COLORS.textBody }}>
        {children}
      </Typography>
    </Box>
  );
}

function InfoRow({ label, value, divided }) {
  return (
    <Box className="d-flex justify-content-between align-items-center gap-3" sx={{ px: 1.75, py: "11px", borderTop: divided ? `1px solid ${COLORS.hairlineSoft}` : 0 }}>
      <Typography component="span" sx={{ fontSize: 13, color: COLORS.textSecondary }}>
        {label}
      </Typography>
      <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, textAlign: "right" }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Getting an app or a suite, in three steps: confirm what it will be able to do and who gets it,
 * wait while access is granted, then say it is in My apps — pinned to the person's launchpad, so the
 * rail shows it at once — with the way to open it or keep browsing.
 *
 * Access is granted to the whole organization (`grant` / `grant-suite`). Nothing is charged here.
 * Mounted only while open, so the launchpad state it needs to pin is read only then.
 */
function AppStoreAcquireDialogComponent({ target, onClose }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { appStoreService, appEntitlementService } = useAppEngineSDK();
  const { labels, organizationName, onAcquired, accessOf, backToMyApps } = useAppStore();
  const { togglePin, launch } = useLaunchpadApps();

  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const [app, setApp] = useState(target.app || null);
  const [suiteApps, setSuiteApps] = useState([]);
  const [grantedCount, setGrantedCount] = useState(0);
  const [failure, setFailure] = useState("");

  // -----------------------------------------------------
  // 3. UI States
  // -----------------------------------------------------
  const [step, setStep] = useState(STEPS.confirm);

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const suite = target.suite || null;
  const subject = suite || app;
  const price = priceText(labels, subject?.pricing);
  const publisher = publisherOf(app);
  const dataAccess = Array.isArray(app?.store?.data_access) ? app.store.data_access.filter(Boolean) : [];
  const missingApps = suiteApps.filter((member) => !isUsable(accessOf(member)));
  const busy = step === STEPS.progress;

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const initializeComponent = async () => {
    if (suite) {
      const response = await fetchAllPages((params) => appStoreService.getApps(params), { suite: suite.slug });
      if (response?.success) setSuiteApps(response.result.items);
      return;
    }

    // A card carries the summary; what the app may access is on its page.
    if (!app?.store && app?.slug) {
      const response = await appStoreService.getApp({ slug: app.slug });
      if (response?.success) setApp((current) => ({ ...current, ...response.result }));
    }
  };

  const grantApp = async () => {
    const response = await appEntitlementService.grant({ appSlug: app.slug });

    if (!response?.success) {
      return response;
    }

    // Pinned for the person who asked for it, the way a phone puts a new app on the home screen.
    await togglePin({ kind: "app", id: app.id, slug: app.slug, name: app.name, is_pinned: false, is_favorite: false });
    onAcquired({ slugs: [app.slug] });
    return response;
  };

  const grantSuite = async () => {
    const response = await appEntitlementService.grantSuite({ suiteSlug: suite.slug });

    if (!response?.success) {
      return response;
    }

    const granted = Array.isArray(response.result?.granted) ? response.result.granted : [];
    setGrantedCount(granted.length);
    onAcquired({ slugs: granted });
    return response;
  };

  const confirm = async () => {
    setStep(STEPS.progress);
    setFailure("");

    const response = suite ? await grantSuite() : await grantApp();

    if (!response?.success) {
      setFailure(response?.message || "");
      setStep(STEPS.failed);
      return;
    }

    setStep(STEPS.done);
  };

  const openAcquired = () => {
    onClose();
    launch({ kind: "app", id: app.id, slug: app.slug });
  };

  const goToMyApps = () => {
    onClose();
    backToMyApps();
  };

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    initializeComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth={false}
      slotProps={{ paper: { sx: { ...storePaperSx(), width: 440, maxWidth: "calc(100% - 32px)", m: 2 } } }}
      aria-labelledby="loom-store-acquire-title"
      sx={STORE_DIALOG_SX}
    >
      <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 3.5, pb: 1 }}>
        <Box className="d-flex align-items-center gap-3" sx={{ mb: 2.75 }}>
          {suite ? <AppStoreSuiteGlyphComponent suite={suite} size={48} /> : <AppStoreAppGlyphComponent app={app} size={48} />}
          <Box sx={{ minWidth: 0 }}>
            <Typography id="loom-store-acquire-title" component="h2" noWrap sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink }}>
              {subject?.name}
            </Typography>
            <Typography component="p" className="d-flex align-items-center gap-1" sx={{ fontSize: 13, color: COLORS.textTertiary }}>
              {suite ? suiteKindTitle(labels, suite.kind) : publisher.name}
              {!suite && publisher.verified && <VerifiedIcon sx={{ fontSize: 13, color: COLORS.successIcon }} />}
              {" · "}
              {price || labels.card.free}
            </Typography>
          </Box>
        </Box>

        {step === STEPS.confirm && (
          <Box className="loom-store-fade">
            {!suite && dataAccess.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Typography component="p" sx={{ mb: 1.25, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                  {labels.acquire.ableTo}
                </Typography>
                <Box className="d-flex flex-column gap-1">
                  {dataAccess.map((line) => (
                    <Bullet key={line}>{line}</Bullet>
                  ))}
                </Box>
              </Box>
            )}
            {suite && missingApps.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Typography component="p" sx={{ mb: 1.25, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                  {labels.acquire.suiteApps}
                </Typography>
                <Box className="d-flex flex-wrap gap-2">
                  {missingApps.map((member) => (
                    <Box key={member.slug} className="d-inline-flex align-items-center gap-1" sx={{ pr: 1.25, pl: 0.5, py: 0.5, borderRadius: "999px", border: `1px solid ${COLORS.hairline}` }}>
                      <AppStoreAppGlyphComponent app={member} size={18} />
                      <Typography component="span" sx={{ fontSize: 12, fontWeight: 500, color: COLORS.ink }}>
                        {member.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            <Box sx={{ borderRadius: "10px", backgroundColor: COLORS.surfaceMuted, overflow: "hidden", mb: 1 }}>
              <InfoRow label={labels.acquire.installFor} value={labels.acquire.everyoneIn(organizationName)} />
              <InfoRow label={labels.acquire.price} value={price ? `${price} · ${priceNote(labels, { pricing: subject?.pricing })}` : labels.card.free} divided />
            </Box>
          </Box>
        )}

        {step === STEPS.progress && (
          <Box className="loom-store-fade" role="status" sx={{ py: 1.5 }}>
            <Typography component="p" sx={{ fontSize: 13, color: COLORS.textSecondary, mb: 1.25 }}>
              {suite ? labels.acquire.progressSuite : labels.acquire.progressApp}
            </Typography>
            <LinearProgress
              aria-label={suite ? labels.acquire.progressSuite : labels.acquire.progressApp}
              sx={{ height: 6, borderRadius: "3px", backgroundColor: COLORS.hover, "& .MuiLinearProgress-bar": { borderRadius: "3px", backgroundColor: COLORS.accent } }}
            />
          </Box>
        )}

        {step === STEPS.done && (
          <Box
            className="d-flex align-items-center gap-2 loom-store-fade"
            role="status"
            sx={{ px: 1.75, py: 1.5, borderRadius: "10px", color: COLORS.success, backgroundColor: COLORS.successTint, mb: 1 }}
          >
            <CheckCircleIcon sx={{ fontSize: 20, flex: "none", color: COLORS.successIcon }} />
            <Typography component="p" sx={{ fontSize: 13, fontWeight: 500, color: COLORS.success }}>
              {suite ? (grantedCount > 0 ? labels.acquire.doneSuite(grantedCount) : labels.acquire.doneSuiteNothing) : labels.acquire.doneApp}
            </Typography>
          </Box>
        )}

        {step === STEPS.failed && (
          <Box role="alert" className="loom-store-fade" sx={{ px: 1.75, py: 1.5, borderRadius: "10px", backgroundColor: COLORS.dangerTint, mb: 1 }}>
            <Typography component="p" sx={{ fontSize: 13, fontWeight: 600, color: COLORS.danger }}>
              {labels.acquire.failed}
            </Typography>
            {failure && (
              <Typography component="p" sx={{ fontSize: 13, color: COLORS.textSecondary, mt: 0.25 }}>
                {failure}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions disableSpacing className="flex-wrap" sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 3, pt: 1.5, gap: 1.25 }}>
        {step === STEPS.confirm && (
          <>
            <SecondaryPill onClick={onClose}>{labels.acquire.cancel}</SecondaryPill>
            <PrimaryPill onClick={confirm} disabled={!subject}>
              {suite
                ? price
                  ? labels.suite.getSuite(price)
                  : labels.acquire.confirmSuite
                : isPaid(app?.pricing)
                  ? labels.card.buy(price)
                  : labels.acquire.confirmApp}
            </PrimaryPill>
          </>
        )}
        {step === STEPS.progress && <PrimaryPill disabled>{suite ? labels.acquire.confirmSuite : labels.acquire.confirmApp}</PrimaryPill>}
        {step === STEPS.done && (
          <>
            <SecondaryPill onClick={onClose}>{labels.acquire.keepBrowsing}</SecondaryPill>
            {suite ? (
              <PrimaryPill onClick={goToMyApps}>{labels.nav.backToMyApps}</PrimaryPill>
            ) : (
              <PrimaryPill onClick={openAcquired}>{labels.acquire.open(app.name)}</PrimaryPill>
            )}
          </>
        )}
        {step === STEPS.failed && (
          <>
            <SecondaryPill onClick={onClose}>{labels.acquire.close}</SecondaryPill>
            <PrimaryPill onClick={confirm}>{labels.acquire.tryAgain}</PrimaryPill>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default AppStoreAcquireDialogComponent;
