# App Store, business suites and entitlements

What the SDK's App Store is built on: which apps an organization can see and use, how suites group them,
how "Get" works, and the SDK surface hosts use. The backend is the source of truth; its API contract is
`link-loom/link-loom-cloud/bsh.linkloom.cloud.backend.svc/docs/app-engine/app-store-contract.md` (callers,
errors, data shapes, rollout). This page is the client side of that contract. Host wiring (routes, labels,
bridge) is in `docs/11-launchpad-host-integration.md`.

---

## 1. The model

| Record | What it is |
|---|---|
| App definition | An app. New store fields: `visibility`, one `category`, `pricing`, `store` (listing), mandatory `publisher`; `organization_id` optional (official apps have none). |
| Suite (`app_suite`) | A priced bundle of apps for a niche: `{ slug, name, tagline, description, kind, color, icon, apps: [{ app_slug, display_order }], pricing, is_highlighted, display_order, visibility }`. An app can be in several suites. Managed in the Link Loom Cloud admin. |
| Entitlement (`app_entitlement`) | "This organization may use this app": `{ organization_id, app_definition_id, app_slug, enabled, source, suite_id, pricing_snapshot, granted_by }`, unique per organization and app. |

Pricing is flat and one-time, per app and per suite (`{ model, amount_minor, currency }`, integer minor
units). A suite's price is shown as it is: the store never compares it with the price of its apps.

**Nothing is charged.** Get, Buy and Get the suite grant the entitlement to the organization. The copy must
never say a payment happened.

## 2. The access rule

- **Owned**: the app's `organization_id` is the caller's organization.
- **Entitled**: the organization holds an enabled entitlement.
- **Platform surface**: official apps with `manifest.launcher_visibility: "system"` (approval gates, intake
  forms) are usable by every organization, reported as `entitled`, and never listed in the store.
- **Usable** = any of the three.

Consequences the UI relies on:

| Surface | Behaviour |
|---|---|
| My apps, the rail, `PinnedAppsWidget`, the Command Center catalog | Only usable apps (`definition/marketplace`, `definition/command-center-catalog`). |
| The store's catalog (`store/apps`, `scope: all`) | Public apps on sale, each with its `access` (`owned`, `entitled`, `available`). |
| "`<Organization>` apps" (`scope: organization`) | The organization's own apps, any visibility. |
| Opening an app (`session/open`) | Usable → opens. Private and not usable → 404 `app_not_found`. Public and not usable → 403 `app_not_entitled`: `AppRuntimeHostComponent` shows "Get this app", linking to the app's store page. |

Visibility is private by default; public is an explicit `manifest.visibility: "public"`.

## 3. Closed values — `app-store.enums.js`

No component writes a closed value as a literal. The module also holds the store's UI-only values:
`STORE_PILL_TONES` (accent, tint, dark, neutral, danger) and `STORE_PILL_SIZES` (small, medium, large). They come from one module
(`src/features/app-engine/app-store/app-store.enums.js`, exported from the package root) that mirrors the
backend catalog keys; the maps are `backend key → wire name`:

| Export | Values (key → name) |
|---|---|
| `STORE_CATEGORIES` | ai, productivity, operations, sales, finance, communication, analytics, support, people |
| `STORE_SCOPES` | all, organization |
| `STORE_SORTS` | featured (default), name, recent |
| `STORE_ACCESS_STATES` | owned, entitled, available |
| `STORE_PRICING_MODELS` | free, oneTime → `one_time` |
| `STORE_MEDIA_TYPES` | image, video |
| `STORE_VISIBILITIES` | private, public |
| `SUITE_KINDS` | core, business, industry |
| `APP_CONTRACT_KINDS` | input, output, event |
| `APP_ENGINE_ERROR_CODES` | appNotEntitled → `app_not_entitled`, appNotFound, suiteNotFound, organizationRequired |

Helpers: `enumName(value)` (the wire name of an entry object or a string), `enumKeyOf(map, value)` (its
backend key), `isEnumValue(value, name)`.

The lists a person sees (sidebar categories, category chips, suite kinds) come from the backend's `catalogs`
(`useStoreCatalogs`, loaded once per backend per session), so a category added in the backend appears
without an SDK release. Titles come from `storeLabels`, indexed by the backend key (`categoryTitles.ai`,
`pricingModels.oneTime`, `access.entitled`, `suites.kindTitles.core`…); a key the host has not translated
falls back to the catalog's own `title`.

The API accepts a key, a name or the entry object; the store sends names (`category=productivity`).

## 4. Endpoints the SDK calls

All as the signed-in person: `Authorization: Bearer <Veripass token>` and
`x-veripass-organization-identity: <active organization>`. The backend takes the organization from those
headers, never from a body.

