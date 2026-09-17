/**
 * Customer-facing copy and colours for the pricing and billing surfaces.
 *
 * Everything here is what a CUSTOMER reads. None of the operator vocabulary belongs in this file — a
 * customer should never see the words "version", "stamped" or "entitlement" on a pricing card.
 *
 * A host overrides any of it through the `labels` and `theme` props, which is how one implementation
 * serves several products without forking.
 */
export const PRICING_TABLE_DEFAULTS = {
  currentPlanLabel: "Your current plan",
  selectLabel: "Choose this plan",
  contactLabel: "Talk to us",
  loadingLabel: "Loading plans…",
  emptyLabel: "No plans are available right now.",
  featuresLabel: "What you get",
  showAllFeaturesLabel: "Show everything included",
  showFewerFeaturesLabel: "Show less",
  faqTitle: "Common questions",
};

export const BILLING_SUMMARY_DEFAULTS = {
  planTitle: "Your plan",
  usageTitle: "What you have used",
  historyTitle: "Past periods",
  noSubscriptionTitle: "No plan yet",
  noSubscriptionBody: "Choose a plan to get started.",
  loadingLabel: "Loading…",
  periodLabel: "This period",
  renewsLabel: "Renews",
  unlimitedLabel: "Unlimited",
  payPerUseLabel: "Pay per use",
  overLimitLabel: "Over the limit",
  approachingLabel: "Close to the limit",
  changePlanLabel: "Change plan",
  amountLabel: "Amount",
  emptyHistoryLabel: "Nothing here yet.",
};

export const BILLING_CENTER_DEFAULTS = {
  // Subscription
  subscriptionTitle: "Subscription details",
  subscriptionDescription:
    "Your plan, what it costs and when you are billed next.",
  planPriceLabel: "Plan price",
  yourPlanLabel: "Your plan",
  nextInvoiceLabel: "Next invoice on",
  cycleLabel: "Cycle",
  autoRenewalLabel: "Auto-renewal",
  onLabel: "On",
  offLabel: "Off",
  freeLabel: "Free",
  changePlanLabel: "Change plan",
  noPlanTitle: "No plan yet",
  noPlanBody: "Choose a plan to get started.",
  trialNotice: "Your trial ends on {date}.",
  cancelNotice: "Your plan ends on {date} and will not renew.",
  pendingChangeNotice: "You move to {plan} on {date}.",
  pastDueNotice:
    "A payment is overdue. Pay it to keep using the platform without interruption.",
  suspendedNotice: "Your account is paused because a payment is overdue.",
  cycleMonthly: "Monthly",
  cycleAnnual: "Annual",
  cycleOneTime: "One time",
  cycleCustom: "Custom",
  // Usage
  usageTitle: "Usage this cycle",
  usageDescription: "What you have used in the current billing period.",
  usageEmpty: "Nothing to show for this cycle yet.",
  meteredNote: "Billed at the end of the cycle",
  overageNote:
    "{quantity} over your allowance · about {amount} on your next invoice",
  // Payment
  paymentTitle: "Payment information",
  paymentDescription: "How your invoices are paid.",
  paymentProviderNote:
    "Payments will be handled by Virtual Capital of America.",
  paymentComingSoon: "Coming soon",
  addPaymentMethodLabel: "Add payment method",
  paymentNotAvailable: "Not available yet. Your invoices stay available below.",
  // Profile
  profileTitle: "Billing address",
  profileDescription: "These details appear on all your invoices.",
  profileEmpty: "Add your billing details so they appear on your invoices.",
  addDetailsLabel: "Add details",
  editLabel: "Edit",
  saveLabel: "Save",
  cancelLabel: "Cancel",
  legalNameLabel: "Legal name",
  billingEmailLabel: "Billing email",
  phoneLabel: "Phone",
  addressLine1Label: "Address",
  addressLine2Label: "Apartment, suite or floor",
  cityLabel: "City",
  regionLabel: "State / province / region",
  postalCodeLabel: "Postal code",
  countryLabel: "Country",
  taxIdsLabel: "Tax IDs",
  taxIdTypeLabel: "Type",
  taxIdValueLabel: "Number",
  taxIdCountryLabel: "Issued in",
  taxIdOtherNameLabel: "Tax ID name",
  addTaxIdLabel: "Add tax ID",
  removeLabel: "Remove",
  profileSaved: "Billing details saved",
  profileNeedsAttention: "Some details need attention.",
  // Invoices
  invoicesTitle: "Invoices",
  invoicesDescription: "Your complete invoice history.",
  invoicesEmpty: "No invoices yet. Your first one arrives with your plan.",
  exportLabel: "Export",
  invoiceNumberLabel: "Invoice",
  planLabel: "Plan",
  billingDateLabel: "Billing date",
  amountLabel: "Amount",
  statusLabel: "Status",
  viewLabel: "View",
  downloadLabel: "Download PDF",
  statusOpen: "Awaiting payment",
  statusPaid: "Paid",
  statusVoid: "Void",
  statusUncollectible: "Unpaid",
  statusActive: "Active",
  statusTrialing: "On trial",
  statusPastDue: "Past due",
  statusSuspended: "Suspended",
  statusCanceled: "Canceled",
  statusExpired: "Expired",
  issuedLabel: "Issued",
  dueLabel: "Due",
  periodLabel: "Service period",
  fromLabel: "From",
  billToLabel: "Bill to",
  snapshotNote: "Details as they were when this invoice was issued.",
  descriptionLabel: "Description",
  quantityLabel: "Qty",
  unitPriceLabel: "Unit price",
  subtotalLabel: "Subtotal",
  taxLabel: "Tax",
  totalLabel: "Total",
  amountPaidLabel: "Amount paid",
  amountDueLabel: "Amount due",
  attemptsTitle: "Payment attempts",
  attemptLabel: "Attempt {number} of {max}",
  nextAttemptLabel: "Next attempt on {date}",
  lineUsage: "Usage over your allowance",
  attemptScheduled: "Scheduled",
  attemptRequested: "In progress",
  attemptSucceeded: "Succeeded",
  attemptFailed: "Failed",
  attemptCanceled: "Canceled",
  // States
  retryLabel: "Retry",
  loadError: "We couldn't load this right now.",
  sessionExpired:
    "Your session has expired. Sign in again to see your billing.",
  forbidden: "You don't have access to billing for this organization.",
  paginationOf: "of",
};

