import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HiOutlineBell, HiOutlineMap } from 'react-icons/hi2';
import { AppRoutes } from '@/config/routes.config';
import type { Notification } from '@/types';

interface NotificationDropdownProps {
  list: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (ids: string[]) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  isOpen: boolean;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

/** Types d'entité pour la navigation au clic */
const TYPE_ENTITE_TOURNEE = 'tournee';

export default function NotificationDropdown({
  list,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
  isOpen,
}: NotificationDropdownProps) {
  const navigate = useNavigate();

  const handleItemClick = (n: Notification) => {
    if (!n.lu) onMarkAsRead([n.id]);
    if (n.typeEntite === TYPE_ENTITE_TOURNEE && n.idEntite) {
      navigate(AppRoutes.TOURNEE_DETAIL.replace(':id', n.idEntite));
    } else if (n.typeEntite === TYPE_ENTITE_TOURNEE) {
      navigate(AppRoutes.TOURNEES);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <HiOutlineBell className="h-4 w-4 text-gray-500" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => {
                onMarkAllAsRead();
                onClose();
              }}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Tout marquer lu
            </button>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Chargement…
            </div>
          ) : list.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Aucune notification
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3"
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {n.typeEntite === TYPE_ENTITE_TOURNEE ? (
                        <HiOutlineMap className="h-5 w-5 text-primary-500" />
                      ) : (
                        <HiOutlineBell className="h-5 w-5 text-gray-400" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          !n.lu ? 'text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {n.titre}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(n.createdAt), 'dd MMM à HH:mm', {
                          locale: fr,
                        })}
                      </p>
                    </div>
                    {!n.lu && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={() => {
              navigate(AppRoutes.NOTIFICATIONS);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <HiOutlineBell className="h-4 w-4" />
            Voir toutes les notifications
          </button>
        </div>
      </div>
    </>
  );
}
