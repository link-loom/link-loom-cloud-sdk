# link-loom-cloud-sdk

## App runtime

`AppRuntimeHost` loads an App Engine bundle and injects the `sdk` object (`sdk.identity`, `sdk.data`,
`sdk.files`, `sdk.directory`, `sdk.signals`, `sdk.notify`, `sdk.api`). The shared contract lives in
`bsh.linkloom.cloud.app-engine.svc/docs/architecture/stoneos-productivity-suite.md` (sections 2, 3, 5, 6, 7).

### Host context

`AppRuntimeHost` accepts `hostContext`, a JSON-safe object describing the embedding platform. Apps read a
frozen copy as `sdk.context.host` (`null` when the host passes nothing) and light up platform features only
when the host declares the capability:

```jsx
<AppRuntimeHost hostContext={{ platform: "mi-retail", name: "Mi Retail", capabilities: ["work-items"] }} />
```

```js
const canConvert = sdk.context.host?.capabilities?.includes("work-items");
```

- `platform`: stable id of the host (`mi-retail`, `sommatic`, `link-loom-cloud`, …).
- `name`: display name of the host.
- `capabilities`: string ids of the host APIs an app may call through `sdk.api` (base URL = the host backend).
  `work-items` = Mi Retail work items (`POST /workspace/operations/ingest`, app contributions, workspace tree and
  projects). Every ingest names the person the app acts for — `actor: { identity: sdk.identity.veripassIdentity,
  name: sdk.identity.displayName }` — and is refused with 400 without it: an app never writes work anonymously.
- `locale`: the host's current UI language (`en`, `es`, …). Apps whose language setting is `platform` follow it.
- `timeZone`: the host's IANA time zone (`America/Bogota`, …). Omitted when the host has no time zone setting;
  apps then fall back to the browser zone.

`sdk.context.host` always returns the latest value. When the host's `locale` or `timeZone` changes while the app
runs, `sdk.context.onHostChange(callback)` fires with the new host object; it returns the unsubscribe function:

```js
const unsubscribe = sdk.context.onHostChange?.((host) => setLocale(resolveLanguage(settings.language, sdk)));
```

Functions and non-serializable values are dropped. Hosts running an older SDK ignore the prop, so apps must
treat a missing `sdk.context.host` as "no host capabilities".

### Runtime dependencies

The SDK registers generic modules in `window.__LOOM_RUNTIME__`: context-bearing packages statically
(React, React Router, MUI, Emotion, `@link-loom/react-sdk`, `@veripass/react-sdk`, `react-moveable`,
`react-selecto`) and pure libraries through lazy loaders (dayjs, luxon, zod, react-hook-form, recharts,
react-markdown, axios, `@tanstack/react-query`, MUI icons and date pickers, glide-data-grid,
fast-formula-parser, exceljs, pptxgenjs, html-to-image, rrule, ical.js). Static modules are external in the
SDK build, so the host bundler resolves them against the host React. Hosts keep precedence.

Rich documents are not a runtime dependency. Apps never import tiptap (`@tiptap/*`), dompurify, docx or
mammoth directly: they use `RichDocumentEditor`, `editorCommands`, `sanitizeDocumentHtml`, `exportDocx` and
`importDocx` from `@link-loom/react-sdk`, the copy the host already shares. A second editor stack inside an
app bundle would load a duplicate ProseMirror instance.

### Backend envelopes the runtime relies on

- Batch (`POST /app-engine/data/batch`) operations are `create | update | set-key | delete | restore | purge | share`;
  the answer is `{ results: [{ index, op, client_mutation_id, status, success, message, result }] }`.
- `409` answers `{ status: 409, success: false, message, result: { current } }`.
- `GET /app-engine/data/key` answers `{ record }` (`record` is `null` when unset); `create` ignores `key`.
- `GET /app-engine/data/changes` pages oldest-first, includes soft-deleted records and `server_time`, which is
  the next watermark. Purged records never appear: a `404` on a known id means purged.
- Records outside the app or organization answer `404`.
- `user:{veripass_identity}` and `app-data:*` signal channels require identity: streams pass `access_token`,
  `organization_id` and `app_session_id` as query params, and `sdk.signals.subscribe(channel)` returns its
  unsubscribe function.

## Launchpad and App Store

`LaunchpadRailComponent` (sidebar rail), `AppLaunchpadComponent` ("My apps") and `AppStoreComponent`, configured
once per host with `LaunchpadProvider`. Integrating them into a host means shell changes as well; follow
[docs/11-launchpad-host-integration.md](docs/11-launchpad-host-integration.md).

## Platforms and the support center

`stoneOSPlatformRoutes()` mounts the hub and the help center of every StoneOS platform (`STONEOS_PLATFORMS`),
`supportCenterRoutes()` mounts the help center of one product anywhere, and `stoneOSAppsMenuItems()` gives the
navbar's StoneOS menu its data. The assistant and the Command Center context come from the host, never from an
import: see [docs/13-platforms-and-support.md](docs/13-platforms-and-support.md).

## StorageBrowser

Finder-style file manager shared by the operator console and user-facing hosts.

```jsx
import { StorageBrowser, StorageObjectService } from '@link-loom/cloud-sdk';

const services = useMemo(
  () => ({ storage: new StorageObjectService({ baseUrl, getHeaders: () => identityHeaders }) }),
  [],
);

<StorageBrowser
  scope="user"                       // 'operator' (api-key console) | 'user' (identity headers)
  services={services}                // memoized: { storage: StorageObjectService-like client }
  routing={{
    path,                            // folder path below the floor, URI-encoded segments ("Archive/Invoices")
    view,                            // '' | 'trash' | 'recent' (recent: user scope only)
    folderId,                        // optional legacy id link, rewritten to the path once resolved
    onNavigatePath: (path, { view, replace }) => {},
    onViewChange: (view) => {},      // optional; defaults to onNavigatePath(path, { view })
    buildPathUrl: (path) => '',      // optional shareable folder address; without it folders copy their path
    onOpenOwner: ({ type, id }) => {}, // operator only: open the workload or project owning a root
  }}
  labels={{ trashbox: 'Papelera' }}  // optional overrides of STORAGE_BROWSER_LABELS
  organizationId={organizationId}    // operator scope
  workloadId={workloadId}            // operator scope, embedded
  workloadSlug={workloadSlug}
  embedded={false}
/>;
```

- `operator`: standalone lists the organization roots; `embedded` anchors at the workload root.
- `user`: anchors at the principal's `Files` folder (`user-root`), hides workload/project root chips and
  "Open workload/project", uploads and folders are created in the `user-files` space, and the folder panel adds
  a Recent view. The storage backend has no shared-with-me selector, so there is no "Shared with me" view.
