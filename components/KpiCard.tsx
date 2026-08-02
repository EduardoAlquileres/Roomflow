type Props = {
  titulo: string;
  valor: number;
};

export default function KpiCard({ titulo, valor }: Props) {
  return (
    <div className="rf-kpi-card">
      <div className="rf-kpi-label">{titulo}</div>
      <div className="rf-kpi-value">{valor}</div>
    </div>
  );
}
