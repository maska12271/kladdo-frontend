import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

function getFocusableElements(container) {
    if (!container) return []
    return Array.from(
        container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))
}

export default function Modal({ isOpen, title, children, onClose, width = 'max-w-3xl' }) {
    const { t } = useTranslation()
    const dialogRef = useRef(null)
    const lastActiveElementRef = useRef(null)

    useEffect(() => {
        if (!isOpen) return

        lastActiveElementRef.current = document.activeElement

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const dialog = dialogRef.current

        const focusFirst = () => {
            const focusable = getFocusableElements(dialog)
            if (focusable.length > 0) {
                focusable[0].focus()
            } else {
                dialog?.focus()
            }
        }

        const timer = setTimeout(focusFirst, 0)

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
                return
            }

            if (event.key === 'Tab') {
                const focusable = getFocusableElements(dialog)
                if (focusable.length === 0) {
                    event.preventDefault()
                    dialog?.focus()
                    return
                }

                const first = focusable[0]
                const last = focusable[focusable.length - 1]

                if (event.shiftKey) {
                    if (document.activeElement === first || document.activeElement === dialog) {
                        event.preventDefault()
                        last.focus()
                    }
                } else {
                    if (document.activeElement === last) {
                        event.preventDefault()
                        first.focus()
                    }
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            clearTimeout(timer)
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleKeyDown)
            lastActiveElementRef.current?.focus?.()
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div
            className="overlay-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                // Click on the dim backdrop (outside the dialog) dismisses the modal.
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className={`dialog-enter shadow-pop w-full ${width} rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                ref={dialogRef}
                tabIndex={-1}
            >
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <h2 id="modal-title" className="text-xl font-semibold tracking-tight">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.close')}
                        className="-mr-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}