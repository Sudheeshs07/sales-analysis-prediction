import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { getRegionalAnalysis } from '../utils/api.js'
import { fmt, fmtCurrency, COLORS } from '../utils/formatters.js'
import { Loading, ErrorBox, SectionHeader, Card } from '../components/UI.jsx'
import { Filters } from '../components/Filters.jsx'

const REGION_COLORS = { North: '#3b82f6', South: '#ef4444', East: '#10b981', West: '#f59e0b', Central: '#8b5cf6' }

export default function RegionalAnalysis({ filterOptions }) {
  const [filters, setFilters] = useState({ category: 'All', start_date: '', end_date: '' })
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await getRegionalAnalysis(filters)
      setData(res.data)
      if (!selectedRegion && res.data?.regions?.length) {
        setSelectedRegion(res.data.regions[0].Region)
      }
    } catch(e) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters])

  if (loading) return <Loading text="Loading regional analysis..." />
  if (error)   return <ErrorBox message={error} />

  const radarData = data?.regions?.map(r => ({
    region: r.Region,
    Sales: r.Sales,
    Profit: r.Profit,
    Orders: r.Orders,
  })) || []

  const trendData = selectedRegion ? data?.regional_trends?.[selectedRegion] : []

  return (
    <div>
      <SectionHeader title="Regional Analysis"
        subtitle="Compare sales performance, profit and orders across all regions" />

      <Filters options={{ ...filterOptions, regions: undefined }}
        value={filters}
        onChange={setFilters} />

      {/* Regional overview bars */}
      <div className="charts-grid mb-6">
        <Card title="Sales by Region">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.regions} margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="Region" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} width={72} />
              <Tooltip formatter={v => fmtCurrency(v)} />
              <Bar dataKey="Sales" name="Sales" radius={[4, 4, 0, 0]}>
                {data?.regions?.map((e, i) => <Cell key={i} fill={REGION_COLORS[e.Region] ?? COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Profit by Region">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.regions} margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="Region" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} width={72} />
              <Tooltip formatter={v => fmtCurrency(v)} />
              <Bar dataKey="Profit" name="Profit" radius={[4, 4, 0, 0]}>
                {data?.regions?.map((e, i) => <Cell key={i} fill={REGION_COLORS[e.Region] ?? COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Region trend + radar */}
      <div className="charts-grid mb-6">
        <Card title="Region Sales Over Time" actions={
          <select style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}
            value={selectedRegion || ''} onChange={e => setSelectedRegion(e.target.value)}>
            {data?.regions?.map(r => <option key={r.Region}>{r.Region}</option>)}
          </select>}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} width={72} />
              <Tooltip formatter={v => fmtCurrency(v)} />
              <Line type="monotone" dataKey="sales" stroke={REGION_COLORS[selectedRegion] ?? '#3b82f6'}
                strokeWidth={2} dot={false} name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Comparative Radar">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
              { metric: 'Sales',    ...Object.fromEntries(data?.regions?.map(r => [r.Region, r.Sales]) ?? []) },
              { metric: 'Profit',   ...Object.fromEntries(data?.regions?.map(r => [r.Region, r.Profit]) ?? []) },
              { metric: 'Orders',   ...Object.fromEntries(data?.regions?.map(r => [r.Region, r.Orders * 100]) ?? []) },
              { metric: 'Quantity', ...Object.fromEntries(data?.regions?.map(r => [r.Region, r.Quantity]) ?? []) },
            ]}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              {data?.regions?.map((r, i) => (
                <Radar key={r.Region} name={r.Region} dataKey={r.Region}
                  stroke={REGION_COLORS[r.Region] ?? COLORS[i]}
                  fill={REGION_COLORS[r.Region] ?? COLORS[i]} fillOpacity={0.15} />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Regional summary table */}
      <Card title="Regional Summary">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['Region', 'Total Sales', 'Total Profit', 'Orders', 'Quantity', 'Profit Margin'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data?.regions?.map((r, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: REGION_COLORS[r.Region] ?? COLORS[i], display: 'inline-block' }} />
                      {r.Region}
                    </span>
                  </td>
                  <td className="font-bold">{fmtCurrency(r.Sales)}</td>
                  <td className="text-success">{fmtCurrency(r.Profit)}</td>
                  <td>{fmt(r.Orders)}</td>
                  <td>{fmt(r.Quantity)}</td>
                  <td>{r.Profit_Margin?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
