import {
  AppsOutlined,
  BuildOutlined,
  PersonOutline,
  ShowChart,
  Cable,
  AutoAwesome,
  Widgets as WorkspaceIcon,
  Code as FallbackIcon,
  DynamicForm as DynamicFormIcon,
  Storage as StorageIcon,
  TuneOutlined,
  TrendingUp,
  AccountBalanceOutlined,
  ForumOutlined,
  SupportAgentOutlined,
  GroupsOutlined,
} from "@mui/icons-material";

import { STORE_CATEGORIES, enumName } from "@/features/app-engine/app-store/app-store.enums";

// Indexed by the category's wire name. The App Store categories come first; the rest are the names
// definitions carried before categories became a catalog, kept so older records keep their glyph.
const CATEGORY_ICON_MAP = {
  [STORE_CATEGORIES.ai]: AutoAwesome,
  [STORE_CATEGORIES.productivity]: AppsOutlined,
  [STORE_CATEGORIES.operations]: TuneOutlined,
  [STORE_CATEGORIES.sales]: TrendingUp,
  [STORE_CATEGORIES.finance]: AccountBalanceOutlined,
  [STORE_CATEGORIES.communication]: ForumOutlined,
  [STORE_CATEGORIES.analytics]: ShowChart,
  [STORE_CATEGORIES.support]: SupportAgentOutlined,
  [STORE_CATEGORIES.people]: GroupsOutlined,
  workspace: WorkspaceIcon,
  utility: BuildOutlined,
  hitl: PersonOutline,
  integration: Cable,
  forms: DynamicFormIcon,
  form: DynamicFormIcon,
  data: StorageIcon,
};

const CATEGORY_TINT_MAP = {
  [STORE_CATEGORIES.ai]: { bg: "#FFE4E6", iconColor: "#F43F5E" },
  [STORE_CATEGORIES.productivity]: { bg: "#E0E7FF", iconColor: "#4F46E5" },
  [STORE_CATEGORIES.operations]: { bg: "#FFEDD5", iconColor: "#EA580C" },
  [STORE_CATEGORIES.sales]: { bg: "#DCFCE7", iconColor: "#16A34A" },
  [STORE_CATEGORIES.finance]: { bg: "#CCFBF1", iconColor: "#0D9488" },
  [STORE_CATEGORIES.communication]: { bg: "#E0F2FE", iconColor: "#0284C7" },
  [STORE_CATEGORIES.analytics]: { bg: "#FEF3C7", iconColor: "#F59E0B" },
  [STORE_CATEGORIES.support]: { bg: "#FEE2E2", iconColor: "#DC2626" },
  [STORE_CATEGORIES.people]: { bg: "#FCE7F3", iconColor: "#DB2777" },
  workspace: { bg: "#EDE9FE", iconColor: "#8B5CF6" },
  utility: { bg: "#D1FAE5", iconColor: "#10B981" },
  hitl: { bg: "#DBEAFE", iconColor: "#3B82F6" },
  integration: { bg: "#CFFAFE", iconColor: "#06B6D4" },
  forms: { bg: "#FEF3C7", iconColor: "#D97706" },
  form: { bg: "#FEF3C7", iconColor: "#D97706" },
  data: { bg: "#E0F2FE", iconColor: "#0284C7" },
};

const DEFAULT_TINT = { bg: "#F3F4F6", iconColor: "#6B7280" };

// A category arrives as its catalog object (`{ name, title }`) or, on older records, as a string.
export function getCategoryIcon(category) {
  const name = enumName(category);
  if (!name) return AppsOutlined;
  return CATEGORY_ICON_MAP[name] || FallbackIcon;
}

export function getCategoryTint(category) {
  const name = enumName(category);
  if (!name) return DEFAULT_TINT;
  return CATEGORY_TINT_MAP[name] || DEFAULT_TINT;
}
