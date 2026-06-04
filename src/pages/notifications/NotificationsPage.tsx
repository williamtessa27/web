import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HiOutlineBell, HiOutlineCheck, HiOutlineMap, HiOutlineUser, HiOutlineBuildingOffice2, HiOutlineCreditCard } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { notificationApi } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import type { Notification } from '@/types';
import type { PaginatedResponse } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const LIMIT = 20;

/** Retourne la route à ouvrir au clic sur une notification selon typeEntite / idEntite. */
function getNotificationRoute(n: Notification): string | null {
  if (!n.idEntite) {
    if (n.typeEntite === 'tournee') return AppRoutes.TOURNEES;
    if (n.typeEntite === 'client') return AppRoutes.CLIENTS;
    if (n.typeEntite === 'collecte') return AppRoutes.COLLECTES;
    if (n.typeEntite === 'souscription' || n.typeEntite === 'mouvement_compte') return AppRoutes.SOUSCRIPTIONS;
    if (n.typeEntite === 'demande_retrait') return AppRoutes.DEMANDES_RETRAIT;
    if (n.typeEntite === 'dossier_credit' || n.typeEntite === 'credit_repayment') return AppRoutes.CREDIT;
    if (n.typeEntite === 'garantie' || n.typeEntite === 'assurance') return AppRoutes.GARANTIES;
    if (n.typeEntite === 'planning_collecte') return AppRoutes.TOURNEES;
    return null;
  }
  switch (n.typeEntite) {
    case 'client':
      return AppRoutes.CLIENT_DETAIL.replace(':id', n.idEntite);
    case 'tournee':
      return AppRoutes.TOURNEE_DETAIL.replace(':id', n.idEntite);
    case 'collecte':
      return AppRoutes.COLLECTE_DETAIL.replace(':id', n.idEntite);
    case 'dossier_credit':
      return AppRoutes.CREDIT_DETAIL.replace(':id', n.idEntite);
    case 'credit_repayment':
      return AppRoutes.CREDIT;
    case 'souscription':
      return AppRoutes.SOUSCRIPTION_DETAIL.replace(':id', n.idEntite);
    case 'demande_retrait':
      return AppRoutes.DEMANDES_RETRAIT;
    case 'mouvement_compte':
      return AppRoutes.SOUSCRIPTIONS;
    case 'garantie':
    case 'assurance':
      return AppRoutes.GARANTIES;
    case 'planning_collecte':
      return AppRoutes.TOURNEES;
    case 'collecteur':
      return AppRoutes.COLLECTEUR_DETAIL.replace(':id', n.idEntite);
    case 'abonnement':
      return AppRoutes.MES_ABONNEMENTS;
    default:
      return null;
  }
}

function NotificationIcon({ typeEntite, type }: { typeEntite?: string | null; type?: string }) {
  if (typeEntite === 'tournee' || type === 'tournee_demarree' || type === 'tournee_terminee') {
    return <HiOutlineMap className="h-5 w-5 text-primary-500" />;
  }
  if (typeEntite === 'client' || type === 'nouveau_client' || type === 'client_change_agence') {
    return <HiOutlineUser className="h-5 w-5 text-emerald-500" />;
  }
  if (type === 'entreprise_bloquee' || type === 'entreprise_debloquee') {
    return <HiOutlineBuildingOffice2 className="h-5 w-5 text-amber-500" />;
  }
  if (type === 'abonnement_cree' || typeEntite === 'abonnement') {
    return <HiOutlineCreditCard className="h-5 w-5 text-primary-500" />;
  }
  if (
    typeEntite === 'dossier_credit' ||
    typeEntite === 'credit_repayment' ||
    type?.startsWith('credit_') ||
    type === 'rappel_echeance_credit'
  ) {
    return <HiOutlineCreditCard className="h-5 w-5 text-indigo-500" />;
  }
  if (
    typeEntite === 'souscription' ||
    typeEntite === 'demande_retrait' ||
    typeEntite === 'mouvement_compte' ||
    type?.startsWith('epargne_') ||
    type?.startsWith('retrait_')
  ) {
    return <HiOutlineCreditCard className="h-5 w-5 text-emerald-500" />;
  }
  return <HiOutlineBell className="h-5 w-5 text-gray-400" />;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const load = useCallback(
    async (pageNum = 1, append = false) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page: pageNum, limit: LIMIT };
        const res = await notificationApi.list(params) as PaginatedResponse<Notification>;
        const data = res.data ?? [];
        const meta = res.meta ?? { totalPages: 1, total: data.length };
        if (append) {
          setList((prev) => (pageNum === 1 ? data : [...prev, ...data]));
        } else {
          setList(data);
        }
        setTotalPages(meta.totalPages ?? 1);
        setTotal(meta.total ?? data.length);
        const countRes = await notificationApi.unreadCount();
        setUnreadCount(countRes?.count ?? 0);
      } catch {
        toast.error('Erreur lors du chargement des notifications');
        if (!append) setList([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(page, false);
  }, [page, load]);

  const markAsRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await notificationApi.markAsRead(ids);
      setList((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, lu: true } : n)));
      setUnreadCount((c) => Math.max(0, c - ids.length));
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setList((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
      toast.success('Toutes les notifications ont été marquées comme lues.');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setMarkingAll(false);
    }
  }, []);

  const handleItemClick = useCallback(
    (n: Notification) => {
      if (!n.lu) markAsRead([n.id]);
      const route = getNotificationRoute(n);
      if (route) navigate(route);
    },
    [markAsRead, navigate],
  );

  const displayedList = filterUnreadOnly ? list.filter((n) => !n.lu) : list;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {total} notification{total !== 1 ? 's' : ''}
            {unreadCount > 0 && (
              <span className="ml-2 text-primary-600 font-medium">
                · {unreadCount} non lue{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={filterUnreadOnly}
              onChange={(e) => setFilterUnreadOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Non lues uniquement
          </label>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              isLoading={markingAll}
              disabled={markingAll}
            >
              <HiOutlineCheck className="h-4 w-4 mr-1.5" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      <Card>
        {loading && list.length === 0 ? (
          <PageLoader />
        ) : displayedList.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <HiOutlineBell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium">
              {filterUnreadOnly ? 'Aucune notification non lue' : 'Aucune notification'}
            </p>
            {filterUnreadOnly && (
              <button
                type="button"
                onClick={() => setFilterUnreadOnly(false)}
                className="mt-2 text-sm text-primary-600 hover:underline"
              >
                Voir toutes les notifications
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {displayedList.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors flex gap-4 rounded-lg"
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      <NotificationIcon typeEntite={n.typeEntite} type={n.type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          !n.lu ? 'text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {n.titre}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(n.createdAt), "dd MMMM yyyy 'à' HH:mm", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                    {!n.lu && (
                      <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-primary-500 mt-2" />
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {totalPages > 1 && !filterUnreadOnly && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
