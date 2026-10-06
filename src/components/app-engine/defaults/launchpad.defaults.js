// ── Launchpad + App Store defaults ──────────────────────────────────
// English copy and host-agnostic routes. Hosts override any subset through `LaunchpadProvider`
// (`labels`, `storeLabels`, `paths`); overrides are deep-merged, so a host that only translates a
// few strings keeps the rest.

export const LAUNCHPAD_LABELS = {
  // The name of the place in the navbar's breadcrumb, over My apps and the App Store.
  stoneOS: "StoneOS",
  myApps: "My apps",
  appStore: "App Store",
  rail: { home: "StoneOS", allApps: "All apps", pinned: "Pinned", platforms: "Platforms" },
  prompt: "What do you want to work on?",
  searchPlaceholder: "Applications",
  searchShortcut: "/",
  recent: "Recent",
  pinned: "Pinned",
  allApps: "All apps",
  getMore: "Get more",
  folderStoneOS: "StoneOS",
  folderClose: "Close",
  results: (count) => `${count} in your apps`,
  noResults: (term) => `No app named “${term}” in your apps.`,
  searchStore: (term) => `Search the App Store for “${term}”`,
  // The records the apps of the organization found for the text of the search (platform-facade §10).
  records: {
    searching: "Searching inside your apps…",
    failed: "Could not search inside your apps",
    found: (count) => `${count} found inside your apps`,
  },
  emptyHint: "Install the first one from the App Store. The StoneOS platforms are always in the folder.",
  loadFailed: "Could not load your apps",
  retry: "Retry",
  copyBlocked: "The browser refused to copy",
  group: {
    defaultName: "Group",
    nameLabel: "Group name",
    rename: "Rename group",
    removeFromGroup: "Take out of the group",
  },
  menu: {
    open: "Open",
    newTab: "Open in a new tab",
    pin: "Pin to launchpad",
    unpin: "Remove from launchpad",
    copyLink: "Copy link",
    viewInStore: "View in the App Store",
    linkCopied: "Link copied",
    pinFailed: "Could not change the pin",
  },
};

