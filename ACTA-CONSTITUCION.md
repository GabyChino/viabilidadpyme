# Acta de constitución del proyecto

## Viabilidad PYME Tijuana: plataforma de diagnóstico de viabilidad con inteligencia artificial

| Dato | Valor |
|---|---|
| Nombre del proyecto | Viabilidad PYME Tijuana |
| Repositorio | https://github.com/GabyChino/viabilidadpyme |
| Fecha de elaboración del acta | [completar] |
| Versión | 1.0 |
| Elaboró | [Nombre del gerente del proyecto] |

---

## 1. Gerente del proyecto asignado

**Nombre:** [Nombre del gerente del proyecto]

### Responsabilidades

- Planear, ejecutar y cerrar el proyecto dentro del alcance, tiempo y presupuesto aprobados.
- Definir y priorizar los requerimientos con base en las necesidades de los emprendedores y comerciantes de Tijuana.
- Coordinar la integración técnica: aplicación web (Next.js), agente de IA en IBM watsonx Orchestrate, base de conocimiento del RETyS y fuentes de datos abiertas (OpenStreetMap e INEGI/DENUE).
- Gestionar los riesgos del proyecto (disponibilidad de servicios en la nube, calidad de las respuestas de la IA, protección de datos).
- Asegurar la calidad mediante pruebas automáticas, revisión de accesibilidad y validación con usuarios.
- Informar el avance al sponsor y a los interesados en cada hito.
- Administrar el repositorio de código, la documentación y las credenciales de los servicios.

### Nivel de autoridad

| Ámbito | Autoridad del gerente |
|---|---|
| Decisiones técnicas (arquitectura, herramientas, librerías) | Total |
| Priorización de funcionalidades dentro del alcance aprobado | Total |
| Gasto dentro del presupuesto aprobado | Hasta el monto aprobado por partida |
| Gasto adicional o cambios al presupuesto | Requiere aprobación del sponsor |
| Cambios de alcance (nuevos módulos, nuevos municipios) | Propone; aprueba el sponsor |
| Asignación de tareas al equipo | Total |
| Publicación del sistema para uso público | Requiere aprobación del sponsor |

---

## 2. Objetivos del proyecto

### Objetivo general

Desarrollar y publicar una plataforma web gratuita que permita a emprendedores y dueños de pequeños negocios de Tijuana, Baja California, obtener en menos de un minuto un diagnóstico de viabilidad de su negocio, basado en los trámites oficiales del RETyS de Baja California y en datos de competencia de su zona, mediante un agente de inteligencia artificial.

### Objetivos específicos

1. **Diagnóstico con IA:** integrar un agente de IBM watsonx Orchestrate que evalúe cada negocio con un modelo de 10 criterios (50 puntos) y devuelva fortalezas, riesgos, incertidumbres y siguientes pasos.
2. **Trámites oficiales:** incorporar al agente una base de conocimiento con las 242 fichas de trámites del RETyS de Baja California, para identificar los trámites aplicables a cada giro con su costo, plazo y dependencia.
3. **Dos perfiles de usuario:** ofrecer un formulario adaptado al emprendedor nuevo y otro al negocio en operación.
4. **Llenado automático:** permitir que un negocio en operación se busque en el mapa y que el sistema investigue sus datos públicos para prellenar el formulario.
5. **Competencia cercana:** medir los negocios del mismo giro en un radio de 800 m usando OpenStreetMap y el DENUE de INEGI.
6. **Calidad y confianza:** lograr que al menos el 90% de los análisis sean generados por el agente (no por el modo de respaldo), con pruebas automáticas, accesibilidad y aviso de privacidad.
7. **Publicación:** publicar el código en GitHub y la aplicación en internet con acceso gratuito y sin registro.

---

## 3. Justificación del proyecto

Abrir o formalizar un negocio en Tijuana implica conocer múltiples trámites municipales, estatales y federales, cuyos requisitos, costos y plazos están dispersos en distintas dependencias. Para un emprendedor o un pequeño comerciante, entender qué trámites le aplican, cuánta competencia tiene en su zona y qué tan viable es su negocio normalmente requiere contratar una consultoría o invertir mucho tiempo en investigar.

Esta falta de información accesible provoca que:

