// Shared by room document generation and the template catalogue.
// Values are formatted and HTML-escaped by the caller; *Html fields contain trusted markup.

export type VistaContrato = {
  vivienda: string;
  habitacion: string;
  titulo: string;
  municipio: string;
  fechaEmision: string;
  propietarios: string;
  titularesHtml: string;
  direccion: string;
  referenciaCatastralHtml: string;
  duracion: string;
  inicio: string;
  fin: string;
  renta: string;
  bancoHtml: string;
  ibanHtml: string;
  numeroPersonas: string | number;
  personasEtiqueta: string;
  gastos: string;
  suministros: string;
  fianza: string;
  entregado: string;
  pendiente: string;
  clausulasHtml: string;
  firmantesSufijo: string;
};

export function renderizarContrato(datos: VistaContrato, imprimir = true): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Contrato ${datos.vivienda} - ${datos.habitacion}</title><style>
        @page{size:A4;margin:20mm 18mm} body{font-family:Arial,sans-serif;color:#182235;line-height:1.52;max-width:820px;margin:auto;padding:36px;font-size:12px}.titulo{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:13px}.titulo h1{font-size:21px;margin:0}.sub{margin:6px 0 0;color:#526078}.bloque{margin-top:18px}.bloque h2{font-size:13.5px;text-transform:uppercase;color:#1d4ed8;letter-spacing:.04em;margin:0 0 8px}.caja{border:1px solid #cbd5e1;border-radius:8px;padding:12px}.caja p{margin:7px 0}.caja ol{margin:7px 0;padding-left:23px}.caja li{margin:4px 0}.clausula{margin:14px 0}.clausula h3{font-size:12.5px;margin:0 0 4px}.fila{display:flex;justify-content:space-between;gap:24px;padding:7px 0;border-bottom:1px solid #e2e8f0}.fila:last-child{border:0}.nota{margin-top:18px;padding:12px;border-radius:8px;background:#eff6ff;color:#1e3a8a}.firma{margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:42px}.firma div{border-top:1px solid #64748b;padding-top:7px;text-align:center;font-size:11px}@media print{body{padding:0}.bloque{break-inside:avoid}}
      </style></head><body>
      <div class="titulo"><h1>${datos.titulo}</h1><p class="sub">${datos.vivienda} · Habitación ${datos.habitacion}</p></div>
      <p>En ${datos.municipio}, a ${datos.fechaEmision}.</p>
      <section class="bloque"><h2>Reunidos</h2><div class="caja"><p><strong>De una parte,</strong> ${datos.propietarios}, en adelante, la <strong>PARTE ARRENDADORA</strong>.</p>${datos.titularesHtml}</div></section>
      <section class="bloque"><h2>Exponen</h2><div class="caja"><p><strong>I.</strong> Que la parte arrendadora es titular de la vivienda situada en <strong>${datos.direccion}</strong>${datos.referenciaCatastralHtml}.</p><p><strong>II.</strong> Que dentro de dicha vivienda se arrienda exclusivamente la habitación <strong>${datos.habitacion}</strong>, completamente amueblada, con derecho de uso compartido de cocina, baño, salón y demás zonas comunes.</p><p><strong>III.</strong> Que este contrato tiene naturaleza de arrendamiento de habitación en vivienda compartida y se regirá por lo pactado y, supletoriamente, por los artículos 1542 y siguientes del Código Civil.</p></div></section>
      <section class="bloque"><h2>Cláusulas</h2><div class="caja">
        <div class="clausula"><h3>PRIMERA. Objeto y limitaciones de uso</h3><p>La habitación se destina exclusivamente al alojamiento personal de la parte arrendataria. Queda prohibido subarrendar o ceder el contrato, realizar actividades molestas, insalubres, peligrosas o ilícitas, fumar en la vivienda, instalar aparatos sin autorización, alojar o permitir la permanencia de terceros y tener animales o mascotas. No se permiten visitas en la habitación ni en las zonas comunes. El incumplimiento grave facultará la resolución del contrato, sin perjuicio de daños y perjuicios.</p></div>
        <div class="clausula"><h3>SEGUNDA. Duración</h3><p>La duración inicial será de <strong>${datos.duracion}</strong>, desde el <strong>${datos.inicio}</strong> hasta el <strong>${datos.fin}</strong>. Tras dicho plazo, se prorrogará mensualmente de forma tácita salvo preaviso escrito con quince días de antelación. No cabrá desistimiento antes del cumplimiento del plazo mínimo pactado.</p></div>
        <div class="clausula"><h3>TERCERA. Renta</h3><div class="fila"><span>Renta mensual de la habitación</span><strong>${datos.renta}</strong></div><p>La renta se abonará por adelantado dentro de los cinco primeros días de cada mes mediante transferencia${datos.bancoHtml}${datos.ibanHtml}. El impago de una mensualidad será causa de resolución. La renta podrá actualizarse anualmente conforme al IPC interanual publicado por el INE.</p></div>
        <div class="clausula"><h3>CUARTA. Gastos y suministros</h3><div class="fila"><span>Gastos mensuales por persona (${datos.numeroPersonas} ${datos.personasEtiqueta})</span><strong>${datos.gastos}</strong></div><p>Los gastos se facturan separadamente de la renta como cuota por persona para ${datos.suministros}. Podrá realizarse una regularización por consumos superiores a lo razonable, previa justificación.</p></div>
        <div class="clausula"><h3>QUINTA. Fianza</h3><div class="fila"><span>Fianza pactada</span><strong>${datos.fianza}</strong></div><div class="fila"><span>Entregado a cuenta de fianza</span><strong>${datos.entregado}</strong></div><div class="fila"><span>Pendiente de entregar</span><strong>${datos.pendiente}</strong></div><p>La fianza responde de daños, impagos y obligaciones contractuales y no podrá aplicarse unilateralmente al pago de rentas.</p></div>
        <div class="clausula"><h3>SEXTA. Conservación, reparaciones y obras</h3><p>La parte arrendadora realizará las reparaciones necesarias para conservar la habitabilidad. La parte arrendataria asumirá las pequeñas reparaciones derivadas del uso ordinario y responderá de los daños causados por dolo o negligencia. Quedan prohibidas las obras sin autorización escrita.</p></div>
        <div class="clausula"><h3>SÉPTIMA. Acceso</h3><p>La parte arrendadora podrá acceder a las zonas comunes en cualquier momento y a la habitación previa comunicación, salvo urgencia.</p></div>
        <div class="clausula"><h3>OCTAVA. Resolución y permanencia indebida</h3><p>Serán causas de resolución el impago, el incumplimiento de las prohibiciones anteriores, el subarriendo o cesión, los daños graves y las actividades ilícitas o molestas. En caso de permanencia tras la finalización, se abonará una indemnización diaria equivalente al doble de la renta diaria vigente.</p></div>
        <div class="clausula"><h3>NOVENA. Jurisdicción</h3><p>Las partes se someten a los Juzgados y Tribunales del partido judicial donde radica el inmueble.</p></div>
      </div></section>${datos.clausulasHtml}
      <p class="nota">El envío de este documento acredita la información y los importes que en él se exponen. No se requiere firma manuscrita.</p>
      <div class="firma"><div>La parte arrendadora</div><div>La parte arrendataria${datos.firmantesSufijo}</div></div>
      ${imprimir ? "<script>window.opener=null;window.onload=()=>window.print()<\/script>" : ""}</body></html>`;
}

export type VistaReserva = {
  vivienda: string;
  habitacion: string;
  propietarios: string;
  titularesHtml: string;
  direccion: string;
  municipioHtml: string;
  inicio: string;
  renta: string;
  numeroPersonas: string | number;
  personasEtiqueta: string;
  gastos: string;
  mesesFianza: string | number;
  fianza: string;
  entregado: string;
  pendiente: string;
  fechaEmision: string;
  clausulasHtml: string;
};

export function renderizarReserva(datos: VistaReserva, imprimir = true): string {
  return `<!doctype html><html lang="es"><head><title>Reserva ${datos.vivienda} - ${datos.habitacion}</title><style>body{font-family:Arial,sans-serif;color:#172033;line-height:1.35;max-width:760px;margin:auto;padding:30px;font-size:13px}.titulo{text-align:center;border-bottom:3px solid #2563eb;padding-bottom:12px}.titulo h1{font-size:22px;margin:0}.titulo p{margin:5px 0 0;color:#526078}.seccion{margin-top:16px}.seccion h2{font-size:14px;text-transform:uppercase;color:#1d4ed8;letter-spacing:.04em;margin:0 0 7px}.caja{border:1px solid #cbd5e1;border-radius:8px;padding:11px}.caja p{margin:5px 0}.caja ul{margin:5px 0;padding-left:20px}.fila{display:flex;justify-content:space-between;gap:24px;padding:7px 0;border-bottom:1px solid #e2e8f0}.fila:last-child{border:0}@media print{body{padding:18px}}</style></head><body><div class="titulo"><h1>DOCUMENTO DE RESERVA DE HABITACIÓN</h1><p>${datos.vivienda} · Habitación ${datos.habitacion}</p></div><section class="seccion"><h2>Partes</h2><div class="caja"><p><strong>Propietario(s):</strong> ${datos.propietarios}</p><p><strong>Reservatario(s), responsables solidarios:</strong></p><ul>${datos.titularesHtml}</ul></div></section><section class="seccion"><h2>Objeto de la reserva</h2><div class="caja"><p>Se reserva la habitación <strong>${datos.habitacion}</strong> de la vivienda situada en <strong>${datos.direccion}</strong>${datos.municipioHtml}, para la entrada prevista el <strong>${datos.inicio}</strong>.</p><p>Los reservatarios asumirán solidariamente las obligaciones derivadas del contrato de alquiler que se formalizará para esta habitación.</p></div></section><section class="seccion"><h2>Condiciones económicas</h2><div class="caja"><div class="fila"><span>Alquiler mensual de la habitación</span><strong>${datos.renta}</strong></div><div class="fila"><span>Gastos por persona (${datos.numeroPersonas} ${datos.personasEtiqueta})</span><strong>${datos.gastos}</strong></div><div class="fila"><span>Fianza total pactada (${datos.mesesFianza} meses)</span><strong>${datos.fianza}</strong></div><div class="fila"><span>Pago a cuenta de la fianza recibido con la reserva</span><strong>${datos.entregado}</strong></div><div class="fila"><span>Fianza pendiente de entregar</span><strong>${datos.pendiente}</strong></div></div></section><section class="seccion"><h2>Acuerdo</h2><div class="caja"><p>La cantidad entregada como reserva se imputa exclusivamente a la fianza y no constituye renta ni pago de gastos. El resto de condiciones se concretará en el contrato de alquiler de habitación.</p><p>El envío de este documento acredita la información y los importes que en él se exponen.</p><p>Documento emitido el ${datos.fechaEmision}.</p></div></section>${datos.clausulasHtml}${imprimir ? "<script>window.opener=null;window.onload=()=>window.print()<\/script>" : ""}</body></html>`;
}
