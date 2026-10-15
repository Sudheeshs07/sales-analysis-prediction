import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { getSalesAnalysis } from '../utils/api.js'
import { fmt, fmtCurrency, COLORS, categoryColor } from '../utils/formatters.js'
import { Loading, ErrorBox, SectionHeader, Card } from '../components/UI.jsx'
import { Filters } from '../components/Filters.jsx'

export default function SalesAnalysis({ filterOptions }) {
  const [filters, setFilters] = useState({ category: 'All', region: 'All', start_date: '', end_date: '' })
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await getSalesAnalysis(filters)
      setData(res.data)
    } catch (e) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters])

  if (loading) return <Loading text="Analyzing sales data..." />
  if (error)   return <ErrorBox message={error} />

  return (
    <div>
      <SectionHeader title="Sales Analysis"
        subtitle="Deep-dive into sales trends, growth and category performance" />
      <Filters options={filterOptions} value={filters} onChange={setFilters} />

      {/* Key Insights */}
      <Card title="🔍 Key Insights" className="mb-6">
        <div className="insights-list">
          {data?.insights?.map((ins, i) => (
            <div key={i} className="insight-item"
              dangerouslySetInnerHTML={{ __html: ins.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </div>
      </Card>

      {/* Monthly trend + growth */}
      <div className="charts-grid mb-6">
        <Card title="Monthly Sales Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.monthly_trend} margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} width={72} />
              <Tooltip formatter={v => fmtCurrency(v)} />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Month-over-Month Growth (%)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.monthly_trend} margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v + '%'} />
              <Tooltip formatter={v => v + '%'} />
              <Bar dataKey="Growth" name="Growth %"
                radius={[4, 4, 0, 0]}>
                {data?.monthly_trend?.map((e, i) => (
                  <Cell key={i} fill={e.Growth >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Category Performance */}
      <Card title="Category Performance" className="mb-6">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['Category', 'Total Sales', 'Total Profit', 'Orders', 'Quantity', 'Profit Margin'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data?.category_performance?.map((c, i) => (
                <tr key={i}>
                  <td><span className="badge badge-blue">{c.Category}</span></td>
                  <td className="font-bold">{fmtCurrency(c.Sales)}</td>
                  <td className="text-success">{fmtCurrency(c.Profit)}</td>
                  <td>{fmt(c.Orders)}</td>
                  <td>{fmt(c.Quantity)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: Math.min(c.Profit_Margin * 2, 100) + '%',
                        maxWidth: '80px',
                        height: 8,
                        background: '#3b82f6',
                        borderRadius: 4,
                        display: 'inline-block',
                      }} />
                      <span>{c.Profit_Margin?.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Scatter: Discount vs Sales & Qty vs Sales */}
      <div className="charts-grid mb-6">
        <Card title="Discount vs Sales">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="Discount" name="Discount" tickFormatter={v => (v*100).toFixed(0)+'%'} tick={{ fontSize: 11 }} label={{ value: 'Discount %', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis dataKey="Sales" name="Sales" tickFormatter={v => '$'+fmt(v)} tick={{ fontSize: 11 }} width={70} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => n === 'Discount' ? (v*100).toFixed(0)+'%' : fmtCurrency(v)} />
              {['Technology','Furniture','Office Supplies','Clothing','Electronics'].map((cat, ci) => (
                <Scatter key={cat} name={cat}
                  data={data?.discount_scatter?.filter(r => r.Category === cat)}
                  fill={COLORS[ci]} opacity={0.65} />
              ))}
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Quantity vs Sales">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="Quantity" name="Quantity" tick={{ fontSize: 11 }} label={{ value: 'Quantity', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis dataKey="Sales" name="Sales" tickFormatter={v => '$'+fmt(v)} tick={{ fontSize: 11 }} width={70} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => n === 'Sales' ? fmtCurrency(v) : v} />
              {['Technology','Furniture','Office Supplies','Clothing','Electronics'].map((cat, ci) => (
                <Scatter key={cat} name={cat}
                  data={data?.qty_scatter?.filter(r => r.Category === cat)}
                  fill={COLORS[ci]} opacity={0.65} />
              ))}
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
