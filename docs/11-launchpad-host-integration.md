# StoneOS Launchpad — Host Integration Runbook

How to put the StoneOS Launchpad into a host webapp: the sidebar (the launchpad rail beside the host's
navigation, with the organization switcher at its foot), the My apps and App Store pages with their routes,
and the page title as a breadcrumb in the navbar. Written for an agent integrating a host: read it top to
bottom once, then execute section 3 in order.

Reference hosts, in the order they were built: Mi Retail (`mi-retail/bsh.miretail.workspace.webapp`, where
the Launchpad was designed) and Link Loom Cloud admin
(`link-loom/link-loom-cloud/bsh.linkloom.cloud.admin.webapp`, the first host built from this runbook). Any
Adminto-based StoneOS host (Sommatic client and admin, Link Loom Cloud client, ÊTRUNE ID admin, Veripass
client) has the same skeleton.

---

## 0. The rule: the host renders the SDK's components, it never reimplements them

Everything in section 1 comes from the SDKs, which split by who it is for: `@link-loom/cloud-sdk` holds
what is StoneOS (the sidebar, the rail, the pages and their routes, the look), `@link-loom/react-sdk` (open
source) holds what any webapp can use (the page title and breadcrumb, the collapse control, the sidebar
rows). A host consumes them as they are.

- **If a host looks different, it changes a prop, a label or a token** (`--stos-*`, `--ll-*`), never the
  markup or the CSS of a component.
- **Two hosts print the same HTML** for everything the SDK owns (section 12 is the contract and has a
  script that checks it). A fix made in the SDK reaches every host with an SDK update; a host with its own
  copy stops receiving them. That is how the breadcrumb of Mi Retail kept a mobile defect and a different
  offset the other host never had.
- **A host never:**
  - copies the sidebar column (`mr-leftbar*`-style classes), the collapse control, the page-meta context or
    the page wrappers into its own files;
  - patches the vendored Adminto `app.css` for the sidebar (the SDK overrides what it needs, section 4);
  - puts `data-simplebar` on the navigation column or adds `.content-page` rules for the StoneOS pages;
  - passes `className` or `style` into an SDK component to bend it.
- **A host decides:** its labels and language, its platforms, its base path (`/client`, `/admin`), its
  storage prefix, the navigation items and which row carries the collapse control, the Command Center
  bridges and the create-app form, and the token values.

---

## 1. What you get and what stays in the host

| Piece | Owner | Notes |
|---|---|---|
| `StoneOSLaunchpadSidebar` | cloud-sdk | The aside: rail + navigation column + footer, the column's width math and its look. |
| `LaunchpadRailComponent` | cloud-sdk | Inside the sidebar. A host does not mount it. |
| `StoneOSAppsPage`, `StoneOSStorePage`, `stoneOSLaunchpadRoutes()` | cloud-sdk | The two pages, on their own ground (`StoneOSPageFrame`), and the route group that mounts them. |
| `LaunchpadProvider` | cloud-sdk | Takes the host's data: labels, platforms, `basePath`, `baseUrl`, storage prefix. |
| `AppLaunchpadComponent`, `AppStoreComponent`, `StoneOSTabsComponent` | cloud-sdk | Rendered by the pages. Mount them directly only on a host that cannot use the pages. |
| Right-click menu, drag-and-drop, folders, recents, pins | cloud-sdk | |
| `SidebarLinkRow`, `SidebarCollapseToggle`, `useSidebarCondensed`, `SidebarGroup`, `SidebarFooter` | react-sdk | The rows of the navigation and the control that condenses it. |
| `PageMetaProvider`, `usePageMeta`, `usePageMetaState`, `usePageMetaActions`, `NavbarBreadcrumb` | react-sdk | The page declares its title and trail; the navbar shows the trail. |
| Navigation items (the `<li>` modules) | Host | Rendered as children of the sidebar. |
| Layout engine (`public/assets/js/app.js`) | Host | Owns the sidebar's size (3.3). It is the host's static asset. |
| Labels, platforms, `basePath`, `storageNamespace` | Host | Data given to `LaunchpadProvider` (3.4). |
| Command Center bridges (`*.sommatic.jsx`) | Host | Passed through `renderBridge`. The SDK never imports `@sommatic/react-sdk`. |
| "New App" create form | Host | Passed through `renderCreateApp`. |
| Global shortcut to My apps | Host (optional) | A command in the host's Omnisearch (3.6). The search field's own shortcut is `/`, handled by the SDK. |
| Grab cursor during a drag | Host (optional) | Section 11. |
| Branding (logo, brand colour, copy language) | Host | Never copy another host's. |

---

## 2. Prerequisites

1. **SDK versions.** `@link-loom/cloud-sdk` with `StoneOSLaunchpadSidebar` and `@link-loom/react-sdk` `>=1.1.78`
   (the first with `PageMetaProvider`, `NavbarBreadcrumb`, `SidebarLinkRow`; cloud-sdk lists it as a peer).
   Check: `grep -c StoneOSLaunchpadSidebar node_modules/@link-loom/cloud-sdk/dist/cloud-sdk.esm.js` and
   `grep -c NavbarBreadcrumb node_modules/@link-loom/react-sdk/dist/react-sdk.esm.js` must print a number
   greater than 0. Until both are published, link the local builds (`npm run build` in each repo, react-sdk
   first) and keep the Vite `dedupe` of 3.1.
2. **Peer dependencies in the host** (already present in every StoneOS host): `react` 18/19, `react-dom`,
   `react-router-dom` **6 or 7**, `@mui/material` + `@mui/icons-material` 6/7, `@emotion/react`,
   `@emotion/styled`, `styled-components` 6, `@link-loom/react-sdk`, `@veripass/react-sdk`.
3. **The Adminto skeleton.** `#wrapper > .navbar-custom + aside.left-side-menu + .content-page > .content`,
   with `.footer` and the `.logo-box` in the navbar. Every StoneOS host has it.
4. **A browser with `:has`** (Chrome 105, Safari 15.4, Firefox 121): the page frame uses it. Without it the
   pages still work, on the host's own padding.
5. **Auth.** The surfaces call `useAuth()` from `@veripass/react-sdk`, so they must render under the host's
   Veripass `AuthProvider`. The catalog, the store and the entitlements are read **as the person**:
   `AppEngineSDKProvider` sends the Veripass token and the active organization
   (`createSessionIdentityHeaders(getToken())`) and the backend takes the organization from that principal,
   never from a parameter. No token handling is needed beyond what Veripass already does.
