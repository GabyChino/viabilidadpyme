# Plan de Mejoras UI — PYME Digital Tijuana

## Resumen

Correcciones y mejoras de interfaz en 6 puntos específicos del proyecto: Hero, sección Para Quién, indicador de progreso del formulario, Navbar, Footer y ancho del formulario en desktop. Todos los cambios son cosméticos o de UX — no alteran lógica de negocio ni tipos.

**Archivos involucrados:**
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/ParaQuienSection.tsx`
- `src/components/landing/NavbarLanding.tsx`
- `src/components/landing/FooterLanding.tsx`
- `src/components/IndicadorPasos.tsx`
- `src/app/analizar/page.tsx`

---

## Sub-Tarea 3 — Hero: CTA más claro y visible

**Status:** [ ] pending

### Intent
El Hero ya tiene dos botones ("Iniciar diagnóstico gratis" y "Ver los módulos"), pero el CTA primario no se distingue suficientemente del secundario ni comunica urgencia o beneficio concreto. Se refuerza visualmente y se agrega un micro-dato de credibilidad debajo del botón.

### Expected Outcomes
- El botón primario es más grande y prominente (tamaño, sombra, padding)
- Se agrega una línea de credibilidad debajo del CTA: "Sin registro · 5 minutos · 100% gratuito"
- El botón secundario se mantiene pero queda claramente subordinado

### Todo List
1. En `HeroSection.tsx`, aumentar el padding del botón primario (`px-8 py-4`) y agregar `shadow-lg`
2. Agregar debajo del grupo de botones una línea `<p>` con los 3 micro-datos separados por `·`
3. Estilizar esa línea con `text-xs text-content-3 mt-3`
4. En la card "Qué incluye el diagnóstico" (`HeroSection.tsx` columna derecha), centrar el contenido interno: agregar `text-center` al `<p>` del título y `items-center` al `<div className="flex flex-col gap-3">` que contiene los ítems, de modo que el texto e íconos queden centrados dentro de la card sin moverla de posición

### Relevant Context
- `src/components/landing/HeroSection.tsx` líneas 32–44 — bloque de los dos botones CTA

---

## Sub-Tarea 4 — Para Quién: contenido específico por perfil

**Status:** [ ] pending

### Intent
La sección muestra 4 perfiles (Emprendedores, Consultores, Incubadoras, Instituciones) con texto genérico. Se reemplaza la descripción de cada tarjeta con un escenario concreto en primera persona que resuene directamente con el usuario.

### Expected Outcomes
- Cada tarjeta tiene una descripción reescrita en lenguaje directo y situacional
- Los bullets de cada tarjeta son acciones concretas, no características abstractas
- El encabezado de sección refleja mejor a quién se habla

### Todo List
1. En `ParaQuienSection.tsx`, actualizar el array `PERFILES` con nuevas descripciones:
   - **Emprendedores:** "Tienes una idea pero no sabes si vale la pena invertir en esa colonia. En 5 minutos obtienes datos reales de competencia, trámites y financiamiento."
   - **Consultores:** "Tus clientes te piden análisis locales. Genera diagnósticos basados en INEGI y DENUE sin hacer la búsqueda manualmente."
   - **Incubadoras:** "Evalúas decenas de proyectos al mes. Usa criterios objetivos y datos oficiales para priorizar cuáles acompañar."
   - **Instituciones:** "Ofrece a tus comerciantes una herramienta gratuita de diagnóstico con datos del Ayuntamiento de Tijuana integrados."
2. Actualizar bullets de cada perfil con verbos de acción específicos
3. Cambiar el subtítulo del header de sección a: "Hecha para quien necesita tomar decisiones con datos reales"

### Relevant Context
- `src/components/landing/ParaQuienSection.tsx` líneas 4–21 — array `PERFILES`
- `src/components/landing/ParaQuienSection.tsx` líneas 44–50 — header de sección

---

## Sub-Tarea 5 — Formulario: indicador de progreso visible al cargar

**Status:** [ ] pending

### Intent
El `IndicadorPasos` ya existe y funciona, pero en la página `/analizar` el formulario arranca sin que el usuario vea el indicador hasta hacer scroll. Además, en desktop el indicador de barra de progreso mobile está oculto pero no hay ningún equivalente visual inmediato. Se asegura que el indicador sea lo primero visible y que la barra de progreso sea visible en todas las resoluciones.

### Expected Outcomes
- El indicador de pasos se muestra en la parte superior del área del formulario, siempre visible sin scroll
- Se agrega una barra de progreso delgada también en desktop, debajo de los círculos
- El paso 1 ya muestra la barra al 20% (1 de 5), no vacía

### Todo List
1. En `IndicadorPasos.tsx`, agregar debajo del bloque desktop una barra de progreso `h-1 bg-border rounded-full` con fill `bg-brand-600` igual que en mobile — visible también en `md:`
2. Ajustar el cálculo de ancho de barra a `(pasoActual / totalPasos) * 100%` para que el paso 1 ya muestre progreso
3. En `analizar/page.tsx`, verificar que el `<FormularioViabilidad>` no quede por debajo del fold en móvil — mover el bloque de título (`h2` + `p`) a un tamaño más compacto si es necesario (`text-xl` en lugar de `text-2xl`)

### Relevant Context
- `src/components/IndicadorPasos.tsx` líneas 56–63 — barra de progreso mobile (replicar para desktop)
- `src/app/analizar/page.tsx` líneas 80–87 — bloque de título antes del formulario

---

## Sub-Tarea 6 — Navbar: indicador de sección activa

**Status:** [ ] pending

### Intent
Los links del Navbar no tienen ningún estado visual activo. Al hacer scroll a una sección o al estar en ella, el usuario no sabe dónde está dentro de la página. Se agrega resaltado con `IntersectionObserver` para la sección visible.

### Expected Outcomes
- El link del Navbar correspondiente a la sección en pantalla se muestra con `text-content` y un subrayado o dot indicador
- El estado activo se actualiza dinámicamente al hacer scroll
- En mobile, el menú desplegable también aplica el estado activo

### Todo List
1. En `NavbarLanding.tsx`, agregar un `useState<string>` para `seccionActiva`
2. Agregar un `useEffect` con `IntersectionObserver` que observe los ids `#modulos`, `#para-quien`, `#fuentes` y actualice `seccionActiva` cuando cada uno entre al viewport (threshold 0.4)
3. En el render de links, agregar clase condicional: si `l.href === '#' + seccionActiva`, aplicar `text-content font-semibold` y un `border-b-2 border-brand-500 pb-0.5`
4. Aplicar el mismo estado en el menú mobile

