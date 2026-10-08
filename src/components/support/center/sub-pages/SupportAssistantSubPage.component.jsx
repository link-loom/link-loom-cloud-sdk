import React from "react";
import { useOutletContext } from "react-router-dom";
import { OnPageLoaded } from "@link-loom/react-sdk";

import SupportAssistantPanel from "../../assistant/SupportAssistantPanel.component";
import SupportCenterNotice from "../SupportCenterNotice.component";
import { SUPPORT_SUB_PAGES } from "../support-center.navigation";

function SupportAssistantSubPage() {
  const { namespace, supportContext, handleItemOnAction, llmProviders, assistant, renderBridge, labels } = useOutletContext();

  return (
    <>
      {renderBridge?.(SUPPORT_SUB_PAGES.ASSISTANT, { namespace, supportContext, llmProviders, handleItemOnAction })}
      {!assistant && <SupportCenterNotice>{labels.assistantUnavailable}</SupportCenterNotice>}
      {assistant && (
        <section className="container-fluid my-4 px-4">
          <SupportAssistantPanel
            namespace={namespace}
            context={supportContext}
            itemOnAction={handleItemOnAction}
            executionService={assistant.executionService}
            llmProviders={llmProviders}
            components={assistant.components}
          />
        </section>
      )}
      <OnPageLoaded />
    </>
  );
}

export default SupportAssistantSubPage;
