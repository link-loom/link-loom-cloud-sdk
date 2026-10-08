// `@link-loom/react-sdk` as the bundler resolves it (its ESM build), with `QuickLinkCard` swapped for a
// plain stand-in. The real card is built with the SDK's own bundled emotion, which cannot render on the
// server without a DOM; the stand-in keeps the same props and the same link, which is what the SDK's
// components are tested on.
import { createElement } from "react";
import { Link } from "react-router-dom";

export * from "../../../node_modules/@link-loom/react-sdk/dist/react-sdk.esm.js";

export const QuickLinkCard = ({ href, title, description, Icon, iconColor, backgroundPercentage, className }) =>
  createElement(
    "article",
    { className, "data-icon-color": iconColor, "data-icon-background": backgroundPercentage },
    createElement(
      Link,
      { to: href, className: "flex-fill text-decoration-none" },
      createElement(Icon, null),
      createElement("h6", null, title),
      createElement("p", null, description),
    ),
  );
