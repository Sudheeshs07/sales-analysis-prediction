import { SectionHeader } from '../components/UI.jsx'

const TECH = [
  { icon: '⚛️',  name: 'React 18',       desc: 'Frontend framework' },
  { icon: '⚡',  name: 'Vite',            desc: 'Dev server & bundler' },
  { icon: '🐍',  name: 'Python FastAPI',  desc: 'REST API backend' },
  { icon: '🐼',  name: 'Pandas',          desc: 'Data analysis' },
  { icon: '🔢',  name: 'NumPy',           desc: 'Numerical computing' },
  { icon: '🤖',  name: 'Scikit-learn',    desc: 'ML models' },
  { icon: '📊',  name: 'Recharts',        desc: 'Interactive charts' },
  { icon: '🎨',  name: 'Custom CSS',      desc: 'Design system' },
]

const FEATURES = [
  { icon: '📊', title: 'Interactive Dashboard', desc: 'KPI cards, trend charts, category breakdown, regional analysis, and top-10 products table — all updated in real time when filters change.' },
  { icon: '📈', title: 'Sales Analysis',        desc: 'Monthly growth trends, category performance comparison, discount vs. sales scatter, quantity correlation, and automatically generated insights.' },
  { icon: '📦', title: 'Product Analysis',      desc: 'Rank all products by sales, profit, quantity and profit margin. Toggle between top and bottom performers with a single click.' },
  { icon: '🌍', title: 'Regional Analysis',     desc: 'Compare five regions with bar charts, a radar overlay and an individual region trend line. Filter by category and date.' },
  { icon: '🔮', title: 'ML Sales Prediction',   desc: 'Two models — Linear Regression and Random Forest — trained on a chronological split to avoid data leakage. Interactive form produces instant predictions with MAE / RMSE / R² metrics and a 6-month forecast.' },
  { icon: '🗂️', title: 'Data Explorer',         desc: 'Browse and search all 2,000+ records. Upload any valid CSV to instantly replace the dataset and trigger automatic model retraining.' },
]

export default function AboutProject() {
  return (
    <div>
      <SectionHeader title="About This Project" subtitle="Technology, architecture and feature overview" />

      <div className="about-hero">
        <h1>Sales Analysis & Future Sales Prediction</h1>
        <p>Transforming historical sales data into actionable insights and data-driven forecasts using machine learning.</p>
      </div>

      {/* Features */}
      <div className="card mb-6">
        <div className="card-header"><span className="card-title">✨ Features</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset */}
      <div className="card mb-6">
        <div className="card-header"><span className="card-title">📁 Dataset</span></div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            The application ships with a <strong>synthetic dataset of 2,000 sales records</strong> spanning three years (2021–2023).
            Records include realistic seasonal patterns — Q4 holiday uplift, summer mid-season boost, and Q1 slowdown — as well as
            category-specific pricing, quantity distributions and profit margins. Every column required for analysis and ML training is present:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {['Order_ID','Order_Date','Product','Category','Region','Quantity','Sales','Discount','Profit'].map(c => (
              <span key={c} className="badge badge-blue" style={{ fontSize: 13 }}>{c}</span>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 14 }}>
            Upload your own CSV from the <strong>Data Explorer</strong> page to replace the synthetic dataset. The backend will automatically
            validate, clean and retrain both ML models on your data.
          </p>
        </div>
      </div>

      {/* ML */}
      <div className="card mb-6">
        <div className="card-header"><span className="card-title">🤖 Machine Learning</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>📐 Linear Regression</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Fast baseline model. Assumes a linear relationship between features and sales.
                Useful for detecting systematic biases and for interpretability.
              </div>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>🌲 Random Forest</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Ensemble of 100 decision trees. Captures non-linear interactions and is robust to outliers.
                Typically achieves the highest R² on this dataset.
              </div>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>📊 Evaluation</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Models are evaluated on a held-out test set using a <strong>chronological 80/20 split</strong> (no data leakage).
                Metrics: MAE, RMSE, R².
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="card mb-6">
        <div className="card-header"><span className="card-title">🛠️ Technology Stack</span></div>
        <div className="card-body">
          <div className="tech-grid">
            {TECH.map((t, i) => (
              <div key={i} className="tech-card">
                <div className="tech-icon">{t.icon}</div>
                <h4>{t.name}</h4>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, paddingBottom: 20 }}>
        Built with ❤️ using React + FastAPI + Scikit-learn
      </div>
    </div>
  )
}
