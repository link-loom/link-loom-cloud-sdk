import React from "react";
import { useOutletContext } from "react-router-dom";
import { OnPageLoaded } from "@link-loom/react-sdk";

import SupportCaseForm from "../../case-form/SupportCaseForm.component";
import { SUPPORT_SUB_PAGES } from "../support-center.navigation";

function SupportNewCaseSubPage() {
  const { namespace, categories, supportContext, handleItemOnAction, renderBridge } = useOutletContext();

  return (
    <>
      {renderBridge?.(SUPPORT_SUB_PAGES.NEW_CASE, { namespace, categories, supportContext, handleItemOnAction })}
      <section className="container-fluid my-4 px-4">
        <SupportCaseForm namespace={namespace} categories={categories} context={supportContext} itemOnAction={handleItemOnAction} />
      </section>
      <OnPageLoaded />
    </>
  );
}

export default SupportNewCaseSubPage;
