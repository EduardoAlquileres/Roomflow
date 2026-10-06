import { jsPDF } from "jspdf";

// Draw only receipt content: no HTML printing, browser URL, links or footers.
export function crearReciboPdf(documento: Document) {
  const pdf = new jsPDF();
  const margen = 18;
  const ancho = 174;
  let y = 22;
  pdf.setProperties({ title: documento.title, author: "", creator: "" });

  function texto(elemento: Element): string {
    const copia = elemento.cloneNode(true) as Element;
    copia.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    return (copia.textContent ?? "").replace(/\u00a0/g, " ").trim();
  }

  function espacio(alto: number) {
    if (y + alto > 277) {
      pdf.addPage();
      y = 22;
    }
  }

  function escribir(contenido: string, tamano = 11, negrita = false) {
    pdf.setFont("helvetica", negrita ? "bold" : "normal");
    pdf.setFontSize(tamano);
    const lineas = pdf.splitTextToSize(contenido, ancho) as string[];
    const paso = tamano * 0.45;
    for (const linea of lineas) {
      espacio(paso);
      pdf.text(linea, margen, y);
      y += paso;
    }
    y += 3;
  }

  function dibujar(elemento: Element) {
    if (elemento.matches(".acciones, script, style, footer")) return;
    if (elemento.classList.contains("fila")) {
      const columnas = Array.from(elemento.children);
      if (columnas.length !== 2) return;
      const total = elemento.classList.contains("total");
      pdf.setFontSize(total ? 12 : 11);
      pdf.setFont("helvetica", total ? "bold" : "normal");
      const izquierda = pdf.splitTextToSize(texto(columnas[0]), 118) as string[];
      pdf.setFont("helvetica", "bold");
      const derecha = pdf.splitTextToSize(texto(columnas[1]), 48) as string[];
      const cantidad = Math.max(izquierda.length, derecha.length);
      espacio(Math.min(cantidad * 6 + 6, 255));
      for (let i = 0; i < cantidad; i++) {
        espacio(6);
        pdf.setFont("helvetica", total ? "bold" : "normal");
        if (izquierda[i]) pdf.text(izquierda[i], margen, y);
        pdf.setFont("helvetica", "bold");
        if (derecha[i]) pdf.text(derecha[i], 192, y, { align: "right" });
        y += 6;
      }
      pdf.setDrawColor(220, 226, 234);
      pdf.line(margen, y - 2, 192, y - 2);
      y += 4;
      return;
    }
    if (elemento.matches(".titulo, .meta, .etiqueta, .valor, .recordatorio, .nota")) {
      const titulo = elemento.classList.contains("titulo");
      const etiqueta = elemento.classList.contains("etiqueta");
      pdf.setTextColor(etiqueta ? "#475569" : "#172033");
      escribir(texto(elemento), titulo ? 21 : etiqueta ? 9 : 11, titulo || etiqueta);
      return;
    }
    if (elemento.matches(".bloque, .pendientes")) {
      espacio(24);
      y += 5;
    }
    Array.from(elemento.children).forEach(dibujar);
  }

  dibujar(documento.body);
  return pdf;
}

export function descargarReciboPdf(html: string, nombre: string) {
  const documento = new DOMParser().parseFromString(html, "text/html");
  const pdf = crearReciboPdf(documento);
  const archivo = new File([pdf.output("blob")], nombre, { type: "application/pdf" });
  const datos = { files: [archivo] };
  const puedeCompartir = typeof navigator.share === "function" && Boolean(navigator.canShare?.(datos));

  // A fresh click preserves Safari's required user activation after fetching data.
  // Share only the File: never a blob URL, page URL, title or message.
  const dialogo = document.createElement("dialog");
  dialogo.style.cssText = "border:1px solid #cbd5e1;border-radius:16px;padding:24px;max-width:400px;width:calc(100% - 32px);color:#172033;background:white;box-sizing:border-box";
  const titulo = document.createElement("h2");
  titulo.textContent = "Recibo listo";
  titulo.style.cssText = "font-size:20px;font-weight:700;margin:0 0 12px";
  const mensaje = document.createElement("p");
  mensaje.textContent = puedeCompartir
    ? "Comparte el recibo con un inquilino o con el grupo de todos los inquilinos. Elige WhatsApp, selecciona el destinatario o grupo y confirma el envío."
    : "Descarga el recibo y adjunta el PDF en WhatsApp al inquilino o al grupo de todos los inquilinos.";
  mensaje.style.cssText = "margin:0 0 20px";
  const compartir = document.createElement("button");
  compartir.type = "button";
  compartir.textContent = "Compartir PDF";
  compartir.style.cssText = "background:#2563eb;color:white;border:0;border-radius:8px;padding:12px 16px;font-weight:700;cursor:pointer";
  const compartirGrupo = document.createElement("button");
  compartirGrupo.type = "button";
  compartirGrupo.textContent = "Enviar al grupo de todos los inquilinos";
  compartirGrupo.style.cssText = "display:block;width:100%;background:#16a34a;color:white;border:0;border-radius:8px;padding:12px 16px;margin-bottom:12px;font-weight:700;cursor:pointer";
  const descargar = document.createElement("button");
  descargar.type = "button";
  descargar.textContent = "Descargar PDF";
  descargar.style.cssText = "background:#eff6ff;color:#2563eb;border:0;border-radius:8px;padding:12px 16px;margin-top:12px;font-weight:700;cursor:pointer";
  descargar.onclick = () => pdf.save(nombre);
  const cerrar = document.createElement("button");
  cerrar.type = "button";
  cerrar.textContent = "Cerrar";
  cerrar.style.cssText = "background:white;color:#172033;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;margin-left:12px;cursor:pointer";
  cerrar.onclick = () => dialogo.close();
  async function compartirArchivo(alGrupo: boolean) {
    if (!puedeCompartir) {
      pdf.save(nombre);
      mensaje.textContent = alGrupo
        ? "PDF descargado. Abre el grupo de todos los inquilinos en WhatsApp y adjunta este recibo como documento."
        : "PDF descargado. Abre WhatsApp y adjunta este recibo como documento.";
      return;
    }
    compartir.disabled = true;
    compartirGrupo.disabled = true;
    try {
      await navigator.share(datos);
      dialogo.close();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        mensaje.textContent = "No se pudo compartir el PDF. Puedes intentarlo de nuevo o descargarlo y adjuntarlo en WhatsApp.";
      }
    } finally {
      compartir.disabled = false;
      compartirGrupo.disabled = false;
    }
  }
  compartir.onclick = () => compartirArchivo(false);
  compartirGrupo.onclick = () => compartirArchivo(true);
  dialogo.addEventListener("close", () => dialogo.remove(), { once: true });
  dialogo.append(titulo, mensaje, compartirGrupo);
  if (puedeCompartir) dialogo.append(compartir);
  dialogo.append(descargar, cerrar);
  document.body.append(dialogo);
  dialogo.showModal();
}
