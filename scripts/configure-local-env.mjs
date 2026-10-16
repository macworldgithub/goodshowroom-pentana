import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

const destination = new URL("../.env.local", import.meta.url);
const backend = new URL("../../goodshowroom-pentana-backend/.env", import.meta.url);
if (existsSync(destination)) {
  throw new Error(".env.local already exists; update it directly to preserve your local settings.");
}
if (!existsSync(backend)) {
  throw new Error("Configure goodshowroom-pentana/.env.local using .env.example and your Supabase public settings.");
}
const settings = parseEnv(readFileSync(backend, "utf8"));
const url = settings.SUPABASE_URL?.trim();
const key = (settings.SUPABASE_PUBLISHABLE_KEY || settings.SUPABASE_ANON_KEY)?.trim();
let publicKey = key?.startsWith("sb_publishable_") ?? false;
if (key?.startsWith("eyJ")) {
  try {
    publicKey = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8")).role === "anon";
  } catch { /* A malformed JWT must never be copied into browser configuration. */ }
}
if (!url || !publicKey) {
  throw new Error("The backend needs SUPABASE_URL and a public anon/publishable key. Server secret keys cannot be used in the browser.");
}
const parsed = new URL(url);
if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) {
  throw new Error("SUPABASE_URL must be an HTTP(S) URL without credentials.");
}
const port = settings.PORT || "4000";
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error("Invalid backend PORT.");
// Explicit allowlist: never copy service-role, database, SMTP or integration secrets.
writeFileSync(destination, [
  `NEXT_PUBLIC_SUPABASE_URL=${JSON.stringify(url)}`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${JSON.stringify(key)}`,
  `BACKEND_API_URL=http://localhost:${port}/api`,
  "",
].join("\n"), { flag: "wx" });
console.log(`Created ${fileURLToPath(destination)} using public Supabase settings only. Restart Next.js to load them.`);
