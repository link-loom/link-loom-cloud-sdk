import { useLayoutEffect, useRef } from "react";

/**
 * Slides tiles to their new places instead of teleporting them.
 *
 * Reordering a grid moves everything at once, and a jump gives no clue about
 * what actually happened — the tile you dragged and the ones that shifted to
 * make room look the same. This is the FLIP trick: remember where each child
 * was, and after React has laid them out again, start each one from its old
 * position and let it travel to the new one.
 *
 * Children opt in with `data-flip-key`; anything without one is left alone,
 * which is how a panel or a divider stays put.
 */
const DURATION = 200;
const EASING = "cubic-bezier(.2,.8,.2,1)";
/** Tagged so a second reorder replaces the first instead of fighting it. */
const FLIP = "loom-reorder-flip";

export default function useReorderFlip(node, signature) {
  const positions = useRef(new Map());

  useLayoutEffect(() => {
    if (!node) return;

    const next = new Map();

    [...node.children].forEach((child) => {
      const key = child.dataset?.flipKey;
      if (!key) return;

      const box = child.getBoundingClientRect();
      next.set(key, box);

      const previous = positions.current.get(key);
      if (!previous) return;

      const dx = previous.left - box.left;
      const dy = previous.top - box.top;
      if (!dx && !dy) return;
      if (typeof child.animate !== "function") return;

      child
        .getAnimations?.()
        .filter((animation) => animation.id === FLIP)
        .forEach((animation) => animation.cancel());

      const animation = child.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
        duration: DURATION,
        easing: EASING,
      });
      animation.id = FLIP;
    });

    positions.current = next;
  }, [node, signature]);
}
