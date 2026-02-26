import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HiOutlineArrowLeft, HiOutlinePlus } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { entrepriseApi, abonnementApi } from '@/core/api';
import type { Entreprise, Abonnement } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';

function formatMontant(montant: number, devise = 'XAF') {
  return (
    new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(montant)) + ` ${devise}`
  );
}

export default function AbonnementsPage() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState<string>('');
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [loadingEnt, setLoadingEnt] = useState(true);
  const [loadingAb, setLoadingAb] = useState(false);
  const [form, setForm] = useState({
    montant: '',
    dateDebut: '',
    dureeMois: '1',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadEntreprises = useCallback(() => {
    setLoadingEnt(true);
    entrepriseApi
      .list({ limit: 500 })
      .then((r) => setEntreprises(r.data ?? []))
      .catch(() => toast.error('Erreur chargement entreprises'))
      .finally(() => setLoadingEnt(false));
  }, []);

  useEffect(() => {
    loadEntreprises();
  }, [loadEntreprises]);

  useEffect(() => {
    if (!selectedEntrepriseId) {
      setAbonnements([]);
      return;
    }
    setLoadingAb(true);
    abonnementApi
      .listByEntreprise(selectedEntrepriseId)
      .then(setAbonnements)
      .catch(() => toast.error('Erreur chargement abonnements'))
      .finally(() => setLoadingAb(false));
  }, [selectedEntrepriseId]);

  const selectedEntreprise = entreprises.find((e) => e.id === selectedEntrepriseId);
  const today = new Date().toISOString().slice(0, 10);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntrepriseId) {
      toast.error('Sélectionnez une entreprise');
      return;
    }
    const montant = parseFloat(form.montant);
    const dureeMois = parseInt(form.dureeMois, 10);
    if (Number.isNaN(montant) || montant < 0) {
      toast.error('Montant invalide');
      return;
    }
    if (Number.isNaN(dureeMois) || dureeMois < 1) {
      toast.error('Durée minimale : 1 mois');
      return;
    }
    if (!form.dateDebut || form.dateDebut < today) {
      toast.error('La date de début doit être aujourd\'hui ou une date future');
      return;
    }
    setSubmitting(true);
    try {
      await abonnementApi.create({
        entrepriseId: selectedEntrepriseId,
        montant,
        dateDebut: form.dateDebut,
        dureeMois,
      });
      toast.success('Abonnement créé');
      setForm({ montant: '', dateDebut: '', dureeMois: '1' });
      abonnementApi.listByEntreprise(selectedEntrepriseId).then(setAbonnements);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erreur lors de la création';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEnt) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={AppRoutes.SUPER_ADMIN_DASHBOARD}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Abonnements</h1>
        <p className="text-gray-500 mt-1">
          Créer et consulter les abonnements par entreprise. La date de début doit être aujourd'hui ou une date future (pas en arrière).
        </p>
      </div>

      <Card className="rounded-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Entreprise</h2>
        <select
          value={selectedEntrepriseId}
          onChange={(e) => setSelectedEntrepriseId(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">— Choisir une entreprise —</option>
          {entreprises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom}
            </option>
          ))}
        </select>
      </Card>

      {selectedEntrepriseId && (
        <>
          <Card className="rounded-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlinePlus className="h-5 w-5" />
              Nouvel abonnement
            </h2>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Montant</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.montant}
                  onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                  className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Date de début (≥ aujourd'hui)</span>
                <input
                  type="date"
                  min={today}
                  value={form.dateDebut}
                  onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Durée (mois)</span>
                <select
                  value={form.dureeMois}
                  onChange={(e) => setForm((f) => ({ ...f, dureeMois: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 6, 12].map((m) => (
                    <option key={m} value={m}>
                      {m} mois
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" variant="primary" disabled={submitting} isLoading={submitting}>
                Créer l'abonnement
              </Button>
            </form>
          </Card>

          <Card className="rounded-2xl" padding={!abonnements.length}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Liste des abonnements — {selectedEntreprise?.nom}
            </h2>
            {loadingAb ? (
              <div className="animate-pulse h-24 rounded-lg bg-gray-100" />
            ) : !abonnements.length ? (
              <EmptyState
                title="Aucun abonnement"
                description="Les abonnements créés pour cette entreprise s'afficheront ici."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Début</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fin</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Durée</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {abonnements.map((a) => {
                      const dateDebut = new Date(a.dateDebut);
                      const dateFin = new Date(a.dateFin);
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      dateDebut.setHours(0, 0, 0, 0);
                      dateFin.setHours(0, 0, 0, 0);
                      const isEnCours = now >= dateDebut && now <= dateFin;
                      const isFutur = now < dateDebut;
                      return (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {formatMontant(Number(a.montant), selectedEntreprise?.devise ?? 'XAF')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {format(dateDebut, 'dd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {format(dateFin, 'dd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{a.dureeMois} mois</td>
                          <td className="px-4 py-3">
                            <Badge variant={isEnCours ? 'success' : isFutur ? 'info' : 'neutral'}>
                              {isEnCours ? 'En cours' : isFutur ? 'À venir' : 'Terminé'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
