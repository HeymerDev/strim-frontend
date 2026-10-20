import { useEffect, useId, useRef, useState } from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from './Button';

type CopyFieldProps = {
  label: string;
  value: string;
  /** Oculta el valor por defecto y suma "Mostrar" (la clave de OBS, RF-12.6). */
  secret?: boolean;
};

const MASK = '•'.repeat(24);

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Respaldo para navegadores sin Clipboard API o sin permiso.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

/** Valor de solo lectura con "Copiar" y, si es secreto, "Mostrar" (diseño §9.8). */
export function CopyField({ label, value, secret = false }: CopyFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(!secret);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    await copyText(value);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-sm font-semibold text-texto">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2 rounded-campo border border-linea bg-relieve p-1.5 pl-4">
        <code
          aria-labelledby={id}
          className="min-w-0 flex-1 py-1.5 font-mono text-sm break-all text-texto"
          translate="no"
        >
          {visible ? value : <span aria-label="Valor oculto">{MASK}</span>}
        </code>
        <div className="flex gap-1.5">
          {secret && (
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={visible}
              icon={visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? 'Ocultar' : 'Mostrar'}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={copied ? <Check size={16} aria-hidden="true" className="text-senal" /> : <Copy size={16} aria-hidden="true" />}
            onClick={copy}
            aria-label={`Copiar ${label.toLowerCase()}`}
          >
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      </div>
      <span role="status" className="sr-only">
        {copied ? `${label} copiado` : ''}
      </span>
    </div>
  );
}
