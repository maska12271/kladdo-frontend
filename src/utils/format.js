export function formatMoney(value) {
    const number = Number(value || 0)
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
    }).format(number)
}

export function formatDate(value) {
    if (!value) return '-'
    return new Date(value).toLocaleDateString()
}

export function safeArray(value) {
    return Array.isArray(value) ? value : value?.content || []
}

export function isActiveStatus(status) {
    return ['NEW', 'OPEN', 'IN_PROGRESS', 'PUBLISHED', 'CONFIRMED'].includes(String(status || '').toUpperCase())
}