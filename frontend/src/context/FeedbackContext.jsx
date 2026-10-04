import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import Modal from '../components/Modal';

const FeedbackContext = createContext(null);
export const useToast = () => useContext(FeedbackContext).toast;
export const useConfirm = () => useContext(FeedbackContext).confirm;

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message, ms = 4200) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), ms);
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m, 6000),
    info: (m) => push('info', m)
  }), [push]);

  // confirm({ title, message, confirmText, danger }) -> Promise<boolean>
  const confirm = useCallback((options) => new Promise((resolve) => setDialog({ ...options, resolve })), []);
  const close = (result) => { dialog?.resolve(result); setDialog(null); };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`toast ${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
              <Icon size={20} className="t-icon" />
              <span>{t.message}</span>
              <button className="t-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"><X size={16} /></button>
            </div>
          );
        })}
      </div>

      {dialog && (
        <Modal small onClose={() => close(false)} labelledBy="confirm-title">
          <div className={`confirm-icon ${dialog.danger ? 'danger' : ''}`}><AlertTriangle size={24} /></div>
          <h2 id="confirm-title" style={{ fontSize: '1.4rem' }}>{dialog.title || 'Are you sure?'}</h2>
          <p className="text-2" style={{ marginTop: 8 }}>{dialog.message}</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => close(false)}>Cancel</button>
            <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)} autoFocus>
              {dialog.confirmText || 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}
