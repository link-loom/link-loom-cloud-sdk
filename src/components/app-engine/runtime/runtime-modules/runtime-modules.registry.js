import * as React from "react";
import * as ReactJSXRuntime from "react/jsx-runtime";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as ReactRouterDOM from "react-router-dom";
import * as MuiMaterial from "@mui/material";
import * as MuiMaterialStyles from "@mui/material/styles";
import * as EmotionReact from "@emotion/react";
import * as EmotionStyled from "@emotion/styled";
import * as LinkLoomReactSdk from "@link-loom/react-sdk";
import * as VeripassReactSdk from "@veripass/react-sdk";
import * as ReactMoveable from "react-moveable";
import * as ReactSelecto from "react-selecto";

export const RUNTIME_WINDOW_KEY = "__LOOM_RUNTIME__";

const RUNTIME_TOKEN_SCAN_PATTERN = /\$\$LOOM_RUNTIME\$\$:([^"'`\s)]+)/g;

// Context-bearing modules: they must be the exact instances the host renders with, so they are
// imported statically and stay external in the SDK build. React component libraries that call hooks
// (react-moveable, react-selecto) belong here too: a lazily loaded SDK chunk is prebundled by the host
// dev server on its own and can bind to a React copy other than the one rendering the app.
export const STATIC_RUNTIME_MODULES = {
  react: React,
  "react/jsx-runtime": ReactJSXRuntime,
  "react-dom": ReactDOM,
  "react-dom/client": ReactDOMClient,
  "react-router-dom": ReactRouterDOM,
  "@mui/material": MuiMaterial,
  "@mui/material/styles": MuiMaterialStyles,
  "@emotion/react": EmotionReact,
  "@emotion/styled": EmotionStyled,
  "@link-loom/react-sdk": LinkLoomReactSdk,
  "@veripass/react-sdk": VeripassReactSdk,
  "react-moveable": ReactMoveable,
  "react-selecto": ReactSelecto,
};

const loadGlideDataGrid = async () => {
  const [gridModule] = await Promise.all([
    import("@glideapps/glide-data-grid"),
    import("@glideapps/glide-data-grid/dist/index.css"),
  ]);
  return gridModule;
};

// Pure libraries: loaded on demand, only when an app bundle references them.
export const RUNTIME_MODULE_LOADERS = {
  dayjs: () => import("dayjs"),
  luxon: () => import("luxon"),
  zod: () => import("zod"),
  "react-hook-form": () => import("react-hook-form"),
  recharts: () => import("recharts"),
  "react-markdown": () => import("react-markdown"),
  axios: () => import("axios"),
  "@tanstack/react-query": () => import("@tanstack/react-query"),
  "@mui/icons-material": () => import("@mui/icons-material"),
  "@mui/x-date-pickers": () => import("@mui/x-date-pickers"),
  "@mui/x-date-pickers/AdapterDayjs": () => import("@mui/x-date-pickers/AdapterDayjs"),
  "@glideapps/glide-data-grid": loadGlideDataGrid,
  "fast-formula-parser": () => import("fast-formula-parser"),
  exceljs: () => import("exceljs"),
  pptxgenjs: () => import("pptxgenjs"),
  "html-to-image": () => import("html-to-image"),
  rrule: () => import("rrule"),
  "ical.js": () => import("ical.js"),
};

const splitSpecifier = (specifier) => {
  const segments = specifier.split("/");
  const rootLength = specifier.startsWith("@") ? 2 : 1;
  return {
    root: segments.slice(0, rootLength).join("/"),
    subpath: segments.slice(rootLength).join("/"),
  };
};

// `@mui/material/Button` style deep imports resolve to the matching export of the root module.
const fromRootExport = (rootModule, subpath) => {
  const exportName = subpath.split("/").pop();
  if (!rootModule || rootModule[exportName] === undefined) {
    return rootModule;
  }
  return { ...rootModule, default: rootModule[exportName] };
};

const resolveStaticModule = (specifier) => {
  if (STATIC_RUNTIME_MODULES[specifier]) {
    return STATIC_RUNTIME_MODULES[specifier];
  }

  const { root, subpath } = splitSpecifier(specifier);
  if (!subpath || !STATIC_RUNTIME_MODULES[root]) {
    return null;
  }

  return fromRootExport(STATIC_RUNTIME_MODULES[root], subpath);
};

const loadDynamicModule = async (specifier) => {
  if (RUNTIME_MODULE_LOADERS[specifier]) {
    return RUNTIME_MODULE_LOADERS[specifier]();
  }

  const { root, subpath } = splitSpecifier(specifier);
  if (!subpath || !RUNTIME_MODULE_LOADERS[root]) {
    return null;
  }

  return fromRootExport(await RUNTIME_MODULE_LOADERS[root](), subpath);
};

export const collectRuntimeSpecifiers = (code) => {
  const specifiers = new Set();
  if (typeof code !== "string") {
    return specifiers;
  }

  for (const match of code.matchAll(RUNTIME_TOKEN_SCAN_PATTERN)) {
    specifiers.add(match[1]);
  }

  return specifiers;
};

export const getRuntimeRegistry = () => {
  if (!window[RUNTIME_WINDOW_KEY]) {
    window[RUNTIME_WINDOW_KEY] = {};
  }
  return window[RUNTIME_WINDOW_KEY];
};

export const registerStaticRuntimeModules = () => {
  const registry = getRuntimeRegistry();

  for (const [specifier, moduleObject] of Object.entries(STATIC_RUNTIME_MODULES)) {
    if (!registry[specifier]) {
      registry[specifier] = moduleObject;
    }
  }

  return registry;
};

// Host registrations always win: a specifier already present in window.__LOOM_RUNTIME__ is never
// replaced. Returns the specifiers that could not be resolved.
export const ensureRuntimeModules = async (code) => {
  const registry = registerStaticRuntimeModules();
  const unresolved = [];

  const pending = [...collectRuntimeSpecifiers(code)]
    .filter((specifier) => !registry[specifier])
    .map(async (specifier) => {
      if (/\.css(\?.*)?$/.test(specifier)) {
        registry[specifier] = {};
        return;
      }

      const staticModule = resolveStaticModule(specifier);
      if (staticModule) {
        registry[specifier] = staticModule;
        return;
      }

      try {
        const loadedModule = await loadDynamicModule(specifier);
        if (!loadedModule) {
          unresolved.push(specifier);
          return;
        }
        if (!registry[specifier]) {
          registry[specifier] = loadedModule;
        }
      } catch (error) {
        console.error(`[AppRuntimeHost] Failed to load runtime module ${specifier}`, error);
        unresolved.push(specifier);
      }
    });

  await Promise.all(pending);
  return unresolved;
};
