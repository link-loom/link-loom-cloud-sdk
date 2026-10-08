// Copy of the platform hub, by locale. A host overrides any subset through the `labels` prop; the
// entries that name a platform are functions so each language orders its own words.

export const PLATFORM_HUB_LABELS = {
  en: {
    helpCenter: {
      title: "Help center",
      description: (name) => `Guides, support cases and the assistant for ${name}.`,
    },
    portal: {
      title: (name) => `Go to ${name}`,
      description: (name) => `Open the ${name} portal.`,
    },
    comingSoon: {
      title: "Coming soon",
      description: (capability) => `${capability} will open its StoneOS app here.`,
    },
  },
  es: {
    helpCenter: {
      title: "Centro de ayuda",
      description: (name) => `Guías, casos de soporte y asistente para ${name}.`,
    },
    portal: {
      title: (name) => `Ir a ${name}`,
      description: (name) => `Abre el portal de ${name}.`,
    },
    comingSoon: {
      title: "Próximamente",
      description: (capability) => `${capability} abrirá aquí su aplicación de StoneOS.`,
    },
  },
};
