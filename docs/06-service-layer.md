# App Engine — Service Layer

## Overview

The SDK provides 7 service classes for communicating with the App Engine backend. All extend `BaseApi` from `@link-loom/react-sdk`, which uses Axios internally.

**Base URL:** `import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL` (overridable via constructor)

**Headers:** `Accept: application/json`, optional `api-key` header

**Timeout:** 31,000ms default

## Common Constructor Pattern

```javascript
const service = new AppEngineAppDefinitionService({
  apiKey: 'optional-api-key',
  baseUrl: 'https://api.example.com', // optional override
});
```

## Common CRUD Methods (Inherited from BaseApi)

| Method | HTTP | Endpoint Pattern | Description |
|--------|------|-----------------|-------------|
| `create(payload)` | POST | `/{resource}` | Create new record |
| `getByParameters(payload)` | GET | `/{resource}/{queryselector}?search=...` | Query records |
| `update(payload)` | PATCH | `/{resource}` | Update record (body includes id) |
| `delete(payload)` | DELETE | `/{resource}` | Delete record (body includes id) |

---

## 1. AppEngineAppDefinitionService

**Import:** `AppEngineAppDefinitionService` from `@link-loom/cloud-sdk`
**Base Endpoint:** `/app-engine/definition`

| Method | HTTP | Endpoint | Payload |
|--------|------|----------|---------|
| `create(payload)` | POST | `/app-engine/definition` | Definition object |
| `getByParameters(payload)` | GET | `/app-engine/definition/{queryselector}` | `{ queryselector, search, page, pageSize }` |
| `update(payload)` | PATCH | `/app-engine/definition` | Definition with ID |
| `delete(payload)` | DELETE | `/app-engine/definition` | `{ id }` |
| `createWithScaffold(payload)` | POST | `/app-engine/definition/scaffold/` | Scaffold config |
| `getStudioPayload(payload)` | GET | `/app-engine/definition/studio/` | `{ id }` |
| `getCatalog(payload)` | GET | `/app-engine/definition/catalog/` | Query params |
| `getFullApp(payload)` | GET | `/app-engine/definition/full/` | Query params |
| `provision(payload)` | POST | `/app-engine/definition/provision/` | Provision config |

---

## 2. AppEngineAppVersionService

**Import:** `AppEngineAppVersionService` from `@link-loom/cloud-sdk`
**Base Endpoint:** `/app-engine/version`

| Method | HTTP | Endpoint | Payload |
|--------|------|----------|---------|
| `create(payload)` | POST | `/app-engine/version` | Version definition |
| `getByParameters(payload)` | GET | `/app-engine/version/{queryselector}` | Query params |
| `update(payload)` | PATCH | `/app-engine/version` | Version with ID |
| `delete(payload)` | DELETE | `/app-engine/version` | `{ id }` |
| `publish(payload)` | POST | `/app-engine/version/publish` | `{ app_definition_id, changelog?, published_by? }` |
| `activate(payload)` | PATCH | `/app-engine/version/activate` | `{ id }` |

---

## 3. AppEngineAppFileService

**Import:** `AppEngineAppFileService` from `@link-loom/cloud-sdk`
**Base Endpoint:** `/app-engine/file`

| Method | HTTP | Endpoint | Payload |
|--------|------|----------|---------|
| `create(payload)` | POST | `/app-engine/file` | File metadata + content |
| `getByParameters(payload)` | GET | `/app-engine/file/{queryselector}` | Query params |
| `update(payload)` | PATCH | `/app-engine/file` | File with ID |
| `delete(payload)` | DELETE | `/app-engine/file` | `{ id }` |
| `getFileContent(payload)` | GET | `/app-engine/file/content` | `{ search: fileId }` |
| `getFileTree(payload)` | GET | `/app-engine/file/tree` | `{ app_definition_id }` |
| `applyChanges(payload)` | POST | `/app-engine/file/apply-changes` | `{ app_definition_id, changes: [{ operation, id, path, content }] }` |

---

## 4. AppEngineAppBuildService

**Import:** `AppEngineAppBuildService` from `@link-loom/cloud-sdk`
**Base Endpoint:** `/app-engine/build`

