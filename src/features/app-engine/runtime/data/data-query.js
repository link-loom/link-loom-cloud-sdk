// Queries by the `data` fields an app declares in its manifest (`manifest.data`): the `where` object of
// `list`, `range` and `search`, sent the way `GET /app-engine/data/:selector?where=` reads it and
// evaluated locally for the records that only exist on this device (created offline), so a filtered
// list shows them with the same rules the backend applies.
//
//   where: { status: "open", due_at: { $lt: 1767225600000 }, "assignee.id": { $in: ["u1", "u2"] } }
//
// Operators: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin and $exists. A plain value is equality.

const COMPARISONS = {
  $gt: (value, bound) => value > bound,
  $gte: (value, bound) => value >= bound,
  $lt: (value, bound) => value < bound,
  $lte: (value, bound) => value <= bound,
};

const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const ownValue = (target, key) => (Object.prototype.hasOwnProperty.call(target, key) ? target[key] : undefined);

const sortKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    );
  }
  return value;
};

/**
 * The `where` of a query as the backend reads it: a JSON string with its keys in a stable order, so
 * the same filter is the same cached list. `undefined` when there is nothing to filter by.
 */
export const serializeWhere = (where) => {
  if (where === undefined || where === null || where === "") {
    return undefined;
  }
  if (!isPlainObject(where)) {
    throw new Error("where must be an object of declared data fields");
  }
  return Object.keys(where).length ? JSON.stringify(sortKeys(where)) : undefined;
};

// The values a path takes in `data`, as the database sees the declared field: through an array it is
// the values its object items hold (nested arrays are not entered).
const valuesAt = (value, segments) => {
  if (!segments.length) {
    return Array.isArray(value) ? value : [value];
  }
  if (Array.isArray(value)) {
    return value.filter(isPlainObject).flatMap((item) => valuesAt(item, segments));
  }
  if (!isPlainObject(value)) {
    return [];
  }
  return valuesAt(ownValue(value, segments[0]), segments.slice(1));
};

const isMissing = (value) => value === undefined || value === null;
const sameValue = (left, right) => (isMissing(left) && isMissing(right)) || left === right;
const isComparable = (value, bound) => typeof value === typeof bound && !isMissing(value);

const matchesOperator = ({ values, operator, operand }) => {
  const present = values.filter((value) => value !== undefined);

  switch (operator) {
    case "$eq":
      return isMissing(operand) ? !present.some((value) => !isMissing(value)) : present.some((value) => sameValue(value, operand));
    case "$ne":
      return !matchesOperator({ values, operator: "$eq", operand });
    case "$in":
      return operand.some((candidate) => matchesOperator({ values, operator: "$eq", operand: candidate }));
    case "$nin":
      return !matchesOperator({ values, operator: "$in", operand });
    case "$exists":
      return (present.length > 0) === Boolean(operand);
    default:
      return present.some((value) => isComparable(value, operand) && ownValue(COMPARISONS, operator)?.(value, operand));
  }
};

const parseWhere = (where) => {
  if (!where) {
    return null;
  }
  try {
    const parsed = typeof where === "string" ? JSON.parse(where) : where;
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/** Whether a record's `data` satisfies a `where` (an object or its JSON string); no `where` matches everything. */
export const matchesWhere = (record, where) => {
  const conditions = parseWhere(where);
  if (!conditions) {
    return true;
  }

  return Object.entries(conditions).every(([path, condition]) => {
    const values = valuesAt(record?.data, path.split("."));
    if (!isPlainObject(condition)) {
      return matchesOperator({ values, operator: "$eq", operand: condition });
    }
    return Object.entries(condition).every(([operator, operand]) => matchesOperator({ values, operator, operand }));
  });
};
