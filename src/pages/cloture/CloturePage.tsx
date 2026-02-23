import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { clotureApi } from '@/core/api';
import type { ClotureJournaliere, ClotureRecap } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function CloturePage() {
  const [clotures, setClotures] = useState<ClotureJournaliere[]>([]);
  const [recap, setRecap] = useState<ClotureRecap | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    clotureApi.list().then(setClotures).catch(() => toast.error('Erreur chargement')).finally(() => setLoading(false));
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
    </div>
  );
}
