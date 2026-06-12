import { Fragment, useMemo, useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiOutlineChevronRight, HiOutlineChevronDown } from 'react-icons/hi2';
import { auditApi, utilisateurApi, agenceApi } from '@/core/api';
import type { AuditLog, PaginatedResponse, Utilisateur, Agence } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Sheet from '@/components/ui/Sheet';
import { PageLoader } from '@/components/ui/LoadingSpinner';

/** Groupe les logs par jour (clé = YYYY-MM-DD), jours triés du plus récent au plus ancien. */
function groupLogsByDay(logs: AuditLog[]): { dateKey: string; label: string; logs: AuditLog[] }[] {
  const byDay = new Map<string, AuditLog[]>();
  for (const log of logs) {
    if (!log.createdAt) continue;
    const d = parseISO(log.createdAt);
    const key = format(d, 'yyyy-MM-dd');
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(log);
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, logList]) => ({
      dateKey,
      label: format(parseISO(dateKey), "EEEE d MMMM yyyy", { locale: fr }),
      logs: logList.sort(
        (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
      ),
    }));
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Création',
  UPDATE: 'Modification',
  ACTIVATE: 'Activation',
  DEACTIVATE: 'Désactivation',
  VALIDATE: 'Validation',
  REJECT: 'Rejet',
  CLOTURE: 'Clôture',
  REAFFECTATION: 'Réaffectation',
  CHANGEMENT_AGENCE: 'Changement d\'agence',
  CANCEL: 'Annulation',
  SOFT_DELETE: 'Suppression',
  EXPORT: 'Export',
};

const ENTITY_LABELS: Record<string, string> = {
  ENTREPRISE: 'Entreprise',
  UTILISATEUR: 'Utilisateur',
  CLIENT: 'Client',
  COLLECTE: 'Collecte',
  CLOTURE: 'Clôture',
  DEMANDE_RETRAIT: 'Demande de retrait',
  DOSSIER_CREDIT: 'Dossier crédit',
  DEPOT_AGENCE: 'Dépôt agence',
  EXPORT_RAPPORT: 'Export rapport',
};

/** E6.6.2 — Types d'entités pour la vue « Audit financier ». */
const AUDIT_FINANCIER_ENTITY_TYPES = 'CLOTURE,COLLECTE,DEMANDE_RETRAIT,DOSSIER_CREDIT,DEPOT_AGENCE';

const HIDDEN_AUDIT_STATE_FIELDS = new Set([
  'idclient',
  'idecheance',
  'iddossiercredit',
]);

