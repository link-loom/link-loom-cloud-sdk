# Launchpad + App Store — Host Integration Runbook

How to put the StoneOS launchpad (the vertical rail in the sidebar and the "My apps" page) and the App
Store into a host webapp. Written for an agent integrating a host that has never had them. Read it top
to bottom once, then execute the steps in order.

The reference host is Mi Retail (`mi-retail/bsh.miretail.workspace.webapp`). It was bootstrapped from the
Sommatic client (`sommatic-ai/bsh.sommatic.client.webapp`), so the Sommatic client is "the template
before the launchpad". Every before/after below is written against that template; any Adminto-based
StoneOS host (Sommatic client, Link Loom Cloud client/admin) has the same skeleton.

---

## 1. What you get and what stays in the host

| Piece | Owner | Notes |
|---|---|---|
| `LaunchpadRailComponent` (rail) | SDK | Mounted by the host inside its sidebar. |
| `AppLaunchpadComponent` ("My apps") | SDK | Mounted by the host on a route. |
| `AppStoreComponent` (App Store) | SDK | Mounted by the host on a route. |
| `StoneOSTabsComponent` (My apps / App Store switch) | SDK | Already rendered by both pages. |
| Right-click menu, drag-and-drop, folders, recents, pins | SDK | |
| Styles of the three surfaces | SDK | styled-components / MUI `sx`, no stylesheet to import. |
| `LaunchpadProvider` config (labels, platforms, routes, storage prefix) | Host | One provider around the layout. |
| Sidebar/layout shell (column width, rail column, offsets) | Host | Section 5. This is the part that breaks if skipped. |
| Command Center bridges (`*.sommatic.jsx`) | Host | Passed through `renderBridge`. The SDK never imports `@sommatic/react-sdk`. |
| "New App" create form | Host | Passed through `renderCreateApp`. |
| Global shortcut to My apps (⌘⇧A) | Host | The page only shows the hint. |
| Grab cursor during a drag | Host (optional) | Section 11. |
| Branding (logo, brand colour, copy language) | Host | Never copy Mi Retail's. |

---

## 2. Prerequisites

1. **SDK version.** The first `@link-loom/cloud-sdk` release after `1.1.0` that exports
   `LaunchpadRailComponent`, `AppLaunchpadComponent`, `AppStoreComponent` and `LaunchpadProvider`. Check:
   `grep -c LaunchpadRailComponent node_modules/@link-loom/cloud-sdk/dist/cloud-sdk.esm.js` must print a
   number greater than 0. Until it is published, pack the local SDK (`npm run build && npm pack`) and install
   the tarball; never symlink it into a real repo's `node_modules` without the Vite `dedupe` below.
2. **Peer dependencies in the host** (already present in every StoneOS host):
   `react` 18/19, `react-dom`, `react-router-dom` **6 or 7** (the surfaces use `useNavigate`, `useLocation`,
   `useSearchParams`, `Link`; v5 is not supported here), `@mui/material` + `@mui/icons-material` 6/7,
   `@emotion/react`, `@emotion/styled`, `styled-components` 6, `@link-loom/react-sdk` (for `openSnackbar`
   and `PopUp`), `@veripass/react-sdk`.
3. **Auth.** The surfaces call `useAuth()` from `@veripass/react-sdk`, so they must render under the host's
   Veripass `AuthProvider`. They read `user.identity` (preference owner) and `user.payload.organization_id`
   (catalog scope). No token handling is needed in the host beyond what Veripass already does.
4. **Link Loom Cloud backend URL.** Set `VITE_LOOM_CLOUD_BACKEND_URL` in the host `.env*` files, or pass
   `baseUrl` to each of the three components. Endpoints used:
   `GET /app-engine/definition/marketplace/`, `GET|POST|PATCH` app preferences (`queryselector: "user"`),
   `DELETE /app-engine/definition` (App Store, own apps only) and `GET /app-engine/definition/icon/:slug`
   (published SVG icons — served by the same backend the catalog comes from).
