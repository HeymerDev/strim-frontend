import { useId, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../../components/Button';
import { CopyField } from '../../components/CopyField';
import { Modal } from '../../components/Modal';
import type { StreamDashboard } from '../../lib/types';
import { useStudioActions } from './useStudioActions';

/** Servidor y clave para OBS, con "Regenerar clave" (RF-12.6, RF-12.8 y RF-12.9). */
export function ObsPanel({ stream }: { stream: StreamDashboard }) {
  const { regenerate } = useStudioActions();
  const headingId = useId();
  const hintId = useId();
  const [confirm, setConfirm] = useState(false);
  const canRegenerate = stream.status === 'offline';

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5 rounded-panel border border-linea bg-panel p-5 sm:p-6">
      <h2 id={headingId} className="text-lg font-bold">
        Conectar OBS
      </h2>
      <CopyField label="Servidor" value={stream.obs.server} />
      <CopyField label="Clave de transmisión" value={stream.obs.streamKey} secret />
      <p className="flex items-start gap-2 text-sm text-texto-suave">
        <ShieldAlert size={18} aria-hidden="true" className="mt-px shrink-0 text-senal" />
        No compartas tu clave: con ella cualquiera transmite en tu canal.
      </p>
      <div className="flex flex-col items-start gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!canRegenerate}
          aria-describedby={canRegenerate ? undefined : hintId}
          onClick={() => setConfirm(true)}
        >
          Regenerar clave
        </Button>
        {!canRegenerate && (
          <p id={hintId} className="text-sm text-texto-suave">
            Finaliza el stream para regenerar la clave.
          </p>
        )}
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="¿Regenerar la clave?"
        description="La clave actual dejará de funcionar. Tendrás que pegar la nueva en OBS."
        actions={
          <>
            <Button variant="ghost" data-autofocus onClick={() => setConfirm(false)}>
              Cancelar
            </Button>
            <Button loading={regenerate.isPending} onClick={() => regenerate.mutate(undefined, { onSettled: () => setConfirm(false) })}>
              Regenerar clave
            </Button>
          </>
        }
      />
    </section>
  );
}

/** Guía corta para OBS (RF-12.7). Lista numerada porque son pasos en orden. */
export function ObsGuide() {
  const headingId = useId();
  const steps = [
    <>En OBS: Ajustes → Emisión → Servicio <strong className="font-semibold text-texto">Personalizado</strong>.</>,
    <>Pega el servidor y la clave. En Salida, usa un intervalo de fotogramas clave de 2 s.</>,
    <>Aquí, pulsa <strong className="font-semibold text-texto">Iniciar stream</strong>.</>,
    <>En OBS, pulsa <strong className="font-semibold text-texto">Iniciar transmisión</strong>.</>,
  ];
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-panel border border-linea bg-panel p-5 sm:p-6">
      <h2 id={headingId} className="text-lg font-bold">
        Cómo conectar OBS
      </h2>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-base text-texto-suave">
            <span
              aria-hidden="true"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-linea text-xs font-bold text-texto tabular-nums"
            >
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
