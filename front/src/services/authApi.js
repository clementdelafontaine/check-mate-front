const BASE = import.meta.env.VITE_API_BASE ?? '/api'

async function request(path, options = {}) {
  const hasBody = options.body !== undefined
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.error ?? `API error ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

export const authApi = {
  me() {
    return request('/auth/me')
  },
  login(username, password) {
    return request('/auth/login', { method: 'POST', body: { username, password } })
  },
  changePassword(currentPassword, newPassword) {
    return request('/auth/me/password', { method: 'PATCH', body: { currentPassword, newPassword } })
  },
  logout() {
    return request('/auth/logout', { method: 'POST' })
  },
  listUsers() {
    return request('/auth/users')
  },
  createUser(username, password, role) {
    return request('/auth/users', { method: 'POST', body: { username, password, role } })
  },
  deleteUser(userId) {
    return request(`/auth/users/${userId}`, { method: 'DELETE' })
  },
  setUserPassword(userId, password) {
    return request(`/auth/users/${userId}/password`, { method: 'PATCH', body: { password } })
  }
}
