import React from "react";
import { useOutletContext } from "react-router-dom";
import { OnPageLoaded } from "@link-loom/react-sdk";

import SupportAllCategories from "../../categories/SupportAllCategories.component";
import { SUPPORT_SUB_PAGES } from "../support-center.navigation";

function SupportCategoriesSubPage() {
  const { namespace, categories, supportContext, handleItemOnAction, renderBridge } = useOutletContext();

  return (
    <>
      {renderBridge?.(SUPPORT_SUB_PAGES.CATEGORIES, { namespace, categories, supportContext, handleItemOnAction })}
      <section className="container-fluid my-4 px-4">
        <SupportAllCategories namespace={namespace} categories={categories} context={supportContext} itemOnAction={handleItemOnAction} />
      </section>
      <OnPageLoaded />
    </>
  );
}

export default SupportCategoriesSubPage;
