import React from "react";
import { useOutletContext } from "react-router-dom";
import { OnPageLoaded } from "@link-loom/react-sdk";

import SupportCaseList from "../../cases/SupportCaseList.component";
import { SUPPORT_SUB_PAGES } from "../support-center.navigation";

function SupportCasesSubPage() {
  const { namespace, recentCases, caseStatuses, supportContext, handleItemOnAction, renderBridge } = useOutletContext();

  const namespaces = namespace ? [namespace] : [];

  return (
    <>
      {renderBridge?.(SUPPORT_SUB_PAGES.CASES, {
        namespace,
        recentCases,
        caseStatuses,
        supportContext,
        handleItemOnAction,
      })}
      <section className="container-fluid my-4 px-4">
        <SupportCaseList cases={recentCases} namespaces={namespaces} statuses={caseStatuses} itemOnAction={handleItemOnAction} />
      </section>
      <OnPageLoaded />
    </>
  );
}

export default SupportCasesSubPage;
