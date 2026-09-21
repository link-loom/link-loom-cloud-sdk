import React from "react";
import { Link as RouterLink } from "react-router-dom";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import { STORE_PILL_SIZES, STORE_PILL_TONES } from "@/features/app-engine/app-store/app-store.enums";
import { isPaid, isUsable, priceText } from "@/features/app-engine/app-store/app-store.format";
import AppStorePillComponent from "./AppStorePill.component";

/**
 * The one action an app offers, as a pill, by what the organization has and what it costs:
 * - not in the organization yet: **Get** (a light pill) for a free app, **Buy · price** (solid) for a
 *   paid one; both open the acquisition dialog, which charges nothing by itself.
 * - already in it: **View**, a quiet outlined pill that goes to the app's page — on a card an app the
 *   organization has is something to look at, not something to launch, and the eye stays on what it
 *   can still add. **Open** (dark) exists only on the app's own page (`onDetailPage`).
 */
function AppStoreActionButtonComponent({ app, onDetailPage = false }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, storePaths, accessOf, acquire, openApp } = useAppStore();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const usable = isUsable(accessOf(app));
  const paid = isPaid(app?.pricing);
  const size = onDetailPage ? STORE_PILL_SIZES.large : STORE_PILL_SIZES.small;

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const onAcquire = (event) => {
    event.stopPropagation();
    acquire({ app });
  };

  const onOpen = (event) => {
    event.stopPropagation();
    openApp(app);
  };

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (usable && onDetailPage) {
    return (
      <AppStorePillComponent tone={STORE_PILL_TONES.dark} size={size} onClick={onOpen}>
        {labels.card.open}
      </AppStorePillComponent>
    );
  }

  if (usable) {
    return (
      <AppStorePillComponent
        tone={STORE_PILL_TONES.neutral}
        size={size}
        component={RouterLink}
        to={storePaths.app(app.slug)}
        aria-label={labels.card.viewApp(app.name)}
        onClick={(event) => event.stopPropagation()}
      >
        {labels.card.view}
      </AppStorePillComponent>
    );
  }

  return (
    <AppStorePillComponent tone={paid ? STORE_PILL_TONES.accent : STORE_PILL_TONES.tint} size={size} onClick={onAcquire}>
      {paid ? labels.card.buy(priceText(labels, app.pricing)) : labels.card.get}
    </AppStorePillComponent>
  );
}

export default AppStoreActionButtonComponent;
