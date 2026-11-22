// Calcula con el DENUE de INEGI las cifras de negocios de Tijuana que muestra
// la landing (src/components/landing/ContextoSection.tsx), para citarlas con fuente.
//
// Uso:  node --env-file=.env.local scripts/denue-estadisticas.mjs
// Requiere INEGI_DENUE_TOKEN (https://www.inegi.org.mx/servicios/api_denue.html)

const token = process.env.INEGI_DENUE_TOKEN;
if (!token) {
  console.error("Falta INEGI_DENUE_TOKEN. Agrégalo a .env.local y ejecuta con --env-file=.env.local");
  process.exit(1);
}

const TIJUANA = "02004"; // entidad 02 (Baja California) + municipio 004 (Tijuana)
const ESTRATOS = {
  1: "0 a 5 personas",
  2: "6 a 10 personas",
  3: "11 a 30 personas",
  4: "31 a 50 personas",
  5: "51 a 100 personas",
  6: "101 a 250 personas",
  7: "251 y más personas",
};

async function cuantificar(actividad, estrato) {
  const url = `https://www.inegi.org.mx/app/api/denue/v1/consulta/Cuantificar/${actividad}/${TIJUANA}/${estrato}/${token}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`DENUE respondió ${res.status}`);
  const datos = await res.json();
  return datos.reduce((suma, fila) => suma + Number(fila.Total ?? 0), 0);
}

const total = await cuantificar(0, 0);
console.log(`Unidades económicas en Tijuana (DENUE): ${total.toLocaleString("es-MX")}`);

console.log("\nPor tamaño:");
let micro = 0;
for (const [codigo, nombre] of Object.entries(ESTRATOS)) {
  const n = await cuantificar(0, codigo);
  if (codigo === "1" || codigo === "2") micro += n;
  console.log(`  ${nombre.padEnd(20)} ${n.toLocaleString("es-MX").padStart(10)}  (${((n / total) * 100).toFixed(1)}%)`);
}
console.log(`\nMicronegocios (0 a 10 personas): ${micro.toLocaleString("es-MX")} (${((micro / total) * 100).toFixed(1)}%)`);

console.log("\nPor sector (SCIAN):");
for (const [codigo, nombre] of [["46", "Comercio al por menor"], ["72", "Alojamiento y alimentos"], ["81", "Otros servicios"], ["31-33", "Manufactura"]]) {
  const actividades = codigo === "31-33" ? "31,32,33" : codigo;
  const n = await cuantificar(actividades, 0);
  console.log(`  ${nombre.padEnd(26)} ${n.toLocaleString("es-MX").padStart(10)}`);
}
console.log(`\nFuente: INEGI, DENUE (consulta del ${new Date().toLocaleDateString("es-MX")}).`);
