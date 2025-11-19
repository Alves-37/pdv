function Card({ title, value, color = 'primary' }) {
  const colorGrad = {
    primary: 'from-primary-600 via-primary-700 to-primary-900',
    secondary: 'from-secondary-600 via-secondary-700 to-secondary-900',
    accent: 'from-accent-600 via-accent-700 to-accent-900',
    danger: 'from-danger-600 via-danger-700 to-danger-900',
  }
  const grad = colorGrad[color] || colorGrad.primary
  return (
    <div className={`rounded-xl p-4 shadow-card border border-white/10 bg-gradient-to-br ${grad} text-white`}>
      <div className="text-xs text-white/80">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}

export default function RestauranteRelatorios() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios Financeiros - Restaurante</h1>
      <p className="text-gray-600 text-sm">
        Resumo financeiro do restaurante. Os valores abaixo são placeholders até integrar com o backend.
      </p>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card title="Faturamento" value="MT --" color="primary" />
        <Card title="Custo" value="MT --" color="secondary" />
        <Card title="Lucro" value="MT --" color="accent" />
        <Card title="Qtd. Vendas" value="--" color="danger" />
        <Card title="Ticket Médio" value="MT --" color="primary" />
        <Card title="Itens Vendidos" value="--" color="secondary" />
      </section>
    </div>
  )
}
