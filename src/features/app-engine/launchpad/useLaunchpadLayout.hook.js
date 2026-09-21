import { useCallback, useEffect, useMemo, useState } from "react";

import { useLaunchpadConfig } from "./LaunchpadConfig.context";

/**
 * How the launchpad is arranged: the order of the tiles in each row and the
 * folders someone made by dropping one app onto another, the way iOS and
 * macOS do it.
 *
 * There is one primitive — a tile — and one operation on it, `move`, which
 * takes the container it came from and the container it is going to. Pinned,
 * the top-level grid and the inside of a folder are all containers, so
 * reordering, foldering, unfoldering and crossing the pin line are the same
 * code path rather than four.
 *
 * This is a local arrangement. Link Loom Cloud records whether an app is
 * pinned, not where its icon sits or what folder it was dragged into, so the
 * layout lives in this browser beside the recents — and a machine that has
 * never seen it simply shows the plain grid. Crossing the pin line is the one
 * part that *is* a record, and that write belongs to the caller.
 *
 * `order` and `pinnedOrder` hold ids (apps and folders alike, since a folder
 * takes a tile's place); anything not named in them is appended, so an app
 * installed later shows up at the end instead of disappearing.
 *
 * The key is `<storageNamespace>::launchpad::layout` — see `LaunchpadProvider`.
 */
const layoutKeyFor = (namespace) => `${namespace}::launchpad::layout`;

const EMPTY = { order: [], pinnedOrder: [], platformOrder: [], groups: [] };

const read = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return EMPTY;
    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],
      pinnedOrder: Array.isArray(parsed.pinnedOrder) ? parsed.pinnedOrder : [],
      platformOrder: Array.isArray(parsed.platformOrder) ? parsed.platformOrder : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
    };
  } catch {
    return EMPTY;
  }
};

const write = (key, layout) => {
  try {
    localStorage.setItem(key, JSON.stringify(layout));
  } catch {
    // A private window can refuse storage; the grid falls back to plain order.
  }
};

