function StatCard({ title, value, color = 'primary' }) {
  const colorGrad = {
    primary: 'from-primary-600 via-primary-700 to-primary-900',
    secondary: 'from-secondary-600 via-secondary-700 to-secondary-900',
    accent: 'from-accent-600 via-accent-700 to-accent-900',
    danger: 'from-danger-600 via-danger-700 to-danger-900',
  }
  const grad = colorGrad[color] || colorGrad.primary
  return (
    <div className={`rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow border border-white/10 bg-gradient-to-br ${grad} text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm/5 text-white/80">{title}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardRestaurante() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Restaurante</h1>
      </div>

      <p className="text-gray-600 text-sm">
        Visão geral do movimento do restaurante. Os dados abaixo são placeholders até integrar com o backend.
      </p>

      <section className="grid grid-cols-2 gap-4">
        <StatCard title="Faturamento do dia" value="MT --" color="primary" />
        <StatCard title="Faturamento do mês" value="MT --" color="secondary" />
        <StatCard title="Pedidos em andamento" value="--" color="accent" />
        <StatCard title="Pedidos concluídos hoje" value="--" color="danger" />
        <StatCard title="Mesas ocupadas" value="--" color="primary" />
        <StatCard title="Ticket médio por mesa" value="MT --" color="secondary" />
      </section>
    </div>
  )
}
