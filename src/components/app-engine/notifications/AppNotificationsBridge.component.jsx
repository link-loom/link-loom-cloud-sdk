import React, { useEffect, useState, useCallback } from "react";
import * as LinkLoomReactSdk from "@link-loom/react-sdk";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { CloseOutlined as CloseOutlinedIcon } from "@mui/icons-material";

import AppRealtimeHub from "../../../features/app-engine/runtime/realtime/app-realtime.hub";
import { readIdentitySession } from "../../../features/app-engine/runtime/identity/identity-session";
import { getRuntimeConfig } from "../../../features/app-engine/runtime/shared/runtime-config";
import { notificationSignalNames, signalToNotification } from "./app-notification-signals";

export const APP_NOTIFICATION_EVENT = "stoneos::app-notification";
export const APP_NOTIFICATION_OPEN_EVENT = "stoneos::app-notification-open";
export const APP_NOTIFICATION_ACTION_EVENT = "stoneos::app-notification-action";

const NOTIFICATION_PREFS_KEY = "sommatic::notification-prefs";
const SEVERITY_ACCENTS = { info: "#3B82F6", success: "#22C55E", warning: "#F59E0B", error: "#EF4444" };

// Used only while the host runs a @link-loom/react-sdk version without `shouldNotify`.
const shouldNotifyFallback = ({ appSlug }) => {
  try {
    const preferences = JSON.parse(window.localStorage.getItem(NOTIFICATION_PREFS_KEY));
    if (!preferences) {
      return true;
    }
    if (preferences.muted === true || preferences.enabled === false) {
      return false;
    }
    return preferences.apps?.[appSlug]?.enabled !== false;
  } catch {
    return true;
  }
};

const shouldNotify = (options) =>
  typeof LinkLoomReactSdk.shouldNotify === "function" ? LinkLoomReactSdk.shouldNotify(options) : shouldNotifyFallback(options);

const isDesktopNotificationSupported = () => typeof window !== "undefined" && "Notification" in window;

export const requestDesktopNotificationPermission = async () => {
  if (!isDesktopNotificationSupported()) {
    return "unsupported";
  }
  if (Notification.permission !== "default") {
    return Notification.permission;
  }
  return Notification.requestPermission();
};