5. **Bootstrap 5 utility CSS.** The App Store uses Bootstrap utilities (`d-flex`, `px-4`, `gap-*`, `row g-3`,
   `col-*`, `text-muted`, `h5`). Adminto's `app.css` provides them. A host without Bootstrap must add it.
6. **A MUI theme is optional.** Typography variants (`subtitle1`, `overline`, `h5`, `body1/2`) and
   `text.primary/secondary`, `primary.main`, `background.paper` come from the host theme. Mi Retail's theme
   makes them 13/11/14px Inter; with MUI's default theme they render at MUI's sizes.
7. **Vite dedupe (only when the SDK is linked, not installed).** Add `"@link-loom/cloud-sdk"` to
   `resolve.dedupe` next to the entries Mi Retail already has (`react`, `react-dom`, `react-router-dom`,
   `@veripass/react-sdk`, `@link-loom/react-sdk`). Two copies of the SDK mean two `LaunchpadProvider`
   contexts: the rail then shows English and the default routes.

---

## 3. Step 1 — the host's launchpad config

Create one file in the host and mount it around the layout, above both the sidebar and the page outlet.

`src/components/layouts/launchpad/LaunchpadHost.component.jsx`

```jsx
import React from "react";
import { LaunchpadProvider } from "@link-loom/cloud-sdk";

import { PLATFORMS } from "@constants/platforms";

// The host's routes. `runtime` and `studio` build a path from an app definition.
const LAUNCHPAD_PATHS = {
  apps: "/client/stoneos/apps",
  store: "/client/stoneos/store",
  runtime: (slug) => `/client/app-engine/runtime/${slug}`,
  studio: (id) => `/client/app-engine/studio/${id}`,
};

function LaunchpadHostComponent({ children }) {
  return (
    <LaunchpadProvider platforms={PLATFORMS} paths={LAUNCHPAD_PATHS} storageNamespace="sommatic">
      {children}
    </LaunchpadProvider>
  );
}

export default LaunchpadHostComponent;
```

`LaunchpadProvider` props (all optional; every one is deep-merged over the SDK defaults):

| Prop | Default | Meaning |
|---|---|---|
| `labels` | `LAUNCHPAD_LABELS` (English) | Copy of the rail, My apps, the tabs and the right-click menu. Section 7. |
| `storeLabels` | `APP_STORE_LABELS` (English) | Copy of the App Store. |
| `platforms` | `[]` | Platforms of the ecosystem shown on the rail and in the StoneOS folder. Section 8. |
| `paths` | `LAUNCHPAD_PATHS` (`/stoneos/apps`, `/stoneos/store`, `/app-engine/runtime/:slug`, `/app-engine/studio/:id`) | Host routes. |
| `storageNamespace` | `"stoneos"` | Prefix of the browser storage keys. Section 10. Pick one per host and never change it. |

Mount it in `src/layouts/LayoutBusiness.jsx` around whatever renders `<SidebarBusiness />` and the
`<Outlet />`. In the template that is the element returned by `LayoutBusiness`:

```jsx
// before
<OmniSearchRegistryProvider>
  <LayoutBusinessContent />
</OmniSearchRegistryProvider>

// after
<OmniSearchRegistryProvider>
  <LaunchpadHostComponent>
    <LayoutBusinessContent />
  </LaunchpadHostComponent>
</OmniSearchRegistryProvider>
```

If the layout has more than one branch (Mi Retail has one with and one without the Command Center), wrap
every branch. Anything outside the provider still works but falls back to English and the default routes.

---

## 4. Step 2 — mount the rail in the sidebar

`src/components/layouts/sidebar/SidebarBusiness.jsx` — before (template):

```jsx
<aside className="left-side-menu p-0">
  <div className="d-flex flex-column h-100">
    <div className="flex-grow-1 overflow-hidden">
      <div className="h-100" data-simplebar>
        <section id="sidebar-menu" className="py-2">
          <ul id="side-menu">{/* ...menu items... */}</ul>
        </section>
        <div className="clearfix"></div>
      </div>
    </div>

    <SidebarFooter condensed={isCondensed}>
      <VeripassOrganizationSwitcher isCondensed={isCondensed} />
    </SidebarFooter>
  </div>
</aside>
```

