import { jsPDF } from "jspdf";

export type DatosFinalizacion = {
  vivienda: string; habitacion: string; entrada: string; salida: string;
  propietarios: string[]; titulares: string[]; fianza: string[];
  pendientes: { periodo: string; importe: number }[]; observaciones: string;
};

export function crearFinalizacionPdf(datos: DatosFinalizacion, hoy = new Date()) {
  const pdf = new jsPDF();
  pdf.setProperties({ title: "Finalización del contrato de habitación", author: "", creator: "" });
  let y = 20;
  const fecha = (f: string) => f.slice(0, 10).split("-").reverse().join("/");
  const euros = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  function espacio(alto: number) { if (y + alto > 275) { pdf.addPage(); y = 20; } }
  function texto(t: string, tamano = 10, negrita = false) {
    pdf.setFont("helvetica", negrita ? "bold" : "normal"); pdf.setFontSize(tamano); pdf.setTextColor(25, 40, 60);
    const lineas = pdf.splitTextToSize(t, 174) as string[];
    for (const linea of lineas) { espacio(tamano * 0.47); pdf.text(linea, 18, y); y += tamano * 0.47; }
    y += 3;
  }
  function seccion(t: string) { espacio(25); y += 3; texto(t, 11, true); }
  texto("FINALIZACIÓN DEL CONTRATO", 17, true);
  texto("Arrendamiento de habitación", 12);
  texto("Fecha de preparación: " + new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid" }).format(hoy), 9);
  seccion("1. Partes y habitación");
  texto("Parte arrendadora: " + (datos.propietarios.join("; ") || "________________________________ (completar)"));
  texto("Parte arrendataria: " + datos.titulares.join("; "));
  texto("Vivienda: " + datos.vivienda + ". Habitación: " + datos.habitacion + ".");
  texto("Inicio de la estancia: " + fecha(datos.entrada) + ". Fecha de finalización: " + fecha(datos.salida) + ".");
  seccion("2. Finalización y entrega");
  texto("Las partes, mediante su firma, dejan constancia de la finalización del arrendamiento de la habitación indicada con efectos en la fecha de finalización anterior.");
  texto("Entrega de llaves (completar al firmar): fecha ______________; número de juegos ______.");
  texto("Estado de la habitación e incidencias: __________________________________________________\n________________________________________________________________________________");
  seccion("3. Fianza");
  datos.fianza.forEach(t => texto(t));
  seccion("4. Liquidación de alquiler y gastos");
  if (datos.pendientes.length) {
    datos.pendientes.forEach(c => texto(c.periodo + ": " + euros(c.importe) + " pendiente."));
    texto("Total pendiente registrado: " + euros(Math.round(datos.pendientes.reduce((s,c) => s+c.importe,0)*100)/100), 11, true);
  } else texto("No constan saldos pendientes en los cobros registrados de esta estancia a la fecha de preparación.");
  texto("Los importes anteriores reflejan los registros disponibles al preparar este documento. La finalización no acredita por sí sola pagos, devoluciones de fianza ni la entrega de llaves, ni supone renuncia a cantidades pendientes o regularizaciones justificadas.");
  if (datos.observaciones) { seccion("5. Observaciones registradas"); texto(datos.observaciones); }
  espacio(46); y += 6;
  texto("Lugar y fecha de firma: ____________________________________________________________");
  texto("Conformes con lo consignado y con las anotaciones realizadas al firmar:");
  y += 15;
  pdf.setDrawColor(120); pdf.line(18,y,94,y); pdf.line(111,y,192,y); y+=6;
  pdf.setFontSize(9); pdf.text("Parte arrendadora",18,y); pdf.text("Parte arrendataria (todos los titulares)",111,y);
  return pdf;
}