export const BILLING_ACCESS_DEFAULTS = {
  blockedTitle: "Your account is paused",
  blockedBody:
    "A payment is overdue, so access is paused. Pay the pending invoice to continue — everything you have is kept.",
  blockedAction: "Go to billing",
  pastDueBanner: "A payment is overdue. Pay it soon to avoid an interruption.",
  quotaBanner:
    "You have used all of your {name}. Change your plan to keep going.",
  bannerAction: "View billing",
};

/**
 * The same copy in other languages, picked by a surface's `locale` ("es", "es-CO"). Any key a
 * translation lacks falls back to English, and a host's `labels` still win over both.
 */
export const BILLING_SUMMARY_TRANSLATIONS = {
  es: {
    planTitle: "Tu plan",
    usageTitle: "Lo que has usado",
    historyTitle: "Períodos anteriores",
    noSubscriptionTitle: "Aún no tienes un plan",
    noSubscriptionBody: "Elige un plan para empezar.",
    loadingLabel: "Cargando…",
    periodLabel: "Este período",
    renewsLabel: "Se renueva",
    unlimitedLabel: "Ilimitado",
    payPerUseLabel: "Pago por uso",
    overLimitLabel: "Por encima del límite",
    approachingLabel: "Cerca del límite",
    changePlanLabel: "Cambiar de plan",
    amountLabel: "Monto",
    emptyHistoryLabel: "Todavía no hay nada aquí.",
  },
};

