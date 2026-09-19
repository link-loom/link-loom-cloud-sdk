import React, { useEffect, useState } from "react";
import { Box, Button, Chip, CircularProgress, Divider, IconButton, MenuItem, Select, Switch, Tooltip } from "@mui/material";
import {
  AudioFileOutlined as AudioFileIcon,
  ContentCopyOutlined as ContentCopyIcon,
  DeleteOutlined as DeleteIcon,
  DownloadOutlined as DownloadIcon,
  DriveFileMoveOutlined as DriveFileMoveIcon,
  DriveFileRenameOutlineOutlined as RenameIcon,
  ImageOutlined as ImageIcon,
  InfoOutlined as InfoIcon,
  InsertDriveFileOutlined as InsertDriveFileIcon,
  IosShareOutlined as IosShareIcon,
  LanguageOutlined as PublicIcon,
  LinkOutlined as LinkIcon,
  LockOutlined as LockIcon,
  MovieOutlined as MovieIcon,
  PictureAsPdfOutlined as PictureAsPdfIcon,
} from "@mui/icons-material";
import { openSnackbar } from "@link-loom/react-sdk";

import { formatFileSize, mimeFamily, triggerFileDownload } from "../shared/storage.helpers";
import { THEME_COLORS, THEME_RADII, THEME_TYPE, tint } from "../defaults/storage.theme";
import { STORAGE_HELP } from "../defaults/storage.help";

const FAMILY_ICONS = {
  image: ImageIcon,
  video: MovieIcon,
  audio: AudioFileIcon,
  pdf: PictureAsPdfIcon,
  file: InsertDriveFileIcon,
};

const VISIBILITY_META = {
  public: { label: "Public", Icon: PublicIcon, color: THEME_COLORS.success },
  authenticated: { label: "Link with expiration", Icon: LinkIcon, color: THEME_COLORS.brandPrimary },
  private: { label: "Private", Icon: LockIcon, color: THEME_COLORS.textSecondary },
};

const formatDate = (value) => {
  if (!value) return "--";
  const stamp = !Number.isNaN(Number(value)) ? Number(value) : new Date(value).getTime();
  if (Number.isNaN(stamp)) return "--";
  return new Date(stamp).toLocaleString();
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

const DetailRow = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: "0.5rem",
      paddingTop: "0.25rem",
      paddingBottom: "0.25rem",
    }}
  >
    <span style={{ fontSize: 12, color: THEME_COLORS.textSecondary, flexShrink: 0 }}>{label}</span>
    <span
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontWeight: 500,
        fontSize: THEME_TYPE.fontSize12,
        color: THEME_COLORS.textStrong,
      }}
    >
      {value}
    </span>
  </div>
);

/**
 * The file inspector, content-first: the media owns the modal and the metadata lives in a
 * collapsible Info aside (closed by default), Drive-style. Non-public media mints a
 * short-lived token to render — the preview itself exercises the link flow. Delete opens the
 * shared trash-or-forever dialog; it never destroys anything by itself.
 */
