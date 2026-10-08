import React from "react";
import { useOutletContext } from "react-router-dom";
import { OnPageLoaded } from "@link-loom/react-sdk";

import SupportHub from "../../hub/SupportHub.component";
import { SUPPORT_SUB_PAGES } from "../support-center.navigation";

function SupportHubSubPage() {
  const { namespace, categories, incidents, recentCases, guides, supportContext, handleItemOnAction, renderBridge } =
    useOutletContext();

  return (
    <>
      {renderBridge?.(SUPPORT_SUB_PAGES.HUB, {
        namespace,
        categories,
        incidents,
        recentCases,
        guides,
        supportContext,
        handleItemOnAction,
      })}
      <section className="container-fluid my-4 px-4">
        <SupportHub
          namespace={namespace}
          categories={categories}
          incidents={incidents}
          recentCases={recentCases}
          guides={guides}
          context={supportContext}
          itemOnAction={handleItemOnAction}
        />
      </section>
      <OnPageLoaded />
    </>
  );
}

export default SupportHubSubPage;
