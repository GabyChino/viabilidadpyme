# Plan de Desarrollo — PYME Digital Tijuana

## Resumen

Plataforma web para ayudar a comerciantes informales de Tijuana, B.C. a proteger, conocer y formalizar su negocio. El frontend ya existe (Next.js 15 + Tailwind + React Hook Form + Zod). Este plan cubre el desarrollo de los 4 módulos funcionales, la integración con fuentes de datos reales y el agente IBM watsonx Orchestrate.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · Leaflet.js · IBM watsonx Orchestrate · SESNSP · DENUE/INEGI · RETYS · NAFIN · Power BI Embedded

**Contexto de archivos clave:**
- `src/lib/constants.ts` — COLONIAS_TIJUANA (22 zonas), GIROS_COMERCIALES, MUNICIPIO_FOCO
- `src/lib/types.ts` — FormularioData (schema Zod), ResultadoAnalisis
- `src/app/api/analizar/route.ts` — BFF endpoint (hoy simulado, se reemplazará por llamadas reales)
- `src/app/analizar/page.tsx` — Página del formulario + resultados
- `src/components/PanelResultados.tsx` — Panel de resultados (se extenderá con módulos)

---

## Sub-Tarea 1 — Módulo de Seguridad

**Status:** [ ] pending

### Intent
Mostrar al comerciante el nivel de riesgo delictivo real de su colonia en Tijuana, con un mapa de calor interactivo y protocolos de actuación ante extorsión. La seguridad es la barrera #1 para la formalización.

### Expected Outcomes
- Nueva ruta `/seguridad` con dashboard completo del módulo
- Mapa de calor interactivo (Leaflet.js) con puntos de incidencia por colonia
- Cards de estadísticas: índice de robos, asaltos, extorsiones por zona
- Sección de protocolos antiextorsión con guías paso a paso
- Botón de denuncia directa al 089 y enlace al C5 B.C.
- API route `/api/seguridad?colonia=zona_rio` que devuelve datos por colonia
- Datos del SESNSP integrados como dataset estático JSON (no hay API REST pública del SESNSP — se usa el dataset descargable procesado)
- Navegación desde el panel de resultados del formulario

### Todo List
1. Instalar Leaflet.js y tipos: `npm install leaflet react-leaflet @types/leaflet`
2. Crear `src/lib/data/sesnsp-tijuana.ts` — dataset estático con incidencia delictiva por colonia (fuente: SESNSP datos abiertos procesados para Tijuana)
3. Crear `src/app/api/seguridad/route.ts` — GET endpoint que recibe `?colonia=` y devuelve stats + coordenadas del polígono
4. Crear `src/components/seguridad/MapaCalor.tsx` — mapa Leaflet con círculos de calor por colonia, leyenda y tooltip al hover
5. Crear `src/components/seguridad/StatsSeguridad.tsx` — cards con índice de robos, asaltos, extorsiones y nivel de riesgo (bajo/medio/alto)
6. Crear `src/components/seguridad/ProtocolosPanel.tsx` — acordeón con protocolos: qué hacer ante cobro de piso, números de emergencia, denuncia 089, C5 B.C.
7. Crear `src/app/seguridad/page.tsx` — página que recibe `?colonia=` como query param y ensambla los 3 componentes
8. Agregar a `ResultadoAnalisis` en `types.ts`: campo `seguridadColonia` con el resumen de riesgo
9. Extender `PanelResultados.tsx` con card de seguridad que enlaza a `/seguridad?colonia=X`
10. Agregar link "Ver mapa de seguridad" en la navegación del formulario

### Relevant Context
- `src/lib/constants.ts` — COLONIAS_TIJUANA tiene los valores exactos a usar como keys del dataset
- `src/components/PanelResultados.tsx` — aquí se agrega la card de seguridad
- `src/lib/types.ts` — extender `ResultadoAnalisis` con `seguridadColonia`
- `src/app/api/analizar/route.ts` — incluir datos de seguridad en la respuesta del análisis

---

## Sub-Tarea 2 — Módulo de Potencial Comercial