After:

```jsx
import { LaunchpadRailComponent } from "@link-loom/cloud-sdk";

<aside className="left-side-menu p-0">
  <div className="d-flex flex-column h-100">
    <div className="flex-grow-1 overflow-hidden launchpad-leftbar">
      <LaunchpadRailComponent />
      <div className="launchpad-leftbar__col">
        <div className="launchpad-leftbar__nav">
          <section id="sidebar-menu">
            <ul id="side-menu">{/* ...menu items, unchanged... */}</ul>
          </section>
          <div className="clearfix"></div>
        </div>

        <SidebarFooter condensed={isCondensed}>
          <VeripassOrganizationSwitcher isCondensed={isCondensed} />
        </SidebarFooter>
      </div>
    </div>
  </div>
</aside>
```

What changed and why:

- The column becomes a row: rail on the left, a new column (`__col`) on the right. Without the row the rail
  stacks above the menu.
- **The footer moves inside `__col`.** Left where it was, the organization switcher spans the whole aside
  and cuts the rail short 58px above the floor; inside `__col` the rail runs from under the navbar to the
  floor and the all-apps button sits on the same centre line as the switcher's avatar (the rail's 3px bottom
  padding is tuned for a 58px footer band).
- **`data-simplebar` is removed** and replaced by native overflow (`__nav` below). Adminto initialises
  SimpleBar once at page load and measures the element then; this column gets its height from flex, so
  SimpleBar measured nothing and the menu stopped scrolling.
- `className="py-2"` leaves `#sidebar-menu`; the vertical rhythm moves to `__nav` so the first menu item's
  top edge lines up with the rail's top edge.

The class names (`launchpad-leftbar*`) are the host's own; Mi Retail calls them `mr-leftbar*`. Use a prefix
of the host, not `mr-`.

---

## 5. Step 3 — the shell CSS (the part that must not be skipped)

