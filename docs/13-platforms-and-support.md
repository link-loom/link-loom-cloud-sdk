# StoneOS platforms and the support center

Two things every StoneOS host used to copy-paste, now components of the SDK: the **platform hub** (one page per
platform of the ecosystem, with its routes) and the **support center** (the whole help center of a product).
A host mounts them with one route helper each and gives them its data; it never copies their markup. The
rule of `docs/11-launchpad-host-integration.md` section 0 applies: if a host looks different, it changes a
prop or a label, not the component.

`@link-loom/cloud-sdk` **never imports `@sommatic/react-sdk`** or any service of the host. What needs Sommatic
(the assistant and the Command Center context) arrives from the host through two props, section 5.

---

## 1. What you get

| Export | What it is |
|---|---|
| `STONEOS_PLATFORMS` | The nine platforms, frozen, in this order: `linkloom`, `veripass`, `sommatic`, `vectry`, `hivora`, `vca`, `miretail`, `micampus`, `etrune`. |
| `DEFAULT_HIDDEN_PLATFORMS` | `['etrune']`: the platforms a host does not list unless it asks. |
| `platformsForSettings({ hidden })` | The catalog minus `hidden` (default `DEFAULT_HIDDEN_PLATFORMS`). What a host lists in settings and menus. |
| `platformLabels(platform, locale)` | `{ capability, name, description }` in the locale; English when the locale has none. |
| `platformIconSrc(platform, iconBasePath)` | Where the host serves the platform logo. |
| `PlatformHub`, `PLATFORM_HUB_LABELS` | The hub page of one platform and its copy (`en`, `es`). |
| `stoneOSPlatformRoutes(options)` | `<Route path="platforms">`: the hub and the help center of every platform. |
| `supportCenterRoutes(options)` | The help center of one product as a route group. |
| `SupportCenterLayout`, `SUPPORT_CENTER_LABELS`, `SUPPORT_SUB_PAGES` | The layout route behind both helpers, its copy and the ids of its sub-pages. |
| `SupportHubSubPage`, `SupportCasesSubPage`, `SupportNewCaseSubPage`, `SupportCaseDetailSubPage`, `SupportAssistantSubPage`, `SupportIncidentsSubPage`, `SupportGuideDetailSubPage`, `SupportCategoriesSubPage` | The eight sub-pages, for a host that builds its own route tree under `SupportCenterLayout`. |
| `stoneOSAppsMenuItems(options)`, `APPS_MENU_LABELS` | The props of `AppsMenu` (`@link-loom/react-shell`) for the navbar's StoneOS menu. |

Prerequisites are the launchpad's (`docs/11`, section 2): `react-router-dom` 6 or 7, MUI, `@link-loom/react-sdk`,
and the Veripass `AuthProvider` above the routes (the support center reads the signed-in person with
`useAuth()`). Bootstrap 5 utility classes, as everywhere in StoneOS.

---

## 2. The platform catalog

Each entry is named by the **capability** it gives an organization; the brand comes second.

```js
{
  id: 'veripass',
  capability: 'Identity',             // English capability, also in labels.en
  color: '#E4536A',
  icon: 'veripass.svg',               // a file name; the host owns the base path
  portalUrl: 'https://veripass.com.co',
  supportNamespaceSlug: 'veripass',   // the support namespace of the platform (its id)
  stoneosAppSlug: null,               // the StoneOS app that will replace the portal, once it ships
  labels: {
    en: { capability: 'Identity', name: 'Veripass', description: '…' },
    es: { capability: 'Identidad', name: 'Veripass', description: '…' },
  },
}
```

| Platform | Capability (en / es) |
|---|---|
| Link Loom Cloud | Applications / Aplicaciones |
| Veripass | Identity / Identidad |
| Sommatic AI | Intelligence / Inteligencia |
| Vectry Analytics | Analytics / Analítica |
| Hivora Dynamics | Devices / Dispositivos |
| Virtual Capital of America | Finance / Finanzas |
| Mi Retail | Operations / Operaciones |
| Mi Campus | Learning / Aprendizaje |
| Êtrune | Retail / Comercio |

The brand name is the same in both languages. Logos are `{iconBasePath}/{icon}`; the default base path is
`/assets/images/bsh-apps` (the folder Mi Retail serves them from), plus `stone-os.svg` for the menu badge and
`etrune.svg`.

---

## 3. Mounting the platform routes

