import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  departmentMix,
  kpis,
  monthlyActivity,
  palette,
  satisfaction,
} from './data'

const tooltipStyle = {
  background: '#0b1020',
  border: '1px solid #232c47',
  borderRadius: 12,
  color: '#e8ecf5',
  fontSize: 13,
}

function KpiCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string
  value: string
  delta: number
  hint: string
}) {
  const up = delta >= 0
  return (
    <div className="card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <div className="kpi-foot">
        <span className={`delta ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {Math.abs(delta)}%
        </span>
        <span>{hint}</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">HD</div>
          <div>
            <h1>HHCD DataVis</h1>
            <p>Healthcare activity &amp; outcomes dashboard</p>
          </div>
        </div>
        <div className="pill">Fiscal year 2026 · demo dataset</div>
      </header>

      <section className="kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="charts-grid">
        <div className="card">
          <div className="card-title">
            <h2>Monthly Encounters</h2>
            <span>Visits vs. telehealth</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyActivity} margin={{ left: -12, right: 8 }}>
              <defs>
                <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="gTele" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232c47" />
              <XAxis dataKey="month" stroke="#9aa4bf" fontSize={12} />
              <YAxis stroke="#9aa4bf" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#39466b' }} />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#gVisits)"
              />
              <Area
                type="monotone"
                dataKey="telehealth"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#gTele)"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#6366f1' }} />
              In-person visits
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#22d3ee' }} />
              Telehealth
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <h2>Department Mix</h2>
            <span>share of visits</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentMix}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
              >
                {departmentMix.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: '#9aa4bf' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="charts-grid-bottom">
        <div className="card">
          <div className="card-title">
            <h2>Admissions Trend</h2>
            <span>monthly inpatient admissions</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyActivity} margin={{ left: -12, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232c47" />
              <XAxis dataKey="month" stroke="#9aa4bf" fontSize={12} />
              <YAxis stroke="#9aa4bf" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
              <Bar dataKey="admissions" radius={[6, 6, 0, 0]} fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">
            <h2>Patient Satisfaction</h2>
            <span>survey responses</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={satisfaction}
              layout="vertical"
              margin={{ left: 40, right: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#232c47" horizontal={false} />
              <XAxis type="number" stroke="#9aa4bf" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9aa4bf"
                fontSize={12}
                width={100}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(34,211,238,0.08)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {satisfaction.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <footer className="app-footer">
        HHCD DataVis · built with Vite, React &amp; Recharts · demo data for
        environment verification
      </footer>
    </div>
  )
}