export default function AuditPage() {
  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [entityType, setEntityType] = useState('');
  const [vueFinanciere, setVueFinanciere] = useState(false);
  const [action, setAction] = useState('');
  const [idUtilisateur, setIdUtilisateur] = useState('');
  const [idAgence, setIdAgence] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);
  /** Jours ouverts (dropdowns). Vide = tous fermés par défaut. */
  const [openDays, setOpenDays] = useState<Set<string>>(() => new Set());
  const limit = 20;

  useEffect(() => {
    utilisateurApi.list({ limit: '200' }).then((r) => setUtilisateurs(r.data ?? [])).catch(() => setUtilisateurs([]));
    agenceApi.list().then((r) => setAgences(Array.isArray(r) ? r : [])).catch(() => setAgences([]));
  }, []);

  const toggleDay = useCallback((dateKey: string) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit, sortBy: 'createdAt', sortOrder: 'DESC' };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (vueFinanciere) params.entityTypes = AUDIT_FINANCIER_ENTITY_TYPES;
      else if (entityType) params.entityType = entityType;
      if (action) params.action = action;
      if (idUtilisateur) params.idUtilisateur = idUtilisateur;
      if (idAgence) params.idAgence = idAgence;
      const res = await auditApi.list(params);
      setData(res);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur chargement historique');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, vueFinanciere, idUtilisateur, idAgence]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const displayUser = (log: AuditLog) => {
    const u = log.utilisateur;
    if (u) return [u.nom, u.prenom].filter(Boolean).join(' ') || u.email;
    return '—';
  };

  const formatState = (state: Record<string, unknown> | null) => {
    if (!state || Object.keys(state).length === 0) return null;
    const visibleEntries = Object.entries(state).filter(
      ([key]) => !HIDDEN_AUDIT_STATE_FIELDS.has(key.toLowerCase())
    );
    if (visibleEntries.length === 0) return null;

    return visibleEntries.map(([key, value]) => {
      let display = value;
      if (value != null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        display = JSON.stringify(value);
      } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        try {
          display = format(new Date(value), "dd MMM yyyy HH:mm", { locale: fr });
        } catch {
          // keep as is
        }
      }
      return { key, value: display };
    });
  };

  const groupsByDay = useMemo(
    () => (data?.data?.length ? groupLogsByDay(data.data) : []),
    [data?.data]
  );
  const oldStateDetails = selectedLog ? formatState(selectedLog.oldState) : null;
  const newStateDetails = selectedLog ? formatState(selectedLog.newState) : null;

  if (loading && !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logs — Audit des opérations sensibles</h1>
        <p className="text-gray-500 mt-1">
          Historique détaillé des opérations sensibles : collectes, retraits, validations, rejets, clôtures, etc. Qui a fait quoi, date, client, montants. Réservé à l&apos;administrateur.
        </p>
      </div>

      <Card>
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4 mb-4">
          <div className="min-w-[140px]">
            <Input
              label="Du"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="min-w-[140px]">
            <Input
              label="Au"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 h-10 cursor-pointer">
            <input
              type="checkbox"
              checked={vueFinanciere}
              onChange={(e) => {
                setVueFinanciere(e.target.checked);
                if (e.target.checked) setEntityType('');
              }}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Vue audit financier</span>
          </label>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type d&apos;entité</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); if (e.target.value) setVueFinanciere(false); }}
              disabled={vueFinanciere}
            >
              <option value="">Tous</option>
              {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">Toutes</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={idUtilisateur}
              onChange={(e) => setIdUtilisateur(e.target.value)}
            >
              <option value="">Tous</option>
              {utilisateurs.map((u) => (
                <option key={u.id} value={u.id}>
                  {[u.prenom, u.nom].filter(Boolean).join(' ') || u.email}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Agence</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={idAgence}
              onChange={(e) => setIdAgence(e.target.value)}
            >
              <option value="">Toutes</option>
              {agences.map((a) => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">Filtrer</Button>
        </form>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Auteur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groupsByDay.length > 0 ? (
                groupsByDay.map(({ dateKey, label, logs }) => {
                  const isOpen = openDays.has(dateKey);
                  return (
                    <Fragment key={dateKey}>
                      <tr
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleDay(dateKey)}
                        onKeyDown={(e) => e.key === 'Enter' && toggleDay(dateKey)}
                        className="bg-gray-100/80 hover:bg-gray-200/80 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-300"
                      >
                        <td colSpan={5} className="px-4 py-2.5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 capitalize">
                            <span className="inline-flex shrink-0 text-gray-500" aria-hidden>
                              {isOpen ? <HiOutlineChevronDown className="h-4 w-4" /> : <HiOutlineChevronRight className="h-4 w-4" />}
                            </span>
                            {label}
                            <span className="text-gray-500 font-normal">({logs.length} événement{logs.length > 1 ? 's' : ''})</span>
                          </div>
                        </td>
                      </tr>
                      {isOpen && logs.map((log) => (
                      <tr
                        key={log.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedLog(log)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedLog(log)}
                        className="hover:bg-primary-50/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-300"
                      >
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {log.createdAt ? format(new Date(log.createdAt), 'HH:mm', { locale: fr }) : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{ENTITY_LABELS[log.entityType] ?? log.entityType}</td>
                        <td className="px-4 py-3 text-gray-600">{displayUser(log)}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-md">
                          {log.newState && Object.keys(log.newState).length > 0 ? (
                            <span title={JSON.stringify({ ...log.oldState, ...log.newState })} className="block truncate">
                              {typeof log.newState.nom === 'string' && log.newState.nom}
                              {typeof log.newState.statut === 'string' && ` • ${log.newState.statut}`}
                              {typeof log.newState.montant === 'number' && ` • ${log.newState.montant} XAF`}
                              {typeof log.newState.montantDemande === 'number' && ` • Demande: ${log.newState.montantDemande} XAF`}
                              {typeof log.newState.commissionPrelevee === 'number' && ` • Commission: ${log.newState.commissionPrelevee} XAF`}
                              {typeof log.newState.netVerse === 'number' && ` • Net: ${log.newState.netVerse} XAF`}
                              {typeof log.newState.motifRefus === 'string' && log.newState.motifRefus && ` • Motif: ${log.newState.motifRefus}`}
                              {typeof log.newState.dateCollecte === 'string' && ` • ${log.newState.dateCollecte}`}
                              {log.newState.idClient != null ? ` • Client: ${String(log.newState.idClient).slice(0, 8)}…` : null}
                              {(!log.newState.nom && !log.newState.statut && !log.newState.montant && !log.newState.montantDemande && !log.newState.dateCollecte) ? '—' : null}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucun événement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Page {data.meta.page} / {data.meta.totalPages} ({data.meta.total} au total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={data.meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={data.meta.page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Sheet
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `${ACTION_LABELS[selectedLog.action] ?? selectedLog.action} — ${ENTITY_LABELS[selectedLog.entityType] ?? selectedLog.entityType}` : undefined}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-gray-500 font-medium">Date</dt>
                <dd className="text-gray-900 mt-0.5">
                  {selectedLog.createdAt
                    ? format(new Date(selectedLog.createdAt), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Action</dt>
                <dd className="text-gray-900 mt-0.5">{ACTION_LABELS[selectedLog.action] ?? selectedLog.action}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Type d'entité</dt>
                <dd className="text-gray-900 mt-0.5">{ENTITY_LABELS[selectedLog.entityType] ?? selectedLog.entityType}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Auteur</dt>
                <dd className="text-gray-900 mt-0.5">{displayUser(selectedLog)}</dd>
                {selectedLog.utilisateur?.email && (
                  <dd className="text-gray-500 text-xs mt-0.5">{selectedLog.utilisateur.email}</dd>
                )}
              </div>
            </dl>

            {oldStateDetails?.length || newStateDetails?.length ? (
              <div className="space-y-4">
                {!!oldStateDetails?.length && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Ancien état</h3>
                    <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 bg-gray-50/50 overflow-hidden">
                      {oldStateDetails.map(({ key, value }) => (
                        <li key={key} className="px-3 py-2 flex justify-between gap-2 text-sm">
                          <span className="text-gray-600 font-medium shrink-0">{key}</span>
                          <span className="text-gray-900 text-right break-all">{String(value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!!newStateDetails?.length && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Nouvel état</h3>
                    <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 bg-white overflow-hidden">
                      {newStateDetails.map(({ key, value }) => (
                        <li key={key} className="px-3 py-2 flex justify-between gap-2 text-sm">
                          <span className="text-gray-600 font-medium shrink-0">{key}</span>
                          <span className="text-gray-900 text-right break-all">{String(value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun détail d'état enregistré pour cet événement.</p>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
