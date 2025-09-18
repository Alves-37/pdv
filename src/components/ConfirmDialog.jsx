import Modal from './Modal'

export default function ConfirmDialog({
  open,
  title = 'Confirmar',
  message = 'Tem certeza?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}) {
  return (
    <Modal
      open={open}
      title={title}
      fullScreenMobile={false}
      onClose={() => { if (!loading) onCancel?.() }}
      actions={(
        <>
          <button type="button" className="btn-outline" onClick={onCancel} disabled={loading}>{cancelText}</button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processando...' : confirmText}
          </button>
        </>
      )}
    >
      <div className="text-sm text-gray-700">
        {typeof message === 'string' ? <p>{message}</p> : message}
      </div>
    </Modal>
  )
}
