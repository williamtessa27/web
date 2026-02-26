import { useConnectionStatus, type ConnectionState } from '@/hooks/useConnectionStatus';
import { HiOutlineSignalSlash, HiOutlineServerStack, HiOutlineCheckCircle } from 'react-icons/hi2';

const config: Record<
  ConnectionState | 'back-online',
  { message: string; icon: React.ReactNode; className: string }
> = {
  offline: {
    message: "Vous n'êtes pas connecté à Internet. Les modifications peuvent ne pas être enregistrées.",
    icon: <HiOutlineSignalSlash className="h-5 w-5 flex-shrink-0" />,
    className: 'bg-amber-600 text-white',
  },
  'server-unreachable': {
    message: 'Connexion au serveur interrompue. Vérifiez votre connexion ou réessayez plus tard.',
    icon: <HiOutlineServerStack className="h-5 w-5 flex-shrink-0" />,
    className: 'bg-amber-700 text-white',
  },
  online: {
    message: '',
    icon: null,
    className: '',
  },
  'back-online': {
    message: "Vous êtes de nouveau connecté.",
    icon: <HiOutlineCheckCircle className="h-5 w-5 flex-shrink-0" />,
    className: 'bg-emerald-600 text-white',
  },
};

export default function ConnectionStatusBar() {
  const { state, showBackOnline } = useConnectionStatus();

  const visible = state !== 'online' || showBackOnline;
  const key = showBackOnline ? 'back-online' : state;
  const { message, icon, className } = config[key];
  const showBar = visible && !!message;

  return (
    <>
      {showBar && (
        <>
          {/* Espaceur pour ne pas masquer le contenu sous la barre fixe */}
          <div className="h-[42px] flex-shrink-0" aria-hidden />
          <div
            role="status"
            aria-live="polite"
            className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium shadow-md ${className}`}
          >
            {icon}
            <span>{message}</span>
          </div>
        </>
      )}
    </>
  );
}