**Status:** [ ] pending

### Intent
Dar al comerciante una imagen clara del mercado local: cuánta competencia tiene en su zona (vía DENUE/INEGI), qué tan transitada es la zona y si su giro tiene demanda digital en Tijuana.

### Expected Outcomes
- Nueva ruta `/mercado` con dashboard del módulo
- Card de análisis DENUE: número de negocios del mismo giro en radio de 500m/1km
- Card de flujo peatonal estimado basado en puntos de transporte y densidad poblacional INEGI
- Card de expansión digital: si el giro tiene búsquedas activas en Tijuana (Google Trends proxy)
- API route `/api/mercado?colonia=&giro=` que devuelve datos del DENUE procesados
- Dataset DENUE de Tijuana procesado como JSON estático por giro + colonia
- Integración futura con Google Places API (placeholder con estructura lista)

### Todo List
1. Crear `src/lib/data/denue-tijuana.ts` — dataset estático del DENUE con conteo de unidades económicas por giro y colonia en Tijuana (fuente: INEGI DENUE descarga estatal)
2. Crear `src/lib/data/flujo-peatonal.ts` — dataset estático con estimaciones de flujo peatonal por colonia (basado en paradas de transporte, escuelas, centros comerciales conocidos)
3. Crear `src/app/api/mercado/route.ts` — GET endpoint `?colonia=&giro=` que devuelve: competidores DENUE, flujo peatonal, saturación del mercado
4. Crear `src/components/mercado/CompetenciaCard.tsx` — muestra número de competidores, nivel de saturación (bajo/medio/alto) y recomendación de zona alternativa
5. Crear `src/components/mercado/FlujoPeatonalCard.tsx` — estimación de personas/día en la zona con factores: transporte, escuelas, comercios ancla
6. Crear `src/components/mercado/ExpansionDigitalCard.tsx` — evalúa si el giro requiere tarjeta, delivery o e-commerce según el perfil de la zona
7. Crear `src/app/mercado/page.tsx` — página que ensambla los 3 componentes, recibe `?colonia=&giro=`
8. Extender `ResultadoAnalisis` en `types.ts` con campo `mercado` (competidores, flujo, saturación)
9. Extender `PanelResultados.tsx` con card de potencial comercial enlazando a `/mercado?colonia=X&giro=Y`

### Relevant Context
- `src/lib/constants.ts` — GIROS_COMERCIALES y COLONIAS_TIJUANA son las keys del dataset
- DENUE Tijuana disponible en: https://www.inegi.org.mx/app/mapa/denue/ (descarga por estado)
- Flujo peatonal: estimación basada en densidad INEGI + puntos conocidos de TJ (Zona Río, Centro, La Mesa)

---

## Sub-Tarea 3 — Tramitómetro

**Status:** [ ] pending

### Intent
Dar al comerciante informal la ruta exacta de trámites para formalizar su negocio específico en Tijuana, explicada en lenguaje simple. Eliminar el miedo a lo burocrático mostrando que es manejable y digital.

### Expected Outcomes
- Nueva ruta `/tramites` con el tramitómetro interactivo
- Búsqueda por giro + resultado: lista ordenada de trámites con estado (pendiente/completado)
- Cada trámite con: nombre, descripción simple, costo estimado, tiempo, enlace digital oficial
- "Traductor legal": explicación de RESICO y SAS en lenguaje coloquial
- Checklist guardable en localStorage para que el usuario retome su progreso
- API route `/api/tramites?giro=` que devuelve la ruta de trámites
- Dataset de trámites RETYS/Ayuntamiento Tijuana procesado por giro

