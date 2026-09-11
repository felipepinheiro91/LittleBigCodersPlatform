const API_URL = (import.meta.env?.VITE_API_URL ?? "http://127.0.0.1:8000/api").replace(/\/$/, "");
const SESSION_KEY = "littlebigcoders.tokens";

function describeError(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(describeError).join(" ");
  if (value && typeof value === "object") return Object.entries(value).map(([key, detail]) => `${key === "detail" ? "" : `${key}: `}${describeError(detail)}`).join(" ");
  return "Não foi possível concluir a solicitação.";
}

export function createApi({ storage = window.sessionStorage, fetcher = fetch, onExpired = () => {} } = {}) {
  let tokens;
  try { tokens = JSON.parse(storage.getItem(SESSION_KEY)); } catch { tokens = null; }
  let generation = 0;
  let refreshing = null;
  function save(next) {
    tokens = next;
    if (next) storage.setItem(SESSION_KEY, JSON.stringify(next));
    else storage.removeItem(SESSION_KEY);
  }
  function logout() {
    generation += 1;
    save(null);
    refreshing = null;
  }
  async function send(path, options = {}, access) {
    let response;
    try {
      response = await fetcher(`${API_URL}/${path}`, {
        ...options,
        headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(access ? { Authorization: `Bearer ${access}` } : {}), ...options.headers },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new Error("Não foi possível conectar à API. Verifique se o backend está disponível.");
    }
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    return { response, data };
  }
  async function request(path, options = {}) {
    const started = generation;
    const access = tokens?.access;
    let result = await send(path, options, access);
    if (started !== generation) throw new DOMException("Sessão alterada", "AbortError");
    if (result.response.status === 401 && tokens?.refresh) {
      if (tokens.access === access) {
        if (!refreshing) {
          const pending = send("token/refresh/", { method: "POST", body: { refresh: tokens.refresh } }).then(({ response, data }) => {
            if (started !== generation) throw new DOMException("Sessão alterada", "AbortError");
            if (!response.ok || !data?.access) {
              if (response.status === 401 || response.status === 400) { logout(); onExpired(); }
              throw new Error("Não foi possível renovar a sessão. Entre novamente ou tente mais tarde.");
            }
            save({ ...tokens, ...data });
          }).finally(() => { if (refreshing === pending) refreshing = null; });
          refreshing = pending;
        }
        await refreshing;
      }
      result = await send(path, options, tokens?.access);
    }
    if (started !== generation) throw new DOMException("Sessão alterada", "AbortError");
    if (result.response.status === 401) { logout(); onExpired(); }
    if (!result.response.ok) throw new Error(describeError(result.data));
    return result.data;
  }
  async function signIn(login, password) {
    logout();
    const { response, data } = await send("token/", { method: "POST", body: { login, password } });
    if (!response.ok) throw new Error(response.status === 401 ? "Login ou senha incorretos." : describeError(data));
    save(data);
    try { return await request("me/"); } catch (error) { logout(); throw error; }
  }
  return { request, signIn, logout, hasSession: () => Boolean(tokens?.refresh) };
}

export function endpoint(path, filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== "" && value != null));
  return `${path}/${params.size ? `?${params}` : ""}`;
}