function StorageObjectPreview({ service, item, initialInfoOpen = false, onRename, onMove, onDelete, onShare, onUpdated }) {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(initialInfoOpen);
  const [access, setAccess] = useState(item?.access || {});

  const family = mimeFamily(item?.mime_type);
  const visibility = access?.visibility || "private";
  const visibilityMeta = VISIBILITY_META[visibility] || VISIBILITY_META.private;
  const FamilyIcon = FAMILY_ICONS[family] || InsertDriveFileIcon;

  const resolveMediaUrl = async () => {
    setIsMediaLoading(true);

    if (family === "file") {
      setMediaUrl(null);
      setIsMediaLoading(false);
      return;
    }

    if (visibility === "public") {
      setMediaUrl(service.fileUrl(item.id, { filename: item.name }));
      setIsMediaLoading(false);
      return;
    }

    const response = await service.shareToken({ id: item.id, ttl_minutes: 15 });

    setMediaUrl(
      response?.success && response.result?.token
        ? service.fileUrl(item.id, { filename: item.name, token: response.result.token })
        : null,
    );
    setIsMediaLoading(false);
  };

  useEffect(() => {
    setAccess(item?.access || {});
    resolveMediaUrl();
  }, [item?.id, item?.access?.visibility, item?.access?.token_version]);

  const saveAccess = async (patch) => {
    const nextAccess = { ...access, ...patch };
    setIsSaving(true);

    const response = await service.update({ id: item.id, access: nextAccess });
    setIsSaving(false);

    if (!response?.success) {
      openSnackbar(response?.message || "The change could not be saved.", "error");
      return;
    }

    setAccess(response.result?.access || nextAccess);
    onUpdated?.(response.result);
  };

  const copyLink = () => {
    if (visibility !== "public") {
      onShare?.();
      return;
    }
    navigator.clipboard.writeText(service.fileUrl(item.id, { filename: item.name }));
    openSnackbar("Link copied!", "success");
  };

  const download = async () => {
    let url = visibility === "public" ? service.fileUrl(item.id, { filename: item.name }) : mediaUrl;

    // Non-media files never resolve a preview URL — mint a token just for the download.
    if (!url) {
      const response = await service.shareToken({ id: item.id, ttl_minutes: 15 });

      if (!response?.success || !response.result?.token) {
        openSnackbar(response?.message || "The download link could not be created.", "error");
        return;
      }

      url = service.fileUrl(item.id, { filename: item.name, token: response.result.token });
    }

    triggerFileDownload(url, item.name);
  };

  const renderMedia = () => {
    if (family === "file") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            paddingTop: "3rem",
            paddingBottom: "3rem",
          }}
        >
          <InsertDriveFileIcon sx={{ fontSize: 64, color: THEME_COLORS.textMuted }} />
          <p style={{ fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textSecondary, marginTop: "0.5rem", marginBottom: "0" }}>
            No inline preview for this type — download to open it.
          </p>
        </div>
      );
    }

    if (isMediaLoading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            paddingTop: "3rem",
            paddingBottom: "3rem",
          }}
        >
          <CircularProgress size={24} />
        </div>
      );
    }

    if (!mediaUrl) {
      return (
        <p
          style={{
            fontSize: THEME_TYPE.fontSize12,
            color: THEME_COLORS.textSecondary,
            textAlign: "center",
            paddingTop: "3rem",
            paddingBottom: "3rem",
            margin: "0",
          }}
        >
          The preview link could not be created.
        </p>
      );
    }

    if (family === "image") {
      return <img src={mediaUrl} alt={item.name} style={{ maxWidth: "100%", maxHeight: "58vh", objectFit: "contain" }} />;
    }
    if (family === "video") {
      return <video src={mediaUrl} controls style={{ maxWidth: "100%", maxHeight: "58vh" }} />;
    }
    if (family === "audio") {
      return (
        <audio
          src={mediaUrl}
          controls
          style={{ width: "100%", marginTop: "1.5rem", marginBottom: "1.5rem", paddingLeft: "1rem", paddingRight: "1rem" }}
        />
      );
    }
    return <iframe src={mediaUrl} title={item.name} style={{ width: "100%", border: 0, height: "58vh" }} />;
  };

  const actionButtonSx = { textTransform: "none", fontSize: THEME_TYPE.fontSize12, color: THEME_COLORS.textBody, minWidth: 0 };

  return (
    <section style={{ padding: "1rem", width: "min(860px, 94vw)" }}>
      {/* Header — right padding clears the PopUp's close button */}
      <header
        style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", minWidth: 0, paddingRight: 36 }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: 34,
            height: 34,
            borderRadius: THEME_RADII.md,
            background: tint(THEME_COLORS.brandPrimary, 8),
          }}
        >
          <FamilyIcon sx={{ fontSize: 18, color: THEME_COLORS.brandPrimary }} />
        </span>
        <h5
          style={{
            fontWeight: THEME_TYPE.weightStrong,
            margin: "0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flexGrow: 1,
            fontSize: THEME_TYPE.fontSize16,
            color: THEME_COLORS.textStrong,
          }}
        >
          {item?.name}
        </h5>
        <Chip
          icon={<visibilityMeta.Icon sx={{ fontSize: 13 }} />}
          label={visibilityMeta.label}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
            bgcolor: tint(visibilityMeta.color, 10),
            color: visibilityMeta.color,
            "& .MuiChip-icon": { color: visibilityMeta.color },
          }}
        />
        <Tooltip title={isInfoOpen ? "Hide details" : "Details & sharing"}>
          <IconButton
            size="small"
            onClick={() => setIsInfoOpen((previous) => !previous)}
            sx={{
              flexShrink: 0,
              color: isInfoOpen ? THEME_COLORS.brandPrimary : THEME_COLORS.textSecondary,
              background: isInfoOpen ? tint(THEME_COLORS.brandPrimary, 8) : "transparent",
            }}
          >
            <InfoIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </header>

      {/* Content-first body: media owns the space, the Info aside slides in on demand */}
      <Box sx={{ display: "flex", gap: "1rem", mb: "1rem", flexDirection: { xs: "column", md: "row" } }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
            background: THEME_COLORS.surfaceCard,
            border: `1px solid ${THEME_COLORS.borderMuted}`,
            borderRadius: THEME_RADII.md,
            overflow: "hidden",
            minHeight: 260,
            minWidth: 0,
          }}
        >
          {renderMedia()}
        </div>

        {isInfoOpen && (
          <aside style={{ flexShrink: 0, width: "min(270px, 100%)" }}>
            <div
              style={{
                padding: "1rem",
                marginBottom: "0.5rem",
                border: `1px solid ${THEME_COLORS.borderMuted}`,
                borderRadius: THEME_RADII.md,
              }}
            >
              <SectionLabel>Details</SectionLabel>
              <DetailRow label="Size" value={formatFileSize(item?.size_bytes)} />
              <DetailRow label="Type" value={item?.mime_type || "--"} />
              <DetailRow label="Uploaded" value={formatDate(item?.created?.timestamp)} />
              <DetailRow label="Modified" value={formatDate(item?.modified?.timestamp)} />
            </div>

            <div style={{ padding: "1rem", border: `1px solid ${THEME_COLORS.borderMuted}`, borderRadius: THEME_RADII.md }}>
              <SectionLabel>Sharing</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Select
                  size="small"
                  value={visibility}
                  disabled={isSaving}
                  onChange={(event) => saveAccess({ visibility: event.target.value })}
                  sx={{ fontSize: THEME_TYPE.fontSize12, height: 32, flexGrow: 1 }}
                >
                  {Object.entries(VISIBILITY_META).map(([value, meta]) => (
                    <MenuItem key={value} value={value} sx={{ fontSize: THEME_TYPE.fontSize12 }}>
                      {meta.label}
                    </MenuItem>
                  ))}
                </Select>
                {isSaving && <CircularProgress size={14} />}
              </div>
              <Tooltip title={STORAGE_HELP.modifiable} placement="top">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    margin: "0",
                    marginBottom: "0.25rem",
                    fontSize: THEME_TYPE.fontSize12,
                    color: THEME_COLORS.textBody,
                  }}
                >
                  <Switch
                    size="small"
                    checked={Boolean(access?.modifiable)}
                    disabled={isSaving}
                    onChange={(event) => saveAccess({ modifiable: event.target.checked })}
                  />
                  Modifiable
                </label>
              </Tooltip>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                <Button size="small" onClick={copyLink} sx={actionButtonSx}>
                  <ContentCopyIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Copy link
                </Button>
                <Button size="small" onClick={() => onShare?.()} sx={actionButtonSx}>
                  <IosShareIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Share…
                </Button>
              </div>
            </div>
          </aside>
        )}
      </Box>

      {/* Action bar */}
      <Divider sx={{ mb: 1.5 }} />
      <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          <Button size="small" onClick={() => onRename?.()} disabled={Boolean(item?.rename_locked)} sx={actionButtonSx}>
            <RenameIcon sx={{ fontSize: 15, mr: 0.5 }} />
            Rename
          </Button>
          <Button size="small" onClick={() => onMove?.()} disabled={Boolean(item?.is_root)} sx={actionButtonSx}>
            <DriveFileMoveIcon sx={{ fontSize: 15, mr: 0.5 }} />
            Move
          </Button>
          <Button size="small" onClick={download} sx={actionButtonSx}>
            <DownloadIcon sx={{ fontSize: 15, mr: 0.5 }} />
            Download
          </Button>
        </div>
        <Button size="small" onClick={() => onDelete?.()} sx={{ ...actionButtonSx, color: THEME_COLORS.errorDark }}>
          <DeleteIcon sx={{ fontSize: 15, mr: 0.5 }} />
          Delete
        </Button>
      </footer>
    </section>
  );
}

export default StorageObjectPreview;
