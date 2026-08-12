import React, { useEffect, useMemo, useState } from "react";
import { Button, Chip, Divider, Skeleton, Typography } from "@mui/material";

import usePricingCatalog from "../../catalog/use-pricing-catalog";
import { formatCyclePrice } from "../../format/value-formatter";
import {
  MONETIZATION_THEME,
  PRICING_TABLE_DEFAULTS,
  mergeDefaults,
} from "../../defaults/monetization.defaults";

import PricingPlanCard from "./PricingPlanCard.component";
import PricingFaq from "./PricingFaq.component";

const FOLD_AT = 8;

/**
 * PricingTable — the customer-facing plan cards, driven entirely by the catalog contract.
 *
 * Every string, price, feature line and card style comes from the server, so two products render
 * from one implementation without either one hardcoding its own copy. Plans carry a `slug` and a
 * `card_variant`, which is how a host styles Enterprise differently from Pro without knowing anything
 * about either.
 *
 * `cycle` and `openFaqIndex` are CONTROLLED on purpose. Hosts that expose this page to an assistant
 * or a command surface need to read and drive that state from outside; if the component owned it,
 * those integrations would go dark the moment this replaced a hand-written page.
 *
 * Layout is Bootstrap utilities and flexbox rather than MUI's grid, because the SDK and the apps that
 * consume it are not always on the same major version of MUI, and the grid is where they differ.
 */