Adminto hardcodes the sidebar at 240px (70px condensed) in four places: `.left-side-menu` width,
`.logo-box` width, `.content-page` margin-left and `.footer` left. The rail adds 58px to the column
(8px inset from the window's edge + 50px rail + 0 gap), so all four move together.

Create `src/styles/launchpad-shell.css` and import it from `src/App.jsx` **after** every other stylesheet
(`import "./styles/launchpad-shell.css";`). JS-imported CSS lands after Adminto's `<link>` in the cascade.

```css
:root {
  /* Adminto's own sidebar widths. */
  --host-sidebar-w: 240px;
  --host-sidebar-w-condensed: 70px;
  /* The rail. The SDK sizes the rail from --stos-launchpad-w (default 50px); binding it here keeps the
     rail and the column math on the same number. */
  --launchpad-w: 50px;
  --launchpad-inset: 8px;
  --launchpad-gap: 0px;
  --stos-launchpad-w: var(--launchpad-w);
  --host-leftbar-w: calc(var(--host-sidebar-w) + var(--launchpad-inset) + var(--launchpad-w) + var(--launchpad-gap));
  --host-leftbar-w-condensed: calc(var(--host-sidebar-w-condensed) + var(--launchpad-inset) + var(--launchpad-w) + var(--launchpad-gap));
}

/* The column is navigation + rail: every width Adminto hardcodes at 240px follows it. The aside keeps no
   padding of its own; the navigation column carries it. */
body .left-side-menu {
  padding: 0;
  width: var(--host-leftbar-w);
}

@media (min-width: 992px) {
  body .logo-box {
    width: var(--host-leftbar-w);
  }
  body .content-page {
    margin-left: var(--host-leftbar-w);
  }
  body .footer {
    left: var(--host-leftbar-w);
  }
  /* Adminto pins the condensed widths with !important, so these must too. */
  body[data-leftbar-size="condensed"] .logo-box,
  body[data-leftbar-size="condensed"] .left-side-menu {
    width: var(--host-leftbar-w-condensed) !important;
  }
  body[data-leftbar-size="condensed"] .content-page {
    margin-left: var(--host-leftbar-w-condensed) !important;
  }
  body[data-leftbar-size="condensed"] .footer {
    left: var(--host-leftbar-w-condensed) !important;
  }
}

/* Rail + navigation side by side, the rail inset from the window's edge. */
.launchpad-leftbar {
  display: flex;
  height: 100%;
  min-height: 0;
  gap: var(--launchpad-gap);
  padding-left: var(--launchpad-inset);
}

/* The navigation's column: menu on top, organization switcher at the foot. */
.launchpad-leftbar__col {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* The menu scrolls on its own. `min-height: 0` lets it shrink below its content instead of pushing the
   switcher off the bottom; 6px + the first item's 2px margin puts it level with the rail's top edge. */
.launchpad-leftbar__nav {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  padding: 6px 0 8px;
}
.launchpad-leftbar__nav #sidebar-menu {
  padding: 0 0 12px;
}

/* Condensed: the menu collapses to icons; the rail already is icons. */
body[data-leftbar-size="condensed"] .launchpad-leftbar__nav {
  padding-top: 0;
}
```

Why each rule is there (what you see without it):

| Rule | Without it |
|---|---|
| `.left-side-menu` width | The rail eats 58px of the menu; labels truncate and the org switcher overflows. |
| `.logo-box` width | The navbar's logo block ends 58px before the sidebar edge; the seam is visible. |
| `.content-page` margin-left | The first 58px of every page slide under the sidebar (My apps' left tiles, the App Store's category column). |
| `.footer` left | The fixed footer starts under the sidebar. |
| Condensed `!important` quartet | In condensed mode Adminto forces 70px: the rail overlaps the icon column and content starts under it. |
| `.left-side-menu { padding: 0 }` | Adminto's `padding: 20px 0` pushes the rail 20px down and 20px short of the floor. The template's `p-0` class already cancels it; the rule keeps it cancelled if someone drops the class. |
| `min-height: 0` on `__nav` | Long menus push the org switcher below the window instead of scrolling. |
| `@media (min-width: 992px)` | Below 992px Adminto hides the aside and sets `margin-left: 0 !important`. Mi Retail's reset is not media-scoped, so in condensed mode on a phone its content keeps a 128px margin (measured: 375px wide, condensed, `.content-page` margin-left 128px). Scope it. |

Measured in Mi Retail at 1440×900 with these values: aside 298px (128px condensed), rail x=8 width 50,
top 78 (8px under the 70px navbar) to 8px above the floor, menu column from x=58.

Z-index: none needed. The rail lives inside the aside (Adminto `z-index: 10` on mobile), and its tooltips
and right-click menu render in MUI portals.

**Mobile (below 992px).** Nothing extra: Adminto hides the aside; the hamburger (`.button-menu-mobile`)
adds `body.sidebar-enable` and the aside opens as a drawer with the rail inside (measured: 298px wide,
rail at x=8). The rail itself needs no mobile handling.

Branding in Mi Retail's shell that you must **not** copy: `--mr-*` palette, `.logo-box` background
(`--mr-brand-hover`), the navbar and footer colours, the `#sidebar-menu .MuiListItemButton-root` item
styling, the page ground `#eff3f9`.

---

## 6. Step 4 — routes, pages and the tabs between them

The two pages render the tabs (`My apps | App Store`) themselves, navigating to `paths.apps` and
`paths.store`. The host provides two routes under the business layout, using the same paths it gave
`LaunchpadProvider`.

`src/pages/.../launchpad/AppLaunchpad.page.jsx`

```jsx
import React from "react";
import { OnPageLoaded } from "@link-loom/react-sdk";
import { AppLaunchpadComponent } from "@link-loom/cloud-sdk";

import AppLaunchpadSommatic from "@components/pages/.../launchpad/AppLaunchpad.sommatic";

const renderBridge = (state) => <AppLaunchpadSommatic {...state} />;

function AppLaunchpadPage() {
  return (
    <>
      <AppLaunchpadComponent renderBridge={renderBridge} />
      <OnPageLoaded />
    </>
  );
}

export default AppLaunchpadPage;
```

`src/pages/.../marketplace/AppEngineMarketplace.page.jsx`

```jsx
import React from "react";
import { OnPageLoaded } from "@link-loom/react-sdk";
import { AppStoreComponent } from "@link-loom/cloud-sdk";

import AppEngineMarketplaceSommatic from "@components/pages/.../marketplace/AppEngineMarketplace.sommatic";
import AppEngineQuickCreateComponent from "@components/pages/.../quick-actions/create/AppEngineQuickCreate.component";

const renderBridge = (state) => <AppEngineMarketplaceSommatic {...state} />;

const renderCreateApp = ({ onUpdatedEntity, onClose }) => (
  <AppEngineQuickCreateComponent onUpdatedEntity={onUpdatedEntity} entitySelected={null} setIsOpen={onClose} isPopupContext />
);

function AppEngineMarketplacePage() {
  return (
    <>
      <AppStoreComponent renderBridge={renderBridge} renderCreateApp={renderCreateApp} />
      <OnPageLoaded />
    </>
  );
}

export default AppEngineMarketplacePage;
```

Routes (react-router 7, under the `/client` layout route):

```jsx
<Route path="stoneos">
  <Route index element={<Navigate to="/client/stoneos/apps" replace />} />
  <Route path="apps" element={<AppLaunchpadPage />} />
  <Route path="store" element={<AppEngineMarketplacePage />} />
</Route>
```

Keep the host's old catalog routes as `<Navigate>` redirects (forward `location.search` for the store so a
`?q=` survives). The store reads `?q=` on mount: the launchpad's "Search the App Store for …" and the
right-click "View in the App Store" land with the search filled.

