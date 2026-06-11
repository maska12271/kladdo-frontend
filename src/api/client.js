const API_BASE_URL = 'http://localhost:8080/api'

// Registered by AuthContext so the client can force a logout when the token is rejected.
let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
    unauthorizedHandler = handler
}

function getToken() {
    return localStorage.getItem('token')
}

async function request(path, options = {}) {
    const token = getToken()

    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
        ...options,
    })

    if (response.status === 401) {
        if (unauthorizedHandler) unauthorizedHandler()
        throw new Error('Your session has expired. Please log in again.')
    }

    if (!response.ok) {
        throw new Error(await extractError(response))
    }

    if (response.status === 204) {
        return null
    }

    const contentType = response.headers.get('content-type') || ''
    const text = await response.text()

    if (!text) {
        return null
    }

    if (contentType.includes('application/json')) {
        return JSON.parse(text)
    }

    return text
}

async function extractError(response) {
    const text = await response.text()
    if (!text) {
        return `Request failed: ${response.status}`
    }
    try {
        const parsed = JSON.parse(text)
        return parsed.error || parsed.message || text
    } catch {
        return text
    }
}

export function apiGet(path) {
    return request(path)
}

export function apiPost(path, body) {
    return request(path, {
        method: 'POST',
        body: JSON.stringify(body),
    })
}

export function apiPut(path, body) {
    return request(path, {
        method: 'PUT',
        body: JSON.stringify(body),
    })
}

export function apiDelete(path) {
    return request(path, {
        method: 'DELETE',
    })
}
