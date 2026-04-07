import { useSupportSDK } from '../context/SupportSDK.context';

const useSupportHub = () => {
  const {
    supportNamespaceService,
    supportIssueCategoryService,
    supportCaseService,
    supportCaseMessageService,
    supportIncidentService,
    supportQuickGuideService,
  } = useSupportSDK();

  return {
    supportNamespaceService,
    supportIssueCategoryService,
    supportCaseService,
    supportCaseMessageService,
    supportIncidentService,
    supportQuickGuideService,
  };
};

export default useSupportHub;
