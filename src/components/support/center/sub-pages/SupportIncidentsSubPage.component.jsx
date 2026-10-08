import React from "react";
import { useOutletContext } from "react-router-dom";
import { OnPageLoaded } from "@link-loom/react-sdk";

import SupportIncidentsList from "../../incidents/SupportIncidentsList.component";
import { SUPPORT_SUB_PAGES } from "../support-center.navigation";

function SupportIncidentsSubPage() {
  const { namespace, incidents, supportContext, handleItemOnAction, renderBridge } = useOutletContext();

  return (
    <>
      {renderBridge?.(SUPPORT_SUB_PAGES.INCIDENTS, { namespace, incidents, supportContext, handleItemOnAction })}
      <section className="container-fluid my-4 px-4">
        <SupportIncidentsList namespace={namespace} incidents={incidents} itemOnAction={handleItemOnAction} />
      </section>
      <OnPageLoaded />
    </>
  );
}

export default SupportIncidentsSubPage;
