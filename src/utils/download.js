/**
 * Triggers a browser "save file" for an in-memory Blob by creating a temporary object URL, clicking a
 * synthetic <a download> link, then revoking the URL. Used for downloading invoice PDFs returned by the
 * authenticated API (which can't be a plain href because it needs the Authorization header).
 */
export function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // Revoke on the next tick so the click has a chance to start the download first.
    setTimeout(() => URL.revokeObjectURL(url), 0)
}