```jsx
import { Route } from 'react-router-dom';
import { stoneOSPlatformRoutes } from '@link-loom/cloud-sdk';
import { People, Groups, Description } from '@mui/icons-material';

const sectionsFor = (platform) =>
  platform.id === 'veripass'
    ? [
        { to: '/client/veripass/user/management', title: 'Users', description: 'Register and manage platform users.', Icon: People },
        { to: '/client/veripass/team/management', title: 'Teams', description: 'Organize users into teams.', Icon: Groups },
        { to: '/client/veripass/legal/contract/management', title: 'Contracts', description: 'Manage user contracts.', Icon: Description },
      ]
    : [];

<Route path="/client" element={<LayoutClient />}>
  {stoneOSPlatformRoutes({
    sectionsFor,
    support: { originSurface: 'miretail-workspace-webapp', assistant, renderBridge },
    locale: 'en',
    iconBasePath: '/assets/images/bsh-apps',
  })}
</Route>
```

| Option | Default | Meaning |
|---|---|---|
| `platforms` | `platformsForSettings()` | The platforms the routes serve. A platform not in the list renders nothing (no error, no 404 page). |
| `sectionsFor(platform)` | `() => []` | The cards the host has built for the platform: `[{ to, title, description, Icon }]`. |
| `support` | `{}` | What the host gives every help center: `originSurface`, `assistant`, `renderBridge`, `labels`, `baseUrl`, `environment`. |
| `locale` | `'en'` | `'en'` or `'es'`; any other falls back to English. |
| `iconBasePath` | `/assets/images/bsh-apps` | Where the host serves the logos. |
| `labels` | | Overrides of `PLATFORM_HUB_LABELS` (hub only; the help center's come in `support.labels`). |

It gives two routes under `platforms`:

| Route | Renders |
|---|---|
| `platforms/:platformId` | `PlatformHub` of that platform, with its help center linked at `…/platforms/:platformId/support`. |
| `platforms/:platformId/support` | `SupportCenterLayout` on that platform's `supportNamespaceSlug` (`productSlug` is the id, `productDisplayName` the brand), with the sub-pages of section 4 under it. The layout is keyed by the platform, so moving from one help center to another starts clean. |

### `PlatformHub`

`PlatformHub` prints exactly what the host hubs print: `section.container-fluid.my-4.px-4 > section.row >
header.col-12 (h4 + p.text-muted)` and a `QuickLinkCard` grid (`@link-loom/react-sdk`), in this order: the
`sections`, a **Help center** card to `supportPath` (left out without one), and a **Go to {name}** card to
the platform's `portalUrl`. The title is the capability and the paragraph its description.

A platform with no `sections` shows a card that goes nowhere ("Coming soon: {capability} will open its
StoneOS app here"), with the platform logo, in place of the sections. Props: `{ platform, locale = 'en',
sections = [], supportPath, iconBasePath = '/assets/images/bsh-apps', labels }`. A host that routes the hub
itself renders `<PlatformHub platform={…} supportPath={…} />` and nothing else.

Hub copy lives in `PLATFORM_HUB_LABELS`; the entries that name a platform are functions
(`portal.title: (name) => …`) so each language orders its own words. `labels` is deep-merged over the
locale's set.

---

## 4. Mounting a support center

```jsx
import { Route } from 'react-router-dom';
import { supportCenterRoutes } from '@link-loom/cloud-sdk';

<Route path="veripass/support">
  {supportCenterRoutes({
    namespaceSlug: 'veripass',
    productSlug: 'veripass',
    productDisplayName: 'Veripass',
    originSurface: 'miretail-workspace-webapp',
    assistant,        // optional, section 5
    renderBridge,     // optional, section 5
  })}
</Route>
```

`supportCenterRoutes` returns a layout route **without a path**, so the host decides where it lives. The
layout works out its base path from the route it is mounted on (`useResolvedPath`), so no path is written
in the SDK. The routes under it are relative:

| Path | Sub-page |
|---|---|
| index | redirects to `hub` |
| `hub` | `SupportHubSubPage` |
| `cases` | `SupportCasesSubPage` |
| `new-case` | `SupportNewCaseSubPage` |
| `case/:id` | `SupportCaseDetailSubPage` |
| `assistant` | `SupportAssistantSubPage` |
| `incidents` | redirects to `../cases` |
| `guide/:slug` | `SupportGuideDetailSubPage` |
| `categories` | `SupportCategoriesSubPage` |

Options: `{ namespaceSlug, productSlug, productDisplayName, originSurface, assistant = null, renderBridge,
labels, locale = 'en', baseUrl, environment }`. `baseUrl` is the Link Loom Cloud backend (falls back to
`VITE_LOOM_CLOUD_BACKEND_URL`); `environment` is the label diagnostics print (falls back to
`VITE_APP_BLACKWOOD_APPS_ENVIRONMENT`).

### What the layout does

- Loads the namespace of `namespaceSlug` and, with it, categories, incidents, the person's five most recent
  cases, guides and the case statuses, and puts them in the outlet context of the sub-pages. Without an
  organization it loads nothing; if the namespace does not exist it stops there.
- Turns every `link-loom-support::*` action the Link Loom support components raise into navigation (a
  route relative to its base path) and into the case operations: create, open, change status, resolve,
  close, delete, reply, open the diagnostics. The action table is `resolveActionRoute` and
  `SUPPORT_ACTIONS` in `support-center.navigation.js`.
- Opens the **diagnostics bundle** modal: the context of the page plus the last 50 console errors and
  warnings, uncaught errors and unhandled rejections. A case created from the form carries the
  environment, route, browser and OS.

The console and error capture lives in `diagnostics-capture.js`. It does not run when the SDK is imported:
the layout installs it **once**, the first time a support center mounts, and a second mount does not wrap
the console again. Errors before that first mount are not in the bundle.

### Copy

`SUPPORT_CENTER_LABELS = { en, es }` holds the chrome of the center: the loading text, the notices of the
sub-pages ("Loading case…", "Guide not found."), the error boundary and the diagnostics modal. `labels` is
deep-merged over the set of `locale`. The cards inside each sub-page keep their own copy
(`support.defaults.js`, overridden through each component's `ui` prop as before).

---

## 5. The assistant and the Sommatic bridge

The assistant tab needs an AI platform, and the center must stay usable without one. So both pieces come
from the host:

```js
assistant = {
  executionService,        // streams a conversation: the panel calls executeEphemeralStream(...) on it
  llmProviderService,      // lists the models: getByParameters({ queryselector: 'all' })
  components: { CognitiveEntry, ChatBubble, SystemResponse },   // the chat primitives the panel renders
}
```

- With `assistant`, the layout loads the model list **without awaiting it** (the call that leaves Link Loom
  Cloud must not hold the whole center on "loading" when that backend is slow) and the assistant sub-page
  renders `SupportAssistantPanel` with the service, the providers and the components.
- With `assistant = null` (the default) the layout loads no providers and the assistant sub-page says the
  assistant is not available (`labels.assistantUnavailable`). Everything else works.

`renderBridge(subPageId, props)` is how a host keeps its Command Center context (what Mi Retail calls the
`*.sommatic.jsx` companions) without the SDK importing it. Every sub-page calls it first, with its own id
(`SUPPORT_SUB_PAGES`: `hub`, `cases`, `new-case`, `case-detail`, `assistant`, `incidents`, `guide-detail`,
`categories`) and the props the companion of that page received (`namespace`, `categories`,
`supportContext`, `handleItemOnAction`, …). It returns a React element (a component that registers its
context source and returns `null`) or `null`:

```jsx
import { SUPPORT_SUB_PAGES } from '@link-loom/cloud-sdk';

const bridges = {
  [SUPPORT_SUB_PAGES.HUB]: SupportHubSubPageSommatic,
  [SUPPORT_SUB_PAGES.CASES]: SupportCasesSubPageSommatic,
  // …
};

const renderBridge = (subPageId, props) => {
  const Bridge = bridges[subPageId];
  return Bridge ? <Bridge {...props} /> : null;
};
```

Without `renderBridge` nothing is rendered next to the sub-pages.

---

## 6. The apps menu

`stoneOSAppsMenuItems({ platforms, locale, iconBasePath, storeLink, labels })` returns the props of
`AppsMenu` from `@link-loom/react-shell` (the SDK does not import the shell):

```js
{
  apps: [{ id, title, link, icon, color, tagline }],        // a tile per platform
  header: { badgeSrc, title: 'StoneOS', caption: 'Blackwood Stone Platforms' },
  more: { link: storeLink, title: 'Explore StoneOS', subtitle: 'Every platform in one place' },
}
```

A tile's `title` is the brand, its `tagline` the capability it gives, its `link` the platform's portal and
its `icon` the logo under `iconBasePath`. `platforms` defaults to `platformsForSettings()` (without Êtrune);
`storeLink` is where the footer goes, by default the StoneOS site. `APPS_MENU_LABELS` has the header and
footer copy in `en` and `es`.

---

## 7. Tests

`npm test` covers the catalog, the apps menu, the labels (both languages, same keys), the action table, the
diagnostics capture, the route trees (paths, redirects, matching, the base-path assumption), the hub and the
platform routes rendered on the server. The support components and `@link-loom/react-sdk` do not load under
Node as they are, so `test/support/` adds three things to the loader: `peer-shims-resolver.mjs` (points
`@link-loom/react-sdk` and `styled-components` at their ESM build and `@veripass/react-sdk` at a stub, and
swaps `QuickLinkCard` for a plain stand-in), `vite-env-loader.mjs` (an empty `import.meta.env`, which Vite
defines in a host) and the existing JSX transform. `react-router-dom` is a dev dependency for the same
reason.
