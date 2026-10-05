// Atomic field-level operations of `POST /app-engine/data/patch`, validated and applied locally with
// the backend semantics so optimistic and offline records match what the server will store.

export const PATCH_OPERATIONS = ["set", "unset", "merge", "add-to-set", "pull", "increment", "push-capped"];

const TOP_LEVEL_PATHS = {
  title: ["set"],
  search_text: ["set"],
  tags: ["set", "add-to-set", "pull"],
};
const MAX_PATCH_OPERATIONS = 100;
const MAX_PUSH_CAP = 1000;
const MAX_PATH_SEGMENTS = 16;
const MAX_PATH_SEGMENT_LENGTH = 128;
const MAX_SEARCH_TEXT_LENGTH = 4096;
const ARRAY_INDEX_PATTERN = /^\d+$/;
// Paths are walked with plain property access: these segments would reach the prototype chain.
const UNSAFE_SEGMENTS = ["__proto__", "constructor", "prototype"];

const isValidSegment = (segment) =>
  typeof segment === "string" &&
  segment.length > 0 &&
  segment.length <= MAX_PATH_SEGMENT_LENGTH &&
  !segment.startsWith("$") &&
  !segment.includes(".") &&
  !UNSAFE_SEGMENTS.includes(segment);

const ownValue = (target, key) => (Object.prototype.hasOwnProperty.call(target, key) ? target[key] : undefined);

const isValidDataPath = (path) => {
  const segments = path.split(".");
  return (
    segments[0] === "data" &&
    segments.length > 1 &&
    segments.length <= MAX_PATH_SEGMENTS &&
    segments.slice(1).every(isValidSegment)
  );
};

const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const sameValue = (left, right) => JSON.stringify(left) === JSON.stringify(right);

// Paths each operation writes, as the database sees them (`merge` writes one path per key).
const writtenPaths = ({ op, path, value }) => (op === "merge" ? Object.keys(value).map((key) => `${path}.${key}`) : [path]);

const DATABASE_OPERATORS = {
  set: "$set",
  merge: "$set",
  unset: "$unset",
  "add-to-set": "$addToSet",
  pull: "$pull",
  increment: "$inc",
  "push-capped": "$push",
};

/**
 * Throws an Error describing the first invalid operation. Mirrors the backend rules: known
 * operations, `data.<path>` / `title` / `search_text` / `tags` paths, a value for every operation
 * but `unset`, and no path written by two operators or together with its ancestor.
 */
export const validatePatchOperations = (operations) => {
  if (!Array.isArray(operations) || !operations.length) {
    throw new Error("operations are required");
  }
  if (operations.length > MAX_PATCH_OPERATIONS) {
    throw new Error(`A patch accepts at most ${MAX_PATCH_OPERATIONS} operations`);
  }

  const writers = new Map();

  for (const operation of operations) {
    const { op, path, value, max } = operation || {};

    if (!PATCH_OPERATIONS.includes(op)) {
      throw new Error(`Unknown patch operation: ${op}`);
    }
    if (typeof path !== "string") {
      throw new Error(`Operation path ${path} is not allowed`);
    }
    if (TOP_LEVEL_PATHS[path] && !TOP_LEVEL_PATHS[path].includes(op)) {
      throw new Error(`Operation ${op} is not allowed on ${path}`);
    }
    if (!TOP_LEVEL_PATHS[path] && !isValidDataPath(path)) {
      throw new Error(`Operation path ${path} is not allowed (use data.<path>, title, tags or search_text)`);
    }
    if (op !== "unset" && value === undefined) {
      throw new Error(`Operation ${op} needs a value`);
    }
    if (op === "merge" && (!isPlainObject(value) || !Object.keys(value).every(isValidSegment))) {
      throw new Error("merge needs an object value with plain keys");
    }
    if (op === "increment" && (typeof value !== "number" || !Number.isFinite(value))) {
      throw new Error("increment needs a finite number value");
    }
    if (op === "push-capped" && (!Number.isInteger(Number(max)) || Number(max) < 1 || Number(max) > MAX_PUSH_CAP)) {
      throw new Error(`push-capped needs an integer max between 1 and ${MAX_PUSH_CAP}`);
    }

    for (const writtenPath of writtenPaths({ op, path, value })) {
      const previous = writers.get(writtenPath);
      if (previous && previous.operator !== DATABASE_OPERATORS[op]) {
        throw new Error(`Operations conflict on ${writtenPath}: send them in separate patches`);
      }
      if (previous && op === "push-capped" && Number(previous.max) !== Number(max)) {
        throw new Error(`push-capped operations on ${writtenPath} must share the same max`);
      }
      writers.set(writtenPath, { operator: DATABASE_OPERATORS[op], max });
    }
  }

  const paths = [...writers.keys()];
  const overlapping = paths.find((path) => paths.some((other) => other !== path && other.startsWith(`${path}.`)));
  if (overlapping) {
    throw new Error(`Operations conflict on ${overlapping}: send them in separate patches`);
  }
};

