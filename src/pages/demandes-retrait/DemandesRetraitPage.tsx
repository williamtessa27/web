import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { demandeRetraitApi, clientApi } from '@/core/api';
import type { DemandeRetrait, PaginatedResponse, Client } from '@/types';
import { StatutDemandeRetrait, TypeRetrait } from '@/types/enums';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function DemandesRetraitPage() {
  const [data, setData] = useState<PaginatedResponse<DemandeRetrait> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [refuserId, setRefuserId] = useState<string | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreerEtValider, setShowCreerEtValider] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [createForm, setCreateForm] = useState({ idClient: '', montantDemande: '' });
  const [creerEtValiderForm, setCreerEtValiderForm] = useState({ idClient: '', montantDemande: '' });

  const load = () => {
    setLoading(true);
    demandeRetraitApi
      .list({ limit: '50', ...(statutFilter && { statut: statutFilter }) })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statutFilter]);

  useEffect(() => {
    clientApi.list({ limit: 500 }).then((r) => setClients(r?.data ?? [])).catch(() => {});
  }, []);

  const handleValider = async (id: string) => {
    setSubmitting(true);
    try {
      await demandeRetraitApi.valider(id);
      toast.success('Demande validée. Solde et commission mis à jour.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la validation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefuser = async (id: string) => {
    setSubmitting(true);
    try {
      await demandeRetraitApi.refuser(id, { motifRefus: motifRefus || undefined });
      toast.success('Demande refusée.');
      setRefuserId(null);
      setMotifRefus('');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du refus.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    const idClient = createForm.idClient;
    const montantDemande = parseFloat(createForm.montantDemande);
    if (!idClient || !montantDemande || montantDemande <= 0) {
      toast.error('Sélectionnez un client et un montant valide.');
      return;
    }
    setSubmitting(true);
    try {
      await demandeRetraitApi.create({ idClient, montantDemande });
      toast.success('Demande créée.');
      setShowCreate(false);
      setCreateForm({ idClient: '', montantDemande: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreerEtValider = async () => {
    const idClient = creerEtValiderForm.idClient;
    const montantDemande = parseFloat(creerEtValiderForm.montantDemande);
    if (!idClient || !montantDemande || montantDemande <= 0) {
      toast.error('Sélectionnez un client et un montant valide.');
      return;
    }
    setSubmitting(true);
    try {
      await demandeRetraitApi.creerEtValider({ idClient, montantDemande });
      toast.success('Retrait créé et validé. Le client le verra dans son interface.');
      setShowCreerEtValider(false);
      setCreerEtValiderForm({ idClient: '', montantDemande: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'opération.');
    } finally {
      setSubmitting(false);
    }
  };

  const statutLabel = (s: StatutDemandeRetrait) => {
    switch (s) {
      case StatutDemandeRetrait.EN_ATTENTE:
        return 'En attente';
      case StatutDemandeRetrait.VALIDEE:
        return 'Validée';
      case StatutDemandeRetrait.REFUSEE:
        return 'Refusée';
      default:
        return s;
    }
  };

  const typeRetraitLabel = (t: TypeRetrait) => (t === TypeRetrait.NORMAL ? 'Normal' : 'Anticipé');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demandes de retrait</h1>
        <p className="text-gray-500 mt-1">
          Consulter les demandes, valider ou refuser. Le gestionnaire peut aussi créer et valider un retrait en une opération (client en agence). Le client voit tous ses retraits dans son interface.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm min-w-[160px]"
        >
          <option value="">Tous les statuts</option>
          <option value={StatutDemandeRetrait.EN_ATTENTE}>En attente</option>
          <option value={StatutDemandeRetrait.VALIDEE}>Validées</option>
          <option value={StatutDemandeRetrait.REFUSEE}>Refusées</option>
        </select>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          Créer une demande
        </Button>
        <Button variant="primary" onClick={() => setShowCreerEtValider(true)}>
          Créer et valider un retrait (client en agence)
        </Button>
      </div>

      {showCreerEtValider && (
        <Card className="border-green-200 bg-green-50/30">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Créer et valider un retrait (client en agence)</h3>
          <p className="text-xs text-gray-600 mb-4">
            Le client est présent : vous créez le retrait et le validez en une opération. Solde et commission sont mis à jour immédiatement. Le client verra ce retrait dans son interface.
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">Client</span>
              <select
                value={creerEtValiderForm.idClient}
                onChange={(e) => setCreerEtValiderForm((f) => ({ ...f, idClient: e.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm min-w-[220px]"
              >
                <option value="">Sélectionner</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.prenom ?? ''} — Solde: {Number(c.solde ?? 0).toLocaleString('fr-FR')} XAF
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">Montant (XAF)</span>
              <input
                type="number"
                min={1}
                value={creerEtValiderForm.montantDemande}
                onChange={(e) => setCreerEtValiderForm((f) => ({ ...f, montantDemande: e.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm w-36"
                placeholder="0"
              />
            </label>
            <div className="flex gap-2">
              <Button onClick={handleCreerEtValider} disabled={submitting}>
                {submitting ? 'En cours...' : 'Créer et valider'}
              </Button>
              <Button variant="secondary" onClick={() => { setShowCreerEtValider(false); setCreerEtValiderForm({ idClient: '', montantDemande: '' }); }}>
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}

      {showCreate && (
        <Card className="border-blue-200 bg-blue-50/30">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Nouvelle demande de retrait</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">Client</span>
              <select
                value={createForm.idClient}
                onChange={(e) => setCreateForm((f) => ({ ...f, idClient: e.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm min-w-[220px]"
              >
                <option value="">Sélectionner</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.prenom ?? ''} — Solde: {Number(c.solde ?? 0).toLocaleString('fr-FR')} XAF
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">Montant demandé (XAF)</span>
              <input
                type="number"
                min={1}
                value={createForm.montantDemande}
                onChange={(e) => setCreateForm((f) => ({ ...f, montantDemande: e.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm w-36"
                placeholder="0"
              />
            </label>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Création...' : 'Créer'}
              </Button>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}

      {refuserId && (
        <Card className="border-amber-200 bg-amber-50/30">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Refuser la demande</h3>
          <textarea
            value={motifRefus}
            onChange={(e) => setMotifRefus(e.target.value)}
            placeholder="Motif du refus (optionnel)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none"
            rows={2}
          />
          <div className="flex gap-2 mt-2">
            <Button
              variant="secondary"
              onClick={() => handleRefuser(refuserId)}
              disabled={submitting}
            >
              {submitting ? 'Envoi...' : 'Confirmer le refus'}
            </Button>
            <Button variant="secondary" onClick={() => { setRefuserId(null); setMotifRefus(''); }}>
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <PageLoader />
      ) : !data?.data?.length ? (
        <Card>
          <EmptyState
            title="Aucune demande"
            description="Les demandes de retrait apparaîtront ici. Créez-en une ou attendez les demandes des clients."
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Commission</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {d.client ? `${d.client.nom} ${d.client.prenom ?? ''}` : d.idClient}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(d.dateDemande), 'dd/MM/yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {Number(d.montantDemande).toLocaleString('fr-FR')} XAF
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{typeRetraitLabel(d.typeRetrait)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {d.commissionPrelevee != null
                        ? `${Number(d.commissionPrelevee).toLocaleString('fr-FR')} XAF`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          d.statut === StatutDemandeRetrait.VALIDEE
                            ? 'success'
                            : d.statut === StatutDemandeRetrait.EN_ATTENTE
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {statutLabel(d.statut)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {d.statut === StatutDemandeRetrait.EN_ATTENTE && (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleValider(d.id)}
                            disabled={submitting}
                          >
                            Valider
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setRefuserId(d.id)}
                            disabled={submitting}
                          >
                            Refuser
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
