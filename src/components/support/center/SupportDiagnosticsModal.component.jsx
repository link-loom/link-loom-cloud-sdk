import React from "react";
import { PopUp } from "@link-loom/react-sdk";

import { getDiagnosticsLogs } from "./diagnostics-capture";

const SECTION_TITLE_STYLE = { fontSize: "10px", letterSpacing: "0.07em", color: "#9ca3af" };
const ROW_VALUE_MAX_WIDTH = "240px";

function DiagnosticsRow({ label, value, truncate = false }) {
  if (!value) {
    return null;
  }

  return (
    <div className="d-flex justify-content-between">
      <span className="text-muted">{label}</span>
      <span
        className={truncate ? "fw-medium text-truncate ms-3" : "fw-medium"}
        style={truncate ? { maxWidth: ROW_VALUE_MAX_WIDTH } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function DiagnosticsSection({ title, children }) {
  return (
    <div>
      <p className="text-uppercase fw-semibold mb-2" style={SECTION_TITLE_STYLE}>
        {title}
      </p>
      <div className="d-flex flex-column gap-1" style={{ fontSize: "13px" }}>
        {children}
      </div>
    </div>
  );
}

/** The diagnostics a person can read before attaching them to a case: the context and the captured logs. */
function SupportDiagnosticsModal({ isOpen, setIsOpen, context, labels }) {
  return (
    <PopUp
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className="col-lg-5 col-md-8 col-12"
      styles={{ closeButtonColor: "text-black-50", borderRadius: "16px", overflow: "hidden" }}
    >
      <div className="p-3">
        <h6 className="fw-semibold mb-3" style={{ fontSize: "14px" }}>
          {labels.title}
        </h6>

        {context && (
          <div className="d-flex flex-column gap-3">
            <DiagnosticsSection title={labels.system}>
              <DiagnosticsRow label={labels.environment} value={context.environment} />
              <DiagnosticsRow label={labels.route} value={context.currentRoute} truncate />
              <DiagnosticsRow label={labels.surface} value={context.originSurface} />
            </DiagnosticsSection>

            <DiagnosticsSection title={labels.identity}>
              <DiagnosticsRow label={labels.user} value={context.userId} truncate />
              <DiagnosticsRow label={labels.displayName} value={context.userDisplayName} />
              <DiagnosticsRow label={labels.organization} value={context.organizationId} truncate />
            </DiagnosticsSection>

            <DiagnosticsSection title={labels.product}>
              <DiagnosticsRow label={labels.slug} value={context.productSlug} />
              <DiagnosticsRow label={labels.name} value={context.productDisplayName} />
              <DiagnosticsRow label={labels.namespace} value={context.supportNamespaceSlug} />
            </DiagnosticsSection>

            <div>
              <p className="text-uppercase fw-semibold mb-2" style={SECTION_TITLE_STYLE}>
                {labels.rawJson}
              </p>
              <pre
                className="p-2 rounded-2 mb-0"
                style={{
                  fontSize: "11px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  overflowX: "auto",
                  overflowY: "auto",
                  maxHeight: "220px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {JSON.stringify({ ...context, console_logs: [...getDiagnosticsLogs()] }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </PopUp>
  );
}

export default SupportDiagnosticsModal;