### Relevant Context
- `src/components/landing/NavbarLanding.tsx` líneas 9–16 — array `links`
- `src/components/landing/NavbarLanding.tsx` líneas 34–38 — render de links desktop
- `src/components/landing/NavbarLanding.tsx` líneas 70–78 — render de links mobile

---

## Sub-Tarea 7 — Footer: contenido más completo

**Status:** [ ] pending

### Intent
El footer actual tiene 4 columnas pero el contenido es escaso y los links de "Módulos" apuntan todos a `#modulos`. Se enriquece con información de contacto/institución, se corrigen los hrefs y se agrega una línea de tecnologías usadas.

### Expected Outcomes
- La columna "Módulos" tiene links que apuntan a las rutas reales (`/seguridad`, `/mercado`, `/tramites`, `/beneficios`) con un badge "Próximamente" en gris
- Se agrega en la columna "Plataforma" el link a `#como-funciona`
- El pie del footer incluye una línea secundaria con "Construido con Next.js · IBM watsonx · Power BI"
- La columna de marca incluye el nombre de la institución o equipo

### Todo List
1. En `FooterLanding.tsx`, actualizar los hrefs de la columna "Módulos" a sus rutas reales y agregar un `<span>` de badge "Próximamente" (`text-[10px] bg-surface-3 text-content-3 px-1.5 py-0.5 rounded ml-1`)
2. Agregar en columna "Plataforma" el link `{ href: "#como-funciona", label: "Cómo funciona" }`
3. En el bloque inferior, agregar segunda línea: "Construido con Next.js · IBM watsonx · Power BI Embedded"
4. En la columna de marca, agregar debajo del párrafo descriptivo el texto: "Proyecto académico · Ingeniería de Software"

### Relevant Context
- `src/components/landing/FooterLanding.tsx` líneas 35–48 — columna Módulos
- `src/components/landing/FooterLanding.tsx` líneas 63–73 — columna Plataforma
- `src/components/landing/FooterLanding.tsx` líneas 82–89 — pie del footer

---

## Sub-Tarea 8 — Formulario: ancho limitado en desktop

**Status:** [ ] pending

### Intent
En `analizar/page.tsx` el formulario usa `lg:col-span-2` dentro de un grid de 3 columnas, lo que lo hace razonablemente ancho — pero la columna derecha (1/3) está vacía. El formulario en sí dentro de `FormularioViabilidad` no tiene restricción de ancho máximo, por lo que en pantallas grandes (1280px+) los campos se estiran demasiado. Se centra el formulario con un `max-w` apropiado.

### Expected Outcomes
- En desktop el formulario tiene un ancho máximo de `max-w-2xl` (672px) y está centrado
- La columna derecha vacía del grid se elimina o se rellena con una card de ayuda contextual
- Los campos de texto no se extienden más allá de un ancho legible

### Todo List
1. En `analizar/page.tsx`, cambiar el grid de `lg:grid-cols-3` a `lg:grid-cols-2` con el formulario en `lg:col-span-1`
2. Agregar en la columna derecha una card de ayuda contextual (`sticky top-24`) con:
   - Título "¿Cómo funciona el análisis?"
   - Lista de 4 ítems: qué datos se consultan (INEGI, DENUE, RETYS, NAFIN)
   - Nota de privacidad: "Tus datos no se almacenan"
   - Badge "Powered by IBM watsonx"
3. Estilizar la card con `bg-surface border border-border rounded-2xl p-5`

### Relevant Context
- `src/app/analizar/page.tsx` líneas 79–89 — bloque del estado `idle` con el grid
