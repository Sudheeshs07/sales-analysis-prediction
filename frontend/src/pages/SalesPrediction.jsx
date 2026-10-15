import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import { getPredictionOptions, getModelMetrics, predict, retrain } from '../utils/api.js'
import { fmt, fmtCurrency, COLORS } from '../utils/formatters.js'
import { Loading, ErrorBox, SectionHeader, Card } from '../components/UI.jsx'

export default function SalesPrediction() {
  const [options, setOptions]   = useState(null)
  const [metrics, setMetrics]   = useState(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [error, setError]       = useState(null)
  const [predResult, setPredResult] = useState(null)
  const [predLoading, setPredLoading] = useState(false)
  const [trainLoading, setTrainLoading] = useState(false)
  const [trainMsg, setTrainMsg] = useState(null)

  const [form, setForm] = useState({
    category: '', region: '', quantity: 10, discount: 0.05,
    month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    model_name: 'Random Forest',
  })

  const loadData = async () => {
    setLoadingInit(true); setError(null)
    try {
      const [o, m] = await Promise.all([getPredictionOptions(), getModelMetrics()])
      setOptions(o.data)
      setMetrics(m.data)
      setForm(f => ({
        ...f,
        category: o.data.categories[0] ?? '',
        region: o.data.regions[0] ?? '',
      }))
    } catch(e) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoadingInit(false) }
  }

  useEffect(() => { loadData() }, [])

  const handlePredict = async (e) => {
    e.preventDefault()
    setPredLoading(true)
    try {
      const res = await predict(form)
      setPredResult(res.data)
    } catch(e) {
      alert('Prediction failed: ' + (e?.response?.data?.detail ?? e.message))
    } finally { setPredLoading(false) }
  }

  const handleRetrain = async () => {
    setTrainLoading(true); setTrainMsg(null)
    try {
      const res = await retrain()
      setTrainMsg(`✅ Retrained! Best: ${res.data.best_model} | R²: ${res.data.r2}`)
      await loadData()
    } catch(e) {
      setTrainMsg('❌ Retrain failed: ' + (e?.response?.data?.detail ?? e.message))
    } finally { setTrainLoading(false) }
  }

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (loadingInit) return <Loading text="Loading prediction model..." />
  if (error)       return <ErrorBox message={error} />

  const bestModel = metrics?.best_model
  const allResults = metrics?.results ?? {}
  const avp = metrics?.actual_vs_predicted?.[bestModel] ?? {}
  const avpData = avp.actual?.map((a, i) => ({ actual: parseFloat(a.toFixed(2)), predicted: parseFloat((avp.predicted[i] ?? 0).toFixed(2)), index: i })) ?? []

  return (
    <div>
      <SectionHeader title="Sales Prediction"
        subtitle="ML-powered forecasting using Linear Regression & Random Forest" />

      {/* Model metrics */}
      <div className="model-compare mb-6">
        {Object.entries(allResults).map(([name, m]) => (
          <div key={name} className={`model-card ${name === bestModel ? 'best' : ''}`}>
            {name === bestModel && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>⭐ BEST MODEL</div>}
            <h3>{name}</h3>
            <div className="metric-row"><span>MAE</span><span>{fmtCurrency(m.mae)}</span></div>
            <div className="metric-row"><span>RMSE</span><span>{fmtCurrency(m.rmse)}</span></div>
            <div className="metric-row"><span>R² Score</span><span>{m.r2}</span></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
        {/* Prediction Form */}
        <Card title="🔮 Predict Sales" className="mb-0" style={{ flex: '1', minWidth: '300px' }}>
          <form onSubmit={handlePredict}>
            <div className="predict-form">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => upd('category', e.target.value)}>
                  {options?.categories?.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Region</label>
                <select value={form.region} onChange={e => upd('region', e.target.value)}>
                  {options?.regions?.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Month</label>
                <select value={form.month} onChange={e => upd('month', parseInt(e.target.value))}>
                  {Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>{new Date(2024,m-1).toLocaleString('en',{month:'long'})}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Year</label>
                <select value={form.year} onChange={e => upd('year', parseInt(e.target.value))}>
                  {[2021,2022,2023,2024,2025].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" min={1} max={200} value={form.quantity}
                  onChange={e => upd('quantity', parseInt(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Discount (0–1)</label>
                <input type="number" min={0} max={0.5} step={0.05} value={form.discount}
                  onChange={e => upd('discount', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Model</label>
                <select value={form.model_name} onChange={e => upd('model_name', e.target.value)}>
                  {Object.keys(allResults).map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-4"
              disabled={predLoading} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              {predLoading ? '⏳ Predicting...' : '🔮 Predict Sales'}
            </button>
          </form>

          {/* Result */}
          {predResult && (
            <div className="predict-result">
              <div className="pred-label">Predicted Sales</div>
              <div className="pred-value">{fmtCurrency(predResult.predicted_sales)}</div>
              <div className="pred-model">Model: {predResult.model_used}</div>
              <div className="metrics-row">
                <div className="metric-pill">MAE: {fmtCurrency(predResult.mae)}</div>
                <div className="metric-pill">RMSE: {fmtCurrency(predResult.rmse)}</div>
                <div className="metric-pill">R²: {predResult.r2}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Retrain */}
        <Card title="🔄 Model Management" style={{ flex: '0 0 240px', minWidth: 220 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Upload a new CSV to automatically retrain the model, or manually trigger retraining.
          </p>
          <button className="btn btn-secondary w-full" onClick={handleRetrain}
            disabled={trainLoading} style={{ width: '100%', justifyContent: 'center' }}>
            {trainLoading ? '⏳ Retraining...' : '🔄 Retrain Model'}
          </button>
          {trainMsg && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface2)',
              borderRadius: 8, fontSize: 13, borderLeft: '3px solid var(--success)' }}>
              {trainMsg}
            </div>
          )}
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            <div><strong>Features used:</strong></div>
            <div>Month, Year, Quantity, Discount, Category, Region</div>
            <div style={{ marginTop: 8 }}><strong>Train/Test split:</strong> Chronological 80/20</div>
          </div>
        </Card>
      </div>

      {/* Actual vs Predicted */}
      <div className="charts-grid mb-6">
        <Card title={`Actual vs Predicted — ${bestModel}`}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={avpData} margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="index" tick={{ fontSize: 11 }} label={{ value: 'Test Sample #', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} width={72} />
              <Tooltip formatter={v => fmtCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="actual"    stroke="#3b82f6" strokeWidth={2} dot={false} name="Actual" />
              <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Predicted" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Future Sales Forecast (Next 6 Months)">
          <div className="forecast-grid">
            {metrics?.future_forecast?.map((f, i) => (
              <div key={i} className="forecast-card">
                <div className="fc-period">{f.period}</div>
                <div className="fc-value">{fmtCurrency(f.predicted_sales)}</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180} style={{ marginTop: 16 }}>
            <BarChart data={metrics?.future_forecast?.map(f => ({ ...f, sales: f.predicted_sales }))}
              margin={{ right: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => '$' + fmt(v)} tick={{ fontSize: 11 }} width={72} />
              <Tooltip formatter={v => fmtCurrency(v)} />
              <Bar dataKey="sales" name="Forecast" fill="#8b5cf6" radius={[4,4,0,0]}>
                {metrics?.future_forecast?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
