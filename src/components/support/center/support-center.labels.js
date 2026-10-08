// Copy of the support center's own chrome (the layout, the diagnostics modal and the notices of its
// sub-pages), by locale. The cards inside each sub-page keep their own copy (`support.defaults.js`).
// A host overrides any subset through the `labels` it gives the center.

export const SUPPORT_CENTER_LABELS = {
  en: {
    loading: "Loading support...",
    loadingCase: "Loading case...",
    guideNotFound: "Guide not found.",
    caseLoadFailed: "Could not load case detail.",
    unexpectedError: "An unexpected error occurred.",
    assistantUnavailable: "The support assistant is not available here.",
    diagnostics: {
      title: "Diagnostics Bundle",
      system: "System",
      environment: "Environment",
      route: "Route",
      surface: "Surface",
      identity: "Identity",
      user: "User",
      displayName: "Display Name",
      organization: "Organization",
      product: "Product",
      slug: "Slug",
      name: "Name",
      namespace: "Namespace",
      rawJson: "Raw JSON",
    },
  },
  es: {
    loading: "Cargando soporte...",
    loadingCase: "Cargando caso...",
    guideNotFound: "No se encontró la guía.",
    caseLoadFailed: "No se pudo cargar el detalle del caso.",
    unexpectedError: "Ocurrió un error inesperado.",
    assistantUnavailable: "El asistente de soporte no está disponible aquí.",
    diagnostics: {
      title: "Paquete de diagnóstico",
      system: "Sistema",
      environment: "Entorno",
      route: "Ruta",
      surface: "Superficie",
      identity: "Identidad",
      user: "Usuario",
      displayName: "Nombre para mostrar",
      organization: "Organización",
      product: "Producto",
      slug: "Identificador",
      name: "Nombre",
      namespace: "Espacio de nombres",
      rawJson: "JSON sin procesar",
    },
  },
};
