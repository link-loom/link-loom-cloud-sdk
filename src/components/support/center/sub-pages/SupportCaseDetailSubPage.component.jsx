import React, { useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { OnPageLoaded } from "@link-loom/react-sdk";

import SupportCaseDetail from "../../cases/SupportCaseDetail.component";
import SupportCenterNotice from "../SupportCenterNotice.component";
import { SUPPORT_SUB_PAGES } from "../support-center.navigation";

class SupportCaseDetailErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    const { labels, children } = this.props;

    if (!error) {
      return children;
    }

    return (
      <section className="container-fluid my-4 px-4">
        <div className="card border p-4 text-center" style={{ minHeight: 200 }}>
          <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
            {labels.caseLoadFailed}
          </p>
          <p className="text-muted" style={{ fontSize: "12px" }}>
            {error.message || labels.unexpectedError}
          </p>
        </div>
      </section>
    );
  }
}

function SupportCaseDetailSubPage() {
  const { id } = useParams();
  const {
    selectedCase,
    setSelectedCase,
    caseMessages,
    supportContext,
    handleItemOnAction,
    fetchCaseMessages,
    recentCases,
    renderBridge,
    labels,
  } = useOutletContext();

  useEffect(() => {
    const found = !selectedCase && id ? (recentCases || []).find((candidate) => candidate.id === id) : null;

    if (found) {
      setSelectedCase(found);
      fetchCaseMessages(found.id);
    }

    if (selectedCase?.id === id) {
      fetchCaseMessages(id);
    }
  }, [id]);

  if (!selectedCase) {
    return (
      <>
        {renderBridge?.(SUPPORT_SUB_PAGES.CASE_DETAIL, {
          selectedCase: null,
          caseMessages: [],
          supportContext,
          handleItemOnAction,
        })}
        <SupportCenterNotice>{labels.loadingCase}</SupportCenterNotice>
      </>
    );
  }

  return (
    <SupportCaseDetailErrorBoundary labels={labels}>
      {renderBridge?.(SUPPORT_SUB_PAGES.CASE_DETAIL, { selectedCase, caseMessages, supportContext, handleItemOnAction })}
      <section className="container-fluid my-4 px-4">
        <SupportCaseDetail supportCase={selectedCase} messages={caseMessages} context={supportContext} itemOnAction={handleItemOnAction} />
      </section>
      <OnPageLoaded />
    </SupportCaseDetailErrorBoundary>
  );
}

export default SupportCaseDetailSubPage;
