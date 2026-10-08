// What the diagnostics bundle of a support case carries: the last console errors and warnings, the
// uncaught errors and the unhandled rejections of the page. It installs itself the first time a support
// center mounts — not when the module is imported — and only once, whatever the number of mounts.

const MAX_LOG_ENTRIES = 50;
const STACK_LINES = 4;

const logBuffer = [];
let isInstalled = false;

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const toPlainObject = (value) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
};

const firstStackLines = (stack) => stack?.split("\n").slice(0, STACK_LINES).join(" | ");

const serializeAxiosError = (error) => ({
  type: "AxiosError",
  message: error.message,
  method: error.config?.method?.toUpperCase(),
  url: error.config?.url,
  payload: error.config?.data ? parseJson(error.config.data) : undefined,
  status: error.response?.status,
  response: error.response?.data,
});

export const serializeLogArgument = (argument) => {
  try {
    if (argument === null || argument === undefined) {
      return String(argument);
    }

    if (argument?.isAxiosError || argument?.config?.url) {
      return serializeAxiosError(argument);
    }

    if (argument instanceof Error) {
      return { type: argument.name || "Error", message: argument.message, stack: firstStackLines(argument.stack) };
    }

    if (typeof argument === "object") {
      return toPlainObject(argument);
    }

    return argument;
  } catch {
    return "[unserializable]";
  }
};

const pushLog = (level, args) => {
  if (logBuffer.length >= MAX_LOG_ENTRIES) {
    logBuffer.shift();
  }

  logBuffer.push({ level, timestamp: new Date().toISOString(), args: args.map(serializeLogArgument) });
};

const wrapConsoleMethod = (method, level) => {
  const original = console[method];

  console[method] = (...args) => {
    pushLog(level, args);
    original.apply(console, args);
  };
};

/** Starts capturing. Calling it again, or outside a browser, does nothing. */
export const installDiagnosticsCapture = () => {
  if (isInstalled || typeof window === "undefined") {
    return;
  }

  isInstalled = true;

  wrapConsoleMethod("error", "error");
  wrapConsoleMethod("warn", "warn");

  window.addEventListener("error", (event) => {
    pushLog("error", [
      {
        type: "UncaughtError",
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: firstStackLines(event.error?.stack),
      },
    ]);
  });

  window.addEventListener("unhandledrejection", (event) => {
    pushLog("error", [event.reason]);
  });
};

/** The captured entries, oldest first. It is the live buffer: copy it before keeping it. */
export const getDiagnosticsLogs = () => logBuffer;
