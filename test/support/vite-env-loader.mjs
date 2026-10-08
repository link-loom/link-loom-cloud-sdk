// Vite defines `import.meta.env` for the host's bundle and Node does not, so sources that read a
// variable from it (the services' base URL) would throw as soon as they are constructed. The tests load
// them with an empty environment, which is what a host that sets no variable has.
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);

  if (!url.startsWith("file:") || url.includes("/node_modules/") || !result.source) {
    return result;
  }

  const source = String(result.source);

  if (!source.includes("import.meta.env")) {
    return result;
  }

  return { ...result, source: source.replaceAll("import.meta.env", "({})") };
}
