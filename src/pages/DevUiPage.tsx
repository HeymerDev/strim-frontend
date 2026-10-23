import { useState, type ReactNode } from 'react';
import { Clock, Radio, Send, Users } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { CopyField } from '../components/CopyField';
import { EmptyState } from '../components/EmptyState';
import { Field, TextAreaField } from '../components/Field';
import { IconButton } from '../components/IconButton';
import { LiveBadge } from '../components/LiveBadge';
import { Logo } from '../components/Logo';
import { Modal } from '../components/Modal';
import { OtpInput } from '../components/OtpInput';
import { PasswordField } from '../components/PasswordField';
import { Skeleton } from '../components/Skeleton';
import { Spinner } from '../components/Spinner';
import { Stat } from '../components/Stat';
import { StatusNode } from '../components/StatusNode';
import { toast } from '../components/toast';

/** Catálogo de componentes, solo en desarrollo (tarea 3). Los datos son de ejemplo. */
export default function DevUiPage() {
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [bio, setBio] = useState('Streams de desarrollo web los martes y jueves.');

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <Logo size={28} />
        <h1 className="text-2xl font-extrabold">Componentes base</h1>
        <p className="text-texto-suave">Página de desarrollo. Datos de ejemplo.</p>
      </header>

      <Section title="Botones">
        <Row>
          <Button>Iniciar stream</Button>
          <Button variant="secondary">Finalizar stream</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="danger">Borrar mi cuenta</Button>
          <Button variant="al-aire" icon={<StatusNode status="live" size={12} />}>
            En vivo
          </Button>
        </Row>
        <Row>
          <Button loading>Guardando</Button>
          <Button variant="secondary" loading>
            Enviando código
          </Button>
          <Button disabled>Guardar cambios</Button>
          <Button size="sm" variant="secondary">
            Copiar
          </Button>
          <Button size="sm" icon={<Radio size={16} aria-hidden="true" />}>
            Transmitir
          </Button>
        </Row>
        <Row>
          <IconButton label="Enviar mensaje" icon={<Send size={18} aria-hidden="true" />} variant="primary" />
          <IconButton label="Transmitir" icon={<Radio size={18} aria-hidden="true" />} variant="secondary" />
          <IconButton label="Espectadores" icon={<Users size={18} aria-hidden="true" />} />
          <Spinner label="Cargando" className="text-senal" />
        </Row>
      </Section>

      <Section title="Campos">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Correo" type="email" autoComplete="email" placeholder="ana@correo.com" />
          <Field label="Nombre de usuario" hint="Será tu canal: strim/ana" defaultValue="ana" />
          <Field label="Correo" type="email" defaultValue="ana@correo.com" error="Ese correo ya está registrado." />
          <Field label="Nombre de usuario" defaultValue="ana" disabled hint="Finaliza el stream para cambiar tu nombre de usuario." />
          <PasswordField
            label="Contraseña"
            autoComplete="current-password"
            labelAction={
              <a href="#" className="text-sm font-semibold text-senal hover:underline">
                ¿La olvidaste?
              </a>
            }
          />
          <PasswordField label="Contraseña nueva" autoComplete="new-password" rules />
          <TextAreaField
            label="Bio"
            value={bio}
            maxLength={200}
            onChange={(e) => setBio(e.target.value)}
            counter={`${bio.length} / 200`}
            className="sm:col-span-2"
          />
        </div>
      </Section>

      <Section title="Código de verificación">
        <div className="flex max-w-sm flex-col gap-4">
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setOtpError(undefined);
            }}
            onComplete={(v) => {
              if (v !== '1234567890'.slice(0, v.length)) setOtpError('El código es incorrecto o venció.');
              else toast('Código correcto');
            }}
            error={otpError}
          />
          <p className="text-sm text-texto-suave">Prueba con 1234… (correcto) u otro número (error).</p>
        </div>
      </Section>

      <Section title="Datos para copiar">
        <div className="flex max-w-xl flex-col gap-5">
          <CopyField label="Servidor" value="rtmp://localhost:1935/live" />
          <CopyField label="Clave de transmisión" value="ana?key=Xk3lI10Op9vQ2wRtYb7sZ4mNcD8fGh5J" secret />
        </div>
      </Section>

      <Section title="Modales y avisos">
        <Row>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
            Regenerar clave
          </Button>
          <Button variant="secondary" onClick={() => setFormOpen(true)}>
            Cambiar contraseña
          </Button>
          <Button variant="ghost" onClick={() => toast('Cambios guardados')}>
            Aviso de éxito
          </Button>
          <Button variant="ghost" onClick={() => toast('No pudimos conectar con el servidor.', 'error')}>
            Aviso de error
          </Button>
        </Row>
        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="¿Regenerar la clave?"
          description="La clave actual dejará de funcionar. Tendrás que pegar la nueva en OBS."
          actions={
            <>
              <Button variant="ghost" data-autofocus onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setConfirmOpen(false);
                  toast('Clave regenerada. Pégala en OBS.');
                }}
              >
                Regenerar clave
              </Button>
            </>
          }
        />
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title="Cambiar contraseña"
          actions={
            <>
              <Button variant="ghost" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setFormOpen(false);
                  toast('Contraseña actualizada');
                }}
              >
                Cambiar contraseña
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-5">
            <PasswordField label="Contraseña actual" autoComplete="current-password" data-autofocus />
            <PasswordField label="Contraseña nueva" autoComplete="new-password" rules />
          </div>
        </Modal>
      </Section>

      <Section title="Estado del canal">
        <Row>
          {(['offline', 'waiting', 'live'] as const).map((status) => (
            <div key={status} className="flex items-center gap-4 rounded-panel border border-linea bg-panel p-5">
              <StatusNode status={status} size={72} />
              <StatusNode status={status} size={24} />
              <StatusNode status={status} size={12} />
              <span className="text-sm text-texto-suave">{status}</span>
            </div>
          ))}
        </Row>
        <Row>
          <LiveBadge />
          <Stat icon={Users} value="124" label="124 espectadores" />
          <Stat icon={Clock} value="1:02:33" label="En vivo desde hace 1 hora y 2 minutos" />
        </Row>
      </Section>

      <Section title="Avatares">
        <Row>
          {([24, 32, 40, 64, 96, 120] as const).map((size) => (
            <Avatar key={size} src={null} name="Ana Torres" username="ana" size={size} />
          ))}
        </Row>
        <Row>
          <Avatar src="/favicon.svg" name="Leo" username="leo" size={64} />
          <Avatar src={null} name="Leo" username="leo" size={64} live />
          <Avatar src={null} name="mar_tv" username="mar_tv" size={64} />
          <Avatar src={null} name="Juan Pablo" username="jp" size={64} />
          <Avatar src="/no-existe.png" name="Sofía" username="sofi" size={64} />
        </Row>
      </Section>

      <Section title="Carga y vacío">
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-video rounded-panel" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
        <EmptyState
          title="Nadie está en vivo ahora"
          text="Cuando alguien empiece a transmitir, aparece aquí."
          action={<Button>Transmite tú</Button>}
        />
      </Section>

    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="border-b border-linea pb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