6. **Link Loom Cloud backend URL.** Give `LaunchpadProvider` a `baseUrl` (or set `VITE_LOOM_CLOUD_BACKEND_URL`).
   Endpoints used: `GET /app-engine/definition/marketplace/` (paged, the apps the organization can use),
   `GET|POST|PATCH` app preferences (`queryselector: "user"`), `GET /app-engine/store/:queryselector`
   (`apps`, `facets`, `home`, `app`, `catalogs`), `GET /app-engine/suite/:queryselector`,
   `POST /app-engine/entitlement/grant` and `/grant-suite`, `DELETE /app-engine/definition` (App Store, own
   apps only) and `GET /app-engine/definition/icon/:slug`. The store's model and contract are in
   `docs/12-app-store-suites-entitlements.md`.
7. **Bootstrap 5 utility CSS.** The App Store uses Bootstrap utilities (`d-flex`, `px-4`, `gap-*`, `row g-3`,
   `col-*`, `text-muted`, `h5`). Adminto's `app.css` provides them.
8. **A MUI theme is optional.** Typography variants and `text.primary/secondary`, `primary.main`,
   `background.paper` come from the host theme; with MUI's default theme they render at MUI's sizes.

---

## 3. The recipe

Run the steps in order. `H` is the host's root; paths are the usual ones of an Adminto host and may differ.

### 3.1 Dependencies and Vite

Install or link both SDKs. In `H/vite.config.js` the host must resolve a single copy of every package that
carries a React context, or the rail ignores the provider (English, default routes):

```js
resolve: {
  dedupe: [
    'react', 'react-dom', 'react/jsx-runtime', 'react-router-dom',
    '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled',
    'styled-components', '@veripass/react-sdk',
    // when the SDKs are linked, not installed:
    '@link-loom/react-sdk', '@link-loom/cloud-sdk',
  ],
},
```

### 3.2 Veripass

The Veripass SDK defaults to its own localhost URL. Point it at the host's environment once, before render
(`H/src/main.jsx`):

```jsx
import { configureVeripass } from '@veripass/react-sdk';

if (import.meta.env.VITE_APP_SERVICE_VERIPASS_URL) {
  configureVeripass({ baseUrl: import.meta.env.VITE_APP_SERVICE_VERIPASS_URL });
}
```

### 3.3 The layout engine owns the sidebar's size

`H/public/assets/js/app.js` is Adminto's. The sidebar needs its `LeftSidebar` to set the size on the body and
announce it, one `toggle-sidebar` event for every control, and the instance on `window`. Replace the host's
`LeftSidebar` header (an older Adminto has the collapse code commented out) with:

```js
class LeftSidebar {
  constructor() {
    this.body = $('body');
    this.window = $(window);
  }

  changeSize(size) {
    this.body.attr('data-sidebar-size', size);
    this.body.attr('data-leftbar-size', size);
  }

  condense() {
    this.changeSize('condensed');
    window.dispatchEvent(new Event('link-loom.setBoxed'));
  }

  expand() {
    this.changeSize('default');
    window.dispatchEvent(new Event('link-loom.setFluid'));
  }

  toggle() {
    if (window.innerWidth >= 993) {
      this.body.attr('data-sidebar-size') === 'condensed' ? this.expand() : this.condense();
      return;
    }
    this.expand();
    this.body.toggleClass('sidebar-enable'); // below 993px the sidebar is a drawer
  }

  initMenu() {
    var self = this;

    // Namespaced and off first: every page load builds a new Layout, and a second delegated handler would
    // toggle twice and cancel the first.
    $(document).off('click.sidebar-toggle').on('click.sidebar-toggle', '.button-menu-mobile', function (event) {
      event.preventDefault();
      self.toggle();
    });
    // ... the rest of Adminto's initMenu, unchanged
  }
}
```

Then:

- `onPageLoaded()` keeps the layout reachable: `window.LayoutInstance = new Layout(); window.LayoutInstance.init();`.
- Remove any other handler of `.button-menu-mobile` (an older Adminto slid the menu by `-400px`).
- Append the listeners the controls go through:

```js
window.addEventListener('toggle-sidebar', function () {
  if (window.LayoutInstance && window.LayoutInstance.leftSidebar) window.LayoutInstance.leftSidebar.toggle();
});
// The Command Center takes the room: condense while it is open (hosts without it can omit these two).
window.addEventListener('sommatic:command-center-opened', function () {
  if (window.innerWidth >= 993 && window.LayoutInstance) window.LayoutInstance.leftSidebar.condense();
});
window.addEventListener('sommatic:command-center-closed', function () {
  if (window.innerWidth >= 993 && window.LayoutInstance) window.LayoutInstance.leftSidebar.expand();
});
```

### 3.4 Providers

Two providers wrap the layout, above the navbar, the sidebar and the outlet. The page meta is the title the
page declares; the launchpad config is the host's data.

`H/src/components/layouts/launchpad/LaunchpadHost.component.jsx`

```jsx
import React from 'react';
import { LaunchpadProvider } from '@link-loom/cloud-sdk';

import { PLATFORMS } from '@constants/platforms';

function LaunchpadHostComponent({ children }) {
  return (
    <LaunchpadProvider
      platforms={PLATFORMS}
      basePath="/admin"                                  // "/client" in a client host
      baseUrl={import.meta.env.VITE_APP_BACKEND_URL}
      storageNamespace="linkloom-admin"                  // one per host, never changed
      // labels={copy.launchpad} storeLabels={copy.appStore}   // a host with its own language, section 7
    >
      {children}
    </LaunchpadProvider>
  );
}

export default LaunchpadHostComponent;
```

`LaunchpadProvider` props (all optional; deep-merged over the SDK defaults):

