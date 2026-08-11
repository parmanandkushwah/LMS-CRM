import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lf-access-token') || sessionStorage.getItem('lf-access-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('lf-refresh-token') || sessionStorage.getItem('lf-refresh-token')
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            { refreshToken }
          )
          const { accessToken, refreshToken: newRefresh } = res.data.data
          const store = localStorage.getItem('lf-access-token') ? localStorage : sessionStorage
          store.setItem('lf-access-token', accessToken)
          store.setItem('lf-refresh-token', newRefresh)
          original.headers.Authorization = `Bearer ${accessToken}`
          return api(original)
        } catch {
          localStorage.removeItem('lf-access-token')
          localStorage.removeItem('lf-refresh-token')
          localStorage.removeItem('lf-user')
          sessionStorage.removeItem('lf-access-token')
          sessionStorage.removeItem('lf-refresh-token')
          sessionStorage.removeItem('lf-user')
          window.location.href = '/login'
        }
      }
    }
    const msg = err.response?.data?.message || err.message || 'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

export default api
