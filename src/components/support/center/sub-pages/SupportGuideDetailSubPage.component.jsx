import React from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { OnPageLoaded } from "@link-loom/react-sdk";

import SupportGuideDetail from "../../guides/SupportGuideDetail.component";
import SupportCenterNotice from "../SupportCenterNotice.component";
import { SUPPORT_SUB_PAGES } from "../support-center.navigation";

function SupportGuideDetailSubPage() {
  const { slug } = useParams();
  const { guides, supportContext, handleItemOnAction, renderBridge, labels } = useOutletContext();

  const guide = (guides || []).find((candidate) => candidate.slug === slug) || null;
  const bridge = renderBridge?.(SUPPORT_SUB_PAGES.GUIDE_DETAIL, { guide, supportContext, handleItemOnAction });

  if (!guide) {
    return (
      <>
        {bridge}
        <SupportCenterNotice>{labels.guideNotFound}</SupportCenterNotice>
      </>
    );
  }

  return (
    <>
      {bridge}
      <section className="container-fluid my-4 px-4">
        <SupportGuideDetail guide={guide} itemOnAction={handleItemOnAction} />
      </section>
      <OnPageLoaded />
    </>
  );
}

export default SupportGuideDetailSubPage;
