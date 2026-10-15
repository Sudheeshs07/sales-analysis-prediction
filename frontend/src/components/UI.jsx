export function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  )
}

export function ErrorBox({ message }) {
  return (
    <div className="error-box">
      ⚠️ {message}
    </div>
  )
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}

export function Card({ title, children, actions, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <span className="card-title">{title}</span>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}

export function KPICard({ label, value, sub, icon, color = 'var(--accent)' }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="kpi-label">{label}</span>
        {icon && <span className="kpi-icon" style={{ color }}>{icon}</span>}
      </div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
