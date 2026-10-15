import { useState } from 'react'

export function Filters({ options = {}, value = {}, onChange, showProduct = false }) {
  const upd = (k, v) => onChange({ ...value, [k]: v })

  return (
    <div className="filters-bar">
      <div className="filter-group">
        <label>Date From</label>
        <input type="date"
          value={value.start_date || ''}
          min={options.date_min}
          max={options.date_max}
          onChange={e => upd('start_date', e.target.value)} />
      </div>
      <div className="filter-group">
        <label>Date To</label>
        <input type="date"
          value={value.end_date || ''}
          min={options.date_min}
          max={options.date_max}
          onChange={e => upd('end_date', e.target.value)} />
      </div>
      <div className="filter-group">
        <label>Category</label>
        <select value={value.category || 'All'} onChange={e => upd('category', e.target.value)}>
          {(options.categories || ['All']).map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Region</label>
        <select value={value.region || 'All'} onChange={e => upd('region', e.target.value)}>
          {(options.regions || ['All']).map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      {showProduct && (
        <div className="filter-group">
          <label>Product</label>
          <select value={value.product || 'All'} onChange={e => upd('product', e.target.value)}>
            {(options.products || ['All']).map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      )}
      <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-end' }}
        onClick={() => onChange({ category: 'All', region: 'All', product: 'All', start_date: '', end_date: '' })}>
        Reset
      </button>
    </div>
  )
}
