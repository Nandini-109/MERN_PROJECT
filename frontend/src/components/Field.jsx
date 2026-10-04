import { useId, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

/** Labelled input with optional leading icon, error text, hint and password visibility toggle. */
export default function Field({ label, icon: Icon, error, hint, type = 'text', textarea = false, counter, className = '', ...props }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const Tag = textarea ? 'textarea' : 'input';
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="input-wrap">
        {Icon && !textarea && <Icon size={18} className="lead-icon" />}
        <Tag
          id={id}
          className={`${textarea ? 'textarea' : 'input'} ${Icon && !textarea ? 'has-icon' : ''} ${isPassword ? 'has-trail' : ''} ${error ? 'invalid' : ''} ${className}`}
          type={textarea ? undefined : isPassword && show ? 'text' : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {isPassword && (
          <button type="button" className="trail-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span id={`${id}-err`} className="error-text" role="alert"><AlertCircle size={14} />{error}</span>}
      {!error && hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      {counter && <span className="counter">{counter}</span>}
    </div>
  );
}
