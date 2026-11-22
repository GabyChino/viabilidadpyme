#!/usr/bin/env node
/**
 * scripts/setup-agent.mjs
 *
 * Script de setup para el agente "Asesor de Viabilidad PYME — Tijuana"
 * en IBM watsonx Orchestrate.
 *
 * Modos de uso:
 *
 *   npm run setup:agent             → verifica credenciales + muestra instrucciones
 *   npm run setup:agent -- --test   → prueba el agente con el WATSONX_AGENT_ID ya configurado
 *   npm run setup:agent -- --id <AGENT_ID>  → guarda el Agent ID en .env.local
 *
 * Nota: La API de GESTIÓN de agentes (crear/listar) de Orchestrate SaaS no está
 * expuesta públicamente. Los agentes se crean desde la UI de Orchestrate.
 * Este script verifica las credenciales, muestra instrucciones exactas,
 * y una vez que tienes el Agent ID lo guarda y verifica la conexión.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Colores ───────────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m",
  green: "\x1b[32m", cyan: "\x1b[36m",
  yellow: "\x1b[33m", red: "\x1b[31m",
  gray: "\x1b[90m", blue: "\x1b[34m",
};
const log  = (msg) => console.log(`${c.cyan}●${c.reset} ${msg}`);
const ok   = (msg) => console.log(`${c.green}✓${c.reset} ${msg}`);
const warn = (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`);
const err  = (msg) => console.error(`${c.red}✗${c.reset} ${msg}`);
const h1   = (msg) => console.log(`\n${c.bold}${c.cyan}── ${msg} ──${c.reset}\n`);
const step = (n, msg) => console.log(`\n${c.bold}${c.blue}  ${n}.${c.reset} ${msg}`);

// ── Leer .env.local ───────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    err(".env.local no encontrado.");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

// ── Escribir Agent ID en .env.local ──────────────────────────────────────────
function writeAgentId(agentId) {
  const envPath = join(ROOT, ".env.local");
  let content = readFileSync(envPath, "utf-8");
  if (content.includes("WATSONX_AGENT_ID=")) {
    content = content.replace(/WATSONX_AGENT_ID=.*/g, `WATSONX_AGENT_ID=${agentId}`);
  } else {
    content += `\nWATSONX_AGENT_ID=${agentId}\n`;
  }
  writeFileSync(envPath, content, "utf-8");
  ok(`.env.local actualizado → WATSONX_AGENT_ID=${agentId}`);
}