const cloneRecord = (record) => JSON.parse(JSON.stringify(record || {}));

const parentOf = (target, segments, { create }) => {
  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    if (Array.isArray(cursor) && !ARRAY_INDEX_PATTERN.test(segment)) {
      return null;
    }
    const child = ownValue(cursor, segment);
    if (!isPlainObject(child) && !Array.isArray(child)) {
      if (!create) {
        return null;
      }
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }
  return cursor;
};

const arrayAt = (parent, key) => {
  const current = ownValue(parent, key);
  if (current === undefined || current === null) {
    parent[key] = [];
  }
  return Array.isArray(parent[key]) ? parent[key] : null;
};

const normalizeTopLevelValue = ({ path, op, value }) => {
  if (path === "title") {
    return String(value ?? "");
  }
  if (path === "search_text") {
    return String(value || "").slice(0, MAX_SEARCH_TEXT_LENGTH);
  }
  if (path === "tags" && op === "set") {
    const list = Array.isArray(value) ? value : String(value || "").split(",");
    return list.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (path === "tags") {
    return String(value ?? "").trim();
  }
  return value;
};

/**
 * Returns a new record with the operations applied, in order. Operations that do not fit the
 * current shape (e.g. `increment` on a string) are skipped locally; the server answers them with
 * 400 and the outbox drops them.
 */
export const applyPatchOperations = (record, operations) => {
  const next = cloneRecord(record);

  for (const operation of operations) {
    const { op, path, max } = operation;
    const value = normalizeTopLevelValue({ path, op, value: operation.value });
    const segments = path.split(".");
    const key = segments[segments.length - 1];

    if (segments.some((segment) => UNSAFE_SEGMENTS.includes(segment))) {
      continue;
    }

    const parent = parentOf(next, segments, { create: op !== "unset" && op !== "pull" });

    if (!parent || (Array.isArray(parent) && !ARRAY_INDEX_PATTERN.test(key))) {
      continue;
    }

    const current = ownValue(parent, key);

    switch (op) {
      case "set":
        parent[key] = value;
        break;
      case "unset":
        delete parent[key];
        break;
      case "merge":
        if (current === undefined || current === null) {
          parent[key] = {};
        }
        if (isPlainObject(parent[key])) {
          for (const [entryKey, entry] of Object.entries(cloneRecord(value))) {
            if (!UNSAFE_SEGMENTS.includes(entryKey)) {
              parent[key][entryKey] = entry;
            }
          }
        }
        break;
      case "add-to-set": {
        const list = arrayAt(parent, key);
        if (list && !list.some((item) => sameValue(item, value))) {
          list.push(value);
        }
        break;
      }
      case "pull":
        if (Array.isArray(current)) {
          parent[key] = current.filter((item) => !sameValue(item, value));
        }
        break;
      case "increment":
        if (current === undefined || current === null) {
          parent[key] = 0;
        }
        if (typeof parent[key] === "number") {
          parent[key] += value;
        }
        break;
      case "push-capped": {
        const list = arrayAt(parent, key);
        if (list) {
          parent[key] = [...list, value].slice(-Number(max));
        }
        break;
      }
      default:
        break;
    }
  }

  return next;
};