export const BILLING_CENTER_TRANSLATIONS = {
  es: {
    subscriptionTitle: "Detalles de la suscripción",
    subscriptionDescription:
      "Tu plan, cuánto cuesta y cuándo se factura de nuevo.",
    planPriceLabel: "Precio del plan",
    yourPlanLabel: "Tu plan",
    nextInvoiceLabel: "Próxima factura",
    cycleLabel: "Ciclo",
    autoRenewalLabel: "Renovación automática",
    onLabel: "Activada",
    offLabel: "Desactivada",
    freeLabel: "Gratis",
    changePlanLabel: "Cambiar de plan",
    noPlanTitle: "Aún no tienes un plan",
    noPlanBody: "Elige un plan para empezar.",
    trialNotice: "Tu período de prueba termina el {date}.",
    cancelNotice: "Tu plan termina el {date} y no se renovará.",
    pendingChangeNotice: "Pasas al plan {plan} el {date}.",
    pastDueNotice:
      "Tienes un pago vencido. Págalo para seguir usando la plataforma sin interrupciones.",
    suspendedNotice: "Tu cuenta está en pausa porque tienes un pago vencido.",
    cycleMonthly: "Mensual",
    cycleAnnual: "Anual",
    cycleOneTime: "Pago único",
    cycleCustom: "Personalizado",
    usageTitle: "Consumo de este ciclo",
    usageDescription: "Lo que has usado en el período de facturación actual.",
    usageEmpty: "Todavía no hay consumo en este ciclo.",
    meteredNote: "Se factura al cierre del ciclo",
    overageNote:
      "{quantity} por encima de lo incluido · cerca de {amount} en tu próxima factura",
    paymentTitle: "Información de pago",
    paymentDescription: "Cómo se pagan tus facturas.",
    paymentProviderNote:
      "Los pagos estarán a cargo de Virtual Capital of America.",
    paymentComingSoon: "Próximamente",
    addPaymentMethodLabel: "Agregar método de pago",
    paymentNotAvailable:
      "Aún no está disponible. Tus facturas siguen disponibles más abajo.",
    profileTitle: "Datos de facturación",
    profileDescription: "Estos datos aparecen en todas tus facturas.",
    profileEmpty:
      "Agrega tus datos de facturación para que aparezcan en tus facturas.",
    addDetailsLabel: "Agregar datos",
    editLabel: "Editar",
    saveLabel: "Guardar",
    cancelLabel: "Cancelar",
    legalNameLabel: "Razón social",
    billingEmailLabel: "Correo de facturación",
    phoneLabel: "Teléfono",
    addressLine1Label: "Dirección",
    addressLine2Label: "Apartamento, oficina o piso",
    cityLabel: "Ciudad",
    regionLabel: "Estado, provincia o departamento",
    postalCodeLabel: "Código postal",
    countryLabel: "País",
    taxIdsLabel: "Identificación tributaria",
    taxIdTypeLabel: "Tipo",
    taxIdValueLabel: "Número",
    taxIdCountryLabel: "País que la emite",
    taxIdOtherNameLabel: "Nombre de la identificación",
    addTaxIdLabel: "Agregar identificación",
    removeLabel: "Quitar",
    profileSaved: "Datos de facturación guardados",
    profileNeedsAttention: "Algunos datos necesitan revisión.",
    invoicesTitle: "Facturas",
    invoicesDescription: "Tu historial completo de facturas.",
    invoicesEmpty: "Aún no tienes facturas. La primera llega con tu plan.",
    exportLabel: "Exportar",
    invoiceNumberLabel: "Factura",
    planLabel: "Plan",
    billingDateLabel: "Fecha de facturación",
    amountLabel: "Monto",
    statusLabel: "Estado",
    viewLabel: "Ver",
    downloadLabel: "Descargar PDF",
    statusOpen: "Pendiente de pago",
    statusPaid: "Pagada",
    statusVoid: "Anulada",
    statusUncollectible: "Sin pagar",
    statusActive: "Activa",
    statusTrialing: "En prueba",
    statusPastDue: "Pago vencido",
    statusSuspended: "En pausa",
    statusCanceled: "Cancelada",
    statusExpired: "Finalizada",
    issuedLabel: "Emitida",
    dueLabel: "Vence",
    periodLabel: "Período del servicio",
    fromLabel: "Emisor",
    billToLabel: "Facturar a",
    snapshotNote: "Datos tal como estaban cuando se emitió esta factura.",
    descriptionLabel: "Descripción",
    quantityLabel: "Cant.",
    unitPriceLabel: "Precio unitario",
    subtotalLabel: "Subtotal",
    taxLabel: "Impuestos",
    totalLabel: "Total",
    amountPaidLabel: "Pagado",
    amountDueLabel: "Saldo pendiente",
    attemptsTitle: "Intentos de cobro",
    attemptLabel: "Intento {number} de {max}",
    nextAttemptLabel: "Próximo intento el {date}",
    lineUsage: "Consumo por encima de lo incluido",
    attemptScheduled: "Programado",
    attemptRequested: "En curso",
    attemptSucceeded: "Cobrado",
    attemptFailed: "Fallido",
    attemptCanceled: "Cancelado",
    retryLabel: "Reintentar",
    loadError: "No pudimos cargar esta información en este momento.",
    sessionExpired:
      "Tu sesión expiró. Vuelve a iniciar sesión para ver tu facturación.",
    forbidden: "No tienes acceso a la facturación de esta organización.",
    paginationOf: "de",
  },
};

