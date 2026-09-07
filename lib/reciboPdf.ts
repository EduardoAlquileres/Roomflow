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
  crearReciboPdf(documento).save(nombre);
}