### Todo List
1. Crear `src/lib/data/tramites-tijuana.ts` — dataset de trámites por giro: RFC SAT, licencia Ayuntamiento Tijuana, aviso SARE, permisos COFEPRIS (si aplica), registro IMSS
2. Crear `src/lib/data/regimenes-fiscales.ts` — explicaciones de RESICO, RIF (en extinción), Persona Física actividad empresarial, SAS en lenguaje simple con ejemplos numéricos
3. Crear `src/app/api/tramites/route.ts` — GET `?giro=` devuelve lista de trámites ordenada por prioridad
4. Crear `src/components/tramites/TramiteItem.tsx` — item de tramite con checkbox, nombre, descripción, costo, tiempo y link
5. Crear `src/components/tramites/TramitesList.tsx` — lista completa con progreso (X de Y completados), barra de progreso y persistencia en localStorage
6. Crear `src/components/tramites/TraductorLegal.tsx` — tarjetas de regímenes fiscales con comparador: "si facturas menos de X al mes, el RESICO te conviene porque..."
7. Crear `src/app/tramites/page.tsx` — página que recibe `?giro=` y ensambla los componentes
8. Extender `PanelResultados.tsx` con card del tramitómetro mostrando cuántos trámites quedan y enlazando a `/tramites?giro=X`

### Relevant Context
- Trámites Tijuana: https://tramites.tijuana.gob.mx (portal del Ayuntamiento)
- SARE Tijuana: apertura express de negocios de bajo riesgo
- RETYS: https://www.gob.mx/tramites — filtrar por Tijuana/B.C.
- SAT RESICO: régimen simplificado de confianza, 1-2.5% sobre ingresos

---

## Sub-Tarea 4 — Módulo de Beneficios Reales

**Status:** [ ] pending

### Intent
Conectar al comerciante con recursos financieros reales: seguros comerciales accesibles y créditos de la banca de desarrollo. Demostrar con números que formalizarse tiene beneficios concretos e inmediatos.

### Expected Outcomes
- Nueva ruta `/beneficios` con el módulo de beneficios
- Cotizador de seguros: dado el valor del inventario/activos, muestra costo mensual de póliza básica
- Comparador: "perder todo sin seguro vs. pagar $X/mes"
- Directorio de programas de crédito: NAFIN, INADEM, Fondo PyME, apoyos estatales B.C.
- Filtro por monto solicitado y sector
- API route `/api/beneficios?giro=&capital=` que devuelve programas elegibles
- Dataset de programas de apoyo procesado y actualizado

### Todo List
1. Crear `src/lib/data/programas-credito.ts` — dataset de programas: NAFIN Cadenas Productivas, Crédito Joven, Fondo PyME B.C., Mujeres PYME, con requisitos y montos
2. Crear `src/lib/data/seguros-comerciales.ts` — dataset de tipos de póliza: contra robo, incendio, responsabilidad civil, con rangos de costo mensual por valor asegurado
3. Crear `src/app/api/beneficios/route.ts` — GET `?giro=&capital=` devuelve programas elegibles filtrados
4. Crear `src/components/beneficios/CotizadorSeguros.tsx` — slider de valor de activos → cálculo de costo estimado de póliza con visualización comparativa
5. Crear `src/components/beneficios/ProgramaCredito.tsx` — card de programa con logo, monto, tasa, requisitos y botón de aplicar
6. Crear `src/components/beneficios/ProgramasGrid.tsx` — grid de programas filtrados por perfil del negocio
7. Crear `src/app/beneficios/page.tsx` — página que recibe `?giro=&capital=` y ensambla los componentes
8. Extender `PanelResultados.tsx` con card de beneficios mostrando N programas disponibles y enlazando a `/beneficios`

### Relevant Context
- NAFIN: https://www.nafin.com/portalnf/content/home/home.html
- Fondo PyME B.C.: programas estatales de Baja California
- Seguros: GNP, Mapfre, HDI tienen productos para comercios desde $300/mes

---

## Sub-Tarea 5 — Integración IBM watsonx Orchestrate

**Status:** [ ] pending

### Intent
Reemplazar el endpoint simulado `/api/analizar` con llamadas reales al agente IBM watsonx Orchestrate, que orquesta las consultas a todos los módulos y genera el análisis completo con lenguaje natural.

### Expected Outcomes
- `/api/analizar` llama al agente watsonx con el contexto del formulario
- El agente ejecuta skills: `analizar_seguridad`, `analizar_mercado`, `obtener_tramites`, `obtener_beneficios`
- Respuesta enriquecida con datos reales de los 4 módulos
- Variables de entorno: `WATSONX_API_KEY`, `WATSONX_INSTANCE_URL`, `WATSONX_AGENT_ID`

