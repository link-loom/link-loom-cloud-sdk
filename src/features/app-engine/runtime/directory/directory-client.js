const DIRECTORY_PATH = "/identity/directory";
const CACHE_TTL_MS = 60 * 1000;

const EMPTY_LIST = { items: [], totalItems: 0 };

// Every list selector answers `{ items, totalItems }`; `user` answers the directory profile itself.
const toList = (result) => ({
  items: result?.items || [],
  totalItems: result?.totalItems ?? result?.items?.length ?? 0,
});

export default class AppDirectoryClient {
  constructor({ http, now = () => Date.now() }) {
    this._http = http;
    this._now = now;
    this._cache = new Map();
  }

  async #query(selector, query = {}) {
    const cacheKey = this._http.buildUrl(`${DIRECTORY_PATH}/${selector}`, query);
    const cached = this._cache.get(cacheKey);
    if (cached && cached.expiresAt > this._now()) {
      return cached.value;
    }

    const value = this._http.request({ path: `${DIRECTORY_PATH}/${selector}`, query });
    this._cache.set(cacheKey, { value, expiresAt: this._now() + CACHE_TTL_MS });

    try {
      return await value;
    } catch (error) {
      this._cache.delete(cacheKey);
      throw error;
    }
  }

  async searchPeople(text) {
    const search = String(text || "").trim();
    if (!search) {
      return EMPTY_LIST;
    }
    return toList(await this.#query("search", { search }));
  }

  async listMembers({ page, pageSize } = {}) {
    return toList(await this.#query("members", { page, pageSize }));
  }

  async listTeams() {
    return toList(await this.#query("teams"));
  }

  async listTeamMembers(teamId) {
    if (!teamId) {
      return EMPTY_LIST;
    }
    return toList(await this.#query("team-members", { team_id: teamId }));
  }

  // Accepts a Veripass identity string or `{ veripassIdentity }` / `{ email }` (case-insensitive).
  async getUser(selector) {
    const veripassIdentity = typeof selector === "string" ? selector : selector?.veripassIdentity;
    const email = typeof selector === "object" ? String(selector?.email || "").trim().toLowerCase() : "";

    if (!veripassIdentity && !email) {
      return null;
    }

    const query = veripassIdentity ? { veripass_identity: veripassIdentity } : { email };

    try {
      return await this.#query("user", query);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  toSdk() {
    return {
      searchPeople: (text) => this.searchPeople(text),
      listMembers: (options) => this.listMembers(options),
      listTeams: () => this.listTeams(),
      listTeamMembers: (teamId) => this.listTeamMembers(teamId),
      getUser: (selector) => this.getUser(selector),
    };
  }
}
