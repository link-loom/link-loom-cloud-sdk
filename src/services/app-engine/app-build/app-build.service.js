import BaseApi from "../../base/api.service";

export default class AppEngineAppBuildService extends BaseApi {
  constructor(args) {
    super(args);

    this.api_key = args?.apiKey || "";
    this.serviceEndpoints = {
      baseUrl:
        args?.baseUrl || import.meta.env.VITE_LOOM_CLOUD_BACKEND_URL || "",
      buildSingle: "/app-engine/build/single",
      buildSingleStream: "/app-engine/build/single/stream",
      buildAll: "/app-engine/build/all",
      buildAndPublish: "/app-engine/build/publish",
    };
  }

  async buildSingle(payload) {
    return super.post(payload, {
      endpoint: this.serviceEndpoints.buildSingle,
      timeout: 180000,
    });
  }

  async buildSingleStream(payload, { onEvent, onComplete, onError } = {}) {
    const url = `${this.serviceEndpoints.baseUrl}${this.serviceEndpoints.buildSingleStream}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Encoding": "identity",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (onError) onError(new Error(errorText || `HTTP ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const dataLine = line.replace(/^data:\s*/, "").trim();

          if (!dataLine) continue;

          try {
            const event = JSON.parse(dataLine);

            if (onEvent) onEvent(event);

            if (event.event === "result") {
              if (onComplete) onComplete(event);
            } else if (event.event === "error") {
              if (onError) onError(new Error(event.message || "Build error"));
            }
          } catch (_) {
            /* ignore parse errors for incomplete chunks */
          }
        }
      }
    } catch (error) {
      if (onError) onError(error);
    }
  }

  async buildAll(payload) {
    return super.post(payload, {
      endpoint: this.serviceEndpoints.buildAll,
      timeout: 180000,
    });
  }

  async buildAndPublish(payload) {
    return super.post(payload, {
      endpoint: this.serviceEndpoints.buildAndPublish,
      timeout: 180000,
    });
  }
}
