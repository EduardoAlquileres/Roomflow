const MAX_TAMANO = 25 * 1024 * 1024;

function validarArchivo(archivo: File) {
  if (!archivo.type.startsWith("image/") && archivo.type !== "application/pdf") throw new Error("Adjunta una imagen o un PDF.");
  if (archivo.size > MAX_TAMANO) throw new Error("El documento no puede superar 25 MB.");
}

async function respuestaJson(respuesta: Response) {
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || "No se pudo gestionar el documento.");
  return datos;
}

export async function subirDocumentoGasto(gastoId: string, archivo: File): Promise<string> {
  validarArchivo(archivo);
  const inicio = await respuestaJson(await fetch("/api/documentos-gastos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gastoId, nombre: archivo.name }) }));
  const tamanoBloque = 5 * 320 * 1024;
  let ultimo: { id?: string } = {};
  for (let desde = 0; desde < archivo.size; desde += tamanoBloque) {
    const hasta = Math.min(desde + tamanoBloque, archivo.size);
    const respuesta = await fetch(inicio.uploadUrl, { method: "PUT", headers: { "Content-Range": `bytes ${desde}-${hasta - 1}/${archivo.size}` }, body: archivo.slice(desde, hasta) });
    ultimo = await respuestaJson(respuesta);
  }
  if (!ultimo.id) throw new Error("OneDrive no confirmó la subida del documento.");
  const confirmado = await respuestaJson(await fetch("/api/documentos-gastos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gastoId, itemId: ultimo.id }) }));
  return confirmado.documento;
}

export async function abrirDocumentoGasto(documento: string): Promise<string> {
  return (await respuestaJson(await fetch(`/api/documentos-gastos?documento=${encodeURIComponent(documento)}`))).url;
}

export async function eliminarDocumentoGasto(documento: string): Promise<void> {
  await respuestaJson(await fetch("/api/documentos-gastos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documento }) }));
}
