import React, { useEffect, useState } from "react";
import { Avatar, Button, CircularProgress, IconButton, MenuItem, Select, Tooltip } from "@mui/material";
import {
  CheckOutlined as CheckIcon,
  CloseOutlined as RemoveIcon,
  ContentCopyOutlined as ContentCopyIcon,
  GroupsOutlined as TeamIcon,
  LanguageOutlined as PublicIcon,
  LinkOutlined as LinkIcon,
  LinkOffOutlined as LinkOffIcon,
  LockOutlined as LockIcon,
  PeopleAltOutlined as PeopleIcon,
  ScheduleOutlined as ScheduleIcon,
} from "@mui/icons-material";
import { PeoplePicker, openSnackbar } from "@link-loom/react-sdk";

import { THEME_COLORS, THEME_RADII, THEME_TYPE, tint } from "../defaults/storage.theme";

const TTL_OPTIONS = [
  { minutes: 15, label: "15 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 60 * 24, label: "1 day" },
  { minutes: 60 * 24 * 7, label: "7 days" },
];

const GRANT_ROLES = ["viewer", "editor"];
const ROLE_LABELS = { viewer: "Can view", editor: "Can edit", owner: "Owner" };

const grantKey = (grant) => `${grant.principal_type}:${grant.principal_id}`;

// The picker speaks { kind, id }; a grant speaks { principal_type, principal_id }.
const toGrant = (option) => ({
  principal_type: option.kind,
  principal_id: option.id,
  role: "viewer",
});

// One visual identity per access level: icon, color, and a one-line consequence. Ordered from
// closed to open, because that is the question the row asks — how far does this reach.
const ACCESS_LEVELS = {
  private: {
    Icon: LockIcon,
    color: THEME_COLORS.textSecondary,
    title: "Private",
    hint: "Nobody else. Only the people named above, and whoever owns this space.",
  },
  authenticated: {
    Icon: LinkIcon,
    color: THEME_COLORS.brandPrimary,
    title: "Link with expiration",
    hint: "Anyone with the link, until it expires. No sign-in.",
  },
  public: {
    Icon: PublicIcon,
    color: THEME_COLORS.success,
    title: "Public",
    hint: "Anyone with the link. No sign-in.",
  },
};

const SectionLabel = ({ children }) => (
  <h6
    style={{
      color: THEME_COLORS.textSecondary,
      marginBottom: "0.5rem",
      fontSize: THEME_TYPE.fontSize11,
      fontWeight: THEME_TYPE.weightStrong,
    }}
  >
    {children}
  </h6>
);

/**
 * Drive-style share sheet over two independent axes, which is why nothing here has to negotiate
 * with anything else:
 *
 * - "General access" answers what happens for EVERYONE ELSE — Private, Link with expiration or
 *   Public — and comes first, because it is the bigger question.
 * - "People with access" answers who has it BY NAME, is always present, and is always meaningful.
 *   A private file shared with one person is the ordinary case, not a contradiction.
 *
 * Changing general access never touches the grants and removing a grant never changes general
 * access, so there is no transition to warn about and no state that can spring back to life. On a
 * public file a named grant conveys nothing extra — the list says so in a quiet line rather than
 * being stripped, so the grant is still there if the owner goes back to Private.
 *
 * "Links" follows, holding however many links have been minted, each with its own expiry.
 *
 * Two revocations live here and they are not the same thing. Removing a person kills only the
 * links that person minted (those carry the grant) and takes effect on their next request.
 * "Revoke all links" bumps the object's token version and kills every outstanding link, for
 * everybody, at once.
 *
 * `directory` is the StoneOS directory client (`sdk.directory`); without it the people section
 * stays out of the way instead of rendering a picker that can never load anybody.
 * `viewerIdentity` is the signed-in Veripass identity: only the owner may change the ACL, so
 * everybody else sees the list read-only.
 */
function StorageShareDialog({ service, item, directory, viewerIdentity, onUpdated, onClose }) {
  const [visibility, setVisibility] = useState(item?.access?.visibility || "private");
  const [grants, setGrants] = useState(item?.access?.grants || []);
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [mintedLinks, setMintedLinks] = useState([]);
  const [principalLabels, setPrincipalLabels] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    setVisibility(item?.access?.visibility || "private");
    setGrants(item?.access?.grants || []);
    setMintedLinks([]);
  }, [item?.id]);

  // Grants already on the file name principals the picker may never list. Their labels are
  // resolved here so the dialog shows names instead of raw identities.
  useEffect(() => {
    if (!directory || !item?.id) {
      return undefined;
    }

    let active = true;
    const remember = (entries) =>
      active &&
      setPrincipalLabels((previous) => ({
        ...previous,
        ...Object.fromEntries(entries.filter(Boolean).map((entry) => [entry.key, entry])),
      }));

    directory
      .listTeams()
      .then((result) =>
        remember(
          (result?.items || []).map((team) => ({ key: `team:${team.id}`, label: team.name, secondary: team.description || "" })),
        ),
      )
      .catch(() => null);

    // Resolved from the re-read list, not from the item the browser handed over.
    Promise.all(
      grants
        .filter((grant) => grant.principal_type === "user")
        .map((grant) =>
          directory
            .getUser(grant.principal_id)
            .then((person) =>
              person
                ? {
                    key: `user:${grant.principal_id}`,
                    label: person.display_name || person.username || person.email || grant.principal_id,
                    secondary: person.email || "",
                    avatarUrl: person.avatar_url || "",
                  }
                : null,
            )
            .catch(() => null),
        ),
    ).then(remember);

    return () => {
      active = false;
    };
  }, [directory, item?.id, grants.length]);

  const level = ACCESS_LEVELS[visibility] || ACCESS_LEVELS.private;
  const publicUrl = service.fileUrl(item?.id, { filename: item?.name });
  // The file the browser hands over is the one the caller can see; a file they do not own is one
  // somebody shared with them, and they may look at the list but not change it.
  const isOwner = !viewerIdentity || !item?.owner_veripass_identity || item.owner_veripass_identity === viewerIdentity;
  const grantedKeys = grants.map(grantKey);
  const labelFor = (grant) => principalLabels[grantKey(grant)]?.label || grant.principal_id;

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 1600);
  };

  // General access is its own axis: this writes visibility and nothing else.
  const changeVisibility = async (nextVisibility) => {
    if (nextVisibility === visibility) {
      return;
    }

    const previous = visibility;
    setVisibility(nextVisibility);
    setIsSaving(true);

    // `grants` is deliberately absent from the payload: the backend preserves the stored list
    // through a PATCH, and echoing this dialog's copy would be refused whenever it is stale —
    // the item comes from a listing that can predate the last share. The ACL moves only through
    // share/unshare, which is also what keeps the two axes from writing over each other.
    const { grants: _storedGrants, ...accessWithoutGrants } = item.access || {};
    const response = await service.update({
      id: item.id,
      access: { ...accessWithoutGrants, visibility: nextVisibility },
    });
    setIsSaving(false);

    if (!response?.success) {
      setVisibility(previous);
      openSnackbar(response?.message || "The change could not be saved.", "error");
      return;
    }

    setMintedLinks([]);
    onUpdated?.(response.result);
  };

  // Every grant change is a full replacement, which is also what the API takes: the list the
  // dialog shows is exactly what gets saved, so two half-applied edits are not representable.
  const saveGrants = async (nextGrants, failureMessage) => {
    const previous = grants;
    setGrants(nextGrants);
    setIsSaving(true);

    const response = await service.share({ id: item.id, grants: nextGrants });
    setIsSaving(false);

    if (!response?.success) {
      setGrants(previous);
      openSnackbar(response?.message || failureMessage, "error");
      return;
    }

    setVisibility(response.result?.access?.visibility || visibility);
    onUpdated?.(response.result);
  };

  const addGrant = (option) => {
    const grant = toGrant(option);

    if (grantedKeys.includes(grantKey(grant))) {
      return;
    }

    setPrincipalLabels((previous) => ({
      ...previous,
      [grantKey(grant)]: { key: grantKey(grant), label: option.label, secondary: option.secondary, avatarUrl: option.avatarUrl },
    }));
    saveGrants([...grants, grant], "That person could not be added.");
  };

  const setGrantRole = (grant, role) =>
    saveGrants(
      grants.map((current) => (grantKey(current) === grantKey(grant) ? { ...current, role } : current)),
      "The role could not be changed.",
    );

  const removeGrant = async (grant) => {
    const previous = grants;
    setGrants(grants.filter((current) => grantKey(current) !== grantKey(grant)));
    setIsSaving(true);

    const response = await service.unshare({ id: item.id, principal_id: grant.principal_id });
    setIsSaving(false);

    if (!response?.success) {
      setGrants(previous);
      openSnackbar(response?.message || "That person could not be removed.", "error");
      return;
    }

    setVisibility(response.result?.access?.visibility || visibility);
    openSnackbar(`${labelFor(grant)} lost access, and any link they made stopped working.`, "success");
    onUpdated?.(response.result);
  };

  const mint = async () => {
    setIsMinting(true);
    const response = await service.shareToken({ id: item.id, ttl_minutes: ttlMinutes });
    setIsMinting(false);

    if (!response?.success) {
      openSnackbar(response?.message || "The link could not be created.", "error");
      return;
    }

    setMintedLinks((previous) => [
      {
        key: `${Date.now()}`,
        url: service.fileUrl(item.id, { filename: item.name, token: response.result.token }),
        expiresAt: response.result.expires_at,
        ttlLabel: TTL_OPTIONS.find((option) => option.minutes === ttlMinutes)?.label || `${ttlMinutes} min`,
      },
      ...previous,
    ]);
  };

  const revoke = async () => {
    setIsSaving(true);
    const response = await service.revokeLinks({ id: item.id });
    setIsSaving(false);

    if (!response?.success) {
      openSnackbar(response?.message || "The links could not be revoked.", "error");
      return;
    }

    setMintedLinks([]);
    openSnackbar("Every previous link is now dead.", "success");
  };

  const renderLinkRow = ({ key, url, caption, color }) => (
    <div
      key={key}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        paddingLeft: "0.5rem",
        paddingRight: "0.5rem",
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
        border: `1px solid ${THEME_COLORS.surfaceTrack}`,
        borderRadius: THEME_RADII.md,
        background: THEME_COLORS.surfaceCard,
      }}
    >
      <LinkIcon sx={{ fontSize: 16, color, flexShrink: 0 }} />
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <p
          style={{
            margin: "0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: THEME_TYPE.fontMono,
            fontSize: THEME_TYPE.fontSize11,
            color: THEME_COLORS.textBody,
          }}
        >
          {url}
        </p>
        {caption && (
          <p
            style={{
              margin: "0",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: 11,
              color: THEME_COLORS.textMuted,
            }}
          >
            <ScheduleIcon sx={{ fontSize: 12 }} />
            {caption}
          </p>
        )}
      </div>
      <Tooltip title={copiedKey === key ? "Copied!" : "Copy link"}>
        <Button
          size="small"
          onClick={() => copyText(url, key)}
          sx={{ minWidth: 0, textTransform: "none", color: copiedKey === key ? THEME_COLORS.success : THEME_COLORS.brandPrimary }}
        >
          {copiedKey === key ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
        </Button>
      </Tooltip>
    </div>
  );

  return (
    <section style={{ padding: "1rem", width: "min(560px, 92vw)", fontFamily: "var(--stos-font-ui, inherit)", color: THEME_COLORS.textBody }}>
      <h5
        style={{
          fontWeight: THEME_TYPE.weightStrong,
          marginBottom: "1rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: THEME_TYPE.fontSize16,
          color: THEME_COLORS.textStrong,
          paddingRight: 36,
        }}
      >
        Share "{item?.name}"
      </h5>

      {/* General access — the row IS the control */}
      <SectionLabel>General access</SectionLabel>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem",
          marginBottom: "1rem",
          border: `1px solid ${THEME_COLORS.borderMuted}`,
          borderRadius: THEME_RADII.md,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: tint(level.color, 10),
          }}
        >
          <level.Icon sx={{ fontSize: 19, color: level.color }} />
        </span>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <Select
            variant="standard"
            disableUnderline
            value={visibility}
            disabled={isSaving || !isOwner}
            onChange={(event) => changeVisibility(event.target.value)}
            sx={{ fontSize: THEME_TYPE.fontSize13, fontWeight: 600, color: THEME_COLORS.textStrong, "& .MuiSelect-select": { py: 0 } }}
          >
            {Object.entries(ACCESS_LEVELS).map(([value, entry]) => (
              <MenuItem key={value} value={value} sx={{ fontSize: 13 }}>
                {entry.title}
              </MenuItem>
            ))}
          </Select>
          <p style={{ margin: "0", fontSize: THEME_TYPE.fontSize11, color: THEME_COLORS.textSecondary }}>{level.hint}</p>
        </div>
        {isSaving && <CircularProgress size={16} sx={{ mr: 1 }} />}
      </div>

      {/* Who has access by name. Its own axis, so it is always here — a private file shared with
          one person is the ordinary case, not a special mode. */}
      <SectionLabel>People with access</SectionLabel>
      {!isOwner && (
        <p style={{ margin: "0 0 0.5rem", fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary }}>
          Someone shared this file with you. Only its owner can change who else can see it.
        </p>
      )}
      {isOwner && directory && (
        <PeoplePicker
          directory={directory}
          includeTeams
          disabled={isSaving}
          // The owner already has the file; offering to grant it to themselves is noise that
          // writes a grant conveying nothing.
          excludeKeys={[
            ...grants.map((grant) => `${grant.principal_type}:${grant.principal_id}`),
            ...(viewerIdentity ? [`user:${viewerIdentity}`] : []),
            ...(item?.owner_veripass_identity ? [`user:${item.owner_veripass_identity}`] : []),
          ]}
          labels={{ searchPlaceholder: "Add people or teams" }}
          onSelect={addGrant}
          sx={{ mb: grants.length ? "0.5rem" : "1rem" }}
        />
      )}
      {grants.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
          {grants.map((grant) => (
            <div key={grantKey(grant)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
              {grant.principal_type === "team" ? (
                <Avatar sx={{ width: 28, height: 28, bgcolor: THEME_COLORS.surfaceTrack, color: THEME_COLORS.textSecondary }}>
                  <TeamIcon sx={{ fontSize: 15 }} />
                </Avatar>
              ) : (
                <Avatar src={principalLabels[grantKey(grant)]?.avatarUrl || undefined} sx={{ width: 28, height: 28, fontSize: 12 }}>
                  {String(labelFor(grant)).charAt(0).toUpperCase()}
                </Avatar>
              )}
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: THEME_TYPE.fontSize13,
                    color: THEME_COLORS.textStrong,
                  }}
                >
                  {labelFor(grant)}
                </p>
                {principalLabels[grantKey(grant)]?.secondary && (
                  <p
                    style={{
                      margin: "0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: THEME_TYPE.fontSize11,
                      color: THEME_COLORS.textMuted,
                    }}
                  >
                    {principalLabels[grantKey(grant)].secondary}
                  </p>
                )}
              </div>
              {isOwner ? (
                <>
                  <Select
                    variant="standard"
                    disableUnderline
                    value={GRANT_ROLES.includes(grant.role) ? grant.role : "viewer"}
                    disabled={isSaving}
                    onChange={(event) => setGrantRole(grant, event.target.value)}
                    sx={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary, "& .MuiSelect-select": { py: 0 } }}
                  >
                    {GRANT_ROLES.map((role) => (
                      <MenuItem key={role} value={role} sx={{ fontSize: 13 }}>
                        {ROLE_LABELS[role]}
                      </MenuItem>
                    ))}
                  </Select>
                  <Tooltip title="Remove">
                    <span>
                      <IconButton size="small" disabled={isSaving} aria-label="Remove" onClick={() => removeGrant(grant)}>
                        <RemoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              ) : (
                <span style={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary }}>
                  {ROLE_LABELS[grant.role] || grant.role}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: "0 0 1rem", fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary }}>
          {isOwner && directory
            ? "Nobody yet. Add a person or a team above and they will find this file under Shared with me."
            : "Nobody has been added to this file yet."}
        </p>
      )}

      {/* A named grant on a public file conveys nothing extra. Say so rather than removing it:
          the grant is what the file falls back to if general access goes back to Private. */}
      {visibility === "public" && grants.length > 0 && (
        <p style={{ margin: "-0.5rem 0 1rem", fontSize: THEME_TYPE.fontSize11, color: THEME_COLORS.textMuted }}>
          This file is public, so anyone with the link can already open it. These people keep
          their access if you set General access back to Private.
        </p>
      )}

      {/* Links */}
      <SectionLabel>Links</SectionLabel>
      {visibility === "public" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {renderLinkRow({
            key: "stable",
            url: publicUrl,
            caption: "Stable — works until access changes",
            color: THEME_COLORS.success,
          })}
        </div>
      )}

      {visibility === "authenticated" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Select
              size="small"
              value={ttlMinutes}
              onChange={(event) => setTtlMinutes(Number(event.target.value))}
              sx={{ fontSize: THEME_TYPE.fontSize12, minWidth: 130, height: 32 }}
            >
              {TTL_OPTIONS.map((option) => (
                <MenuItem key={option.minutes} value={option.minutes} sx={{ fontSize: THEME_TYPE.fontSize12 }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <Button
              variant="contained"
              size="small"
              disabled={isMinting}
              onClick={mint}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: THEME_TYPE.fontSize12,
                height: 32,
                boxShadow: "none",
                backgroundColor: THEME_COLORS.brandPrimary,
                "&:hover": { backgroundColor: THEME_COLORS.brandPrimaryDark },
              }}
            >
              {isMinting ? <CircularProgress size={14} sx={{ color: THEME_COLORS.textInverse }} /> : <LinkIcon sx={{ fontSize: 15, mr: 0.5 }} />}
              Create link
            </Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 190, overflowY: "auto" }}>
            {mintedLinks.length ? (
              mintedLinks.map((link) =>
                renderLinkRow({
                  key: link.key,
                  url: link.url,
                  caption: `${link.ttlLabel} — expires ${new Date(link.expiresAt).toLocaleString()}`,
                  color: THEME_COLORS.brandPrimary,
                }),
              )
            ) : (
              <p style={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary, margin: "0" }}>No links yet — pick a duration and create one.</p>
            )}
          </div>
        </>
      )}

      {visibility === "private" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem",
            border: `1px dashed ${THEME_COLORS.borderDashed}`,
            borderRadius: THEME_RADII.md,
            background: THEME_COLORS.surfaceCard,
          }}
        >
          <LockIcon sx={{ fontSize: 16, color: THEME_COLORS.textMuted }} />
          <p style={{ margin: "0", fontSize: 12, color: THEME_COLORS.textSecondary }}>
            No shareable links at this level. The people named above open it from Shared with me
            without one; switch to Public or Link with expiration to hand out a URL as well.
          </p>
        </div>
      )}

      <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
        <Tooltip title="Cuts off every link handed out so far, for everybody, at once. To cut off one person, remove them above.">
          <span>
            <Button
              onClick={revoke}
              disabled={isSaving || !isOwner || visibility === "public"}
              size="small"
              sx={{ textTransform: "none", fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.errorDark }}
            >
              <LinkOffIcon sx={{ fontSize: 15, mr: 0.5 }} />
              Revoke all links
            </Button>
          </span>
        </Tooltip>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: THEME_TYPE.fontSize13,
            height: 30,
            boxShadow: "none",
            backgroundColor: THEME_COLORS.brandPrimary,
            "&:hover": { backgroundColor: THEME_COLORS.brandPrimaryDark },
          }}
        >
          Done
        </Button>
      </footer>
    </section>
  );
}

export default StorageShareDialog;
