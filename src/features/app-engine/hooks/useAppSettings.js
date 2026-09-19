import { useCallback, useEffect, useRef, useState } from "react";

const SETTINGS_COLLECTION = "loom.system";
const SETTINGS_KEY = "settings";
const SETTINGS_SCOPE = "user-appdata";

export default function useAppSettings(sdk, defaults = {}) {
  const defaultsRef = useRef(defaults);
  const [settings, setSettingsState] = useState(defaults);
  const settingsRef = useRef(defaults);
  const [loading, setLoading] = useState(true);

  const applySettings = (nextSettings) => {
    settingsRef.current = nextSettings;
    setSettingsState(nextSettings);
  };

  useEffect(() => {
    if (!sdk?.data) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    sdk.data
      .getKey(SETTINGS_COLLECTION, SETTINGS_KEY, { scope: SETTINGS_SCOPE })
      .then((stored) => active && applySettings({ ...defaultsRef.current, ...(stored || {}) }))
      .catch(() => active && applySettings(defaultsRef.current))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [sdk]);

  const setSettings = useCallback(
    (partial) => {
      const nextSettings = { ...settingsRef.current, ...partial };
      applySettings(nextSettings);
      return sdk?.data?.setKey(SETTINGS_COLLECTION, SETTINGS_KEY, nextSettings, { scope: SETTINGS_SCOPE });
    },
    [sdk],
  );

  const setSetting = useCallback((key, value) => setSettings({ [key]: value }), [setSettings]);

  return { settings, loading, setSetting, setSettings };
}
