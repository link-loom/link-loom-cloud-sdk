import React, { useState, useEffect } from "react";
import { Apps as DefaultFallbackIcon } from "@mui/icons-material";

function DynamicMuiIcon({ iconName, fallbackIcon: FallbackComponent = DefaultFallbackIcon, ...props }) {
  const [Icon, setIcon] = useState(() => FallbackComponent);

  useEffect(() => {
    setIcon(() => FallbackComponent);

    if (!iconName) return;

    import(`@mui/icons-material/${iconName}.js`)
      .then((module) => setIcon(() => module.default))
      .catch(() => setIcon(() => FallbackComponent));
  }, [iconName, FallbackComponent]);

  return <Icon {...props} />;
}

export default DynamicMuiIcon;