export const BILLING_ACCESS_TRANSLATIONS = {
  es: {
    blockedTitle: "Tu cuenta está en pausa",
    blockedBody:
      "Tienes un pago vencido, por eso el acceso está en pausa. Paga la factura pendiente para continuar; todo lo que tienes se conserva.",
    blockedAction: "Ir a facturación",
    pastDueBanner:
      "Tienes un pago vencido. Págalo pronto para evitar una interrupción.",
    quotaBanner: "Agotaste el cupo de {name}. Cambia de plan para continuar.",
    bannerAction: "Ver facturación",
  },
};

/**
 * Tax ID kinds offered per issuing country. Every list ends with "other", which asks for the name, so
 * no country is ever left without a way to enter its identifier.
 */
export const TAX_ID_TYPES_BY_COUNTRY = {
  US: ["ein", "other"],
  CO: ["nit", "other"],
  MX: ["rfc", "other"],
  BR: ["cnpj", "other"],
  CL: ["rut", "other"],
  UY: ["rut", "other"],
  AR: ["cuit", "other"],
  AU: ["abn", "gst", "other"],
  IN: ["gst", "other"],
  CA: ["gst", "other"],
  NZ: ["gst", "other"],
  SG: ["gst", "other"],
  DEFAULT: ["vat", "other"],
};

export const MONETIZATION_THEME = {
  brandPrimary: "#2A317B",
  brandPrimaryDark: "#1F2559",
  accent: "#25BDD6",
  success: "#2e7d32",
  warning: "#ed6c02",
  error: "#c62828",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#9ca3af",
  surface: "#ffffff",
  surfaceMuted: "#f9fafb",
  surfaceToggle: "#e2e4e8",
  border: "#e5e7eb",
  borderDashed: "#d1d5db",
  successDark: "#1b5e20",
  warningDark: "#9a4a00",
  errorDark: "#8e0000",
};

/**
 * Merge a host's overrides over the defaults, one level deep.
 *
 * Shallow on purpose: these are flat maps of strings and colours, and a deep merge would only make
 * it harder to reason about which value won.
 */
export function mergeDefaults(defaults, overrides) {
  if (!overrides) {
    return defaults;
  }

  return { ...defaults, ...overrides };
}

/**
 * The defaults in a surface's language: `translations[language]` over the English defaults, where the
 * language is the first part of `locale` ("es-CO" → "es"). Unknown languages keep English.
 */
export function localizeDefaults(defaults, translations, locale) {
  const language = String(locale || "")
    .split(/[-_]/)[0]
    .toLowerCase();

  return { ...defaults, ...(translations?.[language] || {}) };
}
