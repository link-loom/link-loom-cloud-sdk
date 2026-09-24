import { register } from "node:module";

register("./extensionless-resolver.mjs", import.meta.url);
register("./jsx-transform.mjs", import.meta.url);
