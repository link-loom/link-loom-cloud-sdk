import React from "react";
import { Button, Chip, Divider, Typography } from "@mui/material";
import { Check as CheckIcon, ArrowForward as ArrowForwardIcon } from "@mui/icons-material";

import { formatCyclePrice } from "../../format/value-formatter";

/**
 * One plan card.
 *
 * Every line it draws was worded by the server, so this component decides presentation and nothing
 * else. The one distinction it does make is between a feature shown struck through and a feature
 * that simply is not on the card: the first is a deliberate "you would get this on a higher plan",
 * the second is silence. Collapsing them would lose the whole point of showing the strikethrough.
 */
function PricingPlanCardComponent({
  plan,
  palette,
  copy,
  locale,
  isCurrent,
  isExpanded,
  foldAt,
  onToggleExpand,
  onSelect,
}) {
  const highlighted =
    plan.card_variant === "highlighted" || plan.is_highlighted;
  const features = plan.features || [];
  const visible = isExpanded ? features : features.slice(0, foldAt);
  const hidden = features.length - visible.length;

  const amount =
    formatCyclePrice(plan.price, { locale }) ||
    plan.price?.display_amount ||
    "";
  const suffix =
    plan.price?.display_suffix?.[locale] ||
    plan.price?.display_suffix?.en ||
    "";

  return (
    <article
      className="d-flex flex-column p-3"
      style={{
        width: 288,
        maxWidth: "100%",
        borderRadius: 16,
        background: palette.surface,
        border: `1px solid ${highlighted ? palette.brandPrimary : palette.border}`,
        boxShadow: highlighted ? "0 12px 32px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div className="d-flex align-items-center gap-2 mb-1">
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 1,
            color: highlighted ? palette.textPrimary : palette.textMuted,
            fontWeight: 600,
          }}
        >
          {plan.name}
        </Typography>
        {highlighted && plan.highlight_label && (
          <Chip
            label={plan.highlight_label}
            size="small"
            sx={{
              height: 20,
              fontSize: 11,
              bgcolor: palette.brandPrimary,
              color: "#fff",
            }}
          />
        )}
      </div>

      <div className="mb-1">
        <Typography
          variant="h5"
          component="p"
          sx={{ fontWeight: 700, color: palette.textPrimary, m: 0 }}
        >
          {amount}
          {suffix && (
            <span
              style={{
                fontWeight: 400,
                fontSize: "0.75rem",
                color: palette.textSecondary,
                marginLeft: 6,
              }}
            >
              {suffix}
            </span>
          )}
        </Typography>
      </div>

      {plan.tagline && (
        <Typography
          variant="body2"
          sx={{
            color: palette.textSecondary,
            fontSize: "0.8rem",
            minHeight: 38,
            mb: 1,
          }}
        >
          {plan.tagline}
        </Typography>
      )}

      <Button
        fullWidth
        variant={highlighted ? "contained" : "outlined"}
        disableElevation
        disabled={isCurrent}
        onClick={onSelect}
        endIcon={!isCurrent ? <ArrowForwardIcon sx={{ fontSize: 16 }} /> : null}
        sx={{
          borderRadius: "24px",
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.82rem",
          mb: 2,
          ...(highlighted
            ? {
                bgcolor: palette.brandPrimary,
                "&:hover": { bgcolor: palette.brandPrimaryDark },
              }
            : {
                borderColor: palette.brandPrimary,
                color: palette.brandPrimary,
              }),
        }}
      >
        {isCurrent
          ? copy.currentPlanLabel
          : plan.cta?.label || copy.selectLabel}
      </Button>

      <Divider sx={{ mb: 1.5 }} />

      <Typography
        variant="caption"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 1,
          fontSize: "0.65rem",
          color: palette.textMuted,
          display: "block",
          mb: 1,
        }}
      >
        {copy.featuresLabel}
      </Typography>

      <div className="flex-grow-1">
        {visible.map((line) => (
          <div className="d-flex align-items-start gap-2 mb-1" key={line.slug}>
            <CheckIcon
              sx={{
                fontSize: 14,
                mt: "3px",
                flexShrink: 0,
                color: line.is_included
                  ? palette.success
                  : palette.borderDashed,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.78rem",
                  lineHeight: 1.35,
                  color: line.is_included
                    ? palette.textPrimary
                    : palette.textMuted,
                  textDecoration: line.is_included ? "none" : "line-through",
                }}
              >
                {line.display_text}
              </Typography>
              {line.note && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.7rem",
                    color: palette.textMuted,
                    display: "block",
                  }}
                >
                  {line.note}
                </Typography>
              )}
            </div>
          </div>
        ))}

        {hidden > 0 && (
          <Button
            size="small"
            onClick={onToggleExpand}
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              px: 0,
              color: palette.brandPrimary,
            }}
          >
            {copy.showAllFeaturesLabel}
          </Button>
        )}

        {hidden === 0 && isExpanded && features.length > foldAt && (
          <Button
            size="small"
            onClick={onToggleExpand}
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              px: 0,
              color: palette.brandPrimary,
            }}
          >
            {copy.showFewerFeaturesLabel}
          </Button>
        )}
      </div>

      {plan.footer_block?.items?.length > 0 && (
        <a
          href={plan.footer_block.url || undefined}
          target={plan.footer_block.url ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="d-flex align-items-center gap-3 mt-3 pt-3 text-decoration-none"
          style={{ borderTop: `1px solid ${palette.border}`, color: "inherit" }}
        >
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontSize: "0.82rem",
                color: palette.textPrimary,
              }}
            >
              {plan.footer_block.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.72rem",
                color: palette.textMuted,
                display: "block",
                mt: 0.5,
              }}
            >
              {plan.footer_block.items.join(", ")}
            </Typography>
          </div>
          {plan.footer_block.url && (
            <ArrowForwardIcon
              sx={{ fontSize: 16, color: palette.brandPrimary, flexShrink: 0 }}
            />
          )}
        </a>
      )}
    </article>
  );
}

export default PricingPlanCardComponent;
