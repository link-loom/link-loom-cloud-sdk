import React, { createContext, useContext, useMemo, useRef } from 'react';
import { useAuth } from '@veripass/react-sdk';

import AppEngineAppDefinitionService from '../../../services/app-engine/app-definition/app-definition.service';
import AppEngineAppVersionService from '../../../services/app-engine/app-version/app-version.service';
import AppEngineAppFileService from '../../../services/app-engine/app-file/app-file.service';
import AppEngineAppBuildService from '../../../services/app-engine/app-build/app-build.service';
import AppEngineAppSessionService from '../../../services/app-engine/app-session/app-session.service';
import AppEngineAppPreferenceService from '../../../services/app-engine/app-preference/app-preference.service';
import AppEngineAppScaffoldService from '../../../services/app-engine/app-scaffold/app-scaffold.service';
import AppEngineStoreService from '../../../services/app-engine/app-store/app-store.service';
import AppEngineAppSuiteService from '../../../services/app-engine/app-suite/app-suite.service';
import AppEngineAppEntitlementService from '../../../services/app-engine/app-entitlement/app-entitlement.service';
import { createSessionIdentityHeaders } from '../runtime/shared/loom-identity.client';

const AppEngineSDKContext = createContext(null);

const AppEngineSDKProvider = ({ baseUrl, children }) => {
  // The catalog, the store and the entitlements answer for the signed-in person's organization, so
  // those clients carry the Veripass identity. The headers are read per request: the session can be
  // refreshed or switch organization without the services being rebuilt.
  const auth = useAuth();
  const getTokenRef = useRef(auth?.getToken);
  getTokenRef.current = auth?.getToken;

  const services = useMemo(() => {
    const config = baseUrl ? { baseUrl } : {};
    const identityConfig = {
      ...config,
      getHeaders: () => createSessionIdentityHeaders(getTokenRef.current?.()),
    };

    return {
      appDefinitionService: new AppEngineAppDefinitionService(identityConfig),
      appVersionService: new AppEngineAppVersionService(config),
      appFileService: new AppEngineAppFileService(config),
      appBuildService: new AppEngineAppBuildService(config),
      appSessionService: new AppEngineAppSessionService(config),
      appPreferenceService: new AppEngineAppPreferenceService(config),
      appScaffoldService: new AppEngineAppScaffoldService(config),
      appStoreService: new AppEngineStoreService(identityConfig),
      appSuiteService: new AppEngineAppSuiteService(identityConfig),
      appEntitlementService: new AppEngineAppEntitlementService(identityConfig),
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
