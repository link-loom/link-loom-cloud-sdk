# App Engine — Publish Pipeline

## Overview

Publishing creates an immutable `AppVersion` record that snapshots the current state of an `AppDefinition`. The publish service lives in `AppVersionService` inside `bsh.linkloom.cloud.app-engine.svc`.

**Source:** `src/services/app/app-version/app-version.service.js`

## Publish Flow

```
[1] Fetch AppDefinition by id
         │
         ▼
[2] Increment version_counter
         │
         ▼
[3] Capture snapshots (manifest, routes, contracts, source_tree)
         │
         ▼
[4] Create AppVersion record (is_active: false, build_status: 'pending')
         │
         ▼
[5] Update AppDefinition.version_counter
         │
         ▼
[6] Return new version record
```

### Step-by-Step

**Step 1:** Query the `app_definition` collection by `app_definition_id`.

**Step 2:** Read `version_counter` (default 0 if missing). Compute `nextVersionNumber = version_counter + 1`.

**Step 3:** Capture frozen copies of the definition's current state:

```javascript
{
  manifest_snapshot: appDefinition.manifest,
  routes_snapshot: appDefinition.routes,
  contracts_snapshot: appDefinition.contracts,
  source_tree_snapshot: appDefinition.source_tree,
}
```

**Step 4:** Create the version record:

```javascript
{
  id: 'appver-{15 chars}',
  app_definition_id: appDefinition.id,
  organization_id: appDefinition.organization_id,
  version: params.version || `1.0.${nextVersionNumber}`,
  version_number: nextVersionNumber,
  // ...snapshots from step 3
  build_status: 'pending',
  is_active: false,
  changelog: params.changelog || '',
  published_by: params.published_by || '',
  published_at: String(Date.now()),
}
```

**Step 5:** Update the parent definition: `version_counter = nextVersionNumber`.

**Step 6:** Return the newly created version.

## Versioning Strategy

- **Monotonic counter:** Each publish increments `version_counter` by 1
- **Default semver:** `1.0.{counter}` (e.g., `1.0.1`, `1.0.2`, `1.0.3`)
- **Override:** Consumers can pass `params.version` to use a custom semver string
- **ID prefix:** All version IDs start with `appver-`

```
Publish #1: version_counter 0 → 1, version = '1.0.1'
Publish #2: version_counter 1 → 2, version = '1.0.2'
Publish #3: version_counter 2 → 3, version = '2.0.0' (custom)
```

## Activation Flow

Activation switches which version is live. Only one version can be active per app definition at any time.

```
[1] Fetch target version by id
         │
         ▼
[2] Find all active versions for same app_definition_id
         │
         ▼
[3] Deactivate all (set is_active = false)
         │
         ▼
[4] Activate target (set is_active = true)
         │
         ▼
[5] Update AppDefinition.active_version_id = version.id
```

### Atomicity Note

The activation is **logically atomic** within the service but NOT transactional at the database level. In practice this is safe because activation is an operator-initiated action (not automated).

## Full `buildAndPublish` Orchestration

When using `AppBuildService.buildAndPublish()`, the complete flow is:

```
[1] build()       → compile source files, get artifacts
[2] publish()     → create version with snapshots (build_status: 'pending')
[3] update()      → attach build_artifact and build_log to version
```

After `buildAndPublish`, the version exists but is NOT active. An explicit `activate()` call is required to make it live.

## Query Selectors

The `get()` method supports multiple query selectors:

| Selector | Description | Parameters |
|----------|-------------|------------|
| `id` | Single version by ID | `search: versionId` |
| `app-definition-id` | All versions for an app | `search: definitionId, page, pageSize` |
| `active` | Active version for an app | `search: definitionId` |
| `all` | All versions (paginated) | `page, pageSize, exclude_status` |

## Immutability Guarantee

Once a version is published:
- `manifest_snapshot`, `routes_snapshot`, `contracts_snapshot`, `source_tree_snapshot` are NEVER modified
- Only `build_status`, `build_artifact`, `build_log`, `build_errors`, `is_active` can change
- The source code that was used to build is preserved in the snapshot, not in the mutable definition
