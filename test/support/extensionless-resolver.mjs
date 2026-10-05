// The sources import relative modules without extension (Rollup resolves them); Node's ESM loader
// does not, so the unit tests retry a relative specifier that was not found with `.js`, then `.jsx`.
const isRelative = (specifier) => specifier.startsWith("./") || specifier.startsWith("../");
const hasExtension = (specifier) => specifier.endsWith(".js") || specifier.endsWith(".jsx");

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || !isRelative(specifier) || hasExtension(specifier)) {
      throw error;
    }

    try {
      return await nextResolve(`${specifier}.js`, context);
    } catch (jsError) {
      if (jsError?.code !== "ERR_MODULE_NOT_FOUND") {
        throw jsError;
      }
      return nextResolve(`${specifier}.jsx`, context);
    }
  }
}
