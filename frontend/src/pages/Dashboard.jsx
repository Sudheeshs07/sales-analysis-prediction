import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, DollarSign, ShoppingCart, Package, BarChart2 } from 'lucide-react'
import { getKPIs, getSalesTrend, getCategoryAnalysis, getRegionalAnalysis, getProductAnalysis, getRecentSales } from '../utils/api.js'
import { fmt, fmtCurrency, COLORS, categoryColor, regionColor } from '../utils/formatters.js'
import { KPICard, Loading, ErrorBox, SectionHeader, Card } from '../components/UI.jsx'
import { Filters } from '../components/Filters.jsx'

const REGION_COLORS = { North: '#3b82f6', South: '#ef4444', East: '#10b981', West: '#f59e0b', Central: '#8b5cf6' }

export default function Dashboard({ filterOptions }) {
  const [filters, setFilters] = useState({ category: 'All', region: 'All', start_date: '', end_date: '' })
  const [kpis, setKpis]       = useState(null)
  const [trend, setTrend]     = useState(null)
  const [cats, setCats]       = useState(null)
  const [regions, setRegions] = useState(null)
  const [products, setProducts] = useState(null)
  const [recent, setRecent]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [granularity, setGranularity] = useState('monthly')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const p = { ...filters }
      const [k, t, c, r, pr, re] = await Promise.all([
        getKPIs(p), getSalesTrend({ ...p, granularity }),
        getCategoryAnalysis(p), getRegionalAnalysis(p),
        getProductAnalysis({ ...p, limit: 10 }), getRecentSales({ limit: 10 }),
      ])
      setKpis(k.data)
      setTrend(t.data.trend)
      setCats(c.data.categories)
      setRegions(r.data.regions)
      setProducts(pr.data.top_products)
      setRecent(re.data.records)
    } catch (e) {
      setError(e?.response?.data?.detail ?? e.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters, granularity])

  if (loading) return <Loading text="Loading dashboard..." />
  if (error)   return <ErrorBox message={error} />

  const profitPct = kpis ? ((kpis.total_profit / kpis.total_sales) * 100).toFixed(1) : 0

  return (
    <div>
      <SectionHeader title="Dashboard" subtitle="Overview of sales performance and key metrics" />
      <Filters options={filterOptions} value={filters} onChange={setFilters} />

      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard label="Total Sales"       value={fmtCurrency(kpis?.total_sales)}    sub={`${kpis?.total_orders} orders`}           color="var(--accent)"   icon={<DollarSign size={20}/>} />
        <KPICard label="Total Profit"      value={fmtCurrency(kpis?.total_profit)}   sub={`${profitPct}% margin`}                   color="var(--success)"  icon={<TrendingUp size={20}/>} />
        <KPICard label="Total Orders"      value={fmt(kpis?.total_orders)}           sub="across all regions"                       color="var(--warning)"  icon={<ShoppingCart size={20}/>} />
        <KPICard label="Quantity Sold"     value={fmt(kpis?.total_quantity)}         sub="units"                                    color="var(--purple)"   icon={<Package size={20}/>} />
        <KPICard label="Avg Order Value"   value={fmtCurrency(kpis?.avg_order_value)} sub="per transaction"                         color="#f97316"         icon={<BarChart2 size={20}/>} />
      </div>

      {/* Sales Trend & Category pie */}
      <div className="charts-grid mb-6">
        <Card title="Sales & Profit Trend" actions={
          <select className="btn btn-secondary btn-sm" style={{ border: 'none', padding: '4px 8px' }}
            value={granularity} onChange={e => setGranularity(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} width={72} />
              <Tooltip formatter={(v, n) => [fmtCurrency(v), n]} />
              <Legend />
              <Line type="monotone" dataKey="Sales"  stroke="#3b82f6" strokeWidth={2} dot={false} name="Sales"  />
              <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Sales by Category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={cats} dataKey="Sales" nameKey="Category" cx="50%" cy="50%"
                outerRadius={100} paddingAngle={3} label={({ Category, percent }) => `${Category} ${(percent*100).toFixed(0)}%`}
                labelLine={false}>
                {cats?.map((e, i) => <Cell key={i} fill={categoryColor(e.Category)} />)}
              </Pie>
              <Tooltip formatter={v => fmtCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Region bar & Top products */}
      <div className="charts-grid mb-6">
        <Card title="Sales by Region">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={regions} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="Region" width={60} tick={{ fontSize: 12 }} />
              <Tooltip formatter={v => fmtCurrency(v)} />
              <Bar dataKey="Sales" radius={[0, 4, 4, 0]}>
                {regions?.map((e, i) => <Cell key={i} fill={REGION_COLORS[e.Region] ?? COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top 10 Products">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={products?.slice(0, 10)} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="Product" width={80} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => fmtCurrency(v)} />
              <Bar dataKey="Sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card title="Recent Sales">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['Order ID', 'Date', 'Product', 'Category', 'Region', 'Qty', 'Sales', 'Discount', 'Profit'].map(h =>
                  <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recent?.map((r, i) => (
                <tr key={i}>
                  <td>{r.Order_ID}</td>
                  <td>{r.Order_Date}</td>
                  <td>{r.Product}</td>
                  <td><span className={`badge badge-blue`}>{r.Category}</span></td>
                  <td>{r.Region}</td>
                  <td>{fmt(r.Quantity)}</td>
                  <td className="font-bold">{fmtCurrency(r.Sales)}</td>
                  <td>{(r.Discount * 100).toFixed(0)}%</td>
                  <td className={r.Profit >= 0 ? 'text-success' : 'text-danger'}>{fmtCurrency(r.Profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
