import axios from 'axios'

export const instance = axios.create({
  // timeout: 120_000,
  baseURL: 'http://localhost:3000'
})

instance.interceptors.request.use(
  config => {
    config.headers['Content-Type'] = 'application/json'
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  response => {
    if (response && (response.status === 200 || response.status === 304 || response.status === 400)) {
      return response.data
    }
  },
  error => {
    return Promise.reject(error)
  }
)

export async function get (url, parameters = {}, responseType) {
  try {
    const response = await instance({
      url,
      params: {
        ...parameters,
        randomTime: Date.now()
      },
      responseType
    })
    return response
  } catch (error) {
    console.log(error)
    return Promise.reject(error)
  }
}

export async function patch (url, data = {}, responseType, properties) {
  try {
    const response = await instance({
      method: 'patch',
      url,
      data,
      responseType,
      headers: { 'Content-Type': 'multipart/form-data' },
      ...properties
    })

    return response
  } catch (error) {
    console.log(error)
    return Promise.reject(error)
  }
}

export async function post (url, data = {}, responseType, properties) {
  try {
    const response = await instance({
      method: 'post',
      url,
      data,
      responseType,
      headers: { 'Content-Type': 'application/json' },
      ...properties
    })

    return response
  } catch (error) {
    return Promise.reject(error)
  }
}

export async function del (url, data = {}, responseType, properties) {
  try {
    const response = await instance({
      method: 'delete',
      url,
      data,
      responseType,
      headers: { 'Content-Type': 'application/json' },
      ...properties
    })

    return response
  } catch (error) {
    console.log(error)
    return Promise.reject(error)
  }
}
