import { fileURLToPath } from "node:url";
import { transformAsync } from "@babel/core";

// Hooks and components are `.jsx` (Rollup compiles them with Babel); the unit tests compile them the same
// way, with the automatic JSX runtime so a source does not need React in scope.
export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:") || !url.endsWith(".jsx")) {
    return nextLoad(url, context);
  }

  const { source } = await nextLoad(url, { ...context, format: "module" });
  const { code } = await transformAsync(String(source), {
    filename: fileURLToPath(url),
    babelrc: false,
    configFile: false,
    presets: [["@babel/preset-react", { runtime: "automatic" }]],
    sourceMaps: "inline",
  });

  return { format: "module", source: code, shortCircuit: true };
}
