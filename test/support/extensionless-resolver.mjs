// The sources import relative modules without extension (Rollup resolves them); Node's ESM loader
// does not, so the unit tests retry a relative specifier that was not found with `.js`.
const isRelative = (specifier) => specifier.startsWith("./") || specifier.startsWith("../");

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || !isRelative(specifier) || specifier.endsWith(".js")) {
      throw error;
    }
    return nextResolve(`${specifier}.js`, context);
  }
}
