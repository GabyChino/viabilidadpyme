# Viabilidad PYME — Tijuana

Aplicación web que evalúa la viabilidad de ideas de negocio para PYMES en Tijuana, Baja California, con el modelo de **10 criterios / 50 puntos** y los trámites del **RETyS** (Registro Estatal de Trámites y Servicios de Baja California). El análisis lo genera un agente de **IBM watsonx Orchestrate**.

📄 **[Acta de constitución del proyecto](ACTA-CONSTITUCION.md)**: objetivos, justificación, hitos, presupuesto, interesados y sponsor.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · React Hook Form + Zod

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # y completa las credenciales
npm run dev
```

Abre http://localhost:3000.

Sin credenciales de watsonx la app funciona en **modo simulación** y lo indica en el panel de resultados. Si las credenciales están configuradas pero el agente falla, `/api/analizar` también responde con la simulación y muestra una advertencia.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run denue:estadisticas` | Cifras de negocios de Tijuana con el DENUE (requiere `INEGI_DENUE_TOKEN`) |
| `npm run setup:agent` | Verifica credenciales de watsonx y guarda el Agent ID (`-- --test`, `-- --id <ID>`) |

## Estructura

```
src/app/                 Páginas (landing, /analizar) y rutas API
  api/analizar/          Análisis de viabilidad (agente watsonx o simulación)
  api/chat/              Chat: watsonx.ai si hay WATSONX_PROJECT_ID; si no, motor de reglas local
src/components/          Formulario por pasos, resultados, chat, landing
src/lib/watsonx.ts       Cliente de watsonx Orchestrate (token IAM, validación de la respuesta)
src/lib/data/            Índice curado de trámites usado por el chat local
agents/  tools/          Definiciones del agente y herramientas (ADK watsonx Orchestrate)
knowledge-bases/         Definición de la base de conocimiento RETyS
knowledge RETYS/         Fichas del RETyS en texto (copia local; el agente en Orchestrate tiene 242)
PROMPTS/                 Prompts de cada módulo del análisis
```

## Variables de entorno

Ver [.env.local.example](.env.local.example). Requeridas para el agente: `WATSONX_API_KEY`, `WATSONX_INSTANCE_URL`, `WATSONX_AGENT_ID`. Opcionales: `WATSONX_IAM_URL`, `WATSONX_TIMEOUT_MS`, `WATSONX_PROJECT_ID` y `WATSONX_REGION` (chat con watsonx.ai). La búsqueda de negocios, su investigación automática y el conteo de competencia cercana (negocios del mismo giro a menos de 800 m) usan el DENUE de INEGI si configuras `INEGI_DENUE_TOKEN` (gratuito, recomendado) y OpenStreetMap siempre; si una fuente no responde, se usa la otra o el análisis continúa sin la competencia. Las consultas se guardan en una caché en memoria ([src/lib/cache.ts](src/lib/cache.ts)); con varias instancias conviene cambiarla por Redis o Vercel KV. Cada análisis registra una línea JSON con `"metrica"` en los logs ([src/lib/metricas.ts](src/lib/metricas.ts)).

Antes de publicar, completa los datos del responsable en el [aviso de privacidad](src/app/privacidad/page.tsx).

## Formulario

El formulario empieza preguntando el perfil:

- **Emprendedor nuevo:** describe su idea; las preguntas usan estimaciones.
- **Negocio establecido:** puede buscar su negocio en el mapa (`/api/negocios/buscar`) o capturarlo a mano. Se le pregunta tiempo operando, situación formal y reto principal. Al elegirlo, se investiga automáticamente (`/api/negocios/investigar`: OpenStreetMap o DENUE, su sitio web y el agente IA) para prellenar el formulario, y sus datos públicos (categoría, horarios, contacto, tamaño, sitio web) se envían al agente como evidencia.
