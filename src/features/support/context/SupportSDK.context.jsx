import React, { createContext, useContext, useMemo } from 'react';

import SupportNamespaceService from '../../../services/support/support-namespace/support-namespace.service';
import SupportIssueCategoryService from '../../../services/support/support-issue-category/support-issue-category.service';
import SupportCaseService from '../../../services/support/support-case/support-case.service';
import SupportCaseMessageService from '../../../services/support/support-case-message/support-case-message.service';
import SupportIncidentService from '../../../services/support/support-incident/support-incident.service';
import SupportQuickGuideService from '../../../services/support/support-quick-guide/support-quick-guide.service';

const SupportSDKContext = createContext(null);

const SupportSDKProvider = ({ baseUrl, children }) => {
  const services = useMemo(() => {
    const config = baseUrl ? { baseUrl } : {};

    return {
      supportNamespaceService: new SupportNamespaceService(config),
      supportIssueCategoryService: new SupportIssueCategoryService(config),
      supportCaseService: new SupportCaseService(config),
      supportCaseMessageService: new SupportCaseMessageService(config),
      supportIncidentService: new SupportIncidentService(config),
      supportQuickGuideService: new SupportQuickGuideService(config),
    };
  }, [baseUrl]);

  return (
    <SupportSDKContext.Provider value={services}>
      {children}
    </SupportSDKContext.Provider>
  );
};

const useSupportSDK = () => {
  const context = useContext(SupportSDKContext);

  if (!context) {
    throw new Error('useSupportSDK must be used within a SupportSDKProvider');
  }

  return context;
};

export { SupportSDKProvider, useSupportSDK };
