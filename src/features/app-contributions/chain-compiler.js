/**
 * Compile a declarative chain contribution into an `appEmbed` descriptor that
 * the webapp can dispatch to open the target app.
 *
 * Chain shape (JSON, produced by chains.contribution.mjs):
 *   {
 *     id, source_app_slug,
 *     target: { app_slug, route, launch_mode },
 *     input_mapping: {
 *       static, context_key, context_passthrough,
 *       rows_key, rows_to, row_fields,
 *     },
 *   }
 *
 * Runtime input: the `outputPayload` produced by the source app when it
 * calls `sdk.submitOutput(payload)`.
 *
 * Output: `{ app_slug, route_path, input_payload, launch_mode }` ready to be
 * wrapped in `{ appEmbed: ... }` and dispatched as `sommatic:open-command-center`.
 */

function pickRow(row, fields) {
  if (!row || typeof row !== 'object') return {};
  if (!Array.isArray(fields) || fields.length === 0) return { ...row };
  const picked = {};
  for (const field of fields) {
    const value = row[field];
    if (value === undefined) continue;
    picked[field] = value;
  }
  return picked;
}

export function compileChainAppEmbed(chain, outputPayload) {
  const target = chain?.target || {};
  const mapping = chain?.input_mapping || {};
  const payload = outputPayload || {};

  const inputPayload = {};

  if (mapping.static && typeof mapping.static === 'object') {
    Object.assign(inputPayload, mapping.static);
  }

  if (mapping.context_key && Array.isArray(mapping.context_passthrough)) {
    const context = payload[mapping.context_key];
    if (context && typeof context === 'object') {
      for (const key of mapping.context_passthrough) {
        const value = context[key];
        if (value === undefined || value === null) continue;
        inputPayload[key] = value;
      }
    }
  }

  if (mapping.rows_key && mapping.rows_to) {
    const rows = payload[mapping.rows_key];
    if (Array.isArray(rows) && rows.length > 0) {
      inputPayload[mapping.rows_to] = rows.map((row) => pickRow(row, mapping.row_fields));
    }
  }

  return {
    app_slug: target.app_slug,
    route_path: target.route || '/',
    input_payload: inputPayload,
    launch_mode: target.launch_mode || 'modal',
  };
}
