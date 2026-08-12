import React, { useState } from "react";
import { IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

/**
 * The questions under the cards.
 *
 * `openIndex` is controlled when the host supplies it, so a surface that drives this page from
 * outside can open a question itself. Left alone it manages its own state.
 */
function PricingFaqComponent({ faq, palette, title, openIndex, onToggle }) {
  const [internalIndex, setInternalIndex] = useState(null);
  const active = openIndex !== undefined ? openIndex : internalIndex;

  const toggle = (index) => {
    const next = active === index ? null : index;

    if (onToggle) {
      onToggle(next);
      return;
    }

    setInternalIndex(next);
  };

  if (!faq?.length) {
    return null;
  }

  return (
    <section>
      {title && (
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: palette.textPrimary, mb: 2 }}
        >
          {title}
        </Typography>
      )}

      <div className="d-flex flex-column gap-2">
        {faq.map((item, index) => {
          const isOpen = active === index;

          return (
            <article
              key={item.question}
              className="px-4 py-3"
              style={{
                border: `1px solid ${palette.border}`,
                borderRadius: 14,
                background: palette.surface,
              }}
            >
              <div
                className="d-flex justify-content-between align-items-start"
                style={{ cursor: "pointer" }}
                onClick={() => toggle(index)}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    lineHeight: 1.4,
                    pt: "4px",
                    color: palette.textPrimary,
                  }}
                >
                  {item.question}
                </Typography>
                <IconButton
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    ml: 2,
                    flexShrink: 0,
                    border: `1px solid ${palette.border}`,
                    borderRadius: "10px",
                  }}
                >
                  {isOpen ? (
                    <RemoveIcon
                      sx={{ fontSize: 16, color: palette.textSecondary }}
                    />
                  ) : (
                    <AddIcon
                      sx={{ fontSize: 16, color: palette.textSecondary }}
                    />
                  )}
                </IconButton>
              </div>

              <div
                style={{
                  maxHeight: isOpen ? 500 : 0,
                  opacity: isOpen ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.4s ease, opacity 0.3s ease",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.85rem",
                    lineHeight: 1.7,
                    color: palette.textSecondary,
                    mt: 1,
                  }}
                >
                  {item.answer}
                </Typography>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default PricingFaqComponent;
