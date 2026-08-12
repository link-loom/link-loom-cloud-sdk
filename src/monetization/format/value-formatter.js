/**
 * Formatting helpers for money and allowances.
 *
 * The server already words every feature line, so nothing here re-implements that. What is left is
 * the arithmetic a client genuinely owns: turning minor units into a readable amount, and describing
 * a tally against its ceiling.
 *
 * Uses `Intl` only. Adding a date or number library for this would be a bundle cost with no payoff.
 */
const DEFAULT_LOCALE = "en-US";

const LOCALE_BY_LANGUAGE = {
  en: "en-US",
  es: "es-CO",
};

function resolveLocale(locale) {
  if (!locale) {
    return DEFAULT_LOCALE;
  }

  return LOCALE_BY_LANGUAGE[locale] || locale;
}

/**
 * Turn an integer amount in minor units into a readable price.
 *
 * Money is always stored as a whole number of minor units with its exponent alongside, so nothing
 * here ever does floating-point arithmetic on it. COP has exponent 0, USD has 2.
 */
export function formatPrice(price, { locale, withCurrency = false } = {}) {
  if (!price) {
    return null;
  }

  if (price.display_amount) {
    return price.display_amount;
  }

  const amount = Number(price.amount_minor);

  if (!Number.isFinite(amount)) {
    return null;
  }

  const exponent = Number(price.currency_exponent) || 0;
  const value = amount / 10 ** exponent;

  try {
    return new Intl.NumberFormat(resolveLocale(locale), {
      style: withCurrency && price.currency ? "currency" : "decimal",
      currency: price.currency || undefined,
      minimumFractionDigits: exponent,
      maximumFractionDigits: exponent,
    }).format(value);
  } catch (error) {
    return String(value);
  }
}

/**
 * The figure a card shows for a multi-month cycle.
 *
 * An annual plan advertises a lower per-month number than it charges in one go, so a card must not
 * simply divide the total.
 */
export function formatCyclePrice(price, { locale, withCurrency = false } = {}) {
  if (!price) {
    return null;
  }

  if (Number.isFinite(price.amount_minor_per_month)) {
    return formatPrice(
      { ...price, amount_minor: price.amount_minor_per_month },
      { locale, withCurrency },
    );
  }

  return formatPrice(price, { locale, withCurrency });
}

/**
 * Describe a tally against its ceiling, e.g. "18,420 of 25,000".
 *
 * A null limit means unlimited, which is why it is rendered as a word rather than a very large number.
 */
export function formatUsage(
  metric,
  { locale, unlimitedLabel = "Unlimited" } = {},
) {
  if (!metric) {
    return null;
  }

  const used = Number(metric.used) || 0;
  const format = (value) => {
    try {
      return new Intl.NumberFormat(resolveLocale(locale)).format(value);
    } catch (error) {
      return String(value);
    }
  };

  if (metric.limit === null || metric.limit === undefined) {
    return `${format(used)} · ${unlimitedLabel}`;
  }

  return `${format(used)} of ${format(metric.limit)}`;
}

/**
 * How full an allowance is, as a percentage, for a progress bar.
 *
 * Returns null when there is no ceiling — a bar with no end has nothing to fill.
 */
export function usagePercentage(metric) {
  if (!metric || metric.limit === null || metric.limit === undefined) {
    return null;
  }

  const limit = Number(metric.limit);
  const used = Number(metric.used) || 0;

  if (!Number.isFinite(limit) || limit <= 0) {
    return null;
  }

  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * A readable period range, e.g. "1 Mar – 31 Mar".
 */
export function formatPeriod(start, end, { locale } = {}) {
  if (!start || !end) {
    return null;
  }

  try {
    const formatter = new Intl.DateTimeFormat(resolveLocale(locale), {
      day: "numeric",
      month: "short",
    });

    return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
  } catch (error) {
    return null;
  }
}
