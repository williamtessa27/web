import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { clotureApi, collecteurApi } from '@/core/api';
import type { CloturePeriode } from '@/core/api';
import type { ClotureJournaliere, ClotureRecap, AvanceCollecteur } from '@/types';
import type { Collecteur } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';

export default function CloturePage() {
  const [clotures, setClotures] = useState<ClotureJournaliere[]>([]);
  const [recap, setRecap] = useState<ClotureRecap | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [avances, setAvances] = useState<AvanceCollecteur[]>([]);
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [showAvanceModal, setShowAvanceModal] = useState(false);
  const [avanceForm, setAvanceForm] = useState({ idCollecteur: '', montant: '', dateAvance: format(new Date(), 'yyyy-MM-dd'), commentaire: '' });
  const [submittingAvance, setSubmittingAvance] = useState(false);
  const [periodes, setPeriodes] = useState<CloturePeriode[]>([]);
  const [periodeMensuelleForm, setPeriodeMensuelleForm] = useState({ annee: new Date().getFullYear(), mois: new Date().getMonth() + 1 });
  const [periodeAnnuelleForm, setPeriodeAnnuelleForm] = useState({ annee: new Date().getFullYear() });
  const [submittingPeriodeMensuelle, setSubmittingPeriodeMensuelle] = useState(false);
  const [submittingPeriodeAnnuelle, setSubmittingPeriodeAnnuelle] = useState(false);

  useEffect(() => {
    clotureApi.list().then(setClotures).catch(() => toast.error('Erreur chargement')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clotureApi.avances().then(setAvances).catch(() => setAvances([]));
    collecteurApi.list({ page: 1, limit: 200 }).then((r) => setCollecteurs(r.data ?? [])).catch(() => setCollecteurs([]));
  }, []);

  useEffect(() => {
    clotureApi.periodes(50).then(setPeriodes).catch(() => setPeriodes([]));
  }, []);

  const loadRecap = async () => {
    if (!selectedDate) return;
    setLoadingRecap(true);
    try {
      const data = await clotureApi.recap(selectedDate);
      setRecap(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur récap');
      setRecap(null);
    } finally {
      setLoadingRecap(false);
    }
  };

  const handleCloturer = async () => {
    if (!selectedDate) return;
    setSubmitting(true);
    try {
      await clotureApi.create({ date: selectedDate, commentaire: commentaire || undefined });
      toast.success('Journée clôturée.');
      clotureApi.list().then(setClotures);
      setRecap(null);
      setCommentaire('');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Impossible de clôturer';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isAlreadyClosed = clotures.some(
    (c) => c.dateCloture && c.dateCloture.slice(0, 10) === selectedDate.slice(0, 10),
  );

  const handleCreateAvance = async () => {
    if (!avanceForm.idCollecteur || !avanceForm.montant || Number(avanceForm.montant) <= 0) {
      toast.error('Sélectionnez un collecteur et saisissez un montant.');
      return;
    }
    setSubmittingAvance(true);
    try {
      await clotureApi.createAvance({
        idCollecteur: avanceForm.idCollecteur,
        montant: Number(avanceForm.montant),
        dateAvance: avanceForm.dateAvance,
        commentaire: avanceForm.commentaire || undefined,
      });
      toast.success('Avance enregistrée.');
      setShowAvanceModal(false);
      setAvanceForm({ idCollecteur: '', montant: '', dateAvance: format(new Date(), 'yyyy-MM-dd'), commentaire: '' });
      clotureApi.avances().then(setAvances);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'Erreur');
    } finally {
      setSubmittingAvance(false);
    }
  };

  const handleClotureMensuelle = async () => {
    setSubmittingPeriodeMensuelle(true);
    try {
      await clotureApi.clotureMensuelle({ annee: periodeMensuelleForm.annee, mois: periodeMensuelleForm.mois });
      toast.success('Clôture mensuelle enregistrée.');
      clotureApi.periodes(50).then(setPeriodes);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'Erreur');
    } finally {
      setSubmittingPeriodeMensuelle(false);
    }
  };

  const handleClotureAnnuelle = async () => {
    setSubmittingPeriodeAnnuelle(true);
    try {
      await clotureApi.clotureAnnuelle({ annee: periodeAnnuelleForm.annee });
      toast.success('Clôture annuelle enregistrée.');
      clotureApi.periodes(50).then(setPeriodes);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'Erreur');
    } finally {
      setSubmittingPeriodeAnnuelle(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clôture journalière</h1>
        <p className="text-gray-500 mt-1">
          Clôturez une journée pour verrouiller les collectes de cette date (aucune création ni modification possible).
        </p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Récap avant clôture</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={loadRecap} disabled={loadingRecap}>
            {loadingRecap ? 'Chargement…' : 'Voir le récap'}
          </Button>
        </div>

        {recap && (
          <div className="mt-6">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">Collecteur</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-700">Nombre</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-700">Montant (XAF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recap.byCollecteur.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-gray-500 text-center">
                        Aucune collecte validée pour ce jour.
                      </td>
                    </tr>
                  ) : (
                    recap.byCollecteur.map((row) => (
                      <tr key={row.idCollecteur}>
                        <td className="px-4 py-2 text-gray-900">{row.nomCollecteur}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{row.nombreCollectes}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {row.montantTotal.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td className="px-4 py-2 text-gray-900">Total</td>
                    <td className="px-4 py-2 text-right text-gray-900">{recap.totalCollectes}</td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {recap.totalMontant.toLocaleString('fr-FR')} XAF
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {!isAlreadyClosed && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ex: Caisse vérifiée"
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCloturer}
                  disabled={submitting}
                  isLoading={submitting}
                >
                  Clôturer la journée du {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
                </Button>
              </div>
            )}
            {isAlreadyClosed && (
              <p className="mt-4 text-amber-600 font-medium">
                Cette date est déjà clôturée. Aucune action possible.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dates déjà clôturées</h2>
        {clotures.length === 0 ? (
          <p className="text-gray-500">Aucune journée clôturée pour le moment.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {clotures.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                <span className="text-gray-900 font-medium">
                  {format(new Date(c.dateCloture), "dd MMMM yyyy", { locale: fr })}
                </span>
                {c.utilisateurCloture && (
                  <span className="text-gray-500">par {c.utilisateurCloture.nom}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Avances collecteurs (E6.3.1)</h2>
          <Button size="sm" onClick={() => setShowAvanceModal(true)}>
            Nouvelle avance
          </Button>
        </div>
        {avances.length === 0 ? (
          <p className="text-gray-500">Aucune avance enregistrée.</p>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Date</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700">Collecteur</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700">Montant (XAF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {avances.slice(0, 50).map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 text-gray-900">{a.dateAvance?.slice(0, 10)}</td>
                    <td className="px-4 py-2 text-gray-900">{a.collecteur?.utilisateur?.nom ?? a.collecteur?.codeCollecteur ?? a.idCollecteur}</td>
                    <td className="px-4 py-2 text-right font-medium">{Number(a.montant).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {avances.length > 50 && <p className="text-gray-500 text-sm mt-2">Affichage des 50 dernières avances.</p>}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Clôtures de période (E6.5.5)</h2>
        <p className="text-sm text-gray-500 mb-4">Enregistrer une clôture mensuelle ou annuelle pour marquer la période comme clôturée.</p>
        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Année</span>
              <select
                value={periodeMensuelleForm.annee}
                onChange={(e) => setPeriodeMensuelleForm((p) => ({ ...p, annee: parseInt(e.target.value, 10) }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm w-24"
              >
                {[0, 1, 2].map((i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Mois</span>
              <select
                value={periodeMensuelleForm.mois}
                onChange={(e) => setPeriodeMensuelleForm((p) => ({ ...p, mois: parseInt(e.target.value, 10) }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm w-32"
              >
                {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((label, i) => (
                  <option key={i} value={i + 1}>{label}</option>
                ))}
              </select>
            </label>
            <Button size="sm" onClick={handleClotureMensuelle} disabled={submittingPeriodeMensuelle} isLoading={submittingPeriodeMensuelle}>
              Clôturer le mois
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Année</span>
              <select
                value={periodeAnnuelleForm.annee}
                onChange={(e) => setPeriodeAnnuelleForm((p) => ({ ...p, annee: parseInt(e.target.value, 10) }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm w-24"
              >
                {[0, 1, 2, 3].map((i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <Button size="sm" variant="secondary" onClick={handleClotureAnnuelle} disabled={submittingPeriodeAnnuelle} isLoading={submittingPeriodeAnnuelle}>
              Clôturer l&apos;année
            </Button>
          </div>
        </div>
        {periodes.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune clôture de période enregistrée.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {periodes.slice(0, 20).map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {p.type === 'MENSUELLE' ? `${['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'][p.mois - 1]} ${p.annee}` : `Année ${p.annee}`}
                </span>
                <span className="text-gray-500">{format(new Date(p.dateClotureAt), 'dd/MM/yyyy HH:mm')}</span>
              </li>
            ))}
            {periodes.length > 20 && <p className="text-gray-500 text-sm mt-2">Affichage des 20 dernières.</p>}
          </ul>
        )}
      </Card>

      {showAvanceModal && (
        <Modal
          open={showAvanceModal}
          onClose={() => setShowAvanceModal(false)}
          title="Nouvelle avance collecteur"
        >
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Collecteur</span>
              <select
                value={avanceForm.idCollecteur}
                onChange={(e) => setAvanceForm((p) => ({ ...p, idCollecteur: e.target.value }))}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">— Choisir —</option>
                {collecteurs.map((c) => (
                  <option key={c.id} value={c.id}>{c.utilisateur?.nom ?? c.codeCollecteur ?? c.id}</option>
                ))}
              </select>
            </label>
            <Input
              label="Montant (XAF)"
              type="number"
              min={1}
              value={avanceForm.montant}
              onChange={(e) => setAvanceForm((p) => ({ ...p, montant: e.target.value }))}
            />
            <Input
              label="Date"
              type="date"
              value={avanceForm.dateAvance}
              onChange={(e) => setAvanceForm((p) => ({ ...p, dateAvance: e.target.value }))}
            />
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Commentaire (optionnel)</span>
              <input
                type="text"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={avanceForm.commentaire}
                onChange={(e) => setAvanceForm((p) => ({ ...p, commentaire: e.target.value }))}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowAvanceModal(false)}>Annuler</Button>
              <Button onClick={handleCreateAvance} disabled={submittingAvance} isLoading={submittingAvance}>
                Enregistrer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
