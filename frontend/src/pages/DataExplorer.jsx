import { useState, useEffect, useRef } from 'react'
import { Upload, Search, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { getDataset, uploadCSV } from '../utils/api.js'
import { fmt, fmtCurrency } from '../utils/formatters.js'
import { Loading, ErrorBox, SectionHeader, Card } from '../components/UI.jsx'

export default function DataExplorer() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [sortBy, setSortBy]   = useState('Order_Date')
  const [sortDir, setSortDir] = useState('desc')
  const [category, setCategory] = useState('All')
  const [region, setRegion]   = useState('All')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const load = async (pg = page) => {
    setLoading(true); setError(null)
    try {
      const res = await getDataset({ page: pg, page_size: 50, search, sort_by: sortBy, sort_dir: sortDir, category, region })
      setData(res.data)
    } catch(e) { setError(e?.response?.data?.detail ?? e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1); setPage(1) }, [search, sortBy, sortDir, category, region])
  useEffect(() => { load(page) }, [page])

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true); setUploadMsg(null)
    try {
      const res = await uploadCSV(file)
      setUploadMsg({ ok: true, msg: res.data.message })
      setPage(1); await load(1)
    } catch(e) {
      setUploadMsg({ ok: false, msg: e?.response?.data?.detail ?? e.message })
    } finally { setUploading(false) }
  }

  const cols = ['Order_ID', 'Order_Date', 'Product', 'Category', 'Region', 'Quantity', 'Sales', 'Discount', 'Profit']
  const totalPages = data ? Math.ceil(data.total / 50) : 1

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return null
    return sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>
  }

  return (
    <div>
      <SectionHeader title="Data Explorer" subtitle="Browse, search, filter and upload sales data" />

      {/* Upload zone */}
      <div className="mb-6">
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]) }}>
          <Upload size={36} />
          <p>{uploading ? 'Uploading...' : 'Click or drag & drop a CSV file'}</p>
          <small>Required columns: Order_Date, Product, Category, Region, Quantity, Sales, Discount, Profit</small>
          <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }}
            onChange={e => handleUpload(e.target.files[0])} />
        </div>
        {uploadMsg && (
          <div style={{ marginTop: 10, padding: '10px 16px', borderRadius: 8,
            background: uploadMsg.ok ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
            border: `1px solid ${uploadMsg.ok ? '#10b981' : '#ef4444'}`,
            color: uploadMsg.ok ? 'var(--success)' : 'var(--danger)',
            fontSize: 13 }}>
            {uploadMsg.msg}
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="filters-bar mb-4">
        <div className="filter-group">
          <label>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search anything..." style={{ paddingLeft: 28 }}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="filter-group">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {(data?.categories || ['All']).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Region</label>
          <select value={region} onChange={e => setRegion(e.target.value)}>
            {(data?.regions || ['All']).map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end', color: 'var(--text-muted)', fontSize: 13 }}>
          {fmt(data?.total ?? 0)} records
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? <Loading /> : error ? <ErrorBox message={error} /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {cols.map(c => (
                      <th key={c} onClick={() => handleSort(c)}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {c.replace('_', ' ')} <SortIcon col={c} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.Order_ID}</td>
                      <td>{row.Order_Date}</td>
                      <td>{row.Product}</td>
                      <td><span className="badge badge-blue">{row.Category}</span></td>
                      <td>{row.Region}</td>
                      <td>{fmt(row.Quantity)}</td>
                      <td className="font-bold">{fmtCurrency(row.Sales)}</td>
                      <td>{((row.Discount ?? 0) * 100).toFixed(0)}%</td>
                      <td className={row.Profit >= 0 ? 'text-success' : 'text-danger'}>{fmtCurrency(row.Profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft size={14}/></button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={14}/></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i))
                return (
                  <button key={p} className={page === p ? 'active' : ''}
                    onClick={() => setPage(p)}>{p}</button>
                )
              })}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight size={14}/></button>
              <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}><ChevronsRight size={14}/></button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