export const useDesktopNotificationPermission = () => {
  const [permission, setPermission] = useState(() =>
    isDesktopNotificationSupported() ? Notification.permission : "unsupported",
  );

  const requestPermission = useCallback(async () => {
    const result = await requestDesktopNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  return { permission, requestPermission };
};

const dispatchOpen = (notification) => {
  window.dispatchEvent(
    new CustomEvent(APP_NOTIFICATION_OPEN_EVENT, {
      detail: { appSlug: notification.appSlug, deepLink: notification.deepLink || null, tag: notification.tag || null },
    }),
  );
};

function AppNotificationCard({ notification, dismiss }) {
  const accent = SEVERITY_ACCENTS[notification.severity] || SEVERITY_ACCENTS.info;

  const handleOpen = () => {
    dispatchOpen(notification);
    dismiss();
  };

  const handleAction = (event, action) => {
    event.stopPropagation();
    window.dispatchEvent(
      new CustomEvent(APP_NOTIFICATION_ACTION_EVENT, {
        detail: {
          appSlug: notification.appSlug,
          actionId: action.id,
          tag: notification.tag || null,
          deepLink: notification.deepLink || null,
        },
      }),
    );
    dismiss();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => event.key === "Enter" && handleOpen()}
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "1rem",
        background: "#FFFFFF",
        borderRadius: "0.375rem",
        boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
        width: 340,
        borderLeft: `3px solid ${accent}`,
        cursor: "pointer",
      }}
    >
      {notification.avatarUrl && <Avatar src={notification.avatarUrl} sx={{ width: 32, height: 32 }} />}
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }} noWrap>
          {notification.title}
        </Typography>
        {notification.body && <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{notification.body}</Typography>}
        {notification.actions?.length > 0 && (
          <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.5rem" }}>
            {notification.actions.map((action) => (
              <Button key={action.id} size="small" variant="text" onClick={(event) => handleAction(event, action)}>
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      <IconButton
        size="small"
        aria-label="Dismiss"
        onClick={(event) => {
          event.stopPropagation();
          dismiss();
        }}
      >
        <CloseOutlinedIcon fontSize="small" />
      </IconButton>
    </div>
  );
}

const isHostFocused = () => document.visibilityState === "visible" && document.hasFocus();

const dispatchNotification = (notification) =>
  window.dispatchEvent(new CustomEvent(APP_NOTIFICATION_EVENT, { detail: notification }));

/**
 * Shows app notifications (`sdk.notify` and server signals) as toasts or desktop notifications,
 * filtered by the notification preferences of each app. Clicking one dispatches
 * `stoneos::app-notification-open` with `{ appSlug, deepLink, tag }`; the host navigates, e.g. to
 * `buildAppRuntimeDeepLink(detail)`.
 *
 * With `getIdentitySession` (the host's `useAuth().getToken`) and a Link Loom Cloud base URL, the
 * bridge also listens to `user:{veripass_identity}` for `calendar.reminder` and
 * `<app_slug>.notify` signals of the given `appSlugs`.
 */
function AppNotificationsBridge({ getIdentitySession, loomCloudBaseUrl, appSlugs = [] }) {
  const identitySession = readIdentitySession(getIdentitySession?.());
  const identityToken = identitySession?.token || "";
  const veripassIdentity = identitySession?.veripassIdentity || "";
  const organizationId = identitySession?.organizationId || "";
  const baseUrl = loomCloudBaseUrl || getRuntimeConfig().loomCloudBaseUrl;
  const signalNamesKey = notificationSignalNames(appSlugs).join(",");

  useEffect(() => {
    if (!identityToken || !veripassIdentity || !baseUrl || typeof EventSource === "undefined") {
      return undefined;
    }

    // Shareable: the `user:` channel rides on an open app-session connection of the same identity.
    const hub = new AppRealtimeHub({
      baseUrl,
      shareable: true,
      getParams: () => ({ platform: "web", access_token: identityToken, organization_id: organizationId || undefined }),
    });
    const disposers = signalNamesKey
      .split(",")
      .map((signalName) =>
        hub.on(signalName, (payload) => {
          const notification = signalToNotification(signalName, payload);
          if (notification) {
            dispatchNotification(notification);
          }
        }),
      );
    disposers.push(hub.addChannel(`user:${veripassIdentity}`));
    hub.ensureStream();

    return () => {
      disposers.forEach((dispose) => dispose());
      hub.dispose();
    };
  }, [identityToken, veripassIdentity, organizationId, baseUrl, signalNamesKey]);

  useEffect(() => {
    const handleNotification = (event) => {
      const notification = event?.detail;
      if (!notification?.title) {
        return;
      }

      const severity = notification.severity || "info";
      if (!shouldNotify({ appSlug: notification.appSlug, channel: "app", severity })) {
        return;
      }

      const showToast = () =>
        LinkLoomReactSdk.openToast({
          severity,
          title: notification.title,
          subtitle: notification.body,
          duration: notification.duration,
          renderCard: (dismiss) => <AppNotificationCard notification={{ ...notification, severity }} dismiss={dismiss} />,
        });

      if (isHostFocused()) {
        showToast();
        return;
      }

      // Without desktop notifications (unsupported, not granted, or turned off for the app) the toast
      // still waits in the page, instead of the notification being lost while the window has no focus.
      const desktopAllowed = shouldNotify({ appSlug: notification.appSlug, channel: "desktop", severity });
      if (!desktopAllowed || !isDesktopNotificationSupported() || Notification.permission !== "granted") {
        showToast();
        return;
      }

      const desktopNotification = new Notification(notification.title, {
        body: notification.body,
        icon: notification.avatarUrl,
        tag: notification.tag,
      });
      desktopNotification.onclick = () => {
        window.focus();
        dispatchOpen(notification);
        desktopNotification.close();
      };
    };

    window.addEventListener(APP_NOTIFICATION_EVENT, handleNotification);
    return () => window.removeEventListener(APP_NOTIFICATION_EVENT, handleNotification);
  }, []);

  return null;
}

export default AppNotificationsBridge;
