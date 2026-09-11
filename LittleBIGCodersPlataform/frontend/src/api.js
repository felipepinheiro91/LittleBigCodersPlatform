const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

export async function signIn(login, password) {
  const response = await fetch(`${API_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });

  if (!response.ok) throw new Error("Login ou senha incorretos.");
  const tokens = await response.json();
  const me = await fetch(`${API_URL}/me/`, {
    headers: { Authorization: `Bearer ${tokens.access}` },
  });

  if (!me.ok) throw new Error("Não foi possível carregar o perfil.");
  return { tokens, user: await me.json() };
}
