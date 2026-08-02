import { generarCobrosPendientes } from "@/lib/generarCobrosPendientes";

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  const autorizacion = request.headers.get("authorization");

  if (!secreto || autorizacion !== `Bearer ${secreto}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const resultado = await generarCobrosPendientes();
    return Response.json(resultado);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudieron generar los cobros.";
    return Response.json({ error: mensaje }, { status: 500 });
  }
}