Component props:

| Component | Props |
|---|---|
| `LaunchpadRailComponent` | `baseUrl?` |
| `AppLaunchpadComponent` | `baseUrl?`, `renderBridge?(state)` |
| `AppStoreComponent` | `baseUrl?`, `renderBridge?(state)`, `renderCreateApp?({ onUpdatedEntity, onClose })`, `contentHeight?` (default `calc(100vh - 172px)` = 70px navbar + 52px tabs + 50px footer; change it if the host's chrome differs) |

Without `renderCreateApp` the store shows no "New App" button and no "Create App" empty-state action.
`onUpdatedEntity("create", response)` closes the modal and opens `paths.studio(response.result.id)`.

The page title (e.g. "StoneOS" in the navbar breadcrumb) is the host's concern; Mi Retail sets it with its
`usePageMeta` hook in the two page files.

My apps fills the window below the navbar (`min-height: calc(100vh - var(--stos-topbar-h, 70px))`). If the
host's top bar is not 70px, set `--stos-topbar-h` on `:root`.

---

## 7. Step 5 — labels (English default, host overrides)

The SDK ships English. Pass only what differs; objects are deep-merged and functions replace functions.
Keys of `labels` (`LAUNCHPAD_LABELS`):

`myApps`, `appStore`, `rail.{home, allApps, pinned, platforms}`, `prompt`, `searchPlaceholder`,
`searchShortcut` (the hint pill, `⌘⇧A`), `recent`, `pinned`, `allApps`, `getMore`, `folderStoneOS`,
`folderClose`, `results(count)`, `noResults(term)`, `searchStore(term)`, `emptyHint`, `loadFailed`, `retry`,
`copyBlocked`, `group.{defaultName, nameLabel, rename, removeFromGroup}`,
`menu.{open, newTab, pin, unpin, copyLink, viewInStore, linkCopied, pinFailed}`.

Spanish, as a starting point (neutral Spanish; the host owns its copy):

```js
const LAUNCHPAD_LABELS_ES = {
  myApps: "Mis apps",
  appStore: "App Store",
  rail: { home: "StoneOS", allApps: "Todas las apps", pinned: "Fijadas", platforms: "Plataformas" },
  prompt: "¿En qué quieres trabajar?",
  recent: "Recientes",
  pinned: "Fijadas",
  allApps: "Todas las apps",
  getMore: "Añadir más",
  folderClose: "Cerrar",
  results: (count) => `${count} en tus apps`,
  noResults: (term) => `Ninguna app llamada «${term}» en tus apps.`,
  searchStore: (term) => `Buscar «${term}» en la App Store`,
  emptyHint: "Instala la primera desde la App Store. Las plataformas de StoneOS siempre están en la carpeta.",
  loadFailed: "No se pudieron cargar tus apps",
  retry: "Reintentar",
  copyBlocked: "El navegador no dejó copiar",
  group: { defaultName: "Grupo", nameLabel: "Nombre del grupo", rename: "Renombrar grupo", removeFromGroup: "Quitar del grupo" },
  menu: {
    open: "Abrir",
    newTab: "Abrir en pestaña nueva",
    pin: "Fijar en el launchpad",
    unpin: "Quitar del launchpad",
    copyLink: "Copiar enlace",
    viewInStore: "Ver en la App Store",
    linkCopied: "Enlace copiado",
    pinFailed: "No se pudo cambiar el pin",
  },
};
```

With a locale switch, build the object from the active locale inside the host provider and memoise it on the
locale (Mi Retail: `useMemo(() => ({ ...copy.launchpad, copyBlocked, retry }), [copy])`). The rail and the
pages re-render when it changes.

`storeLabels` (`APP_STORE_LABELS`) covers the header, sidebar, category titles/subtitles
(`categoryTitles`, `categorySubtitles`), cards (`card.*`), details panel (`details.*`), premium card
(`premium.*`) and empty states (`empty.*`). Mi Retail passes none: its store is English in both locales.

---

## 8. Step 6 — platforms and their assets

`platforms` is host data: `{ id, title, link, icon, color, tagline }[]`. It feeds the rail's first group,
the StoneOS folder on My apps and search. `icon` is a URL the host serves; Mi Retail keeps them at
`public/assets/images/bsh-apps/{sommatic,veripass,vectry,mi-campus,link-loom,vca,hivora,mi-retail}.svg` and
exports the list from `src/constants/platforms.js`. Copy both the list and the SVGs if the host is part of the
BSH ecosystem; `color` is the platform's own colour (the tile is painted with it at 20% alpha).
Pass a stable array (a module constant), not a literal built on every render.

Clicking a platform opens `link` in a new tab. A person can take a platform off the rail (right-click → Remove
from launchpad); that choice is local (Section 10) and it comes back from the StoneOS folder.

---

## 9. Step 7 — the Command Center bridge

`renderBridge(state)` is rendered first inside each page and must render nothing visible. The SDK passes:

- My apps: `{ apps, pinned, query, setQuery, launch, searchRef }`.
- App Store: `{ apps, selectedApp, loading, preferences, searchTerm, selectedCategory, selectedPublisher,
  activeModal, setActiveModal, handleSearchChange, handleOpenApp, handleEditApp, handleCreateApp,
  handleSelect, handleDeleteApp, handlePinApp, handleFavoriteApp }` (`handleCreateApp` is `null` without
  `renderCreateApp`).

These are exactly the props the existing `AppLaunchpad.sommatic.jsx` and `AppEngineMarketplace.sommatic.jsx`
take, so the host's bridge files are reused unchanged (Mi Retail's are the reference). Update each bridge's
`PAGE_METADATA.path` to the host's routes. A host without the Command Center omits `renderBridge`.

