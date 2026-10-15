import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

export const getHealth     = ()       => api.get('/health')
export const getFilters    = ()       => api.get('/filters-options')
export const getKPIs       = (p)      => api.get('/kpis',               { params: p })
export const getSalesTrend = (p)      => api.get('/sales-trend',        { params: p })
export const getCategoryAnalysis  = (p) => api.get('/category-analysis', { params: p })
export const getRegionalAnalysis  = (p) => api.get('/regional-analysis', { params: p })
export const getProductAnalysis   = (p) => api.get('/product-analysis',  { params: p })
export const getRecentSales  = (p)    => api.get('/recent-sales',        { params: p })
export const getSalesAnalysis= (p)    => api.get('/sales-analysis',      { params: p })
export const getPredictionOptions = ()=> api.get('/prediction-options')
export const getModelMetrics = ()     => api.get('/model-metrics')
export const predict         = (d)    => api.post('/predict',            d)
export const uploadCSV       = (f)    => {
  const form = new FormData()
  form.append('file', f)
  return api.post('/upload-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const getDataset      = (p)    => api.get('/dataset',            { params: p })
export const retrain         = ()     => api.post('/train', {})

export default api
