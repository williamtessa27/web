import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { caisseAgenceApi, agenceApi } from '@/core/api';
import type { OuvertureCaisse, MouvementCaisseDto, RapportCaisseDto } from '@/core/api';
import type { Agence } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/LoadingSpinner';

type TabId = 'ouverture' | 'mouvements' | 'rapport';

export default function CaisseAgencePage() {
  const [agences, setAgences] = useState<Agence[]>([]);
  const [idAgence, setIdAgence] = useState<string>('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<TabId>('rapport');

  const [soldeOuverture, setSoldeOuverture] = useState<string>('0');
  const [submittingOuverture, setSubmittingOuverture] = useState(false);
  const [ouvertures, setOuvertures] = useState<OuvertureCaisse[]>([]);
  const [loadingOuvertures, setLoadingOuvertures] = useState(false);

  const [mouvementForm, setMouvementForm] = useState({ sens: 'ENTREE' as 'ENTREE' | 'SORTIE', montant: '', libelle: '' });
  const [submittingMouvement, setSubmittingMouvement] = useState(false);

  const [rapport, setRapport] = useState<RapportCaisseDto | null>(null);
  const [loadingRapport, setLoadingRapport] = useState(false);

  useEffect(() => {
    agenceApi.list(true).then(setAgences).catch(() => setAgences([]));
  }, []);

  useEffect(() => {
    if (idAgence && activeTab === 'ouverture') {
      setLoadingOuvertures(true);
      caisseAgenceApi.getOuvertures(idAgence, 20).then(setOuvertures).catch(() => setOuvertures([])).finally(() => setLoadingOuvertures(false));
    }
  }, [idAgence, activeTab]);

  useEffect(() => {
    if (idAgence && date && activeTab === 'rapport') {
      setLoadingRapport(true);
      caisseAgenceApi.getRapport(idAgence, date).then(setRapport).catch(() => setRapport(null)).finally(() => setLoadingRapport(false));
    } else {
      setRapport(null);
    }
  }, [idAgence, date, activeTab]);

  const handleOuvrirCaisse = async () => {
    if (!idAgence || !date) {
      toast.error('Sélectionnez une agence et une date.');
      return;
    }
    const solde = Number(soldeOuverture);
    if (Number.isNaN(solde) || solde < 0) {
      toast.error('Solde d\'ouverture invalide.');
      return;
    }
    setSubmittingOuverture(true);
    try {
      await caisseAgenceApi.ouvrir({ idAgence, dateOuverture: date, soldeOuverture: solde });
      toast.success('Caisse ouverte pour cette date.');
      setSoldeOuverture('0');
      caisseAgenceApi.getOuvertures(idAgence, 20).then(setOuvertures);
      caisseAgenceApi.getRapport(idAgence, date).then(setRapport);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg as string) ?? 'Erreur ouverture');
    } finally {
      setSubmittingOuverture(false);
    }
  };

  const handleCreateMouvement = async () => {
    if (!idAgence || !date) {
      toast.error('Sélectionnez une agence et une date.');
      return;
    }
    const montant = Number(mouvementForm.montant);
    if (!mouvementForm.libelle.trim() || Number.isNaN(montant) || montant <= 0) {
      toast.error('Montant et libellé obligatoires.');
      return;
    }
    setSubmittingMouvement(true);
    try {
      await caisseAgenceApi.createMouvement({
        idAgence,
        dateMouvement: date,
        sens: mouvementForm.sens,
        montant,
        libelle: mouvementForm.libelle.trim(),
      });
      toast.success('Mouvement enregistré.');
      setMouvementForm({ sens: 'ENTREE', montant: '', libelle: '' });
      caisseAgenceApi.getRapport(idAgence, date).then(setRapport);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg as string) ?? 'Erreur mouvement');
    } finally {
      setSubmittingMouvement(false);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'ouverture', label: 'Ouverture caisse' },
    { id: 'mouvements', label: 'Entrées / Sorties' },
    { id: 'rapport', label: 'Rapport' },
  ];

  if (agences.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Caisse agence</h1>
        <Card>
          <p className="text-gray-500">Aucune agence disponible.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Caisse agence</h1>
        <p className="text-gray-500 mt-1">
          Ouverture de caisse, entrées et sorties manuelles, et rapport de caisse par agence et par date.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Agence</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              value={idAgence}
              onChange={(e) => setIdAgence(e.target.value)}
            >
              <option value="">— Choisir —</option>
              {agences.map((a) => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-6">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === t.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'ouverture' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Ouverture de caisse</h2>
            <p className="text-sm text-gray-500">
              Une seule ouverture par agence et par date. Le solde d&apos;ouverture est le montant en caisse au début de la journée.
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-48">
                <Input
                  label="Solde d'ouverture (FCFA)"
                  type="number"
                  min="0"
                  step="1"
                  value={soldeOuverture}
                  onChange={(e) => setSoldeOuverture(e.target.value)}
                />
              </div>
              <Button onClick={handleOuvrirCaisse} disabled={!idAgence || !date || submittingOuverture}>
                {submittingOuverture ? 'Enregistrement…' : 'Ouvrir la caisse'}
              </Button>
            </div>
            {loadingOuvertures ? (
              <p className="text-sm text-gray-500">Chargement des ouvertures…</p>
            ) : ouvertures.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Dernières ouvertures (cette agence)</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {ouvertures.slice(0, 10).map((o) => (
                    <li key={o.id}>
                      {format(new Date(o.dateOuverture), 'dd MMM yyyy', { locale: fr })} — Solde {Number(o.soldeOuverture).toLocaleString('fr-FR')} FCFA
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mouvements' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Entrées / Sorties de caisse</h2>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sens</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={mouvementForm.sens}
                  onChange={(e) => setMouvementForm((f) => ({ ...f, sens: e.target.value as 'ENTREE' | 'SORTIE' }))}
                >
                  <option value="ENTREE">Entrée</option>
                  <option value="SORTIE">Sortie</option>
                </select>
              </div>
              <div className="w-48">
                <Input
                  label="Montant (FCFA)"
                  type="number"
                  min="1"
                  step="1"
                  value={mouvementForm.montant}
                  onChange={(e) => setMouvementForm((f) => ({ ...f, montant: e.target.value }))}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Input
                  label="Libellé"
                  value={mouvementForm.libelle}
                  onChange={(e) => setMouvementForm((f) => ({ ...f, libelle: e.target.value }))}
                  placeholder="Ex: Retrait banque, Dépôt client…"
                />
              </div>
              <Button onClick={handleCreateMouvement} disabled={!idAgence || !date || submittingMouvement}>
                {submittingMouvement ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
            {rapport && rapport.mouvements.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Mouvements du jour</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 pr-4">Heure</th>
                        <th className="py-2 pr-4">Sens</th>
                        <th className="py-2 pr-4">Montant</th>
                        <th className="py-2">Libellé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rapport.mouvements.map((m) => (
                        <tr key={m.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 text-gray-600">{format(new Date(m.dateMouvement), 'HH:mm')}</td>
                          <td className="py-2 pr-4">{m.sens === 'ENTREE' ? 'Entrée' : 'Sortie'}</td>
                          <td className="py-2 pr-4 font-medium">{m.montant.toLocaleString('fr-FR')}</td>
                          <td className="py-2">{m.libelle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rapport' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Rapport de caisse</h2>
            {!idAgence || !date ? (
              <p className="text-gray-500">Sélectionnez une agence et une date pour afficher le rapport.</p>
            ) : loadingRapport ? (
              <PageLoader />
            ) : rapport ? (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Solde d&apos;ouverture</p>
                  <p className="text-xl font-semibold text-gray-900">{rapport.soldeOuverture.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-gray-600">Total entrées</p>
                  <p className="text-xl font-semibold text-green-700">+{rapport.totalEntrees.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-sm text-gray-600">Total sorties</p>
                  <p className="text-xl font-semibold text-red-700">−{rapport.totalSorties.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="rounded-lg bg-primary-50 p-4">
                  <p className="text-sm text-gray-600">Solde théorique</p>
                  <p className="text-xl font-semibold text-primary-700">{rapport.soldeTheorique.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
              {rapport.mouvements.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Détail des mouvements</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500">
                          <th className="py-2 pr-4">Heure</th>
                          <th className="py-2 pr-4">Sens</th>
                          <th className="py-2 pr-4">Montant</th>
                          <th className="py-2">Libellé</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rapport.mouvements.map((m) => (
                          <tr key={m.id} className="border-b border-gray-100">
                            <td className="py-2 pr-4 text-gray-600">{format(new Date(m.dateMouvement), 'HH:mm')}</td>
                            <td className="py-2 pr-4">{m.sens === 'ENTREE' ? 'Entrée' : 'Sortie'}</td>
                            <td className="py-2 pr-4 font-medium">{m.montant.toLocaleString('fr-FR')}</td>
                            <td className="py-2">{m.libelle}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </>
            ) : (
              <p className="text-gray-500">Aucune donnée pour cette date (pas d&apos;ouverture ni de mouvement).</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