| SDK service | Endpoint | Methods |
|---|---|---|
| `AppEngineStoreService` | `GET /app-engine/store/:queryselector` | `getApps({ search, category, suite, scope, sort, page })`, `getFacets()`, `getHome()`, `getApp({ slug })`, `getCatalogs()` |
| `AppEngineAppSuiteService` | `GET /app-engine/suite/:queryselector` | `getAll(params)`, `getHighlighted(params)`, `getBySlug({ slug })`, `getCatalogs()` |
| `AppEngineAppEntitlementService` | `POST /app-engine/entitlement/grant/`, `/grant-suite/` | `grant({ appSlug })`, `grantSuite({ suiteSlug })`, `getCatalogs()` |
| `AppEngineAppDefinitionService` | `GET /app-engine/definition/marketplace/`, `/command-center-catalog/` | `getMarketplace(params)`, `getCommandCenterCatalog(params, settings)` |

The three new services extend `IdentityApi` (`src/services/base/identity-api.service.js`): headers from a
`getHeaders()` callback read on every request, and failures resolved as the backend's envelope
(`{ success: false, status, message, error_code }`) so a screen can tell 404 from 403 from offline. The base
`BaseApi` now returns the envelope on reads and updates too (it used to return `undefined`), and its query
serializer omits only `null`/`undefined` — `false` and `0` travel as real filters.

Inside the SDK the services come from `AppEngineSDKProvider`, which builds the identity headers from
`useAuth().getToken()`. A host calling them itself uses the same helper:

```js
import { AppEngineStoreService, createSessionIdentityHeaders } from "@link-loom/cloud-sdk";

const store = new AppEngineStoreService({ baseUrl, getHeaders: () => createSessionIdentityHeaders(getToken()) });
```

### Pagination

Every list is Link Loom standard: `page` from 1, the backend's default `pageSize` (25), answers
`{ items, totalItems, totalPages, currentPage, pageSize }`. Nothing in the SDK asks for a large page:

- The store's lists page as the person scrolls (`useStorePagedApps` + an IntersectionObserver sentinel, with
  a "Show more" button for keyboards and screen readers).
- Whoever needs a whole collection walks it with `fetchAllPages(service, params)`: the launchpad and the
  rail (`useLaunchpadApps`: definitions and the person's preferences), `PinnedAppsWidget`, the store's suite
  list and a suite's apps, and the hosts' Command Center catalog hooks. A failed page returns that page's
  envelope, never a partial list.

## 5. The store's screens and actions

Routes under `paths.store` (the host mounts `store/*`): Discover (`?q=` for search), `suites`,
`suites/:slug`, `apps/:slug`, `categories/:category` (`?suite=`), `organization`. Views are `STORE_VIEWS`;
`buildStorePaths(paths.store)` builds the URLs.

| Action | Where | What happens |
|---|---|---|
| **View** | Card, row, suggestion, banner (usable apps; the Featured banner whatever the access) | Goes to the app's page (`apps/:slug`). Outside that page an app the organization has is never launched. |
| **Open** | App page only (usable apps) | Navigates to `paths.runtime(slug)`. |
| **Get** / **Buy · price** | Card, row, app page (available apps; free / one-time) | Opens the acquisition dialog: confirm (what the app may access from `store.data_access`, who gets it — everyone in the organization — and the price), progress while `grant` runs, done. Done pins the app for the person through `useLaunchpadApps().togglePin`, so My apps and the rail show it at once (the rail shows its first 10 pins, as always). |
| **Get the suite · price** | Suite page (while it has apps the organization lacks) | Same dialog listing the apps it adds; `grant-suite` entitles the public members not yet usable. |
| Edit in Studio / Delete | Owner menu of apps the organization owns | Unchanged behaviour. |
| Build your own app | Sidebar banner, organization page | The host's create form (`renderCreateApp`). |

After a grant the store does not reload its lists: it remembers what was granted (`accessOf`), refreshes the
counts and the suites' coverage, and reloads only the page the person is on.

Discover reads `store/home`: the Featured banner is `spotlight` (its `headline`/`subtitle` are the banner
copy; no banner when it is `null`) and "Suggested for you" lists every app in `suggested` (the apps the
operator features), each with its price or "In your apps". While a screen loads it draws a skeleton of its
own layout; the store shows no progress bar for content.

The store shows only real data: no ratings, no adoption counts, no invented screenshots. Media are the
listing's `store.resources` (images and videos in Link Loom Cloud Storage), rendered as `<img>` or
`<video controls>` by `media_type`, from `view.path` prefixed with the backend URL.

## 6. Rollout and what hosts must do

The backend runbook (migrations of `category` and `publisher`, the entitlement backfill, republishing the
official apps) is in the contract. On the client side:

1. Publish the SDK and install it in each host.
2. Mount the store on `store/*` and pass `storeLabels` (Mi Retail: `copy.appStore`).
3. Replace any bare `fetch` of the catalog with the SDK service + identity headers + `fetchAllPages`
   (Mi Retail and the Sommatic client hooks are the reference).
4. Hosts that open apps pass `getIdentitySession` to `AppRuntimeHostComponent`; without identity the backend
   refuses every app that is not a platform surface. The SDK's Studio preview opens as the person;
   `useAppRuntime` takes the same `getIdentitySession` option.
