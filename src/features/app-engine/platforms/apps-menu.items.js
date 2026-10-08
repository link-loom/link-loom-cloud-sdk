import { mergeDefaults } from "../../../components/app-engine/defaults/appEngine.defaults";
import {
  PLATFORM_ICON_BASE_PATH,
  platformIconSrc,
  platformLabels,
  platformsForSettings,
} from "../../../components/app-engine/defaults/stoneos-platforms.catalog";

const STONEOS_SITE_URL = "https://stoneos.blackwoodstoneholdings.com";
const STONEOS_BADGE_FILE = "stone-os.svg";

export const APPS_MENU_LABELS = {
  en: {
    title: "StoneOS",
    caption: "Blackwood Stone Platforms",
    more: { title: "Explore StoneOS", subtitle: "Every platform in one place" },
  },
  es: {
    title: "StoneOS",
    caption: "Plataformas de Blackwood Stone",
    more: { title: "Explorar StoneOS", subtitle: "Todas las plataformas en un solo lugar" },
  },
};

/**
 * What the StoneOS apps menu of the navbar (`AppsMenu` in `@link-loom/react-shell`) shows, as the props
 * it takes: a tile per platform (its brand, with the capability it gives as the tagline), the header
 * with the StoneOS badge and the footer link that explores the rest. `storeLink` is where the footer
 * goes — the host's StoneOS store or, without one, the StoneOS site.
 */
export const stoneOSAppsMenuItems = ({
  platforms = platformsForSettings(),
  locale = "en",
  iconBasePath = PLATFORM_ICON_BASE_PATH,
  storeLink = STONEOS_SITE_URL,
  labels,
} = {}) => {
  const copy = mergeDefaults(APPS_MENU_LABELS[locale] || APPS_MENU_LABELS.en, labels);

  return {
    apps: platforms.map((entry) => {
      const { capability, name } = platformLabels(entry, locale);

      return {
        id: entry.id,
        title: name,
        link: entry.portalUrl,
        icon: platformIconSrc(entry, iconBasePath),
        color: entry.color,
        tagline: capability,
      };
    }),
    header: {
      badgeSrc: platformIconSrc({ icon: STONEOS_BADGE_FILE }, iconBasePath),
      title: copy.title,
      caption: copy.caption,
    },
    more: { link: storeLink, title: copy.more.title, subtitle: copy.more.subtitle },
  };
};
