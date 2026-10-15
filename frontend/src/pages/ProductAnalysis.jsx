import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { getProductAnalysis } from '../utils/api.js'
import { fmt, fmtCurrency, COLORS, categoryColor } from '../utils/formatters.js'
import { Loading, ErrorBox, SectionHeader, Card } from '../components/UI.jsx'
import { Filters } from '../components/Filters.jsx'

export default function ProductAnalysis({ filterOptions }) {
  const [filters, setFilters] = useState({ category: 'All', region: 'All', start_date: '', end_date: '' })
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [view, setView]   = useState('top')  // 'top' | 'bottom'

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await getProductAnalysis({ ...filters, limit: 10 })
      setData(res.data)
    } catch(e) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters])

  if (loading) return <Loading text="Loading product analysis..." />
  if (error)   return <ErrorBox message={error} />

  const shown = view === 'top' ? data?.top_products : data?.bottom_products

  return (
    <div>
      <SectionHeader title="Product Analysis"
        subtitle="Detailed performance metrics for every product in the catalog" />
      <Filters options={filterOptions} value={filters} onChange={setFilters} />

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${view === 'top' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('top')}>🏆 Top Products</button>
        <button className={`btn ${view === 'bottom' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setView('bottom')}>📉 Bottom Products</button>
      </div>

      {/* Bar chart */}
      <div className="charts-grid mb-6">
        <Card title={`${view === 'top' ? 'Top' : 'Bottom'} 10 Products by Sales`}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={shown} layout="vertical" margin={{ left: 80, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="Product" width={90} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [fmtCurrency(v), n]} />
              <Bar dataKey="Sales" name="Sales" radius={[0, 4, 4, 0]}>
                {shown?.map((e, i) => <Cell key={i} fill={categoryColor(e.Category)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={`${view === 'top' ? 'Top' : 'Bottom'} 10 Products — Profit`}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={shown} layout="vertical" margin={{ left: 80, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="Product" width={90} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [fmtCurrency(v), n]} />
              <Bar dataKey="Profit" name="Profit" radius={[0, 4, 4, 0]}>
                {shown?.map((e, i) => <Cell key={i} fill={e.Profit >= 0 ? '#10b981' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Products Table */}
      <Card title={`${view === 'top' ? 'Top' : 'Bottom'} Products Detail`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['#', 'Product', 'Category', 'Total Sales', 'Total Profit', 'Quantity', 'Orders', 'Margin'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {shown?.map((p, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                  <td className="font-bold">{p.Product}</td>
                  <td><span className="badge badge-blue">{p.Category}</span></td>
                  <td>{fmtCurrency(p.Sales)}</td>
                  <td className={p.Profit >= 0 ? 'text-success' : 'text-danger'}>{fmtCurrency(p.Profit)}</td>
                  <td>{fmt(p.Quantity)}</td>
                  <td>{fmt(p.Orders)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: Math.min(p.Profit_Margin * 1.5, 100) + '%',
                        maxWidth: '60px',
                        height: 8,
                        background: p.Profit_Margin >= 0 ? 'var(--success)' : 'var(--danger)',
                        borderRadius: 4,
                      }} />
                      <span>{p.Profit_Margin?.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