| Method | HTTP | Endpoint | Payload |
|--------|------|----------|---------|
| `buildSingle(payload)` | POST | `/app-engine/build/single` | `{ app_definition_id?, slug?, organization_id? }` |
| `buildAll(payload)` | POST | `/app-engine/build/all` | `{ owning_product? }` |
| `buildAndPublish(payload)` | POST | `/app-engine/build/publish` | `{ slug?, app_definition_id?, changelog?, published_by? }` |

No standard CRUD methods — only custom build operations.

---

## 5. AppEngineAppSessionService

**Import:** `AppEngineAppSessionService` from `@link-loom/cloud-sdk`
**Base Endpoint:** `/app-engine/session`

| Method | HTTP | Endpoint | Payload |
|--------|------|----------|---------|
| `create(payload)` | POST | `/app-engine/session` | Session config |
| `getByParameters(payload)` | GET | `/app-engine/session/{queryselector}` | Query params |
| `update(payload)` | PATCH | `/app-engine/session` | Session with ID |
| `delete(payload)` | DELETE | `/app-engine/session` | `{ id }` |
| `open(payload)` | POST | `/app-engine/session/open` | `{ app_slug, route_path, launch_mode, input_payload }` |
| `saveDraft(payload)` | PATCH | `/app-engine/session/save-draft` | `{ id, draft_data }` |
| `submitOutput(payload)` | PATCH | `/app-engine/session/submit-output` | `{ id, output_data }` |
| `cancel(payload)` | PATCH | `/app-engine/session/cancel` | `{ id, reason? }` |

---

## 6. AppEngineAppPreferenceService

**Import:** `AppEngineAppPreferenceService` from `@link-loom/cloud-sdk`
**Base Endpoint:** `/app-engine/preference`

| Method | HTTP | Endpoint | Payload |
|--------|------|----------|---------|
| `create(payload)` | POST | `/app-engine/preference` | Preference object |
| `getByParameters(payload)` | GET | `/app-engine/preference/{queryselector}` | Query params |
| `update(payload)` | PATCH | `/app-engine/preference` | Preference with ID |
| `delete(payload)` | DELETE | `/app-engine/preference` | `{ id }` |

Pure standard CRUD — no custom methods.

---

## 7. AppEngineAppScaffoldService

**Import:** `AppEngineAppScaffoldService` from `@link-loom/cloud-sdk`
**Base Endpoint:** `/app-engine/scaffold`

| Method | HTTP | Endpoint | Payload |
|--------|------|----------|---------|
| `getAll()` | GET | `/app-engine/scaffold/?queryselector=all` | None |
| `getBySlug(slug)` | GET | `/app-engine/scaffold/?queryselector=slug&search={slug}` | `slug` as string |

Limited scope — read-only operations for scaffold templates.

---

## Entity Service Adapter

**Import:** `{ fetchEntityCollection, fetchEntityRecord, updateEntityRecord, ... }` from `@link-loom/cloud-sdk`

A utility layer that standardizes CRUD operations against any service instance:

| Function | Parameters | Description |
|----------|-----------|-------------|
| `fetchEntityCollection({ service, payload? })` | Service instance + optional filters | Fetch paginated list |
| `fetchMultipleEntities(list)` | Array of `{ service, payload }` | Parallel fetch |
| `fetchEntityRecord({ service, payload })` | Service + `{ id }` | Fetch single record |
| `updateEntityRecord({ service, payload })` | Service + entity data | Update record |
| `createEntityRecord({ service, payload })` | Service + entity data | Create record |
| `deleteEntityRecord({ service, payload })` | Service + entity data | Delete record |

Default options for `fetchEntityCollection`:
```javascript
{
  queryselector: 'all',
  exclude_status: 'deleted',
  page: 1,
  pageSize: 10,
}
```

## Context Provider

```javascript
import { AppEngineSDKProvider, useAppEngineSDK } from '@link-loom/cloud-sdk';

// Provide services to component tree
<AppEngineSDKProvider baseUrl="https://api.example.com" apiKey="...">
  <MyApp />
</AppEngineSDKProvider>

// Consume in child components
const { appDefinitionService, appBuildService, ... } = useAppEngineSDK();
```

The provider creates singleton service instances keyed by `baseUrl`.