// ── Obtener token IAM ─────────────────────────────────────────────────────────
async function getIamToken(apiKey) {
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IAM auth failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

// ── Verificar credenciales ────────────────────────────────────────────────────
async function verificarCredenciales(env) {
  h1("Verificando credenciales IBM Cloud");

  const apiKey = env.WATSONX_API_KEY;
  const instanceUrl = env.WATSONX_INSTANCE_URL;

  if (!apiKey) {
    err("WATSONX_API_KEY no encontrado en .env.local"); process.exit(1);
  }
  if (!instanceUrl) {
    err("WATSONX_INSTANCE_URL no encontrado en .env.local"); process.exit(1);
  }

  log(`API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);
  log(`Instance URL: ${instanceUrl}`);

  log("Autenticando con IBM Cloud IAM...");
  let token;
  try {
    token = await getIamToken(apiKey);
    ok("✅ Credenciales válidas — Token IAM obtenido correctamente.");
  } catch (e) {
    err(`❌ Error de autenticación: ${e.message}`);
    err("Verifica que WATSONX_API_KEY sea correcto en .env.local");
    process.exit(1);
  }

  // Extraer el instance_id de la URL
  const instanceMatch = instanceUrl.match(/instances\/([a-f0-9-]{36})/);
  const instanceId = instanceMatch?.[1];
  if (instanceId) {
    ok(`Instance ID extraído: ${instanceId}`);
  }

  return { token, instanceId };
}

// ── Listar archivos RETyS ─────────────────────────────────────────────────────
function contarRetys() {
  const retysDir = join(ROOT, "knowledge RETYS");
  if (!existsSync(retysDir)) return 0;
  let count = 0;
  function walk(dir) {
    for (const e of readdirSync(dir)) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (e.endsWith(".txt")) count++;
    }
  }
  walk(retysDir);
  return count;
}

// ── Mostrar instrucciones para crear el agente ────────────────────────────────
function mostrarInstrucciones(instanceUrl) {
  const retysCount = contarRetys();

  console.log(`
${c.bold}${c.yellow}══════════════════════════════════════════════════════════════════
  INSTRUCCIONES: Crear el agente en watsonx Orchestrate
══════════════════════════════════════════════════════════════════${c.reset}

${c.gray}La API de creación de agentes de Orchestrate SaaS requiere la UI.
Una vez creado, el Agent ID se usa para inferencia vía API.${c.reset}
`);

  step("1", `Abre watsonx Orchestrate en tu navegador:`);
  console.log(`     ${c.cyan}${instanceUrl}${c.reset}\n`);

  step("2", `Click en ${c.bold}"Agents"${c.reset} en el menú lateral → ${c.bold}"New agent"${c.reset} o ${c.bold}"Create an agent"${c.reset}`);

  step("3", `Selecciona ${c.bold}"Create from scratch"${c.reset} y llena:`);
  console.log(`
     ${c.bold}Name:${c.reset}        Asesor de Viabilidad PYME — Tijuana
     ${c.bold}Description:${c.reset} Evalúa viabilidad de PYMEs en Tijuana, B.C. con RETyS y 10 criterios/50 pts.
     ${c.bold}Model:${c.reset}       meta-llama/llama-3-3-70b-instruct
`);

  step("4", `En ${c.bold}"Instructions" / "System Prompt"${c.reset}, pega el contenido de:`);
  console.log(`     ${c.cyan}agents/viabilidad-pyme-agent.yaml${c.reset} → sección ${c.bold}instructions:${c.reset}\n`);
  console.log(`     ${c.gray}(O ejecuta: node -e "const fs=require('fs'); const y=fs.readFileSync('agents/viabilidad-pyme-agent.yaml','utf-8'); const m=y.match(/instructions:\\s*\\|([\\s\\S]*?)(?=^#|^\\w)/m); console.log(m?.[1])")${c.reset}\n`);

  step("5", `En ${c.bold}"Knowledge"${c.reset} → ${c.bold}"Add knowledge"${c.reset} → sube los ${c.bold}${retysCount} archivos .txt${c.reset} de:`);
  console.log(`     ${c.cyan}knowledge RETYS/${c.reset}  (carpetas RETYS 1 — RETYS 12)\n`);

  step("6", `Guarda el agente → copia el ${c.bold}Agent ID${c.reset} de la URL o del panel de detalles`);
  console.log(`     La URL tendrá el formato: ${c.cyan}.../agents/${c.bold}<AGENT_ID>${c.reset}\n`);

  step("7", `Ejecuta este comando con el Agent ID que copiaste:`);
  console.log(`     ${c.bold}${c.green}npm run setup:agent -- --id <TU_AGENT_ID>${c.reset}\n`);

  console.log(`${c.yellow}══════════════════════════════════════════════════════════════════${c.reset}\n`);
}

// ── Probar el agente con un mensaje ──────────────────────────────────────────
async function testAgent(env, token) {
  h1("Probando el agente");

  const instanceUrl = env.WATSONX_INSTANCE_URL?.replace(/\/$/, "");
  const agentId = env.WATSONX_AGENT_ID;

  if (!agentId) {
    warn("WATSONX_AGENT_ID no está configurado en .env.local");
    warn("Primero ejecuta: npm run setup:agent -- --id <TU_AGENT_ID>");
    return false;
  }

  log(`Agent ID: ${agentId}`);

  // Mismo endpoint que usa la app en src/lib/watsonx.ts
  const endpoint = `${instanceUrl}/v1/orchestrate/${agentId}/chat/completions`;
  log(`Probando: ${endpoint}`);

  let res, text;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hola, ¿qué trámites necesito para abrir una taquería en Tijuana?" }],
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
    });
    text = await res.text();
  } catch (e) {
    err(`Error de red: ${e.message.slice(0, 120)}`);
    return false;
  }

  if (!res.ok) {
    err(`El agente respondió ${res.status}: ${text.slice(0, 300)}`);
    if (res.status === 404) err("Verifica WATSONX_AGENT_ID y WATSONX_INSTANCE_URL.");
    return false;
  }

  // Extraer el texto de la respuesta (string o array de items de Orchestrate)
  let contenido = text;
  try {
    const raw = JSON.parse(text)?.choices?.[0]?.message?.content;
    if (typeof raw === "string") contenido = raw;
    else if (Array.isArray(raw)) contenido = raw.map((c) => c.text ?? "").join("\n");
  } catch { /* se muestra el texto crudo */ }

  ok("✅ El agente respondió correctamente.");
  console.log(`\n${c.gray}${contenido.slice(0, 1200)}${c.reset}\n`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes("--test");
  const idIdx = args.indexOf("--id");
  const newId = idIdx !== -1 ? args[idIdx + 1] : null;

  console.log(`\n${c.bold}${c.cyan}╔══════════════════════════════════════════════════╗`);
  console.log(`║   Setup Agente Viabilidad PYME — Tijuana         ║`);
  console.log(`╚══════════════════════════════════════════════════╝${c.reset}\n`);

  const env = loadEnv();
  const { token } = await verificarCredenciales(env);

  // Modo: guardar nuevo Agent ID
  if (newId) {
    h1("Guardando Agent ID");
    writeAgentId(newId);
    // Recargar env y probar
    const updatedEnv = loadEnv();
    const success = await testAgent(updatedEnv, token);
    if (success) {
      console.log(`\n${c.bold}${c.green}✅ Setup completo — El agente está listo.${c.reset}`);
      console.log(`\n   Ejecuta: ${c.bold}npm run dev${c.reset}`);
      console.log(`   Abre:    ${c.cyan}http://localhost:3000/analizar${c.reset}\n`);
    }
    return;
  }

  // Modo: probar agente existente
  if (isTest) {
    await testAgent(env, token);
    return;
  }

  // Modo default: mostrar instrucciones
  mostrarInstrucciones(env.WATSONX_INSTANCE_URL ?? "https://api.au-syd.watson-orchestrate.cloud.ibm.com");

  // Si ya hay un Agent ID configurado, probarlo
  if (env.WATSONX_AGENT_ID) {
    warn(`Agent ID ya configurado: ${env.WATSONX_AGENT_ID}`);
    log("Probando conexión con el agente existente...");
    await testAgent(env, token);
  } else {
    console.log(`${c.gray}Cuando tengas el Agent ID, ejecuta:${c.reset}`);
    console.log(`${c.bold}  npm run setup:agent -- --id <TU_AGENT_ID>${c.reset}\n`);
  }
}

main().catch((e) => {
  err(`Error: ${e.message}`);
  process.exit(1);
});
