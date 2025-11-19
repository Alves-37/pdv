import { useEffect } from 'react'

export default function Modal({ open, title, children, onClose, actions, fullScreenMobile = true }) {
  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  // Evita scroll do conteúdo atrás do modal (mobile)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = originalOverflow || ''
    }
    return () => {
      document.body.style.overflow = originalOverflow || ''
    }
  }, [open])

  if (!open) return null
  return (
    <div className={`fixed inset-0 z-50 flex ${fullScreenMobile ? 'sm:items-center sm:justify-center p-0 sm:p-4' : 'items-center justify-center p-4'} overscroll-contain`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative bg-white shadow-xl flex flex-col ${fullScreenMobile ? 'w-full h-full max-h-screen sm:h-auto sm:max-w-lg sm:max-h-[90vh] sm:rounded-xl' : 'w-full max-w-sm max-h-screen rounded-xl'} `}
        style={fullScreenMobile ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
      >
        {/* Header sticky */}
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button aria-label="Fechar" className="p-2 rounded-md hover:bg-gray-100" onClick={onClose}>
            <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {/* Conteúdo rolável */}
        <div className={`px-4 py-4 overflow-y-auto ${fullScreenMobile ? 'flex-1' : ''}`}>
          {children}
        </div>
        {actions && (
          <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-end gap-2 sticky bottom-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
