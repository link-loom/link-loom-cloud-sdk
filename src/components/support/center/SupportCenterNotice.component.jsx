import React from "react";

/** A muted line in the middle of the page: loading, nothing found, not available. */
function SupportCenterNotice({ children, minHeight = 300 }) {
  return (
    <section className="container-fluid my-4 px-4">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight }}>
        <span className="text-muted">{children}</span>
      </div>
    </section>
  );
}

export default SupportCenterNotice;