---

## 10. Storage keys

Arrangement and recents live in the browser (`localStorage`); pins live in Link Loom Cloud (`is_pinned` on
the app preference record, shared with every StoneOS host and the App Store's pin button).

| Key | Content |
|---|---|
| `<ns>::launchpad::layout` | `{ order, pinnedOrder, platformOrder, groups[] }` — tile order and folders |
| `<ns>::launchpad::recent` | last 8 opened ids |
| `<ns>::launchpad::hidden-platforms` | platform ids taken off the rail |

`<ns>` is `storageNamespace`. Mi Retail uses `miretail`, which keeps the keys it had before the move.
A new host picks its own (`sommatic`, `llc`) and never changes it: a new namespace starts everyone from the
plain grid. Two tabs of the same host stay in sync through the `storage` event.

---

## 11. Theming

Every colour, radius and shadow resolves a StoneOS kit token with Mi Retail's value as the fallback
(`LAUNCHPAD_THEME`, `LAUNCHPAD_RAIL_THEME`). A host without the kit looks like Mi Retail's launchpad; a host
with the kit (or that sets the tokens on `:root`) follows it. The brand-bearing ones:

| Token | Fallback | Used for |
|---|---|---|
| `--stos-brand` / `--stos-brand-hover` | `#3c4876` / `#2f3a5f` | drop frames, focus ring, App Store buttons, active category, pin state |
| `--stos-text-tertiary` | `#737f94` | section labels, hints |
| `--stos-border` / `--stos-border-strong` | `#e4e8ef` / `#d3d9e3` | tabs bar, search field, chips, folders |
| `--stos-bg-page` / `--stos-bg-muted` | `#eff3f9` / `#f2f4f8` | shortcut pill, folders, tabs track |
| `--stos-tile-hover` | `color-mix(in srgb, #fff 55%, #eff3f9)` | My apps tile hover plate |
| `--stos-launchpad-bg` | sky wash gradient | rail ground |
| `--stos-launchpad-mark` | `#2563eb` | StoneOS mark, rail drop rule |
| `--stos-launchpad-w` | `50px` | rail width (bind it to the shell, Section 5) |
| `--stos-topbar-h` | `70px` | My apps min-height |

Full list in `src/components/app-engine/defaults/launchpad.theme.js`. Set the brand tokens to the host's
brand; do not copy Mi Retail's `#3c4876` on purpose.

Optional: the grab cursor during a drag. The tiles keep `cursor: pointer` (a tile is clicked first, dragged
second). Mi Retail sets `body[data-mr-dragging]` on `dragstart`/`dragend`/`drop` (capture phase, see
`mi-retail/.../src/utils/dragCursor.js`, installed once in `App.jsx`) with
`body[data-mr-dragging] [draggable="true"] { cursor: grabbing; }`. It covers every draggable surface of the
host, which is why it is not in the SDK.

---

## 12. Verification checklist (run it in the browser)

Do each and confirm the effect; a probe on a selector that does not exist proves nothing. Use a 1440×900
viewport, then repeat the starred items condensed and on a 375px phone.

Shell
- [ ] * `.left-side-menu` is 298px wide (128px condensed); `nav[aria-label="Launchpad"]` is at x=8, width 50,
      8px under the navbar and 8px above the floor.
- [ ] * `.content-page` margin-left equals the aside width; no page content under the sidebar.
- [ ] The all-apps dots and the org switcher's avatar share a centre line (±1px).
- [ ] A long menu scrolls inside the navigation column; the switcher stays at the floor.
- [ ] * Phone: the aside is hidden; the hamburger opens it with the rail inside; `.content-page` margin 0.

Rail
- [ ] StoneOS mark → My apps; no hover change on the mark; the all-apps button is `aria-current="page"` there.
- [ ] Platform tiles, a short rule, then pinned apps; hover shows a tooltip on the right with the name.
- [ ] Right-click an app: Open, Open in a new tab, Remove from launchpad, Copy link (+ View in the App Store
      on app tiles). Remove → the tile leaves the rail and My apps' Pinned at once; pin it back from My apps.
- [ ] Right-click a platform → Remove: it leaves the rail and `<ns>::launchpad::hidden-platforms` holds its id;
      pin it back from the StoneOS folder.
- [ ] Drag a pinned tile below its neighbour: a rule appears under the target, the order changes and
      survives a reload (`<ns>::launchpad::layout.pinnedOrder`).
- [ ] Short window (≈560px high): the middle scrolls, fades under the two ends; the dots stay visible.

My apps
- [ ] The search field has focus on arrival; typing filters apps and platforms; Enter with one match opens it;
      Escape clears; no match shows "Search the App Store for …" and lands on the store with `?q=`.
- [ ] Recent chips: the glyph is bare (no square, no tint, no shadow).
- [ ] Drag an app to the edge of another → reorder; onto its middle → a folder named "Group" opens under
      the row with the name selected; drag a pinned app into All apps → it unpins (and back).
- [ ] The StoneOS folder opens under its row; only one folder is open at a time.
- [ ] Switch locale (if the host has one): every label follows.

App Store
- [ ] `/` focuses the search; category and publisher counts match the cards; Escape walks back
      (details → sidebar → search → filters); arrows move the selection.
- [ ] Click a card → details panel (markdown description, routes, contracts); premium apps show the premium
      card on "Open App".
- [ ] Pin/favorite from a card persists: after a reload the rail and My apps' Pinned show it. (The rail
      does not refresh live from a store pin; pins made from the rail or My apps do sync live.)
