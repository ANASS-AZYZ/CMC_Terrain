import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.headers['X-Api-Token'] = token
  }
  return config
})

export default api
