import { formatMoney } from "../../../monetization/format/value-formatter";
import {
  STORE_ACCESS_STATES,
  STORE_CATEGORIES,
  STORE_PRICING_MODELS,
  SUITE_KINDS,
  enumKeyOf,
  enumName,
  isEnumValue,
} from "./app-store.enums";

/**
 * How the store words and reads its records. Every title of a closed value comes from `labels`
 * indexed by the backend key, falling back to the catalog's own `title` for a value the host has not
 * translated (a category added in the backend after this SDK shipped).
 */
export const titleFor = (dictionary, enumMap, value) => {
  const key = enumKeyOf(enumMap, value);
  const fromLabels = key ? dictionary?.[key] : null;

  if (fromLabels) {
    return fromLabels;
  }

  return (value && typeof value === "object" && value.title) || enumName(value) || "";
};

export const categoryTitle = (labels, category) => titleFor(labels.categoryTitles, STORE_CATEGORIES, category);

export const categoryDescription = (labels, category) => {
  const key = enumKeyOf(STORE_CATEGORIES, category);

  return (key && labels.categoryDescriptions?.[key]) || labels.categoryFallbackDescription;
};

export const suiteKindTitle = (labels, kind) => titleFor(labels.suites.kindTitles, SUITE_KINDS, kind);

export const suiteKindGroupTitle = (labels, kind) => titleFor(labels.suites.kindGroups, SUITE_KINDS, kind);

export const isUsable = (access) =>
  isEnumValue(access, STORE_ACCESS_STATES.owned) || isEnumValue(access, STORE_ACCESS_STATES.entitled);

export const isOwned = (access) => isEnumValue(access, STORE_ACCESS_STATES.owned);

export const isPaid = (pricing) =>
  isEnumValue(pricing?.model, STORE_PRICING_MODELS.oneTime) && Number(pricing?.amount_minor) > 0;

/** "$49.00 USD" for a paid price, null for a free one. */
export const priceText = (labels, pricing) => {
  if (!isPaid(pricing)) {
    return null;
  }

  const currency = pricing.currency || {};

  return formatMoney(pricing.amount_minor, enumName(currency), currency.exponent, { locale: labels.locale });
};

/** The short price a card shows: the amount, or "Free". */
export const priceShort = (labels, pricing) => priceText(labels, pricing) || labels.card.free;

/**
 * What a card or a row says beside its pill: that the organization has the app ("In your apps",
 * "Yours"), the pricing model when the pill already carries the price (Buy · $49.00 USD → "One-time"),
 * or "Free".
 */
export const priceCaption = (labels, { access, pricing }) => {
  if (isUsable(access)) return labels.access[enumKeyOf(STORE_ACCESS_STATES, access)];
  if (isPaid(pricing)) return titleFor(labels.pricingModels, STORE_PRICING_MODELS, pricing.model);

  return labels.card.free;
};

/** The note under the main action of an app page, by what the organization already has. */
export const priceNote = (labels, { access, pricing }) => {
  if (isOwned(access)) return labels.detail.priceNotes.owned;
  if (isUsable(access)) return labels.detail.priceNotes.entitled;
  if (isPaid(pricing)) return labels.detail.priceNotes.oneTime;

  return labels.detail.priceNotes.free;
};

export const formatDate = (labels, value) => {
  if (!value) {
    return "";
  }

  const date = new Date(Number.isFinite(Number(value)) ? Number(value) : value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(labels.locale, { year: "numeric", month: "short", day: "numeric" }).format(date);
  } catch (error) {
    return date.toISOString().slice(0, 10);
  }
};

/** The first non-empty line of a description, for cards and rows. */
export const shortDescription = (app) => {
  const text = app?.store?.subtitle || app?.description || "";
  const line = String(text)
    .split("\n")
    .map((part) => part.replace(/^[#>*\-\s]+/, "").trim())
    .find(Boolean);

  return line || "";
};

export const publisherOf = (app) => {
  const publisher = app?.publisher || {};
  const profile = publisher.profile || {};

  return {
    name: profile.name || publisher.name || "",
    verified: Boolean(profile.verified ?? publisher.verified),
    url: profile.url || publisher.url || "",
    logoUrl: profile.logo_url || publisher.logo_url || "",
  };
};