| Prop | Default | Meaning |
|---|---|---|
| `basePath` | `""` | Builds the four routes under the host's base: `${basePath}/stoneos/apps`, `${basePath}/stoneos/store`, `${basePath}/app-engine/runtime/:slug`, `${basePath}/app-engine/studio/:id`. |
| `paths` | from `basePath` | Overrides any of the four (`runtime` and `studio` are functions). |
| `baseUrl` | `""` | Link Loom Cloud backend of the rail, My apps and the App Store (falls back to `VITE_LOOM_CLOUD_BACKEND_URL`). |
| `labels` / `storeLabels` | English | Copy of the rail, My apps, the tabs, the menu / of the App Store. Section 7. |
| `platforms` | `[]` | Platforms of the ecosystem on the rail and in the StoneOS folder. Section 8. Pass a module constant. |
| `storageNamespace` | `"stoneos"` | Prefix of the browser storage keys. Section 10. |

The layout (`H/src/layouts/Layout*.jsx`):

```jsx
const LayoutContent = () => {
  // Legacy pages still call `setPageName`; it feeds the page meta as a one-crumb trail, so the navbar keeps
  // saying where the person is. New pages declare their trail with `usePageMeta`.
  const { setMeta } = usePageMetaActions() || {};
  const setPageName = useCallback(
    (name) => setMeta?.({ title: name || '', breadcrumb: name ? [{ label: name }] : [] }),
    [setMeta]
  );
  /* ... <NavbarX />, <SidebarX />, <div className="content-page"><div className="content"><Outlet context={{ setPageName }} /> ... */
};

const Layout = () => (
  <PageMetaProvider appName="Link Loom Cloud">
    <LaunchpadHostComponent>
      <LayoutContent />
    </LaunchpadHostComponent>
  </PageMetaProvider>
);
```

`PageMetaProvider` also writes `document.title` as `title · appName`. If the layout has more than one branch
(with and without the Command Center), wrap every branch.

### 3.5 The sidebar

`H/src/components/layouts/sidebar/Sidebar*.jsx` becomes the SDK's aside with the host's modules inside it:

```jsx
import { SidebarLinkRow, useSidebarCondensed } from '@link-loom/react-sdk';
import { StoneOSLaunchpadSidebar } from '@link-loom/cloud-sdk';
import { VeripassOrganizationSwitcher } from '@veripass/react-sdk';

function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isCondensed = useSidebarCondensed();

  return (
    <StoneOSLaunchpadSidebar footer={<VeripassOrganizationSwitcher isCondensed={isCondensed} />}>
      <li className="px-0">
        <SidebarLinkRow
          title="Overview"
          icon={<DashboardIcon fontSize="small" />}
          active={pathname === '/admin/dashboard'}
          onClick={() => navigate('/admin/dashboard')}
          withCollapseToggle                  // the row that carries the control that condenses the sidebar
        />
      </li>
      {/* the other modules: more <li className="px-0"> with SidebarLinkRow (a link) or SidebarGroup (a section) */}
    </StoneOSLaunchpadSidebar>
  );
}
```

