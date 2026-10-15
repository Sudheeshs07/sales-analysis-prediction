import { useState, useEffect } from 'react'
import {
  LayoutDashboard, TrendingUp, Package, Globe, Brain, Database, Info, Sun, Moon, Menu, X,
} from 'lucide-react'
import { getFilters } from './utils/api.js'
import { useDarkMode } from './hooks/useFetch.js'
import Dashboard       from './pages/Dashboard.jsx'
import SalesAnalysis   from './pages/SalesAnalysis.jsx'
import ProductAnalysis from './pages/ProductAnalysis.jsx'
import RegionalAnalysis from './pages/RegionalAnalysis.jsx'
import SalesPrediction  from './pages/SalesPrediction.jsx'
import DataExplorer     from './pages/DataExplorer.jsx'
import AboutProject     from './pages/AboutProject.jsx'
import { Loading, ErrorBox } from './components/UI.jsx'

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'sales',        label: 'Sales Analysis',     icon: TrendingUp },
  { id: 'products',     label: 'Product Analysis',   icon: Package },
  { id: 'regional',     label: 'Regional Analysis',  icon: Globe },
  { id: 'prediction',   label: 'Sales Prediction',   icon: Brain },
  { id: 'explorer',     label: 'Data Explorer',      icon: Database },
  { id: 'about',        label: 'About Project',      icon: Info },
]

export default function App() {
  const [page, setPage]       = useState('dashboard')
  const [dark, toggleDark]    = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState({ categories: ['All'], regions: ['All'], products: ['All'], date_min: '', date_max: '' })
  const [apiError, setApiError] = useState(null)
  const [apiReady, setApiReady] = useState(false)

  useEffect(() => {
    getFilters()
      .then(r => { setFilterOptions(r.data); setApiReady(true) })
      .catch(e => setApiError(e?.response?.data?.detail ?? e.message ?? 'Cannot connect to backend'))
  }, [])

  const PageComponent = {
    dashboard:  <Dashboard        filterOptions={filterOptions} />,
    sales:      <SalesAnalysis    filterOptions={filterOptions} />,
    products:   <ProductAnalysis  filterOptions={filterOptions} />,
    regional:   <RegionalAnalysis filterOptions={filterOptions} />,
    prediction: <SalesPrediction />,
    explorer:   <DataExplorer />,
    about:      <AboutProject />,
  }[page]

  const currentNav = NAV.find(n => n.id === page)

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>
            <span style={{ fontSize: 20 }}>📊</span>
            Sales Analytics
          </h2>
          <p>Analysis &amp; Prediction</p>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <div key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => { setPage(id); setSidebarOpen(false) }}>
              <Icon size={17} />
              {label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            Sales Analysis & ML Prediction
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            React + FastAPI + Scikit-learn
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary btn-sm"
              style={{ display: 'none', padding: '6px 8px' }}
              id="menu-btn"
              onClick={() => setSidebarOpen(o => !o)}>
              <Menu size={18} />
            </button>
            <span className="topbar-title">
              {currentNav?.label}
            </span>
          </div>
          <div className="topbar-actions">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {apiReady ? '🟢 API Connected' : '🔴 API Offline'}
            </span>
            <button className={`dark-toggle ${dark ? 'on' : ''}`} onClick={toggleDark}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {dark ? <Moon size={14} /> : <Sun size={14} />}
            </span>
          </div>
        </header>

        <main className="page-content">
          {apiError ? (
            <div>
              <ErrorBox message={`Cannot connect to backend: ${apiError}`} />
              <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', fontSize: 13 }}>
                <strong>To start the backend:</strong>
                <ol style={{ marginTop: 8, paddingLeft: 18, lineHeight: 2 }}>
                  <li>Open a terminal in <code>sales-analysis-app/backend/</code></li>
                  <li>Run: <code>pip install -r requirements.txt</code></li>
                  <li>Run: <code>uvicorn main:app --reload --port 8000</code></li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          ) : !apiReady ? (
            <Loading text="Connecting to backend..." />
          ) : PageComponent}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
