import React, { createContext, useContext, useMemo } from 'react';

import AppEngineAppDefinitionService from '../../../services/app-engine/app-definition/app-definition.service';
import AppEngineAppVersionService from '../../../services/app-engine/app-version/app-version.service';
import AppEngineAppFileService from '../../../services/app-engine/app-file/app-file.service';
import AppEngineAppBuildService from '../../../services/app-engine/app-build/app-build.service';
import AppEngineAppSessionService from '../../../services/app-engine/app-session/app-session.service';
import AppEngineAppPreferenceService from '../../../services/app-engine/app-preference/app-preference.service';
import AppEngineAppScaffoldService from '../../../services/app-engine/app-scaffold/app-scaffold.service';

const AppEngineSDKContext = createContext(null);

const AppEngineSDKProvider = ({ baseUrl, children }) => {
  const services = useMemo(() => {
    const config = baseUrl ? { baseUrl } : {};

    return {
      appDefinitionService: new AppEngineAppDefinitionService(config),
      appVersionService: new AppEngineAppVersionService(config),
      appFileService: new AppEngineAppFileService(config),
      appBuildService: new AppEngineAppBuildService(config),
      appSessionService: new AppEngineAppSessionService(config),
      appPreferenceService: new AppEngineAppPreferenceService(config),
      appScaffoldService: new AppEngineAppScaffoldService(config),
    };
  }, [baseUrl]);

  return (
    <AppEngineSDKContext.Provider value={services}>
      {children}
    </AppEngineSDKContext.Provider>
  );
};

const useAppEngineSDK = () => {
  const context = useContext(AppEngineSDKContext);

  if (!context) {
    throw new Error('useAppEngineSDK must be used within an AppEngineSDKProvider');
  }

  return context;
};

export { AppEngineSDKProvider, useAppEngineSDK };
