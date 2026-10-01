// Sessão = cookie assinado (HMAC-SHA256). Funciona no proxy e no servidor.
export const SESSION_COOKIE = "hgc_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

const enc = new TextEncoder();

async function hmac(data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(process.env.SESSION_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionValue() {
  const issued = Date.now().toString();
  return `${issued}.${await hmac(issued)}`;
}

export async function isValidSession(value: string | undefined) {
  if (!value || !process.env.SESSION_SECRET) return false;
  const [issued, sig] = value.split(".");
  if (!issued || !sig) return false;
  if (Date.now() - Number(issued) > SESSION_MAX_AGE * 1000) return false;
  return safeEqual(sig, await hmac(issued));
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