- **Children are `<li>` modules.** The sidebar wraps them in `section#sidebar-menu > ul#side-menu`.
- **A row that is a link** (it navigates, it never expands) is a `SidebarLinkRow`; one row of the sidebar
  carries `withCollapseToggle` (pass `collapseLabel` / `expandLabel` in the host's language). **A section**
  (a title with items under it) is a `SidebarGroup`; wrap it in `ll-sidebar-section` to get the small grey
  label header.
- **Icons are plain `@mui/icons-material` outlined**; their colour comes from the sidebar's look, so no
  `styled()` colour wrapper.
- A host with `data-simplebar`, its own `__col`/`__nav` classes or its own footer wrapper deletes them: the
  sidebar renders all of that.

### 3.6 The navbar

The page title is no longer printed in the navbar: the page prints its own, and the navbar shows the trail
above it. In `H/src/components/layouts/navbar/Navbar*.jsx`, replace the page-title element and its prop with:

```jsx
<ul className="list-unstyled topnav-menu topnav-menu-left mb-0">
  <li>
    <button className="button-menu-mobile disable-btn waves-effect"><MenuIcon /></button>
  </li>
  <li>
    <NavbarBreadcrumb ariaLabel="Location" />
  </li>
</ul>
```

Exactly `<li><NavbarBreadcrumb /></li>`: the component carries its own height, offset (`--ll-navbar-crumb-offset`,
32px) and colours (`--ll-navbar-crumb*`, white on the brand ground), and stays out below 600px. A host adds no
classes to the `<li>`.

Optional: a command in the host's Omnisearch that opens My apps (`nav(`${basePath}/stoneos/apps`)`). Pick a
shortcut the host does not use (`⌘⇧A` was taken in Link Loom Cloud admin, which uses `⌘⇧L`). The platforms of
the navbar's waffle and of the rail come from the same constant (section 8).

### 3.7 Routes

Mount the Launchpad's route group next to the host's other domain routes, under its base route:

```jsx
import { stoneOSLaunchpadRoutes } from '@link-loom/cloud-sdk';

const AppEngineRoutes = () => (
  <>
    {stoneOSLaunchpadRoutes({
      appsPageProps: { renderBridge: renderAppsBridge },                    // optional, Command Center
      storePageProps: { renderBridge: renderStoreBridge, renderCreateApp }, // optional
    })}
    <Route path="app-engine">
      <Route path="studio/:id" element={<AppEngineStudio />} />
      <Route path="runtime/:appSlug/*" element={<AppEngineRuntime />} />
      {/* the host's own management routes */}
    </Route>
  </>
);
```

`stoneOSLaunchpadRoutes()` gives `stoneos` (to `apps`), `stoneos/apps` and `stoneos/store/*`; section 5 lists
the screens under the store. The runtime and studio routes are the host's and must sit at the paths
`basePath` builds (`app-engine/runtime/:appSlug/*`, `app-engine/studio/:id`).

Then repoint what led to the old catalog: redirect its routes to the store (`<Navigate to={`${basePath}/stoneos/store`} replace />`,
forward `location.search`), and every "back to the catalog" of the studio and the runtime to
`${basePath}/stoneos/store`. A host's own dashboard tiles or commands that open My apps or the store use the
same two paths.

### 3.8 Verify

Run section 13, then section 12's script on this host and on the reference.

---

## 4. Layout: what the SDK owns

`StoneOSLaunchpadSidebar` carries a `GlobalStyles` that exists only while the sidebar is mounted. A host
writes none of this and patches no vendored Adminto CSS for it:

| What | How |
|---|---|
| The column's width | navigation 240 + rail inset 8 + rail 50 + gap 0 = **298px** (condensed: 70 + 58 = **128px**). Tokens `--stos-sidebar-w`, `--stos-sidebar-w-condensed`, `--stos-launchpad-w`, `--stos-launchpad-inset`, `--stos-launchpad-gap`, redefinable on `:root`. |
| What follows the column | `.left-side-menu`, and **on desktop only** (`min-width: 993px`) `.logo-box`, `.content-page` margin-left and `.footer` left, condensed too. Below 993px the sidebar is a drawer: its width includes the rail, the content never moves. |
| Adminto's condensed defects | Adminto condenses the menu as `position: absolute` and gives the body `min-height: 1750px`, which pushes the footer of the column (the organization switcher) and the rail's all-apps button below the fold. The SDK makes the aside `fixed` and the body `min-height: auto` when condensed. Its `html` prefix outranks Adminto's own selectors whichever stylesheet loads last. |
| The column | `.stos-leftbar` (row), `.stos-leftbar__col`, `.stos-leftbar__nav` (native overflow, never SimpleBar: SimpleBar measures once at page load and this column gets its height from flex). |
| The look | rows of 32px, 13px labels, 16px icons, 11px section headers, the collapse control and the condensed centring, under `.stos-leftbar #sidebar-menu`. Colours and radius from `--stos-sidebar-*` (text, text-strong, text-muted, text-disabled, hover, selected, border, border-strong, focus, radius), each falling back to the kit token and then to the StoneOS value. |
| The pages' ground | `StoneOSPageFrame` (section 5). |

What the host still owns: the Adminto skeleton (section 2.3), `--stos-topbar-h` if its navbar is not 70px tall
(the pages and the store size themselves from it), and the layout engine (3.3).

---

## 5. The pages, the frame and the routes

`StoneOSAppsPage` and `StoneOSStorePage` are what the routes render. Each one:

- declares the page meta (`usePageMeta`: title and one-crumb trail `StoneOS`, from `labels.stoneOS`);
- renders the component inside **`StoneOSPageFrame`**;
- calls `OnPageLoaded` so the layout engine re-initialises.

**The frame is what makes the two pages look the same in every host.** A host's `.content-page` carries its own
padding and margin (Link Loom Cloud admin: 12px sides, 94px top; Mi Retail: its own); the pages are designed to
run edge to edge. While a frame is on screen it takes over the host's `.content-page`: it starts right under the
navbar, runs from the sidebar to the right edge, has no padding, paints `--stos-bg-page` (`#eff3f9`) behind
itself and makes the host's footer transparent. Other pages of the host keep their layout: the rule is
`.content-page:has(.stos-page-frame)`.

Props:

| Component | Props |
|---|---|
| `StoneOSAppsPage` | `baseUrl?`, `renderBridge?(state)` |
| `StoneOSStorePage` | `baseUrl?`, `renderBridge?(state)`, `renderCreateApp?({ onUpdatedEntity, onClose })`, `contentHeight?` (default `calc(100vh - 172px)` = 70px navbar + 52px tabs + 50px footer; change it if the host's chrome differs) |
| `stoneOSLaunchpadRoutes` | `{ appsPageProps?, storePageProps? }` |

Without `renderCreateApp` the store shows no "Build your own app" banner (nor its rail icon) and no "Build an
app" action on the organization's page. `onUpdatedEntity("create", response)` closes the modal and opens
`paths.studio(response.result.id)`.

The store's own routes, relative to `paths.store` (build them with `buildStorePaths(paths.store)`; the view
names are `STORE_VIEWS`). **The store is mounted on a splat route** (`store/*`): every screen is a route under
it, resolved by the store itself.

| Path | Screen |
|---|---|
| `/` | Discover: the Featured banner, "Suggested for you", highlighted suites, every app (infinite scroll) |
| `/?q=term` | Search results |
| `suites` | All suites, grouped by kind, the ones in use first |
| `suites/:slug` | A suite: price, coverage, apps already in My apps, apps to add (`?category=` filters) |
| `apps/:slug` | An app's page (a route, never a drawer) |
| `categories/:category` | A category across suites (`?suite=` narrows to one suite) |
| `organization` | The apps the organization built |

Routes the Launchpad navigates to, all under the host's base path: `stoneos` (to `apps`), `stoneos/apps`,
`stoneos/store/*`, `app-engine/runtime/:appSlug/*` (a click on an app of the rail or My apps, a search
result, a notification) and `app-engine/studio/:id` ("open in Studio", create app). The launchpad's "Search
the App Store for …" and the right-click "View in the App Store" land on `store?q=`. An app's runtime answers
`403 app_not_entitled` for a public app the organization does not have: the runtime then shows "Get this app",
linking to `apps/:slug` under `paths.store` — so `paths.store` must be the real store route even on hosts
that only embed apps.

The store's sidebar is a column from Bootstrap's xl (1200px) up, foldable into an icon rail by the person
(remembered per host, Section 10); below xl it is always the rail, with the labels in tooltips. The layout
uses Bootstrap's grid, so the host must load Bootstrap 5 utilities (Adminto does).

My apps fills the window below the navbar (`min-height: calc(100vh - var(--stos-topbar-h, 70px))`). If the
host's top bar is not 70px, set `--stos-topbar-h` on `:root`.

---

## 6. Search across apps (Omnisearch and the Launchpad)

Every app with a backend declares the entities people can search in its namespace
(`stoneos/docs/build-specs/_platform/platform-facade.md` §10). LLC merges them for the organization
(`GET /app-engine/app-search/records`, as the person, no app session) and the SDK gives the host two surfaces:

- **My apps (Launchpad).** Typing in the search field also lists the records the apps found, under the apps that
  match, each with its app, kind of record and status. Opening one navigates to
  `paths.runtime(<slug>)` plus the record's path (`/records?id=<id>`). It needs nothing from the host but the
  `labels.records` copy (English by default).
- **Omnisearch (`@link-loom/react-sdk` `OmniSearch`).** The host adds one category:

  ```jsx
  const appSearchCategory = useAppSearchCategory({
    enabled: searchOpen,                 // asks which apps contribute the first time the search opens
    baseUrl: LOOM_CLOUD_BACKEND_URL,
    labels: copy.navbar.appSearch,       // { category: "In your apps" }
    locale,
  });
  const categories = [ …, ...(appSearchCategory ? [appSearchCategory] : []), … ];
  ```

  The hook returns `null` while no app of the organization contributes, so no empty filter appears. Selecting a
  result calls the category's `onSelect(hit, navigate)`, which navigates to
  `<basePath>/app-engine/runtime/<slug><deep_link>` (`hitRuntimePath(hit, basePath)`); the app opens the record with
  its own `?id=` routing.

Lower-level pieces, for hosts with their own surface: `createAppSearchClient({ baseUrl, getSession })`
(`searchRecords({ text, limit })`, `listSources()`), `useAppRecordSearch({ query })`, `createRecordSearchRunner`,
`hitRuntimePath`, `hitPathInApp`, `hitEntityLabel`, `hitContextLine`. A host never builds a path from a result
without them: they refuse any link that is not a path inside the app.

## 7. Labels (English default, host overrides)

The SDK ships English. Pass only what differs; objects are deep-merged and functions replace functions.
Keys of `labels` (`LAUNCHPAD_LABELS`):

`myApps`, `appStore`, `rail.{home, allApps, pinned, platforms}`, `prompt`, `searchPlaceholder`,
`searchShortcut` (the hint pill, `/` — the key the field itself answers to on My apps and the App Store), `recent`, `pinned`, `allApps`, `getMore`, `folderStoneOS`,
`folderClose`, `results(count)`, `noResults(term)`, `searchStore(term)`, `emptyHint`, `loadFailed`, `retry`,
`copyBlocked`, `group.{defaultName, nameLabel, rename, removeFromGroup}`,
`menu.{open, newTab, pin, unpin, copyLink, viewInStore, linkCopied, pinFailed}`.
`records.{searching, failed, found(count)}` — the records the apps of the organization found for the search text, listed under the apps that match it (see Search across apps below).

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

`storeLabels` (`APP_STORE_LABELS`) is the whole App Store and the runtime's "Get this app" state:
`locale` (formats prices and dates), `searchPlaceholder`, `searchShortcut`, `loadFailed`, `retry`, `loading`
(read by screen readers over a skeleton), `nav.*` (sidebar, and `back` for the Back link in the tabs bar — it
retraces the history, or goes to the screen above when the page was opened directly), `build.*` (Build your own app), `discover.*` (`suggestedNote` is the one neutral line under "Suggested
for you"; `seeAllSuites(count)` reads "See all N suites →", or "See all suites →" for one), `search.*`,
`suites.*` (with `kindTitles` and `kindGroups` indexed by suite kind), `suite.*`, `category.*`,
`organization.*`, `card.*` (Get, Buy · price, View / `viewApp(name)`, Open — only on an app's page — and the
owner menu), `detail.*`, `acquire.*` (the three-step dialog), `notEntitled.*`, and the titles of every
closed value **indexed by its backend catalog key**: `access`, `pricingModels`, `sorts`, `categoryTitles`,
`categoryDescriptions`. A key the host does not translate falls back to the catalog's own `title`, so a
category added in the backend still renders. No copy may say a payment was made: "Get", "Buy" and "Get the
suite" grant access to the organization; charging is not part of the store yet.

Mi Retail passes its `copy.appStore` tree for both locales (`src/i18n/{en,es}.js`, checked by
`node src/i18n/parity.check.js`) through `LaunchpadHost`:
`<LaunchpadProvider labels={labels} storeLabels={copy.appStore} … />`.

---

## 8. Platforms and their assets

`platforms` is host data: `{ id, title, link, icon, color, tagline }[]`. It feeds the rail's first group,
the StoneOS folder on My apps and search. `icon` is a URL the host serves; Mi Retail keeps them at
`public/assets/images/bsh-apps/{sommatic,veripass,vectry,mi-campus,link-loom,vca,hivora,mi-retail}.svg` and
exports the list from `src/constants/platforms.js`. Copy both the list and the SVGs if the host is part of the
BSH ecosystem; `color` is the platform's own colour (the tile is painted with it at 20% alpha).
Pass a stable array (a module constant), not a literal built on every render.

Clicking a platform opens `link` in a new tab. A person can take a platform off the rail (right-click → Remove
from launchpad); that choice is local (Section 10) and it comes back from the StoneOS folder.

---

## 9. The Command Center bridge

`renderBridge(state)` is rendered first inside each page and must render nothing visible. The SDK passes:

- My apps: `{ apps, pinned, query, setQuery, launch, searchRef }`.
- App Store: `{ view, query, category, suite, app, apps, totalItems, organization, suites, catalogs, views,
  setQuery, navigateTo, acquire, open, createApp, activeModal, setActiveModal }`:
  - `view` is one of `views` (`STORE_VIEWS`); `apps` is what the current screen shows (the pages loaded so
    far), `totalItems` how many there are; `app` / `suite` are the current page's records.
  - `navigateTo(view, { slug, category, query })` moves between screens; `open(app)` opens an app the
    organization has; `acquire({ app } | { suite })` opens the confirmation dialog — the person still
    confirms, the bridge never grants on its own; `createApp` is `null` without `renderCreateApp`.

The store bridge is rendered on every screen, so a surface registered once must read the latest state:
keep the props in a ref and read it inside the handlers (Mi Retail's `AppEngineMarketplace.sommatic.jsx`),
instead of closing over the first render's props with `[]` deps. Update each bridge's `PAGE_METADATA.path` to
the host's routes. A host without the Command Center omits `renderBridge`.

### The host's own catalog reads

A host that reads the App Engine catalog itself (Mi Retail and the Sommatic client feed the Command Center
with `command-center-catalog`) must page through it and send the identity: the backend pages with its default
`pageSize` and answers only for the caller's organization. Use the SDK instead of a bare `fetch`:

```js
import { AppEngineAppDefinitionService, createSessionIdentityHeaders, fetchAllPages } from "@link-loom/cloud-sdk";

const service = new AppEngineAppDefinitionService({ baseUrl, getHeaders: () => createSessionIdentityHeaders(getToken()) });
const response = await fetchAllPages((params) => service.getCommandCenterCatalog(params));
// response.result.items is the whole catalog; a failed page returns that page's envelope.
```

`fetchAllPages(service, params)` walks `totalPages`; it takes a function `(params) => envelope` or a service
with `getByParameters`. Do not ask for a large `pageSize` instead: the launchpad, `PinnedAppsWidget` and the
store use the backend's default page size.

---

## 10. Storage keys

Arrangement and recents live in the browser (`localStorage`); pins live in Link Loom Cloud (`is_pinned` on
the app preference record, shared with every StoneOS host and the App Store's pin button).

| Key | Content |
|---|---|
| `<ns>::launchpad::layout` | `{ order, pinnedOrder, platformOrder, groups[] }` — tile order and folders |
| `<ns>::launchpad::recent` | last 8 opened ids |
| `<ns>::launchpad::hidden-platforms` | platform ids taken off the rail |
| `<ns>::app-store::sidebar-collapsed` | `"true"` when the person folded the store's sidebar into the rail (xl and up) |

`<ns>` is `storageNamespace`. Mi Retail uses `miretail`, which keeps the keys it had before the move.
A new host picks its own (`sommatic`, `llc`) and never changes it: a new namespace starts everyone from the
plain grid. Two tabs of the same host stay in sync through the `storage` event.

---

## 11. Theming

**The App Store carries StoneOS's own palette**
(`src/components/app-engine/defaults/stoneos-store.palette.js`: accent `#3060c8`, ink `#1c1c1a`…), declared as
scoped custom properties (`--stos-store-*`) on the store's root and on its dialogs and menus, so the host's
MUI theme colour does not reach it. The one exception is its ground: the store paints the same page colour as
My apps (`--stos-bg-page`, `#eff3f9`) and its sidebar one step darker (`--stos-board-column`), so the two halves
of StoneOS read as one place. The tabs bar and the search field take the store's palette while the store is on
screen. The page frame gives the host's footer the kit's white (`--stos-bg-surface`) and a hairline
(`--stos-border`), so the footer never reads as part of the page ground.

**Marks of the store's sidebar rows** (`AppStoreSidebarGlyph.component.jsx`). Where the column is expanded the
label is on screen, so categories keep a grey dot (accent when current) and suites a square in their colour.
Only in the folded rail, where the label hides, a category or a suite shows a tinted square with its two
initials (`initialsOf`: the first two letters of a one-word title, else the first letters of the first two
words). The colour is a muted hue (`STORE_CATEGORY_MARK_COLORS`, one per catalog category; a new category or a
suite without a colour takes one of `STORE_MARK_COLORS` by name, `markColorFor`) painted as a 16% tint with the
hue darkened for the letters, never as a solid block. "See all suites" is an accent arrow.

My apps and the rail follow the tokens below: every colour, radius and shadow resolves a StoneOS kit token
with Mi Retail's value as the fallback (`LAUNCHPAD_THEME`, `LAUNCHPAD_RAIL_THEME`). A host without the kit
looks like Mi Retail's launchpad; a host with the kit (or that sets the tokens on `:root`) follows it. The
brand-bearing ones:

| Token | Fallback | Used for |
|---|---|---|
| `--stos-brand` / `--stos-brand-hover` | `#3c4876` / `#2f3a5f` | drop frames, focus ring, pin state |
| `--stos-text-tertiary` | `#737f94` | section labels, hints |
| `--stos-border` / `--stos-border-strong` | `#e4e8ef` / `#d3d9e3` | tabs bar, search field, chips, folders |
| `--stos-bg-page` / `--stos-bg-muted` | `#eff3f9` / `#f2f4f8` | shortcut pill, folders, tabs track |
| `--stos-tile-hover` | `color-mix(in srgb, #fff 55%, #eff3f9)` | My apps tile hover plate |
| `--stos-launchpad-bg` | sky wash gradient | rail ground |
| `--stos-launchpad-mark` | `#2563eb` | StoneOS mark, rail drop rule |
| `--stos-launchpad-w` | `50px` | rail width (the sidebar's column math reads it, Section 4) |
| `--stos-topbar-h` | `70px` | My apps min-height |

Full list in `src/components/app-engine/defaults/launchpad.theme.js`. Set the brand tokens to the host's
brand; do not copy Mi Retail's `#3c4876` on purpose.

Optional: the grab cursor during a drag. The tiles keep `cursor: pointer` (a tile is clicked first, dragged
second). Mi Retail sets `body[data-mr-dragging]` on `dragstart`/`dragend`/`drop` (capture phase, see
`mi-retail/.../src/utils/dragCursor.js`, installed once in `App.jsx`) with
`body[data-mr-dragging] [draggable="true"] { cursor: grabbing; }`. It covers every draggable surface of the
host, which is why it is not in the SDK.

---

## 12. HTML contract: two hosts, one skeleton

Because a host renders the SDK's components, the HTML of everything the SDK owns is the same in every host.
This is the canonical skeleton (generated class names, text and host data removed):

```
# sidebar
aside.left-side-menu.p-0
  div.d-flex.flex-column.h-100
    div.flex-grow-1.overflow-hidden.stos-leftbar
      nav.loom-launchpad[aria-label=Launchpad]
        a.loom-launchpad__home[aria-label=StoneOS]
          span.loom-launchpad__glow
        div.loom-launchpad__scroller
          div.loom-launchpad__group[aria-label=Platforms]
            button.loom-launchpad__app[aria-label=<platform>]      × the host's platforms
        button.loom-launchpad__all[aria-label=All apps]
      div.stos-leftbar__col
        div.stos-leftbar__nav
          section#sidebar-menu
            ul#side-menu                                           ← the host's <li> modules (not compared)
          div.clearfix
        footer.border-top.d-flex.justify-content-start             ← the host's footer node
          section > button[aria-label=Switch Organization] > figure, span

# breadcrumb (in the navbar's topnav-menu-left)
li
  nav.MuiBox-root[aria-label=Location]
    span.MuiTypography-root.MuiTypography-noWrap                   × one per crumb, "›" spans between

# page
div.content-page … (the host's layout wrappers) … div.stos-page-frame
  (the tabs bar, then My apps or the App Store: the SDK's own markup)
```

**What may differ between hosts:** the text and `aria-label` values (the host's language and platforms), the
`<li>` modules inside `#side-menu`, the footer's contents, and the layout wrappers *above* `.stos-page-frame`
(Mi Retail's `.content-page` is a flex row with the Command Center's panel; Link Loom Cloud admin's is a block).
The frame neutralises them. **Everything else must match**: if a host's skeleton has a `mr-leftbar*` class, a
`li` with utility classes around the breadcrumb, or no `.stos-page-frame`, it is not consuming the SDK's
components and has to be fixed, not documented.

**Check it.** `docs/snippets/stoneos-dom-signature.js` prints this skeleton from a live host. Open My apps in
each host, paste the script in the console, and diff the two outputs; the only differences allowed are the ones
above. The geometry checks of section 13 are the second half of the contract: same x, y and size for the rail,
the toggle, the footer, the breadcrumb text and the tabs bar in both hosts.

---

## 13. Verification checklist (run it in the browser)

Do each and confirm the effect; a probe on a selector that does not exist proves nothing. Use a 1440×900
viewport, then repeat the starred items condensed, at 1024, 768 and 375px.

Shell
- [ ] * `.left-side-menu` is 298px wide (128px condensed); `nav[aria-label="Launchpad"]` is at x=8, width 50,
      8px under the navbar (y=78) and 8px above the floor.
- [ ] * `.content-page` margin-left and `.footer` left equal the aside width, expanded and condensed; no page
      content under the sidebar.
- [ ] * Condensed: the aside is `position: fixed`, the document is not taller than the window, and the
      organization switcher and the all-apps button are on screen.
- [ ] The control in the first row condenses and expands the sidebar; expanded it is at the row's right edge,
      condensed it stands above the row's icon with its centre on the StoneOS mark's.
- [ ] The all-apps dots and the org switcher's avatar share a centre line (±4px: the SDK's own tuning).
- [ ] A long menu scrolls inside the navigation column; the switcher stays at the floor.
- [ ] * Phone and tablet (≤992px): the aside is hidden, the hamburger opens it with the rail inside, a second
      click closes it; `.content-page` and `.footer` margins stay 0; the collapse control is not shown.
- [ ] Overflow detector (elements with `scrollWidth > clientWidth`, or outside their parent) on the aside and
      the navbar at every width: nothing but the rail mark's decorative glow.

Breadcrumb and title
- [ ] A page that declares `usePageMeta({ title, breadcrumb })` shows the trail in the navbar (links before the
      last crumb, `›` between), and `document.title` is `title · appName`.
- [ ] A legacy page that calls `setPageName("X")` shows one crumb `X`.
- [ ] The breadcrumb's text starts 32px from the navbar list's left edge, centred in the 70px navbar, 13px,
      weight 500, white — the same x and y as in every other host.
- [ ] Below 600px it is hidden and the user menu is on screen.

Routes
- [ ] `<base>/stoneos` goes to `<base>/stoneos/apps`; both `apps` and `store` load on a hard reload.
- [ ] The store's screens load on a hard reload: `store`, `store?q=x`, `store/suites`, `store/suites/<slug>`,
      `store/apps/<slug>`, `store/categories/<category>`, `store/organization`.
- [ ] The tabs switch My apps and the App Store without a reload; the rail's StoneOS mark and the all-apps
      button go to My apps.
- [ ] A click on an app of the rail opens `<base>/app-engine/runtime/<slug>`; an app the organization does
      not have shows "Get this app", linking to `store/apps/<slug>`.
- [ ] The host's old catalog routes redirect to the store; the studio's and the runtime's "back" arrive there.
- [ ] The host's shortcut or command opens My apps.

Page ground
- [ ] * On My apps and the App Store the tabs bar starts at the aside's right edge (x = aside width) and the
      navbar's bottom edge (y = 70) and runs to the right edge; the page paints `#eff3f9` behind it, with no
      gutter and no strip between the page and the sidebar or the navbar.
- [ ] * `.content-page` has no padding other than the 70px under the navbar, and the host's footer is
      transparent on these pages; other pages of the host keep their own layout.
- [ ] Phone: the same, from x=0.

Compare the hosts
- [ ] The skeletons of section 12 match, and the numbers above (rail, toggle, footer, breadcrumb, tabs bar,
      store section) are equal in both hosts.

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
- [ ] `/` focuses the search; typing puts `?q=` in the URL and shows "Results for …"; clearing returns to
      Discover; Escape clears.
- [ ] Discover: the blue Featured banner (View → the app's page, never the app) + "Suggested for you" (one
      row at xl, stacked below), highlighted suites with "See all suites →", and the grid loads the next
      page as you scroll until "That is every app in the store"; "Show more" works too.
- [ ] No host colour inside the store: every background is the warm grey ground or white cards; buttons
      are pills. An app the organization has shows **View** everywhere but its own page, where it is
      **Open**.
- [ ] Every screen below Discover has its way back ("← App Store", "← All suites", "← Discover") in the
      left cell of the tabs bar; My apps' bar is unchanged.
- [ ] Sidebar counts (All suites, the organization's apps, each category) match the screens they open; the
      fold control («) at the end of the Discover row folds the column (Discover itself still navigates),
      » at the top of the rail unfolds it, and the fold survives a reload; below xl the rail shows a
      tooltip per icon.
- [ ] Slow the network: every screen draws its skeleton, never a progress bar.
- [ ] An app's name opens `apps/:slug` (a page, not a drawer); media are images or videos from Storage.
- [ ] Get on a free app → dialog → "Added to My apps" → the app is pinned on the rail at once and appears in
      My apps; the card turns to View. Get the suite does the same for the suite's missing apps.
- [ ] A public app the organization does not have, opened by its runtime URL, shows "Get this app".
- [ ] "Build your own app" opens the host's form in a modal; creating opens the studio.

Bridge (with the Command Center on)
- [ ] `/snapshot-insight` on `page-context` returns the launchpad/store data; filling the launchpad search
      from the Command Center updates the field.

---

## 14. Known pitfalls

- **Two SDK copies** (linked SDK without `dedupe`): the rail ignores the provider (English, default routes).
- **The vendored Adminto `app.css` is not yours to patch.** Mi Retail changed the condensed aside to
  `position: fixed` and the body's `min-height` by hand; the SDK now does both. A host that patches it again
  forks from the others.
- **An older Adminto `app.js` has no `condense`/`expand`/`toggle`** (its collapse code is commented out and its
  mobile button slides the menu by `-400px`): the sidebar cannot condense until 3.3 is applied.
- **A delegated handler for `.button-menu-mobile` is added on every page load** unless it is namespaced and
  `off`ed first (3.3): an even number of handlers toggles nothing.
- **`data-simplebar` on the navigation column** measures zero height and blocks scrolling.
- **Unscoped desktop width overrides** break the phone layout in condensed mode; the SDK scopes them to
  `min-width: 993px`.
- **A wrapper around the breadcrumb** (`d-flex`, `h-100`, `ps-3` on its `<li>`) changes its offset and, in
  Adminto's floated list items, collapses its height below the desktop breakpoint. It is `<li><NavbarBreadcrumb /></li>`.
- **`⌘⇧A`** may already be taken by the host's own commands; the Launchpad shortcut is the host's to choose.
- **The old `setPageName(name)` is not a title any more**: it feeds a one-crumb trail. A host with 70 pages
  calling it needs no edit, and moves to `usePageMeta` page by page.
- **`contentHeight`** of the App Store assumes 70 + 52 + 50px of chrome; a host with a different footer
  gets a second scrollbar or a gap until it passes its own value.
- **`:has` unsupported** (old Firefox): the pages render on the host's padding instead of the frame.
- **Vite does not see a rebuilt SDK `dist` that was swapped as a folder** (a linked package outside the
  project root): restart the dev server and clear its cache (`node_modules/.vite`, or the stack's
  `.state/vite-cache-*`). Rebuild into a copy and swap the `dist` folder by rename, so a running host never
  finds a half-written one.
- **Stale modules after syncing sources with `rsync -a`**: it preserves mtimes, so Vite may keep serving the
  old module. `touch` the synced files or restart Vite with `--force`.
- **`import(\`@mui/icons-material/${name}.js\`)` never resolves in a Vite host.** The SDK's
  `DynamicMuiIcon` reads the `@mui/icons-material` namespace instead; legacy app definitions whose `icon` is
  a MUI name (`"Gavel"`) render that icon, not the category fallback. Do not "optimise" it back.
- **Menus**: the right-click menu styles itself (30px rows, 13px type, 14px glyphs). A host rule targeting
  `.MuiMenuItem-root` with higher specificity wins; do not add global menu rules to fix a single menu.
- **`platforms` built inline** re-derives the rail on every render; pass a module constant.
- **Pins are shared** across hosts (same preference record); layouts and recents are not.
- **Getting an app pins it live**: the acquisition dialog pins through `useLaunchpadApps().togglePin`, the
  same path the rail uses, so the rail updates without a reload.
- **Mounting the store on `store` instead of `store/*`** leaves every screen but Discover unreachable
  (`stoneOSLaunchpadRoutes()` does it right).
- **A host without the runtime opens no apps.** `paths.runtime` points at `<base>/app-engine/runtime/:appSlug/*`,
  which needs the host's runtime page (`AppRuntimeHostComponent`) and the module registry
  (`src/setup/app-engine-runtime.js`, with the packages apps resolve at runtime). Without them the rail and both
  pages work and a tile falls through to the host's catch-all route. Add the runtime route before promising apps there.
- **A stack where the App Engine URL is not the LLC backend**: a host that reads definitions, sessions and
  files from `VITE_APP_ENGINE_URL` needs the service that serves them (the LLC backend in the test stack, port
  3191; the App Engine service only builds), or its counters read 0 and the runtime says "Failed to open session".

---

## 15. Reference implementations

- **Link Loom Cloud admin** (built from this runbook; the model to copy):
  `public/assets/js/app.js` (3.3), `src/main.jsx` (3.2), `src/layouts/LayoutAdmin.jsx` (3.4),
  `src/components/layouts/launchpad/LaunchpadHost.component.jsx`, `src/constants/platforms.js`,
  `src/components/layouts/sidebar/SidebarAdmin.jsx` (3.5), `src/components/layouts/navbar/NavbarAdmin.jsx` (3.6),
  `src/routes/domains/app-engine/app-engine.routes.jsx` (3.7), `vite.config.js` (3.1).
- **Sommatic client** (`sommatic-ai/bsh.sommatic.client.webapp`, the template Mi Retail was bootstrapped from): the
  same files under `src/`, with `basePath="/client"`, `storageNamespace="sommatic"`, English labels from the SDK,
  `⌘⇧A` for My apps (`⌘⇧L` was already its chats shortcut), the one-crumb `setPageName` shim (90 legacy pages), and
  the Command Center bridges copied from Mi Retail (`launchpad/AppLaunchpad.sommatic.jsx`,
  `marketplace/AppEngineMarketplace.sommatic.jsx`). Its old marketplace (page, component, nine subcomponents and the
  `application-management` copy) is gone: `app-engine/marketplace`, `app-engine/catalog` and
  `application-management/marketplace|catalog` redirect to the store.
- **ÊTRUNE ID admin** (`etrune/etrune.id/etrune.id.admin.webapp`, Vite, react-router 6): the same files, with
  `basePath="/admin"`, `storageNamespace="etrune-id"`, the one-crumb shim, `⌘⇧A`, the brand tokens
  `--stos-brand` / `--stos-brand-hover` set to its brown in `src/index.css`, and `VITE_LOOM_CLOUD_BACKEND_URL` added
  to its env files. It has **no App Engine runtime route**, so it shows the rail, My apps and the App Store, but an
  app tile has nowhere to open: see the pitfall below.
- **Mi Retail** (where the Launchpad was designed, now migrated to the same components): same files as above
  under `src/` (`SidebarBusiness.jsx`, `LayoutBusiness.jsx`, `NavbarBusiness.jsx`, `LaunchpadHost.component.jsx`,
  `routes/domains/bsh/link-loom-cloud/app-engine/app-engine.routes.jsx`) with `basePath="/client"`, and its
  skeleton hashes equal to Link Loom Cloud admin's (section 12). What stays Mi Retail's by design:
  `src/i18n/{en,es}.js` (`copy.launchpad`, `copy.appStore`), the sidebar modules and their tree styles
  (`ll-sidebar-section` rules in `src/styles/components.css`), the Command Center bridges (`*.sommatic.jsx`),
  the create-app form, `src/setup/useAppEngineDefinitionCatalog.js` (the Command Center catalog through
  `fetchAllPages`) and the drag cursor (`src/utils/dragCursor.js`). Its legacy `setPageName` shim sets no crumb
  (its pages print their own title); Link Loom Cloud admin's sets one.