- Muchos negocios abran sin haber evaluado su viabilidad, lo que aumenta el riesgo de cierre temprano.
- Los negocios en operación permanezcan en la informalidad por desconocimiento de los trámites, lo que limita su acceso a crédito y los expone a sanciones.
- Las decisiones de ubicación se tomen sin conocer la competencia cercana.

El proyecto se justifica porque:

- **Aprovecha información oficial y abierta** que ya existe (RETyS de Baja California, DENUE de INEGI, OpenStreetMap) y la presenta de forma sencilla.
- **Reduce el tiempo y el costo del diagnóstico:** de días de investigación o el pago de una consultoría a menos de un minuto y sin costo.
- **Usa inteligencia artificial de forma responsable:** el agente basa sus respuestas en fichas oficiales, el sistema indica las fuentes y el usuario siempre puede revisar y corregir los datos.
- **Apoya la formalización:** a los negocios en operación les señala los trámites que probablemente les faltan.

> Nota: las cifras de negocios formales e informales de Tijuana se calcularán con el DENUE de INEGI (`npm run denue:estadisticas`) para citarlas con fuente oficial.

---

## 4. Descripción general del proyecto

Viabilidad PYME Tijuana es una aplicación web que guía al usuario en cuatro pasos:

1. **Elige su perfil:** emprendedor nuevo o negocio en operación.
2. **Busca su negocio en el mapa** (si ya opera) o captura sus datos a mano.
3. **El formulario se llena solo:** el sistema investiga los datos públicos del negocio (OpenStreetMap, DENUE y su sitio web) y la IA redacta la descripción; el usuario revisa y completa sus datos financieros.
4. **Recibe su diagnóstico:** puntaje de viabilidad, trámites del RETyS, competencia cercana, riesgos y siguientes pasos, y puede conversar con el asesor de IA.

### Alcance

| Incluido | Fuera del alcance (fases futuras) |
|---|---|
| Municipio de Tijuana, B.C. | Otros municipios o estados |
| Diagnóstico con modelo de 10 criterios | Módulo de financiamiento (NAFIN, Fondo PyME) |
| Trámites del RETyS de Baja California | Realización de trámites en línea |
| Competencia en un radio de 800 m | Estudios de mercado o flujo peatonal |
| Chat con el asesor de IA | Cuentas de usuario e historial en la nube |
| Exportación del resultado por impresión o PDF | Aplicación móvil nativa |

### Componentes técnicos

| Componente | Tecnología |
|---|---|
| Aplicación web | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Agente de IA | IBM watsonx Orchestrate (con watsonx.ai como respaldo del chat) |
| Base de conocimiento | 242 fichas del RETyS de Baja California |
| Datos de negocios | OpenStreetMap (Nominatim) e INEGI DENUE |
| Pruebas | Vitest (44 pruebas unitarias) |
| Código fuente | GitHub |
| Publicación | Vercel (propuesto) |

---

## 5. Resumen de los hitos más importantes del cronograma

| # | Hito | Entregable | Estado |
|---|---|---|---|
| H1 | Inicio y planeación | Acta de constitución y plan del proyecto | [completar fecha] |
| H2 | Agente de IA configurado | Agente en watsonx Orchestrate con la base de 242 fichas del RETyS | Completado |
| H3 | Aplicación base | Formulario de 5 pasos, análisis con el agente y panel de resultados | Completado |
| H4 | Perfiles de usuario | Formulario para emprendedor nuevo y negocio en operación | Completado |
| H5 | Integración con mapas | Búsqueda del negocio en OpenStreetMap y competencia cercana | Completado |
| H6 | Llenado automático | Investigación del negocio y prellenado con IA | Completado |
| H7 | Calidad | Accesibilidad, guardado del avance, pruebas automáticas, aviso de privacidad | Completado |
| H8 | Integración con DENUE | Búsqueda y competencia con el directorio oficial de INEGI | Programado; falta activar el token |
| H9 | Página de presentación | Landing con demo animada | Completado |
| H10 | Código publicado | Repositorio en GitHub | Completado (22 de noviembre de 2026) |
| H11 | Publicación en internet | Aplicación disponible en Vercel | Pendiente |
| H12 | Validación con usuarios y cierre | Pruebas con comerciantes, informe final y aprobación del sponsor | Pendiente |

---

## 6. Resumen del presupuesto

Presupuesto estimado en pesos mexicanos (MXN) para el desarrollo y el primer año de operación. Los servicios de datos (RETyS, INEGI DENUE y OpenStreetMap) son gratuitos.