const newGroupId = () => `group:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The saved order first, then whatever the backend returned that it has never seen. */
const arrange = (ids = [], entries = [], resolve) => {
  const placed = [];
  const seen = new Set();

  (ids || []).forEach((id) => {
    if (seen.has(id)) return;
    const item = resolve(id);
    if (!item) return;
    placed.push(item);
    seen.add(id);
  });
  (entries || []).forEach((entry) => {
    if (seen.has(entry.id)) return;
    const item = resolve(entry.id);
    if (!item) return;
    placed.push(item);
    seen.add(entry.id);
  });

  return placed;
};

export default function useLaunchpadLayout({ apps = [], pinned = [], platforms = [] } = {}) {
  const { storageNamespace } = useLaunchpadConfig();
  const layoutKey = layoutKeyFor(storageNamespace);
  const [layout, setLayout] = useState(() => read(layoutKey));

  /**
   * Merges over what is stored instead of replacing it.
   *
   * Callers used to hand over a complete object, so the day a new list was
   * added every one of them silently dropped it — the arrangement came back
   * from a drag missing a key, and the next render read `undefined`. A patch
   * cannot do that.
   */
  const save = useCallback((patch) => {
    setLayout((previous) => {
      const next = { ...previous, ...patch };
      write(layoutKey, next);
      return next;
    });
  }, [layoutKey]);

  const byId = useMemo(() => new Map([...apps, ...pinned].map((entry) => [entry.id, entry])), [apps, pinned]);

  /**
   * Folders as they should be drawn. One that cannot field two apps any more —
   * because they were uninstalled, or pinned away — is not a folder, and its
   * survivors go back to the grid on their own.
   */
  const groupsById = useMemo(() => {
    const map = new Map();
    layout.groups.forEach((group) => {
      const members = group.members.map((id) => byId.get(id)).filter((entry) => entry && !entry.is_pinned);
      if (members.length > 1) map.set(group.id, { ...group, kind: "group", members });
    });
    return map;
  }, [layout.groups, byId]);

  // An app inside a folder that is actually drawn is not also loose in the grid.
  const loose = useMemo(() => {
    const held = new Set([...groupsById.values()].flatMap((group) => group.members.map((member) => member.id)));
    return apps.filter((app) => !held.has(app.id));
  }, [apps, groupsById]);

  const items = useMemo(() => {
    const looseById = new Map(loose.map((entry) => [entry.id, entry]));
    return arrange([...layout.order, ...groupsById.keys()], loose, (id) => groupsById.get(id) || looseById.get(id) || null);
  }, [layout.order, groupsById, loose]);

  const pinnedItems = useMemo(() => arrange(layout.pinnedOrder, pinned, (id) => byId.get(id) || null).filter((entry) => entry.is_pinned), [layout.pinnedOrder, pinned, byId]);

  const platformById = useMemo(() => new Map(platforms.map((entry) => [entry.id, entry])), [platforms]);
  const platformItems = useMemo(
    () => arrange(layout.platformOrder, platforms, (id) => platformById.get(id) || null),
    [layout.platformOrder, platforms, platformById],
  );

  /**
   * Reorders one list and nothing else.
   *
   * `move` rebuilds every list from what the caller can see, which is right on
   * the launchpad page and wrong anywhere that only renders part of the
   * arrangement — the rail knows its platforms and pinned apps, not the grid,
   * and would save an empty order over it. This writes a single key.
   */
  const reorderList = useCallback(
    (key, sourceId, targetId, side = "before") => {
      if (!sourceId || sourceId === targetId) return;

      const visible = (key === "platformOrder" ? platformItems : pinnedItems).map((item) => item.id);
      const next = visible.filter((id) => id !== sourceId);
      const index = targetId ? next.indexOf(targetId) : -1;

      if (index === -1) next.push(sourceId);
      else next.splice(side === "after" ? index + 1 : index, 0, sourceId);

      save({ ...layout, [key]: next });
    },
    [platformItems, pinnedItems, layout, save],
  );

  /** The ids of a container, in the order they are on screen right now. */
  const idsOf = useCallback(
    (container) => {
      if (!container) return [];
      if (container.zone === "pinned") return pinnedItems.map((item) => item.id);
      if (container.zone === "group") return groupsById.get(container.id)?.members.map((member) => member.id) || [];
      return items.map((item) => item.id);
    },
    [items, pinnedItems, groupsById],
  );

  /**
   * Takes one tile out of `from` and puts it into `to`, beside `targetId` when
   * there is one and at the end when there is not. Every gesture in the
   * launchpad that is not "make a folder" is this.
   *
   * Pinning is *not* done here: crossing the pin line is a record in Link Loom
   * Cloud, and this hook only knows about this browser.
   */
  const move = useCallback(
    ({ sourceId, from, to, targetId = null, side = "before" }) => {
      if (!sourceId || !from || !to || sourceId === targetId) return;

      let order = idsOf({ zone: "apps" });
      let pinnedOrder = idsOf({ zone: "pinned" });
      let groups = layout.groups.map((group) => ({ ...group, members: [...group.members] }));

      const lift = (list) => list.filter((id) => id !== sourceId);

      if (from.zone === "group") {
        groups = groups.map((group) => (group.id === from.id ? { ...group, members: lift(group.members) } : group));
      } else if (from.zone === "pinned") {
        pinnedOrder = lift(pinnedOrder);
      } else {
        order = lift(order);
      }

      const insert = (list) => {
        const next = lift(list);
        const index = targetId ? next.indexOf(targetId) : -1;
        if (index === -1) return [...next, sourceId];
        next.splice(side === "after" ? index + 1 : index, 0, sourceId);
        return next;
      };

      if (to.zone === "group") {
        groups = groups.map((group) => (group.id === to.id ? { ...group, members: insert(group.members) } : group));
      } else if (to.zone === "pinned") {
        pinnedOrder = insert(pinnedOrder);
      } else {
        order = insert(order);
      }

      // A folder left with one app is not a folder: it goes, and its survivor
      // takes its place in the grid.
      groups.forEach((group) => {
        if (group.members.length > 1) return;
        const at = order.indexOf(group.id);
        const survivors = group.members;
        order = at === -1 ? [...order, ...survivors] : [...order.slice(0, at), ...survivors, ...order.slice(at + 1)];
      });
      groups = groups.filter((group) => group.members.length > 1);

      save({ order: order.filter((id) => !groups.some((group) => group.members.includes(id))), pinnedOrder, groups });
    },
    [idsOf, layout.groups, save],
  );

  /**
   * Folds one tile onto another: onto a folder it joins it, onto an app the
   * two become a new folder that takes the target's place. The id comes back
   * so the caller can open it and put the cursor in its name.
   */
  const combine = useCallback(
    (sourceId, targetId, defaultName, from = { zone: "apps" }) => {
      if (!sourceId || !targetId || sourceId === targetId) return null;

      const source = byId.get(sourceId) || groupsById.get(sourceId);
      if (!source || source.kind === "group") return null;

      let order = idsOf({ zone: "apps" });
      let pinnedOrder = idsOf({ zone: "pinned" });
      let groups = layout.groups.map((group) => ({ ...group, members: [...group.members] }));

      const lift = (list) => list.filter((id) => id !== sourceId);
      if (from.zone === "group") groups = groups.map((group) => (group.id === from.id ? { ...group, members: lift(group.members) } : group));
      else if (from.zone === "pinned") pinnedOrder = lift(pinnedOrder);
      order = lift(order);

      const targetGroup = groups.find((group) => group.id === targetId);
      if (targetGroup) {
        targetGroup.members = [...targetGroup.members, sourceId];
        save({ order, pinnedOrder, groups: groups.filter((group) => group.members.length > 1) });
        return targetId;
      }

      if (!order.includes(targetId)) return null;

      const id = newGroupId();
      groups = [...groups, { id, name: defaultName, members: [targetId, sourceId] }];
      save({ order: order.map((entry) => (entry === targetId ? id : entry)), pinnedOrder, groups });
      return id;
    },
    [byId, groupsById, idsOf, layout.groups, save],
  );

  const renameGroup = useCallback(
    (groupId, name) => {
      const clean = String(name || "").trim();
      if (!clean) return;
      save({ ...layout, groups: layout.groups.map((group) => (group.id === groupId ? { ...group, name: clean } : group)) });
    },
    [layout, save],
  );

  /** The menu's way of doing what dragging a tile out of a folder does. */
  const removeFromGroup = useCallback(
    (groupId, entryId) => move({ sourceId: entryId, from: { zone: "group", id: groupId }, to: { zone: "apps" } }),
    [move],
  );

  // Another tab arranging the same launchpad should not be overwritten blindly.
  useEffect(() => {
    const sync = (event) => {
      if (event.key === layoutKey) setLayout(read(layoutKey));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [layoutKey]);

  return { items, pinnedItems, platformItems, move, reorderList, combine, renameGroup, removeFromGroup };
}