// App Store copy. Closed values (categories, suite kinds, access states, pricing models, sorts) are
// indexed by the backend catalog key (see `app-store.enums.js`); a key a host does not translate falls
// back to the catalog's own title.
export const APP_STORE_LABELS = {
  // Formats prices and dates (`en`, `es` or any BCP 47 tag).
  locale: "en",
  searchPlaceholder: "Search the App Store",
  searchShortcut: "/",
  loadFailed: "Could not load the App Store",
  retry: "Retry",
  // Read by screen readers while a screen draws its skeleton.
  loading: "Loading…",
  nav: {
    label: "App Store sections",
    discover: "Discover",
    allSuites: "All suites",
    organizationApps: (organization) => `${organization} apps`,
    organizationFallback: "Your organization",
    yourSuites: "Your suites",
    seeAllSuites: "See all suites",
    categories: "Categories",
    backToMyApps: "Back to my apps",
    collapse: "Collapse the sidebar",
    expand: "Expand the sidebar",
    back: "Back",
  },
  build: {
    title: "Build your own app",
    hint: "Publish internal tools for your teams, right here in the store.",
    action: "Start building",
  },
  discover: {
    featured: "Featured",
    suggested: "Suggested for you",
    // The line under "Suggested for you": what the list is (the apps the store features), nothing more.
    suggestedNote: "Featured picks from the App Store.",
    browseSuites: "Browse by business suite",
    seeAllSuites: (count) => (count > 1 ? `See all ${count} suites →` : "See all suites →"),
    title: "Discover",
    showing: (shown, total) => `Showing ${shown} of ${total} apps`,
    showMore: "Show more",
    loadingMore: "Loading more apps…",
    end: "That is every app in the store.",
    empty: "There are no apps in the store yet.",
  },
  search: {
    resultsFor: (term) => `Results for “${term}”`,
    count: (count) => (count === 1 ? "1 app" : `${count} apps`),
    none: (term) => `Nothing matches “${term}”.`,
    noneHint: "Try another word or pick a category.",
    clear: "Clear the search",
  },
  suites: {
    title: "Business suites",
    subtitle: "Suites bundle the apps a kind of business runs on. Pick one to see every app in it.",
    count: (count) => `${count} suites · yours first`,
    inUse: "In use",
    usage: (used, total) => `${used} of ${total} in use`,
    appsCount: (count) => (count === 1 ? "1 app" : `${count} apps`),
    empty: "There are no suites in the store yet.",
    kindTitles: {
      core: "Core",
      business: "Business suite",
      industry: "Industry edition",
    },
    kindGroups: {
      core: "Core",
      business: "Business suites",
      industry: "Industry editions",
    },
  },
  suite: {
    getSuite: (price) => `Get the suite · ${price}`,
    getSuiteFree: "Get the suite",
    complete: "Every app is yours",
    summary: (total, yours) => `${total} apps · ${yours} already yours`,
    coverage: "Coverage",
    missing: (count) => (count === 1 ? "1 app is not in My apps yet" : `${count} apps are not in My apps yet`),
    alreadyInHub: (count) => `Already in My apps · ${count}`,
    categoryFilter: "Category",
    allCategories: "All",
    appsYouCanAdd: "Apps you can add",
    appsInSuite: "Apps in this suite",
    noApps: "No apps match this filter.",
    notFound: "This suite is not in the store.",
  },
  category: {
    overline: "Category",
    suiteFilter: "Suite",
    allSuites: "All suites",
    allApps: (category) => `All ${category} apps`,
    appsFor: (category, suite) => `${category} apps for ${suite}`,
    empty: "No apps in this category yet.",
    notFound: "This category does not exist.",
  },
  organization: {
    title: (organization) => `Apps built by ${organization}`,
    hint: "Tools your organization publishes for its own teams.",
    build: "Build an app",
    empty: "Your organization has not built an app yet.",
  },
  card: {
    get: "Get",
    buy: (price) => `Buy · ${price}`,
    // An app the organization already has, outside its page: the way to that page.
    view: "View",
    viewApp: (name) => `View ${name}`,
    // Only on an app's own page.
    open: "Open",
    free: "Free",
    line: (suite, category) => (suite ? `${suite} · ${category}` : category),
    noDescription: "No description",
    moreActions: "More actions",
    editInStudio: "Edit in Studio",
    delete: "Delete",
    deleteTitle: "Delete app",
    // The app name is rendered in bold between the two halves.
    deleteConfirmBefore: "Delete ",
    deleteConfirmAfter: "? It stops working for everyone in your organization. This cannot be undone.",
    cancel: "Cancel",
    deleteFailed: "Could not delete the app",
  },
  detail: {
    by: "by",
    publisher: "Publisher",
    verified: "Verified publisher",
    media: "Screens",
    about: "About",
    worksWith: "Works with",
    information: "Information",
    version: "Version",
    updated: "Updated",
    dataAccess: "Data access",
    compliance: "Compliance",
    support: "Support",
    supportLink: "Help center",
    price: "Price",
    priceNotes: {
      owned: "Built by your organization",
      entitled: "Already in your organization",
      free: "Free for your organization",
      oneTime: "One-time price for your organization",
    },
    forDevelopers: "For developers",
    capabilities: "Capabilities",
    routes: "Routes",
    interface: "Interface",
    inputs: "Inputs",
    outputs: "Outputs",
    ports: "Ports",
    defaultPort: "Default",
    notFound: "This app is not in the store.",
    notFoundHint: "It may be private to another organization or no longer published.",
  },
  acquire: {
    ableTo: "This app will be able to",
    suiteApps: "Adds these apps",
    installFor: "Install for",
    everyoneIn: (organization) => `Everyone in ${organization}`,
    price: "Price",
    cancel: "Cancel",
    confirmApp: "Add to my apps",
    confirmSuite: "Add the suite",
    progressApp: "Adding to your apps…",
    progressSuite: "Adding the suite’s apps…",
    doneApp: "Added to My apps and pinned to your launchpad.",
    doneSuite: (count) => (count === 1 ? "1 app added to My apps." : `${count} apps added to My apps.`),
    doneSuiteNothing: "Every app of this suite was already in My apps.",
    open: (name) => `Open ${name}`,
    keepBrowsing: "Keep browsing",
    failed: "Could not add it",
    tryAgain: "Try again",
    close: "Close",
  },
  notEntitled: {
    title: "Your organization does not have this app yet",
    hint: "Get it from the App Store to open it here.",
    action: "Get this app",
  },
  access: {
    owned: "Yours",
    entitled: "In your apps",
    available: "Available",
  },
  pricingModels: {
    free: "Free",
    oneTime: "One-time",
  },
  sorts: {
    featured: "Featured",
    name: "Name",
    recent: "Recently updated",
  },
  categoryTitles: {
    ai: "AI",
    productivity: "Productivity",
    operations: "Operations",
    sales: "Sales",
    finance: "Finance",
    communication: "Communication",
    analytics: "Analytics",
    support: "Support",
    people: "People",
  },
  categoryDescriptions: {
    ai: "Apps that draft, summarize, classify and automate with AI.",
    productivity: "Documents, notes, spreadsheets, calendars and the everyday tools of work.",
    operations: "Run the day-to-day: processes, requests, inventories and approvals.",
    sales: "Pipelines, customers, quotes and everything that closes a deal.",
    finance: "Payments, invoices, settlements and the books.",
    communication: "Chat, mail and the conversations of your teams.",
    analytics: "Dashboards, reports and the numbers behind decisions.",
    support: "Tickets, cases and help for the people you serve.",
    people: "Directories, hiring, time off and everything about your teams.",
  },
  categoryFallbackDescription: "Apps grouped by what they do, across every suite.",
};

// The route segments the launchpad's pages live under, relative to where the host mounts them
// (`stoneOSLaunchpadRoutes`). `store` is a splat: the App Store routes its own screens beneath it.
export const STONEOS_LAUNCHPAD_SEGMENTS = {
  section: "stoneos",
  apps: "apps",
  store: "store",
};

// Where the launchpad sends people, under the host's base path (`/client`, `/admin`, or none).
// `runtime` and `studio` build a path from an app definition.
export const buildLaunchpadPaths = (basePath = "") => {
  const root = String(basePath || "").replace(/\/+$/, "");
  const { section, apps, store } = STONEOS_LAUNCHPAD_SEGMENTS;

  return {
    apps: `${root}/${section}/${apps}`,
    store: `${root}/${section}/${store}`,
    runtime: (slug) => `${root}/app-engine/runtime/${slug}`,
    studio: (id) => `${root}/app-engine/studio/${id}`,
  };
};

export const LAUNCHPAD_PATHS = buildLaunchpadPaths();

// Prefix of the browser storage keys (`<namespace>::launchpad::layout|recent|hidden-platforms`).
export const LAUNCHPAD_STORAGE_NAMESPACE = "stoneos";