| Partida | Supuesto | Monto estimado (MXN) |
|---|---|---|
| Desarrollo de software | [completar horas] h × [completar tarifa] MXN/h | [completar] |
| Gestión del proyecto | [completar horas] h × [completar tarifa] MXN/h | [completar] |
| IBM watsonx Orchestrate y watsonx.ai | Según el plan contratado en IBM Cloud | [completar] |
| Hospedaje web (Vercel) | Plan gratuito en la etapa inicial | 0 |
| Dominio de internet (.mx) | 1 año | [completar] |
| Datos (RETyS, DENUE, OpenStreetMap) | Servicios públicos y gratuitos | 0 |
| Validación con usuarios | Sesiones con comerciantes (traslados, materiales) | [completar] |
| Contingencia (10%) | Sobre el subtotal | [completar] |
| **Total** | | **[completar]** |

> Las tarifas de IBM Cloud dependen del plan y del volumen de uso; deben consultarse en la página oficial de IBM antes de aprobar el presupuesto.

---

## 7. Lista de stakeholders o interesados

| Interesado | Rol en el proyecto | Interés | Influencia |
|---|---|---|---|
| Sponsor ([completar]) | Autoriza el proyecto, el presupuesto y los cambios de alcance | Alto | Alta |
| Gerente del proyecto | Dirige la planeación y la ejecución | Alto | Alta |
| Equipo de desarrollo | Construye y prueba la plataforma | Alto | Media |
| Emprendedores de Tijuana | Usuarios principales: validan su idea antes de invertir | Alto | Media |
| Dueños de negocios en operación | Usuarios principales: conocen los trámites que les faltan | Alto | Media |
| Consultores e incubadoras | Usuarios secundarios: diagnóstico inicial de proyectos | Medio | Baja |
| Cámaras de comercio e instituciones de apoyo PYME | Posibles aliados para difundir la herramienta | Medio | Media |
| Gobierno de Baja California (RETyS) | Fuente oficial de los trámites | Medio | Alta |
| Ayuntamiento de Tijuana | Autoridad de los trámites municipales | Medio | Alta |
| INEGI | Proveedor del DENUE | Bajo | Media |
| Comunidad de OpenStreetMap | Proveedor de datos abiertos de negocios | Bajo | Baja |
| IBM | Proveedor de la plataforma de IA | Bajo | Alta |
| Docente / evaluador | Evalúa el proyecto en el ámbito académico | Alto | Alta |

---

## 8. Requerimientos para la aprobación del proyecto

El proyecto se considerará aprobado y concluido cuando se cumplan los siguientes criterios:

**Funcionales**

- [ ] El usuario puede completar el diagnóstico con ambos perfiles (emprendedor nuevo y negocio en operación).
- [ ] El análisis devuelve puntaje de 10 criterios, trámites del RETyS, fortalezas, riesgos y siguientes pasos.
- [ ] La búsqueda del negocio en el mapa y el llenado automático funcionan con negocios reales de Tijuana.
- [ ] Se muestra la competencia cercana del mismo giro.
- [ ] El chat con el asesor responde preguntas sobre el diagnóstico.

**De calidad**

- [ ] Al menos el 90% de los análisis de prueba los genera el agente de IA (no el modo de respaldo).
- [ ] El diagnóstico se entrega en menos de 60 segundos.
- [ ] Las pruebas automáticas pasan en su totalidad (`npm test`).
- [ ] La aplicación funciona en celular y en computadora, en modo claro y oscuro.
- [ ] El formulario es accesible con lector de pantalla y teclado.

**Legales y de seguridad**

- [ ] El aviso de privacidad está completo con los datos del responsable.
- [ ] Ninguna clave de acceso está publicada en el repositorio.

**Administrativos**

- [ ] El proyecto se mantiene dentro del presupuesto aprobado (±10%).
- [ ] La documentación (README y esta acta) está actualizada.
- [ ] El sponsor firma la aceptación del entregable final.

---

## 9. Sponsor del proyecto

| Dato | Valor |
|---|---|
| Nombre | [Nombre del sponsor] |
| Cargo / institución | [completar] |
| Nivel de autorización | Aprueba el acta de constitución, el presupuesto, los cambios de alcance y el cierre del proyecto. Puede detener o reorientar el proyecto. |

### Firmas de autorización

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Sponsor | [completar] | | |
| Gerente del proyecto | [completar] | | |
