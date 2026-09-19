import { Picker } from 'emoji-mart';
import data from '@emoji-mart/data/sets/15/native.json';
import es from '@emoji-mart/data/i18n/es.json';

// emoji-mart, with its data set bundled here rather than fetched. The runtime never reaches the
// network for emoji: `data` is the native set (no sprite sheets, no images - the system emoji font
// draws every glyph), and the Spanish copy ships alongside it. Apps get this through the SDK like
// every other shared dependency instead of importing emoji-mart themselves.
const TRANSLATIONS = { es };

// The vanilla `Picker` is a custom element, so it is framework-agnostic and carries no React peer.
// Callers append the returned node and remove it on teardown.
export const createEmojiPicker = ({ locale, ...options } = {}) =>
  new Picker({
    data,
    ...(TRANSLATIONS[locale] ? { i18n: TRANSLATIONS[locale], locale } : {}),
    ...options,
  });

export const EMOJI_DATA = data;
