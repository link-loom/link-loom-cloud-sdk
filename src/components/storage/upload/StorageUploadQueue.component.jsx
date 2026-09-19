import React, { useEffect, useRef, useState } from "react";
import { Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import {
  CheckCircleOutlined as CheckCircleIcon,
  CloseOutlined as CloseIcon,
  CloudOffOutlined as CloudOffIcon,
  ErrorOutline as ErrorOutlineIcon,
  OpenInNewOutlined as OpenInNewIcon,
  RefreshOutlined as RefreshIcon,
  ScheduleOutlined as ScheduleIcon,
} from "@mui/icons-material";

import { formatFileSize } from "../shared/storage.helpers";
import { THEME_COLORS, THEME_TYPE } from "../defaults/storage.theme";

/**
 * Persistent bottom-right upload panel. The backend takes one file per request, so a multi-file
 * drop becomes a queue: files run sequentially (maxConcurrent 2), each row carries its own state
 * (queued → uploading → done | error) and failed rows retry individually without re-queueing the
 * rest. A row that could not reach the backend (offline, no response) is "pending sync": it keeps
 * its file and is queued again automatically when the browser comes back online. `batch` is
 * replaced wholesale by the browser on every new drop.
 */
const MAX_CONCURRENT = 2;

const STATUS_ICONS = {
  queued: <ScheduleIcon sx={{ fontSize: 16, color: THEME_COLORS.textMuted }} />,
  uploading: <CircularProgress size={14} />,
  done: <CheckCircleIcon sx={{ fontSize: 16, color: THEME_COLORS.success }} />,
  error: <ErrorOutlineIcon sx={{ fontSize: 16, color: THEME_COLORS.errorDark }} />,
  pending: <CloudOffIcon sx={{ fontSize: 16, color: THEME_COLORS.warning }} />,
};

const PENDING_SYNC_LABEL = "Pending sync";

const isUnreachable = (response) => !response || globalThis.navigator?.onLine === false;

function StorageUploadQueue({ service, batch, onFileUploaded, onOpenItem, onDismiss }) {
  const [rows, setRows] = useState([]);
  const runningRef = useRef(0);
  const rowsRef = useRef([]);

  // The ref mutates synchronously (pump() reads it in a loop — a deferred React updater would
  // let the same queued row be picked twice); state just mirrors it for rendering.
  const setRowState = (rowId, patch) => {
    rowsRef.current = rowsRef.current.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
    setRows(rowsRef.current);
  };

  const pump = () => {
    while (runningRef.current < MAX_CONCURRENT) {
      const nextRow = rowsRef.current.find((row) => row.status === "queued");

      if (!nextRow) {
        return;
      }

      runningRef.current += 1;
      setRowState(nextRow.id, { status: "uploading", message: "" });

      service
        .upload(nextRow.file, nextRow.destination)
        .then((response) => {
          if (response?.success) {
            setRowState(nextRow.id, { status: "done", entity: response.result });
            onFileUploaded?.(response.result);
            return;
          }
          if (isUnreachable(response)) {
            setRowState(nextRow.id, { status: "pending", message: PENDING_SYNC_LABEL });
            return;
          }
          setRowState(nextRow.id, { status: "error", message: response?.message || "Upload failed" });
        })
        .catch(() => {
          setRowState(nextRow.id, { status: "pending", message: PENDING_SYNC_LABEL });
        })
        .finally(() => {
          runningRef.current -= 1;
          pump();
        });
    }
  };

  useEffect(() => {
    if (!batch?.files?.length) {
      return;
    }

    const newRows = batch.files.map((file, index) => ({
      id: `${batch.key}-${index}`,
      file,
      destination: batch.destination,
      status: "queued",
      message: "",
    }));

    // A new drop must not cancel work in flight: keep every unfinished row from the previous
    // batch and append the new ones.
    const unfinished = rowsRef.current.filter((row) => ["queued", "uploading", "pending"].includes(row.status));
    rowsRef.current = [...unfinished, ...newRows];
    setRows(rowsRef.current);
    pump();
  }, [batch?.key]);

  useEffect(() => {
    const retryPending = () => {
      const pendingRows = rowsRef.current.filter((row) => row.status === "pending");
      if (!pendingRows.length) {
        return;
      }
      pendingRows.forEach((row) => setRowState(row.id, { status: "queued", message: "" }));
      pump();
    };

    window.addEventListener("online", retryPending);
    return () => window.removeEventListener("online", retryPending);
  }, []);

  if (!rows.length) {
    return null;
  }

  const doneCount = rows.filter((row) => row.status === "done").length;
  const hasPending = rows.some((row) => ["queued", "uploading", "pending"].includes(row.status));
  const pendingSyncCount = rows.filter((row) => row.status === "pending").length;

  return (
    <aside
      data-storage-chrome
      style={{
        position: "fixed",
        display: "flex",
        flexDirection: "column",
        background: THEME_COLORS.white,
        right: 16,
        bottom: 16,
        width: 340,
        maxHeight: 300,
        zIndex: 1200,
        borderRadius: "12px",
        border: `1px solid ${THEME_COLORS.borderMuted}`,
        boxShadow: "var(--stos-shadow-md, 0 8px 24px -8px rgba(19, 19, 22, 0.16))",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          background: THEME_COLORS.surfaceCard,
          borderBottom: `1px solid ${THEME_COLORS.borderMuted}`,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: THEME_COLORS.textStrong }}>
          Uploading {doneCount}/{rows.length}
          {pendingSyncCount > 0 && (
            <span style={{ marginLeft: 8, fontWeight: 500, fontSize: 12, color: THEME_COLORS.warning }}>
              {PENDING_SYNC_LABEL} ({pendingSyncCount})
            </span>
          )}
        </span>
        <Tooltip title={hasPending ? "Hide finished — uploads keep running" : "Close"}>
          <IconButton
            size="small"
            onClick={() => {
              // Clear everything that is done; anything still moving keeps the panel alive.
              rowsRef.current = rowsRef.current.filter((row) => ["queued", "uploading", "pending"].includes(row.status));
              setRows(rowsRef.current);
              if (!rowsRef.current.length) onDismiss?.();
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </header>

      <div style={{ flexGrow: 1, overflowY: "auto" }}>
        {rows.map((row) => (
          <div
            key={row.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              paddingLeft: "1rem",
              paddingRight: "1rem",
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
              borderBottom: `1px solid ${THEME_COLORS.surfaceTrack}`,
            }}
          >
            {STATUS_ICONS[row.status]}
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: "0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: THEME_TYPE.fontSize12,
                  color: THEME_COLORS.textBody,
                }}
              >
                {row.file.name}
              </p>
              <p
                style={{
                  margin: "0",
                  fontSize: 11,
                  color:
                    row.status === "error"
                      ? THEME_COLORS.errorDark
                      : row.status === "pending"
                      ? THEME_COLORS.warning
                      : THEME_COLORS.textMuted,
                }}
              >
                {row.status === "error" || row.status === "pending" ? row.message : formatFileSize(row.file.size)}
              </p>
            </div>
            {row.status === "error" && (
              <Button
                size="small"
                onClick={() => {
                  setRowState(row.id, { status: "queued", message: "" });
                  pump();
                }}
                sx={{ textTransform: "none", fontSize: 12, minWidth: 0, color: THEME_COLORS.brandPrimary }}
              >
                <RefreshIcon sx={{ fontSize: 14, mr: 0.25 }} />
                Retry
              </Button>
            )}
            {row.status === "done" && row.entity && (
              <Tooltip title="Open">
                <IconButton size="small" onClick={() => onOpenItem?.(row.entity)}>
                  <OpenInNewIcon sx={{ fontSize: 15, color: THEME_COLORS.brandPrimary }} />
                </IconButton>
              </Tooltip>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

export default StorageUploadQueue;
