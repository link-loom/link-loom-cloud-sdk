import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CALENDAR_REMINDER_SIGNAL,
  buildAppRuntimeDeepLink,
  isAppPath,
  notificationSignalNames,
  signalToNotification,
} from "../src/components/app-engine/notifications/app-notification-signals.js";

const NOTICE = {
  appSlug: "stoneos-accounting",
  organizationId: "org-1",
  title: "Record approved",
  titles: { en: "Record approved", es: "Registro aprobado" },
  body: '"Quarterly close" was approved.',
  bodies: { es: "Se aprobó «Quarterly close»." },
  severity: "success",
  deepLink: "/records?id=rec-1",
  tag: "review_approved:rec-1",
};

describe("app notification signals", () => {
  it("listens to the calendar reminder and to <app>.notify of each app, once", () => {
    assert.deepEqual(notificationSignalNames(["stoneos-a", "stoneos-b", "stoneos-a", ""]), [
      CALENDAR_REMINDER_SIGNAL,
      "stoneos-a.notify",
      "stoneos-b.notify",
    ]);
  });

  it("turns an app notice into a host notification, in the default language", () => {
    assert.deepEqual(signalToNotification("stoneos-accounting.notify", NOTICE), {
      appSlug: "stoneos-accounting",
      title: "Record approved",
      body: '"Quarterly close" was approved.',
      deepLink: "/records?id=rec-1",
      severity: "success",
      tag: "review_approved:rec-1",
    });
  });

  it("shows the text of the language of the person, falling back to the default for what is missing", () => {
    const notification = signalToNotification("stoneos-accounting.notify", NOTICE, { locale: "es" });

    assert.equal(notification.title, "Registro aprobado");
    assert.equal(notification.body, "Se aprobó «Quarterly close».");

    const french = signalToNotification("stoneos-accounting.notify", NOTICE, { locale: "fr" });

    assert.equal(french.title, "Record approved");
    assert.equal(french.body, '"Quarterly close" was approved.');

    const onlyTitle = signalToNotification("stoneos-accounting.notify", { ...NOTICE, bodies: { es: "  " } }, { locale: "es" });

    assert.equal(onlyTitle.body, '"Quarterly close" was approved.');
  });

  it("ignores a notice about another organization than the one of this window", () => {
    assert.equal(signalToNotification("stoneos-accounting.notify", NOTICE, { organizationId: "org-2" }), null);
    assert.ok(signalToNotification("stoneos-accounting.notify", NOTICE, { organizationId: "org-1" }));
    assert.ok(signalToNotification("stoneos-accounting.notify", NOTICE));
    assert.ok(signalToNotification("stoneos-accounting.notify", { ...NOTICE, organizationId: undefined }, { organizationId: "org-2" }));
  });

  it("keeps only a path inside the app and a known severity", () => {
    for (const deepLink of ["https://evil.example/x", "//evil.example", "records", 7, undefined]) {
      assert.equal(signalToNotification("stoneos-accounting.notify", { ...NOTICE, deepLink }).deepLink, null);
    }

    assert.equal(signalToNotification("stoneos-accounting.notify", { ...NOTICE, severity: "urgent" }).severity, "info");
  });

  it("never lets a path climb out of the app with dot segments, but keeps dots that are only text", () => {
    for (const deepLink of ["/../work", "/records/../../work", "/records/..", "/./records", "/%2e%2E/work", "/records/%2E%2e/x?id=1"]) {
      assert.equal(isAppPath(deepLink), false, deepLink);
      assert.equal(signalToNotification("stoneos-accounting.notify", { ...NOTICE, deepLink }).deepLink, null, deepLink);
    }

    for (const deepLink of ["/records?id=a..b", "/records?back=/../x", "/v1.2/records", "/records/file..name", "/"]) {
      assert.equal(isAppPath(deepLink), true, deepLink);
    }

    for (const deepLink of ["/records with spaces", "/records\\x", "//host", "records", "", null, 5]) {
      assert.equal(isAppPath(deepLink), false, String(deepLink));
    }
  });

  it("ignores signals that are not notifications", () => {
    assert.equal(signalToNotification("stoneos-accounting.notify", { ...NOTICE, title: " " }), null);
    assert.equal(signalToNotification("stoneos-accounting.notify", null), null);
    assert.equal(signalToNotification("typing", NOTICE), null);
    assert.equal(signalToNotification(".notify", NOTICE), null);
  });

  it("takes the app of a calendar reminder from its payload, defaulting to Calendar", () => {
    assert.equal(signalToNotification(CALENDAR_REMINDER_SIGNAL, { title: "Standup" }).appSlug, "stoneos-calendar");
    assert.equal(signalToNotification(CALENDAR_REMINDER_SIGNAL, { title: "Standup", appSlug: "stoneos-x" }).appSlug, "stoneos-x");
  });

  it("opens a notification in the runtime of its app, at its path", () => {
    assert.equal(
      buildAppRuntimeDeepLink({ appSlug: "stoneos-accounting", deepLink: "/records?id=rec-1" }),
      "/client/app-engine/runtime/stoneos-accounting/records?id=rec-1",
    );
    assert.equal(
      buildAppRuntimeDeepLink({ appSlug: "stoneos-accounting", deepLink: null }),
      "/client/app-engine/runtime/stoneos-accounting",
    );
  });
});
