// Three packages the components import do not load under Node's ESM loader as the bundler sees them:
//  - `@link-loom/react-sdk` and `styled-components` ship a CommonJS `main` that Node picks over their
//    ESM build, which leaves their named and default exports empty;
//  - `@veripass/react-sdk` is a peer dependency and is not installed here.
// The tests point each one at the build Rollup would resolve, or at a stub.
const SHIMS = {
  "@link-loom/react-sdk": new URL("./stubs/link-loom-react-sdk.mjs", import.meta.url),
  "styled-components": new URL("../../node_modules/styled-components/dist/styled-components.esm.js", import.meta.url),
  "@veripass/react-sdk": new URL("./stubs/veripass-react-sdk.mjs", import.meta.url),
};

export async function resolve(specifier, context, nextResolve) {
  const shim = SHIMS[specifier];

  if (!shim) {
    return nextResolve(specifier, context);
  }

  return { url: shim.href, shortCircuit: true };
}
