/**
 * Dragging a tile around the launchpad.
 *
 * There is one kind of thing here: a tile. An app and a folder are dragged the
 * same way, and so is a tile inside an open folder — what changes is not the
 * tile but the *container* it is in:
 *
 *   { zone: "pinned" }            the Pinned row
 *   { zone: "apps" }              the top level of All apps
 *   { zone: "group", id }         inside an open folder
 *   { zone: "rail-*", axis: "y" } a group of the side rail, which runs downwards
 *
 * A drag therefore carries where it came from, and a drop says where it is
 * going. Everything else — reordering, joining a folder, leaving one, crossing
 * the pin line — falls out of that pair, so no caller needs a special case.
 *
 * Two things can happen when a tile is let go: it lands *between* tiles and
 * the row reorders, or it lands *on* one and the two become a folder — the
 * gesture iOS and macOS use. Which one it is depends on where the pointer sits
 * inside the target: the middle folds, the edges order.
 *
 * The dragged tile has to be known during `dragover` — that is where a target
 * decides whether to light up — and `dataTransfer` is deliberately unreadable
 * until the drop, so the tile travels in a module-level slot as well.
 */
export const TILE_DRAG_MIME = "application/x-loom-launchpad-tile";

/** The share of a tile's width, at each edge, that reorders instead of folding. */
const EDGE = 0.28;

let current = null;

export const startTileDrag = (entry, from, event) => {
  if (!entry?.id || !from) return;
  current = { entry, from };

  if (!event?.dataTransfer) return;
  event.dataTransfer.effectAllowed = "move";
  try {
    event.dataTransfer.setData(TILE_DRAG_MIME, String(entry.id));
    event.dataTransfer.setData("text/plain", entry.name || String(entry.id));
  } catch {
    // A browser that refuses a custom type still has the slot.
  }
};

export const endTileDrag = () => {
  current = null;
};

/** `{ entry, from }` for the tile under the grip, or null when nothing moves. */
export const draggedTile = () => current;

export const sameContainer = (a, b) => Boolean(a) && Boolean(b) && a.zone === b.zone && (a.id || null) === (b.id || null);

/**
 * Where a tile is allowed to go at all. A folder has nowhere to be but the
 * top-level grid: inside another folder is a place people lose things, and
 * Pinned is a record in Link Loom Cloud kept per app, which a folder is not.
 */
const canLiveIn = (entry, container) => entry?.kind !== "group" || container?.zone === "apps";

/**
 * What dropping on `target` inside container `to` would do: "group" in the
 * middle, "before"/"after" at the edges, null when the drop makes no sense.
 *
 * Folding only happens in the top-level grid — a folder inside a folder is a
 * place people lose things — so everywhere else the tile splits at its middle
 * and the gesture is purely about order.
 */
export const dropIntent = (event, target, to) => {
  const source = current?.entry;
  if (!source || !target || !to) return null;
  if (source.id === target.id) return null;
  if (!canLiveIn(source, to)) return null;

  // The rail runs down the side, so its tiles split top/bottom rather than
  // left/right.
  const box = event.currentTarget.getBoundingClientRect();
  const ratio = to.axis === "y" ? (event.clientY - box.top) / box.height : (event.clientX - box.left) / box.width;
  const canFold = to.zone === "apps" && source.kind !== "group";

  if (!canFold) return ratio < 0.5 ? "before" : "after";
  if (ratio < EDGE) return "before";
  if (ratio > 1 - EDGE) return "after";
  return "group";
};

/**
 * Where the drop would land, resolved from the whole container rather than from
 * whichever tile happens to be under the pointer.
 *
 * Binding this to the tiles left the gutters between them dead: cross one and
 * the cursor vanished, and letting go there did nothing. So the container is
 * asked instead, and it always answers with the nearest tile — the pointer
 * pulls towards it whether or not it is touching. Inside a tile the old rules
 * still apply, edges to reorder and the middle to fold; outside one there is
 * no folding, only a side.
 *
 * Returns `{ targetId, intent }`, or null when the drop would change nothing.
 */
export const resolveDrop = (event, to, node) => {
  const drag = current;
  if (!drag || !to || !node) return null;

  const source = drag.entry;
  if (!canLiveIn(source, to)) return null;

  const tiles = [...node.children]
    .filter((child) => child.dataset && child.dataset.flipKey)
    .map((child) => ({ id: child.dataset.flipKey, rect: child.getBoundingClientRect() }))
    .filter((tile) => tile.rect.width > 0 && tile.rect.height > 0);

  if (!tiles.length) return sameContainer(drag.from, to) ? null : { targetId: null, intent: "append" };

  const x = event.clientX;
  const y = event.clientY;
  const within = (tile) => x >= tile.rect.left && x <= tile.rect.right && y >= tile.rect.top && y <= tile.rect.bottom;

  // Standing on the tile being dragged means "leave it where it is".
  const over = tiles.find(within);
  if (over && over.id === source.id) return null;

  if (over) {
    const box = over.rect;
    const ratio = to.axis === "y" ? (y - box.top) / box.height : (x - box.left) / box.width;
    const canFold = to.zone === "apps" && source.kind !== "group";

    if (!canFold) return { targetId: over.id, intent: ratio < 0.5 ? "before" : "after" };
    if (ratio < EDGE) return { targetId: over.id, intent: "before" };
    if (ratio > 1 - EDGE) return { targetId: over.id, intent: "after" };
    return { targetId: over.id, intent: "group" };
  }

  // In a gutter, or off the tiles entirely: snap to the closest one and take
  // the side the pointer is on.
  const candidates = tiles.filter((tile) => tile.id !== source.id);
  if (!candidates.length) return null;

  const distance = (tile) => {
    const cx = tile.rect.left + tile.rect.width / 2;
    const cy = tile.rect.top + tile.rect.height / 2;
    return (x - cx) ** 2 + (y - cy) ** 2;
  };

  const nearest = candidates.reduce((best, tile) => (distance(tile) < distance(best) ? tile : best), candidates[0]);
  const centre = to.axis === "y" ? nearest.rect.top + nearest.rect.height / 2 : nearest.rect.left + nearest.rect.width / 2;
  const along = to.axis === "y" ? y : x;

  return { targetId: nearest.id, intent: along < centre ? "before" : "after" };
};

/**
 * Whether the tile can be dropped on the open space of container `to` — which
 * is how a tile leaves a folder, or joins the pinned row, without having to
 * land on any particular neighbour. It appends.
 */
export const acceptsZoneDrop = (to) => {
  const drag = current;
  if (!drag || !to) return false;
  if (!canLiveIn(drag.entry, to)) return false;
  return !sameContainer(drag.from, to);
};