function PricingTableComponent({
  baseUrl,
  apiKey,
  slug,
  productId,
  locale = "en",
  includeDraft = false,
  cycle,
  onCycleChange,
  plans: plansOverride,
  onPlansResolved,
  currentPlanId,
  currentPlanSlug,
  openFaqIndex,
  onFaqToggle,
  onAction,
  labels,
  theme,
  isLoading: isLoadingOverride,
  className = "",
}) {
  // -----------------------------------------------------
  // 1. Hooks
  // -----------------------------------------------------
  const catalog = usePricingCatalog({
    baseUrl,
    apiKey,
    slug,
    productId,
    locale,
    includeDraft,
    // A host that passes plans directly is previewing or testing; no request should go out.
    enabled: !plansOverride,
  });

  // -----------------------------------------------------
  // 2. Models / State
  // -----------------------------------------------------
  const [internalCycle, setInternalCycle] = useState(null);
  const [expanded, setExpanded] = useState({});

  // -----------------------------------------------------
  // 4. Configs / Constants
  // -----------------------------------------------------
  const copy = mergeDefaults(PRICING_TABLE_DEFAULTS, labels);
  const palette = mergeDefaults(MONETIZATION_THEME, theme);
  const activeCycle = cycle ?? internalCycle ?? catalog.defaultCycle;
  const plans = plansOverride || catalog.plansFor(activeCycle);
  const isLoading = isLoadingOverride ?? (!plansOverride && catalog.isLoading);
  const cycles = catalog.cycles || [];

  const bannerPlans = useMemo(
    () => plans.filter((plan) => plan.card_variant === "banner"),
    [plans],
  );
  const cardPlans = useMemo(
    () => plans.filter((plan) => plan.card_variant !== "banner"),
    [plans],
  );

  // -----------------------------------------------------
  // 5. Component Functions
  // -----------------------------------------------------
  const changeCycle = (next) => {
    if (onCycleChange) {
      onCycleChange(next);
    } else {
      setInternalCycle(next);
    }

    onAction?.({ action: "cycle-change", cycle: next });
  };

  const isCurrent = (plan) =>
    (currentPlanId && plan.plan_id === currentPlanId) ||
    (currentPlanSlug && plan.slug === currentPlanSlug);

  const selectPlan = (plan) => {
    onAction?.({
      action: plan.slug === "enterprise" ? "contact-sales" : "plan-select",
      plan,
      cycle: activeCycle,
    });
  };

  // -----------------------------------------------------
  // 6. Lifecycle
  // -----------------------------------------------------
  useEffect(() => {
    if (plans?.length) {
      onPlansResolved?.(plans);
    }
  }, [plans]);

  // -----------------------------------------------------
  // 7. Render
  // -----------------------------------------------------
  if (isLoading) {
    return (
      <section className={`d-flex flex-column ${className}`}>
        <Skeleton variant="text" width={280} height={40} sx={{ mx: "auto" }} />
        <section className="d-flex flex-wrap justify-content-center gap-3 mt-4">
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={index}
              variant="rounded"
              width={280}
              height={420}
              sx={{ borderRadius: "16px" }}
            />
          ))}
        </section>
      </section>
    );
  }

  if (!plans?.length) {
    return (
      <section className={`text-center py-5 ${className}`}>
        <Typography variant="body2" sx={{ color: palette.textMuted }}>
          {catalog.error || copy.emptyLabel}
        </Typography>
      </section>
    );
  }

  return (
    <section className={`d-flex flex-column ${className}`}>
      {(catalog.catalog?.title || catalog.catalog?.subtitle) && (
        <header className="text-center mb-3">
          {catalog.catalog?.title && (
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: palette.textPrimary }}
            >
              {catalog.catalog.title}
            </Typography>
          )}
          {catalog.catalog?.subtitle && (
            <Typography
              variant="body2"
              sx={{ color: palette.textSecondary, mt: 0.5 }}
            >
              {catalog.catalog.subtitle}
            </Typography>
          )}
        </header>
      )}

      {cycles.length > 1 && (
        <nav className="d-flex justify-content-center mb-4">
          <div
            className="d-inline-flex align-items-center rounded-pill p-1"
            style={{ background: palette.surfaceToggle }}
          >
            {cycles.map((entry) => {
              const selected = entry.cycle === activeCycle;

              return (
                <button
                  key={entry.cycle}
                  type="button"
                  onClick={() => changeCycle(entry.cycle)}
                  className="border-0 rounded-pill px-3 py-1"
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: selected ? palette.surface : "transparent",
                    color: selected
                      ? palette.textPrimary
                      : palette.textSecondary,
                    boxShadow: selected ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {entry.label}
                  {entry.badge && (
                    <span
                      className="ms-1"
                      style={{
                        color: palette.success,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    >
                      {entry.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <section className="d-flex flex-wrap justify-content-center align-items-stretch gap-3">
        {cardPlans.map((plan) => (
          <PricingPlanCard
            key={plan.slug}
            plan={plan}
            palette={palette}
            copy={copy}
            locale={locale}
            isCurrent={isCurrent(plan)}
            isExpanded={!!expanded[plan.slug]}
            foldAt={FOLD_AT}
            onToggleExpand={() =>
              setExpanded((previous) => ({
                ...previous,
                [plan.slug]: !previous[plan.slug],
              }))
            }
            onSelect={() => selectPlan(plan)}
          />
        ))}
      </section>

      {bannerPlans.map((plan) => (
        <article
          key={plan.slug}
          className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mt-3 p-4"
          style={{
            border: `1px solid ${palette.border}`,
            borderRadius: 20,
            background: palette.surfaceMuted,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 2,
                color: palette.textMuted,
                display: "block",
              }}
            >
              {plan.name}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: palette.textPrimary }}
            >
              {formatCyclePrice(plan.price, { locale }) ||
                plan.price?.display_amount}
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "0.85rem",
                  color: palette.textSecondary,
                  marginLeft: 8,
                }}
              >
                {plan.price?.display_suffix?.[locale] ||
                  plan.price?.display_suffix?.en}
              </span>
            </Typography>
            {plan.description && (
              <Typography
                variant="body2"
                sx={{ color: palette.textSecondary, mt: 1 }}
              >
                {plan.description}
              </Typography>
            )}
          </div>

          <Button
            variant="contained"
            disableElevation
            onClick={() => selectPlan(plan)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "24px",
              px: 3,
              flexShrink: 0,
              backgroundColor: palette.brandPrimary,
              "&:hover": { backgroundColor: palette.brandPrimaryDark },
            }}
          >
            {plan.cta?.label || copy.contactLabel}
          </Button>
        </article>
      ))}

      {catalog.catalog?.footer_note && (
        <footer className="text-center mt-3">
          <Typography variant="caption" sx={{ color: palette.textMuted }}>
            {catalog.catalog.footer_note}
          </Typography>
        </footer>
      )}

      {!!catalog.catalog?.faq?.length && (
        <>
          <Divider sx={{ my: 4 }} />
          <PricingFaq
            faq={catalog.catalog.faq}
            palette={palette}
            title={copy.faqTitle}
            openIndex={openFaqIndex}
            onToggle={onFaqToggle}
          />
        </>
      )}
    </section>
  );
}

export default PricingTableComponent;
