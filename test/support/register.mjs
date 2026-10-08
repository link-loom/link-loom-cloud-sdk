import { register } from "node:module";

register("./extensionless-resolver.mjs", import.meta.url);
register("./peer-shims-resolver.mjs", import.meta.url);
register("./jsx-transform.mjs", import.meta.url);
// Registered last, so it runs first and sees the source the JSX transform returns.
register("./vite-env-loader.mjs", import.meta.url);
