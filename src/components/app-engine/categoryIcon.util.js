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
} from "@mui/icons-material";

const CATEGORY_ICON_MAP = {
  workspace: WorkspaceIcon,
  utility: BuildOutlined,
  hitl: PersonOutline,
  analytics: ShowChart,
  integration: Cable,
  ai: AutoAwesome,
  forms: DynamicFormIcon,
  form: DynamicFormIcon,
  data: StorageIcon,
};

const CATEGORY_TINT_MAP = {
  workspace:   { bg: "#EDE9FE", iconColor: "#8B5CF6" },
  utility:     { bg: "#D1FAE5", iconColor: "#10B981" },
  hitl:        { bg: "#DBEAFE", iconColor: "#3B82F6" },
  analytics:   { bg: "#FEF3C7", iconColor: "#F59E0B" },
  integration: { bg: "#CFFAFE", iconColor: "#06B6D4" },
  ai:          { bg: "#FFE4E6", iconColor: "#F43F5E" },
  forms:       { bg: "#FEF3C7", iconColor: "#D97706" },
  form:        { bg: "#FEF3C7", iconColor: "#D97706" },
  data:        { bg: "#E0F2FE", iconColor: "#0284C7" },
};

const DEFAULT_TINT = { bg: "#F3F4F6", iconColor: "#6B7280" };

export function getCategoryIcon(category) {
  if (!category) return AppsOutlined;
  return CATEGORY_ICON_MAP[category] || FallbackIcon;
}

export function getCategoryTint(category) {
  if (!category) return DEFAULT_TINT;
  return CATEGORY_TINT_MAP[category] || DEFAULT_TINT;
}
