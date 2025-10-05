// src/libs/axios.js
import axios from 'axios'
import router from '@/router'

const api = axios.create({ baseURL: 'http://localhost:8000/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.replace({ name: 'login' }).catch(()=>{})
    }
    return Promise.reject(err)
  }
)

export default api