- [ ] "New App" opens the host's form in a modal; creating opens the studio.

Bridge (with the Command Center on)
- [ ] `/snapshot-insight` on `page-context` returns the launchpad/store data; filling the launchpad search
      from the Command Center updates the field.

---

## 13. Known pitfalls

- **Two SDK copies** (linked SDK without `dedupe`): the rail ignores the provider (English, default routes).
- **Stale modules after syncing sources with `rsync -a`**: it preserves mtimes, so Vite may keep serving the
  old module. `touch` the synced files or restart Vite with `--force`.
- **`import(\`@mui/icons-material/${name}.js\`)` never resolves in a Vite host.** The SDK's
  `DynamicMuiIcon` reads the `@mui/icons-material` namespace instead; legacy app definitions whose `icon` is
  a MUI name (`"Gavel"`) render that icon, not the category fallback. Do not "optimise" it back.
- **SimpleBar on the navigation column** measures zero height and blocks scrolling (Section 4).
- **Unscoped desktop width overrides** break the phone layout in condensed mode (Section 5).
- **`contentHeight`** of the App Store assumes 70 + 52 + 50px of chrome; a host with a different footer
  gets a second scrollbar or a gap until it passes its own value.
- **Menus**: the right-click menu styles itself (30px rows, 13px type, 14px glyphs). A host rule targeting
  `.MuiMenuItem-root` with higher specificity wins; do not add global menu rules to fix a single menu.
