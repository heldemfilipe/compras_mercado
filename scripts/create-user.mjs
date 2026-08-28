#!/usr/bin/env node
/**
 * Cria um usuário no Supabase Auth (sem cadastro aberto no app).
 *
 * Uso:
 *   node --env-file=.env.local scripts/create-user.mjs <email> <senha> ["Nome"]
 *
 * Precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.
 */
import { createClient } from "@supabase/supabase-js";

const [email, password, displayName] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    'Uso: node --env-file=.env.local scripts/create-user.mjs <email> <senha> ["Nome"]',
  );
  process.exit(1);
}

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltando NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.",
  );
  console.error("Copie .env.example para .env.local e preencha os valores.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: displayName ? { display_name: displayName } : undefined,
});

if (error) {
  console.error("Erro:", error.message);
  process.exit(1);
}

console.log(`✔ Usuário criado: ${data.user.email}`);
console.log("Agora é só entrar no app com esse e-mail e senha.");
