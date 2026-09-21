import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

import { useAppStore } from "@/features/app-engine/app-store/AppStore.context";
import useStorePagedApps from "@/features/app-engine/app-store/useStorePagedApps.hook";
import { categoryDescription, categoryTitle } from "@/features/app-engine/app-store/app-store.format";
import { STORE_QUERY } from "@/features/app-engine/app-store/app-store.routes";
import { getCategoryIcon, getCategoryTint } from "../../categoryIcon.util";
import { STORE_COLORS as COLORS } from "../../defaults/stoneos-store.palette";
import { STORE_ROOT_SX, overlineSx, storePaperSx } from "../app-store.styles";
import AppStoreAppGridComponent from "../subcomponents/AppStoreAppGrid.component";
import { AppStoreCount, AppStorePageTitle, AppStoreSectionHeader } from "../subcomponents/AppStoreHeading.component";
import { HeaderSkeleton, SkeletonBlock } from "../subcomponents/AppStoreSkeleton.component";
import { AppStoreEmptyState } from "../subcomponents/AppStoreStatus.component";

// The suite picker in the store's colours: the accent on focus, the store's hairline at rest.
const PICKER_SX = {
  width: 280,
  maxWidth: "100%",
  mb: 3,
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: COLORS.surface,
    color: COLORS.ink,
    fontSize: 14,
    "& fieldset": { borderColor: COLORS.pillBorder },
    "&:hover fieldset": { borderColor: COLORS.pillBorderHover },
    "&.Mui-focused fieldset": { borderColor: COLORS.accent, borderWidth: 1, boxShadow: `0 0 0 3px ${COLORS.focusRing}` },
  },
  "& .MuiInputLabel-root": { color: COLORS.textTertiary },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.accent },
  "& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator": { color: COLORS.textTertiary },
};

// Its list opens in a portal, outside the store's root, so it carries the palette itself.
const PICKER_PAPER_SX = {
  ...STORE_ROOT_SX,
  ...storePaperSx("12px"),
  mt: 0.5,
  border: `1px solid ${COLORS.hairline}`,
  boxShadow: COLORS.shadowHover,
  "& .MuiAutocomplete-option": { fontSize: 14, color: COLORS.ink },
  "& .MuiAutocomplete-option.Mui-focused": { backgroundColor: COLORS.hover },
  "& .MuiAutocomplete-option[aria-selected='true'], & .MuiAutocomplete-option[aria-selected='true'].Mui-focused": { backgroundColor: COLORS.accentTint },
  "& .MuiAutocomplete-noOptions": { color: COLORS.textTertiary },
};

/**
 * Every app of one category across the suites, narrowed to one suite with `?suite=`. The suite
 * picker is an autocomplete: the store holds dozens of suites.
 */
function AppStoreCategoryComponent({ category: categoryName }) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const { labels, catalogs, catalogsLoading, suites, reportView } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const category = catalogs.categories.find((entry) => entry.name === categoryName || entry.key === categoryName) || null;
  const suiteSlug = searchParams.get(STORE_QUERY.suite) || "";
  const selectedSuite = suites.find((suite) => suite.slug === suiteSlug) || null;
  const params = useMemo(() => ({ category: categoryName, suite: suiteSlug || undefined }), [categoryName, suiteSlug]);
  const list = useStorePagedApps(params);
  const title = category ? categoryTitle(labels, category) : categoryName;
  const Icon = getCategoryIcon(categoryName);
  const tint = getCategoryTint(categoryName);
  // Until the catalogs arrive the category has no title yet: its header and section title are skeletons.
  const titlePending = catalogsLoading && !category;

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const selectSuite = (suite) => {
    const next = new URLSearchParams(searchParams);
    if (suite?.slug) next.set(STORE_QUERY.suite, suite.slug);
    else next.delete(STORE_QUERY.suite);
    setSearchParams(next, { replace: true });
  };

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    reportView({ items: list.items, totalItems: list.totalItems });
  }, [list.items, list.totalItems, reportView]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (catalogs.categories.length > 0 && !category) {
    return <AppStoreEmptyState text={labels.category.notFound} />;
  }

  return (
    <>
      {titlePending ? (
        <Box sx={{ mb: 3 }}>
          <HeaderSkeleton glyph={48} />
        </Box>
      ) : (
        <Box className="loom-store-fade d-flex align-items-start gap-3" sx={{ mb: 3 }}>
          <Box sx={{ width: 48, height: 48, flex: "none", borderRadius: "26%", display: "grid", placeItems: "center", backgroundColor: tint.bg }}>
            <Icon sx={{ fontSize: 24, color: tint.iconColor }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="p" sx={{ ...overlineSx, mb: 0.75 }}>
              {labels.category.overline}
            </Typography>
            <AppStorePageTitle>{title}</AppStorePageTitle>
            <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.45, color: COLORS.textSecondary, mt: 1, maxWidth: 560 }}>
              {categoryDescription(labels, category || categoryName)}
            </Typography>
          </Box>
        </Box>
      )}

      {suites.length > 0 && (
        <Autocomplete
          options={suites}
          value={selectedSuite}
          onChange={(event, suite) => selectSuite(suite)}
          getOptionLabel={(suite) => suite?.name || ""}
          isOptionEqualToValue={(option, value) => option.slug === value.slug}
          renderOption={(props, suite) => {
            const { key, ...optionProps } = props;
            return (
              <Box component="li" key={key} {...optionProps} className={`${optionProps.className || ""} d-flex align-items-center gap-2`}>
                <Box component="span" sx={{ width: 10, height: 10, borderRadius: "3px", backgroundColor: suite.color || COLORS.accent, flex: "none" }} />
                {suite.name}
              </Box>
            );
          }}
          renderInput={(inputParams) => <TextField {...inputParams} size="small" label={labels.category.suiteFilter} placeholder={labels.category.allSuites} />}
          slotProps={{ paper: { sx: PICKER_PAPER_SX } }}
          sx={PICKER_SX}
        />
      )}

      <Box component="section">
        {titlePending ? (
          <SkeletonBlock width={180} height={16} sx={{ mb: 2 }} />
        ) : (
          <AppStoreSectionHeader
            title={selectedSuite ? labels.category.appsFor(title, selectedSuite.name) : labels.category.allApps(title)}
            trailing={list.isLoading ? null : <AppStoreCount>{labels.search.count(list.totalItems)}</AppStoreCount>}
          />
        )}
        <AppStoreAppGridComponent list={list} emptyText={labels.category.empty} />
      </Box>
    </>
  );
}

export default AppStoreCategoryComponent;
