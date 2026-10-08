// ── StoneOS platform catalog ────────────────────────────────────────
// The platforms of the Blackwood Stone ecosystem, named by the capability they give an organization
// (Identity, Operations, Finance…) with the brand second. One list for every consumer: the platform
// hub, the support center, the apps menu and the settings that decide which platforms show up.
//
// `icon` is a file name; the host owns the base path it serves them from. `stoneosAppSlug` is where
// the StoneOS app that replaces the platform's own site will be named once it ships.

const platform = ({ id, color, icon, portalUrl, labels }) =>
  Object.freeze({
    id,
    capability: labels.en.capability,
    color,
    icon,
    portalUrl,
    supportNamespaceSlug: id,
    stoneosAppSlug: null,
    labels: Object.freeze({ en: Object.freeze(labels.en), es: Object.freeze(labels.es) }),
  });

export const STONEOS_PLATFORMS = Object.freeze([
  platform({
    id: "linkloom",
    color: "#1FA9C4",
    icon: "link-loom.svg",
    portalUrl: "https://linkloom.io",
    labels: {
      en: {
        capability: "Applications",
        name: "Link Loom Cloud",
        description: "Build, deploy and operate the applications your organization runs on.",
      },
      es: {
        capability: "Aplicaciones",
        name: "Link Loom Cloud",
        description: "Crea, despliega y opera las aplicaciones sobre las que funciona tu organización.",
      },
    },
  }),
  platform({
    id: "veripass",
    color: "#E4536A",
    icon: "veripass.svg",
    portalUrl: "https://veripass.com.co",
    labels: {
      en: {
        capability: "Identity",
        name: "Veripass",
        description: "Identity, trust and contextual access for the people and systems of your organization.",
      },
      es: {
        capability: "Identidad",
        name: "Veripass",
        description: "Identidad, confianza y acceso contextual para las personas y los sistemas de tu organización.",
      },
    },
  }),
  platform({
    id: "sommatic",
    color: "#6E56CF",
    icon: "sommatic.svg",
    portalUrl: "https://sommatic.ai",
    labels: {
      en: {
        capability: "Intelligence",
        name: "Sommatic AI",
        description: "Applied AI and decision systems that close the operating loop.",
      },
      es: {
        capability: "Inteligencia",
        name: "Sommatic AI",
        description: "IA aplicada y sistemas de decisión que cierran el ciclo operativo.",
      },
    },
  }),
  platform({
    id: "vectry",
    color: "#DB3860",
    icon: "vectry.svg",
    portalUrl: "https://vectry.io",
    labels: {
      en: {
        capability: "Analytics",
        name: "Vectry Analytics",
        description: "Event architecture and total traceability of everything that happens in your operation.",
      },
      es: {
        capability: "Analítica",
        name: "Vectry Analytics",
        description: "Arquitectura de eventos y trazabilidad total de todo lo que ocurre en tu operación.",
      },
    },
  }),
  platform({
    id: "hivora",
    color: "#0E7C66",
    icon: "hivora.svg",
    portalUrl: "https://hivoradynamics.com",
    labels: {
      en: {
        capability: "Devices",
        name: "Hivora Dynamics",
        description: "Edge hardware and operational endpoints, connected to the rest of your platforms.",
      },
      es: {
        capability: "Dispositivos",
        name: "Hivora Dynamics",
        description: "Hardware en el borde y puntos operativos, conectados con el resto de tus plataformas.",
      },
    },
  }),
  platform({
    id: "vca",
    color: "#3B1F9E",
    icon: "vca.svg",
    portalUrl: "https://www.virtualcapitalofamerica.com",
    labels: {
      en: {
        capability: "Finance",
        name: "Virtual Capital of America",
        description: "Financial rails and fintech infrastructure for payments, issuing and risk.",
      },
      es: {
        capability: "Finanzas",
        name: "Virtual Capital of America",
        description: "Rieles financieros e infraestructura fintech para pagos, emisión y riesgo.",
      },
    },
  }),
  platform({
    id: "miretail",
    color: "#3c4876",
    icon: "mi-retail.svg",
    portalUrl: "https://miretail.com.co",
    labels: {
      en: {
        capability: "Operations",
        name: "Mi Retail",
        description: "The operations center every role runs the organization from.",
      },
      es: {
        capability: "Operaciones",
        name: "Mi Retail",
        description: "El centro de operaciones desde el que cada rol gestiona la organización.",
      },
    },
  }),
  platform({
    id: "micampus",
    color: "#3902D7",
    icon: "mi-campus.svg",
    portalUrl: "https://micampusapp.com",
    labels: {
      en: {
        capability: "Learning",
        name: "Mi Campus",
        description: "Adaptive learning infrastructure tied to your operation.",
      },
      es: {
        capability: "Aprendizaje",
        name: "Mi Campus",
        description: "Infraestructura de aprendizaje adaptativo conectada con tu operación.",
      },
    },
  }),
  platform({
    id: "etrune",
    color: "#563e2e",
    icon: "etrune.svg",
    portalUrl: "https://etrune.com",
    labels: {
      en: {
        capability: "Retail",
        name: "Êtrune",
        description: "Author jewelry and certified gemstones.",
      },
      es: {
        capability: "Comercio",
        name: "Êtrune",
        description: "Joyería de autor y piedras preciosas certificadas.",
      },
    },
  }),
]);

/** Where the hosts of the ecosystem serve the platform logos from, unless they say otherwise. */
export const PLATFORM_ICON_BASE_PATH = "/assets/images/bsh-apps";

/** Platforms a host does not list unless it asks for them. */
export const DEFAULT_HIDDEN_PLATFORMS = Object.freeze(["etrune"]);

/** The platforms a host lists in its settings and menus: the catalog minus the hidden ones. */
export const platformsForSettings = ({ hidden = DEFAULT_HIDDEN_PLATFORMS } = {}) =>
  STONEOS_PLATFORMS.filter((entry) => !hidden.includes(entry.id));

/** A platform's capability, name and description in the locale; English when the locale has none. */
export const platformLabels = (entry, locale = "en") => entry.labels[locale] || entry.labels.en;

/** Where the host serves a platform's logo: its base path (no trailing slash needed) and the file name. */
export const platformIconSrc = (entry, iconBasePath) => `${iconBasePath.replace(/\/+$/, "")}/${entry.icon}`;
