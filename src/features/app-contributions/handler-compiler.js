/**
 * Compiles a declarative CommandContribution into a runtime `action(args)`
 * function that the Sommatic Command Center can execute. The output matches
 * the descriptor shape consumed by `CommandCenterSidebar.renderAppEmbed`:
 *
 *   {
 *     ok: true,
 *     type: 'app-embed',
 *     title: string,
 *     app_embed: { app_slug, route_path, input_payload, launch_mode },
 *     receipt_id?: string,
 *   }
 *
 * See src/contracts/command-contribution.schema.js in the App Engine backend
 * for the full handler contract.
 */

const PLACEHOLDER_FULL = /^\{([^{}|]+)(?:\|([^{}]*))?\}$/;
const PLACEHOLDER_GLOBAL = /\{([^{}|]+)(?:\|([^{}]*))?\}/g;

function parseLiteral(raw) {
  if (raw === undefined) return undefined;
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (/^-?\d*\.\d+$/.test(raw)) return Number(raw);
  return raw;
}

function resolvePlaceholder(key, fallbackRaw, args) {
  const value = args?.[key];
  if (value !== undefined && value !== null) return value;
  return parseLiteral(fallbackRaw);
}

function interpolateString(template, args) {
  if (typeof template !== 'string') return template;

  const exactMatch = template.match(PLACEHOLDER_FULL);
  if (exactMatch) {
    return resolvePlaceholder(exactMatch[1], exactMatch[2], args);
  }

  return template.replace(PLACEHOLDER_GLOBAL, (_match, key, fallbackRaw) => {
    const resolved = resolvePlaceholder(key, fallbackRaw, args);
    return resolved === undefined || resolved === null ? '' : String(resolved);
  });
}

function interpolateTree(node, args) {
  if (Array.isArray(node)) {
    return node.map((item) => interpolateTree(item, args));
  }
  if (node !== null && typeof node === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(node)) {
      result[key] = interpolateTree(value, args);
    }
    return result;
  }
  if (typeof node === 'string') {
    return interpolateString(node, args);
  }
  return node;
}

function resolveRoute(handler, args) {
  const safeArgs = args || {};

  if (handler.route_override_key && safeArgs[handler.route_override_key]) {
    return String(safeArgs[handler.route_override_key]);
  }

  const template = handler.route_template;
  if (!template || typeof template !== 'object') return '/';

  const key = safeArgs[handler.route_template_key || 'mode'];
  const rawRoute =
    (key !== undefined && template[key]) !== undefined && template[key]
      ? template[key]
      : template._default;

  if (!rawRoute) return '/';
  return interpolateString(rawRoute, safeArgs);
}

function resolveInputPayload(handler, args) {
  const safeArgs = args || {};
  const payload = {};

  if (handler.input_static && typeof handler.input_static === 'object') {
    Object.assign(payload, handler.input_static);
  }

  if (handler.input_template && typeof handler.input_template === 'object') {
    const interpolated = interpolateTree(handler.input_template, safeArgs);
    Object.assign(payload, interpolated);
  }

  if (Array.isArray(handler.input_passthrough)) {
    for (const key of handler.input_passthrough) {
      const value = safeArgs[key];
      if (value === undefined || value === null) continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (typeof value === 'string' && value.length === 0) continue;
      payload[key] = value;
    }
  }

  return payload;
}

export function compileContributionHandler(contribution, { registry } = {}) {
  const handler = contribution?.handler;

  if (!handler || handler.type !== 'app-embed') {
    return async () => ({
      ok: false,
      error: {
        code: 'UNSUPPORTED_HANDLER',
        message: `Unsupported handler.type "${handler?.type}" for command "${contribution?.id}"`,
      },
    });
  }

  return async (args) => {
    const safeArgs = args || {};
    const appEmbed = {
      app_slug: handler.app_slug,
      route_path: resolveRoute(handler, safeArgs),
      input_payload: resolveInputPayload(handler, safeArgs),
      launch_mode: handler.launch_mode || 'command-center',
    };

    let receiptId;
    if (registry && typeof registry.pushReceipt === 'function') {
      try {
        const receipt = registry.pushReceipt({
          command_id: contribution.id,
          args: safeArgs,
          reversible: false,
        });
        receiptId = receipt?.id;
      } catch (_error) {
        receiptId = undefined;
      }
    }

    return {
      ok: true,
      type: 'app-embed',
      title: `Opening app [${appEmbed.app_slug}]`,
      app_embed: appEmbed,
      receipt_id: receiptId,
    };
  };
}

export const __internals = {
  interpolateString,
  interpolateTree,
  resolveRoute,
  resolveInputPayload,
};