- **`platforms` built inline** re-derives the rail on every render; pass a module constant.
- **Pins are shared** across hosts (same preference record); layouts and recents are not.
- **A pin made in the App Store reaches the rail on the next load**, not live: the store writes the
  preference itself and does not notify the launchpad hooks. Do not test "store pin → rail" without a reload.

---

## 14. Reference implementation (Mi Retail)

- `src/components/layouts/launchpad/LaunchpadHost.component.jsx` — provider with locale copy, `PLATFORMS`,
  `/client` routes, `storageNamespace="miretail"`.
- `src/layouts/LayoutBusiness.jsx` — both layout branches wrapped in `LaunchpadHostComponent`.
- `src/components/layouts/sidebar/SidebarBusiness.jsx` — rail + `mr-leftbar__col` + footer inside the column.
- `src/styles/adminto-reset.css` (widths), `src/styles/tokens.css` (`--mr-launchpad-*`, `--stos-launchpad-w`),
  `src/styles/components.css` (`.mr-leftbar*`, drag cursor).
- `src/pages/bsh/link-loom-cloud/app-engine/{launchpad,marketplace}/*.page.jsx` — pages with the bridges and
  the create form.
- `src/components/pages/bsh/link-loom-cloud/app-engine/{launchpad,marketplace}/*.sommatic.jsx` — bridges.
- `src/components/layouts/navbar/NavbarBusiness.jsx` — the ⌘⇧A command (`keys: ["meta", "shift", "a"]`).
