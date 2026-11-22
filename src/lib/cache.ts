/**
 * src/lib/cache.ts
 *
 * Caché en memoria con tiempo de vida, para no repetir consultas a servicios
 * externos (OpenStreetMap, DENUE, el agente IA) con los mismos datos.
 * Vive en cada instancia del servidor: en un despliegue con varias instancias
 * conviene cambiarla por Redis o Vercel KV conservando esta misma interfaz.
 */

interface Entrada {
  valor: unknown;
  expira: number;
}

const MAX_ENTRADAS = 500;
const almacen = new Map<string, Entrada>();
// Consultas en curso: dos peticiones iguales al mismo tiempo comparten el resultado
const enCurso = new Map<string, Promise<unknown>>();

export async function conCache<T>(clave: string, ttlMs: number, obtener: () => Promise<T>): Promise<T> {
  const entrada = almacen.get(clave);
  if (entrada && entrada.expira > Date.now()) return entrada.valor as T;

  const pendiente = enCurso.get(clave);
  if (pendiente) return pendiente as Promise<T>;

  const promesa = obtener()
    .then((valor) => {
      // Los resultados vacíos (null) no se guardan: pueden deberse a un fallo pasajero
      if (valor !== null && valor !== undefined) {
        if (almacen.size >= MAX_ENTRADAS) almacen.delete(almacen.keys().next().value!);
        almacen.set(clave, { valor, expira: Date.now() + ttlMs });
      }
      return valor;
    })
    .finally(() => enCurso.delete(clave));
  enCurso.set(clave, promesa);
  return promesa;
}

export const HORA = 60 * 60 * 1000;
