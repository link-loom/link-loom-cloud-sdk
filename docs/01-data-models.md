# App Engine — Data Models

## Entity Relationship Diagram

```
AppDefinitionModel (1)
    │
    ├──── active_version_id ──▶ AppVersionModel (denormalized FK)
    │
    ├──── (1:N) ──▶ AppVersionModel.app_definition_id
    │
    └──── (1:N) ──▶ AppFileModel.app_definition_id
                         │
                         └── Hierarchical via path / parent_path
```

All models extend `BaseModel` from `@link-loom/sdk` and inherit: `id`, `created`, `modified`, `deleted` (soft-delete timestamp), `status`.

---

## AppDefinitionModel

**Collection:** `app_definitions`
**Purpose:** Mutable top-level app record. The working draft that developers edit in Studio.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | yes | Human-readable app name |
| `slug` | string | yes | Stable semantic key (e.g., `sommatic-mission-control`) |
| `description` | string | no | Free-text description |
| `icon` | string | no | Icon identifier for launcher |
| `category` | string | no | Category: `workspace`, `utility`, `hitl`, `forms`, `data` |
| `version` | string | no | Current semver string |
| `tags` | array | no | Search/categorization tags |
| `publisher` | object | no | `{ identity, profile: { name, verified, url, logo_url } }` |
| `owning_product` | string | no | Product owner: `sommatic`, `mi-retail`, `mi-campus`, `vca`, `vectry`, `link-loom` |
| `organization_id` | string | yes | Owning organization |
| `project_id` | string | no | Project grouping |
| `manifest` | object | no | Full manifest JSON (kind, launcher_visible, permissions, capabilities, supported_launch_modes, entry_route, pinnable, entry_behavior, requires_context) |
| `routes` | array | no | Route definitions for navigation |
| `contracts` | array | no | Input/output/event contracts |
| `source_tree` | object | no | Computed file index for fast Studio load |
| `active_version_id` | string | no | Currently active published version ID |
| `version_counter` | number | no | Monotonic counter for sequential version numbering |
| `launcher_visible` | boolean | no | Whether the app appears in the App Catalog |
| `is_official` | boolean | no | Seeded from filesystem (protected from deletion) |
| `metadata` | object | no | Custom metadata |
| `context_data` | object | no | Custom context data |

**Custom Statuses:** `draft` (id: 3), `review` (id: 4), `archived` (id: 5) — in addition to inherited `active`, `inactive`, `deleted`.

---

## AppVersionModel

**Collection:** `app_versions`
**Purpose:** Immutable snapshot created when a designer publishes from Studio. Once published, a version cannot be modified (except for build artifact attachment and activation status).

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `app_definition_id` | string | yes | Reference to parent AppDefinition |
| `organization_id` | string | yes | Owning organization |
| `version` | string | yes | Semver (e.g., `1.0.3`) |
| `version_number` | number | no | Sequential counter from parent definition |
| `manifest_snapshot` | object | no | Frozen manifest at publish time |
| `routes_snapshot` | array | no | Frozen routes at publish time |
| `contracts_snapshot` | array | no | Frozen contracts at publish time |
| `source_tree_snapshot` | object | no | Frozen file tree index at publish time |
| `build_status` | string | no | `pending` → `building` → `success` / `failed` |
| `build_artifact` | object | no | `{ [relativePath]: { content, size_bytes, checksum } }` |
| `build_log` | string | no | Build process stdout/stderr |
| `build_errors` | array | no | Error details if build failed |
| `is_active` | boolean | no | Currently deployed version flag (only one per app) |
| `changelog` | string | no | Human-readable release notes |
| `published_by` | string | no | User ID who published |
| `published_at` | string | no | Timestamp (ms as string) |
| `metadata` | object | no | Custom metadata |

**ID Generation:** `appver-{15 alphanumeric chars}` (e.g., `appver-a1b2c3d4e5f6g7h`)

**Statuses:** Inherits only BaseModel defaults (`active`, `inactive`, `deleted`).

---

## AppFileModel

**Collection:** `app_files`
**Purpose:** Individual source file or folder belonging to an app definition. Enables granular CRUD from Studio without loading entire codebases.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `app_definition_id` | string | yes | Reference to parent AppDefinition |
| `organization_id` | string | yes | Owning organization |
| `path` | string | yes | Full path within app (e.g., `/src/components/Home.jsx`) |
| `name` | string | yes | File or folder name |
| `kind` | string | yes | `file` or `folder` |
| `language` | string | no | Language: `jsx`, `tsx`, `json`, `css`, `html`, etc. |
| `content` | string | no | File content (null for folders) |
| `parent_path` | string | no | Parent folder path |
| `size_bytes` | number | no | File size |
| `checksum` | string | no | Content hash (MD5) |
| `is_entry` | boolean | no | Whether this is the app entry file |
| `metadata` | object | no | Custom metadata |

**Statuses:** Inherits only BaseModel defaults.

---

## Key Design Patterns

1. **Immutability boundary**: AppDefinition is mutable (draft), AppVersion is immutable (snapshot).
2. **Granular file storage**: Files stored individually for incremental edits, not as a single blob.
3. **Monotonic versioning**: `version_counter` ensures sequential version numbering across publishes.
4. **Multi-tenancy**: All models include `organization_id` for organizational scoping.
5. **Soft delete**: All models support soft deletion via `deleted` timestamp.
6. **Denormalized FK**: `active_version_id` on AppDefinition provides fast lookup without joining.
7. **Build artifacts embedded**: Compiled bundles stored directly in the version record as `{ path: { content, size_bytes, checksum } }`.
