export class RuntimeHttpError extends Error {
  constructor({ status = 0, message, body = null, network = false }) {
    super(message || (network ? "Network request failed" : `Request failed with status ${status}`));
    this.name = "RuntimeHttpError";
    this.status = status;
    this.body = body;
    this.network = network;
  }
}

export const isRetryableHttpError = (error) => {
  if (!error) {
    return false;
  }
  if (error.network || !error.status) {
    return true;
  }
  return error.status >= 500 || error.status === 408 || error.status === 429;
};

const appendQueryValue = (searchParams, key, value) => {
  if (value === undefined || value === null || value === "") {
    return;
  }
  searchParams.append(key, Array.isArray(value) ? value.join(",") : String(value));
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export default class RuntimeHttpClient {
  constructor({ baseUrl = "", getHeaders, fetchImpl } = {}) {
    this.baseUrl = baseUrl;
    this._getHeaders = getHeaders;
    this._fetchImpl = fetchImpl;
  }

  headers() {
    return this._getHeaders ? this._getHeaders() : {};
  }

  buildUrl(path, query) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query || {})) {
      appendQueryValue(searchParams, key, value);
    }
    const queryString = searchParams.toString();
    return `${this.baseUrl}${path}${queryString ? `?${queryString}` : ""}`;
  }

  async request({ method = "GET", path, query, body, formData, keepalive = false, headers, withIdentity = true, signal }) {
    const fetchImpl = this._fetchImpl || globalThis.fetch?.bind(globalThis);
    if (!fetchImpl) {
      throw new RuntimeHttpError({ network: true, message: "fetch is not available" });
    }

    const requestHeaders = {
      Accept: "application/json",
      ...(withIdentity ? this.headers() : {}),
      ...(headers || {}),
    };

    if (body !== undefined && !formData) {
      requestHeaders["Content-Type"] = "application/json";
    }

    let response;
    try {
      response = await fetchImpl(this.buildUrl(path, query), {
        method,
        headers: requestHeaders,
        body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
        keepalive,
        signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }
      throw new RuntimeHttpError({ network: true, message: error?.message });
    }

    const payload = await parseResponseBody(response);
    const failedByEnvelope = payload && typeof payload === "object" && payload.success === false;

    if (!response.ok || failedByEnvelope) {
      throw new RuntimeHttpError({
        status: response.ok ? payload?.status || 500 : response.status,
        message: payload?.message,
        body: payload,
      });
    }

    if (payload && typeof payload === "object" && payload.result !== undefined) {
      return payload.result;
    }

    return payload;
  }
}