### Todo List
1. Agregar variables de entorno en `.env.local`: `WATSONX_API_KEY`, `WATSONX_INSTANCE_URL`, `WATSONX_AGENT_ID`
2. Crear `src/lib/watsonx.ts` — cliente HTTP para autenticar y llamar al agente via REST
3. Crear `src/lib/skills/` — definiciones OpenAPI de cada skill (seguridad, mercado, tramites, beneficios)
4. Actualizar `src/app/api/analizar/route.ts` — reemplazar simulación por llamada real al agente
5. Actualizar `ResultadoAnalisis` en `types.ts` con campos completos de los 4 módulos
6. Actualizar `PanelResultados.tsx` para mostrar resultados enriquecidos

### Relevant Context
- IBM watsonx Orchestrate docs: https://www.ibm.com/products/watsonx-orchestrate
- Auth: IBM Cloud IAM token via `POST https://iam.cloud.ibm.com/identity/token`
- Skills se registran como herramientas OpenAPI en el agente

---

## Sub-Tarea 6 — Power BI Embedded

**Status:** [ ] pending

### Intent
Integrar reportes visuales de Power BI en el panel de resultados para mostrar gráficas interactivas de competencia, seguridad y flujo peatonal por colonia.

### Expected Outcomes
- Componente `PowerBIEmbed.tsx` que renderiza un reporte embebido
- Reporte de seguridad: mapa de calor y barras de incidencia por zona
- Reporte de mercado: distribución de competencia y flujo peatonal
- Token de embed generado en el servidor (no expuesto al cliente)
- Variables de entorno: `POWERBI_TENANT_ID`, `POWERBI_CLIENT_ID`, `POWERBI_CLIENT_SECRET`, `POWERBI_WORKSPACE_ID`

### Todo List
1. Instalar SDK: `npm install powerbi-client powerbi-client-react`
2. Agregar variables de entorno de Power BI en `.env.local`
3. Crear `src/app/api/powerbi-token/route.ts` — endpoint servidor que genera el embed token via Azure AD
4. Crear `src/components/PowerBIEmbed.tsx` — componente cliente que carga el reporte con el token
5. Diseñar 2 reportes en Power BI Desktop: Seguridad-Tijuana y Mercado-Tijuana con los datasets estáticos
6. Publicar reportes en workspace de Power BI y agregar IDs en `.env.local`
7. Integrar `PowerBIEmbed` en `PanelResultados.tsx` reemplazando el placeholder actual

### Relevant Context
- `src/components/PanelResultados.tsx` líneas 143-167: placeholder actual de Power BI listo para reemplazar
- Power BI Embedded requiere licencia Azure (SKU A1 mínimo para producción, gratis en desarrollo con cuenta educativa)

---

## Sub-Tarea 7 — Deploy y variables de entorno

**Status:** [ ] pending

### Intent
Desplegar la aplicación en producción con todas las integraciones configuradas.

### Expected Outcomes
- Deploy en Vercel con variables de entorno configuradas
- Dominio personalizado (ej: pymedigital.mx o tijuana.pymedigital.mx)
- CI/CD automático desde la rama main
- Health check de todos los endpoints

### Todo List
1. Crear `.env.local.example` con todas las variables requeridas documentadas
2. Crear `vercel.json` con configuración de build y rutas
3. Conectar repositorio GitHub a Vercel
4. Configurar variables de entorno en dashboard de Vercel
5. Ejecutar deploy y verificar todas las rutas
6. Agregar monitoring básico con Vercel Analytics

### Relevant Context
- Variables requeridas: `WATSONX_API_KEY`, `WATSONX_INSTANCE_URL`, `WATSONX_AGENT_ID`, `POWERBI_TENANT_ID`, `POWERBI_CLIENT_ID`, `POWERBI_CLIENT_SECRET`, `POWERBI_WORKSPACE_ID`
