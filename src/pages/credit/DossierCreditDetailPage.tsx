import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineXMark, HiOutlineBanknotes } from 'react-icons/hi2';
import { creditApi } from '@/core/api';
import type { DossierCredit, Echeance } from '@/types';
import { StatutDossierCredit, StatutEcheance } from '@/types/enums';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const statutBadge = (statut: StatutDossierCredit) => {
  const map: Record<StatutDossierCredit, { label: string; variant: 'info' | 'success' | 'warning' | 'neutral' | 'danger' }> = {
    [StatutDossierCredit.BROUILLON]: { label: 'Brouillon', variant: 'neutral' },
    [StatutDossierCredit.EN_ATTENTE]: { label: 'En attente', variant: 'info' },
    [StatutDossierCredit.VALIDE]: { label: 'Validé', variant: 'success' },
    [StatutDossierCredit.REJETE]: { label: 'Rejeté', variant: 'danger' },
    [StatutDossierCredit.ACTIF]: { label: 'Actif', variant: 'success' },
    [StatutDossierCredit.CLOTURE]: { label: 'Clôturé', variant: 'neutral' },
  };
  const { label, variant } = map[statut] ?? { label: statut, variant: 'neutral' as const };
  return <Badge variant={variant}>{label}</Badge>;
};

const echeanceStatutBadge = (statut: StatutEcheance) => {
  const map: Record<StatutEcheance, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
    [StatutEcheance.A_PAYER]: { label: 'À payer', variant: 'neutral' },
    [StatutEcheance.PARTIEL]: { label: 'Partiel', variant: 'warning' },
    [StatutEcheance.PAYEE]: { label: 'Payée', variant: 'success' },
    [StatutEcheance.EN_RETARD]: { label: 'En retard', variant: 'danger' },
  };
  const { label, variant } = map[statut] ?? { label: statut, variant: 'neutral' as const };
  return <Badge variant={variant}>{label}</Badge>;
};

export default function DossierCreditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dossier, setDossier] = useState<DossierCredit | null>(null);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showValider, setShowValider] = useState(false);
  const [showRejeter, setShowRejeter] = useState(false);
  const [montantAccorde, setMontantAccorde] = useState('');
  const [motifRefus, setMotifRefus] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([creditApi.getDossier(id), creditApi.getEcheances(id)])
      .then(([d, e]) => {
        setDossier(d);
        setEcheances(Array.isArray(e) ? e : []);
      })
      .catch(() => toast.error('Dossier introuvable'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSoumettre = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const d = await creditApi.soumettre(id);
      setDossier(d);
      toast.success('Demande soumise en attente de validation.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValider = async () => {
    if (!id) return;
    const montant = montantAccorde ? parseFloat(montantAccorde) : undefined;
    setSubmitting(true);
    try {
      const d = await creditApi.valider(id, { montantAccorde: montant });
      setDossier(d);
      setShowValider(false);
      setMontantAccorde('');
      toast.success('Dossier validé.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejeter = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const d = await creditApi.rejeter(id, { motifRefus: motifRefus || undefined });
      setDossier(d);
      setShowRejeter(false);
      setMotifRefus('');
      toast.success('Dossier rejeté.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOctroyer = async () => {
    if (!id) return;
    if (!window.confirm('Confirmer l\'octroi du crédit ? L\'échéancier sera généré.')) return;
    setSubmitting(true);
    try {
      const d = await creditApi.octroyer(id);
      setDossier(d);
      load();
      toast.success('Crédit octroyé.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemboursementAnticipe = async () => {
    if (!id) return;
    if (!window.confirm('Confirmer le remboursement anticipé ? Le crédit sera clôturé.')) return;
    setSubmitting(true);
    try {
      const d = await creditApi.remboursementAnticipe(id);
      setDossier(d);
      load();
      toast.success('Remboursement anticipé effectué.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !dossier) return <PageLoader />;

  const clientNom = dossier.client
    ? [dossier.client.nom, dossier.client.prenom].filter(Boolean).join(' ')
    : dossier.idClient;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={AppRoutes.CREDIT}>
          <Button variant="ghost" size="sm"><HiOutlineArrowLeft className="h-4 w-4" /> Retour</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dossier.codeDossier}</h1>
          <p className="text-gray-500 mt-1">{clientNom} — {statutBadge(dossier.statut)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dossier.statut === StatutDossierCredit.BROUILLON && (
            <Button onClick={handleSoumettre} disabled={submitting}>Soumettre</Button>
          )}
          {dossier.statut === StatutDossierCredit.EN_ATTENTE && (
            <>
              <Button variant="success" onClick={() => setShowValider(true)} disabled={submitting}>
                <HiOutlineCheck className="h-4 w-4" /> Valider
              </Button>
              <Button variant="danger" onClick={() => setShowRejeter(true)} disabled={submitting}>
                <HiOutlineXMark className="h-4 w-4" /> Rejeter
              </Button>
            </>
          )}
          {dossier.statut === StatutDossierCredit.VALIDE && (
            <Button onClick={handleOctroyer} disabled={submitting}>
              <HiOutlineBanknotes className="h-4 w-4" /> Octroyer le crédit
            </Button>
          )}
          {dossier.statut === StatutDossierCredit.ACTIF && (
            <Button variant="secondary" onClick={handleRemboursementAnticipe} disabled={submitting}>
              Remboursement anticipé
            </Button>
          )}
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><dt className="text-sm text-gray-500">Client</dt><dd className="font-medium">{clientNom}</dd></div>
          <div><dt className="text-sm text-gray-500">Montant demandé</dt><dd>{Number(dossier.montantDemande).toLocaleString('fr-FR')} XAF</dd></div>
          <div><dt className="text-sm text-gray-500">Montant accordé</dt><dd>{dossier.montantAccorde != null ? `${Number(dossier.montantAccorde).toLocaleString('fr-FR')} XAF` : '—'}</dd></div>
          <div><dt className="text-sm text-gray-500">Taux intérêt</dt><dd>{Number(dossier.tauxInteret)} %</dd></div>
          <div><dt className="text-sm text-gray-500">Durée</dt><dd>{dossier.dureeMois} mois</dd></div>
          <div><dt className="text-sm text-gray-500">Date demande</dt><dd>{format(new Date(dossier.dateDemande), 'dd MMM yyyy', { locale: fr })}</dd></div>
          <div><dt className="text-sm text-gray-500">Date octroi</dt><dd>{dossier.dateOctroi ? format(new Date(dossier.dateOctroi), 'dd MMM yyyy', { locale: fr }) : '—'}</dd></div>
          {dossier.motifRefus && (
            <div className="md:col-span-2"><dt className="text-sm text-gray-500">Motif de refus</dt><dd className="text-red-600">{dossier.motifRefus}</dd></div>
          )}
          {dossier.objetCredit && (
            <div className="md:col-span-2"><dt className="text-sm text-gray-500">Objet</dt><dd>{dossier.objetCredit}</dd></div>
          )}
        </dl>
      </Card>

      {echeances.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Échéancier</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">N°</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Capital</th>
                  <th className="pb-2 font-medium text-right">Intérêt</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium text-right">Payé</th>
                  <th className="pb-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {echeances.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100">
                    <td className="py-2">{e.numero}</td>
                    <td className="py-2">{format(new Date(e.dateEcheance), 'dd MMM yyyy', { locale: fr })}</td>
                    <td className="py-2 text-right">{Number(e.montantCapital).toLocaleString('fr-FR')}</td>
                    <td className="py-2 text-right">{Number(e.montantInteret).toLocaleString('fr-FR')}</td>
                    <td className="py-2 text-right">{Number(e.montantTotal).toLocaleString('fr-FR')}</td>
                    <td className="py-2 text-right">{Number(e.montantPaye).toLocaleString('fr-FR')}</td>
                    <td className="py-2">{echeanceStatutBadge(e.statut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showValider} onClose={() => setShowValider(false)} title="Valider le dossier" size="sm">
        <p className="text-gray-600 text-sm mb-4">Le montant accordé peut différer du montant demandé (optionnel).</p>
        <Input
          type="number"
          label="Montant accordé (XAF)"
          value={montantAccorde}
          onChange={(e) => setMontantAccorde(e.target.value)}
          placeholder={String(dossier.montantDemande)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowValider(false)}>Annuler</Button>
          <Button onClick={handleValider} isLoading={submitting}>Valider</Button>
        </div>
      </Modal>

      <Modal open={showRejeter} onClose={() => setShowRejeter(false)} title="Rejeter le dossier" size="sm">
        <Input
          type="text"
          label="Motif de refus"
          value={motifRefus}
          onChange={(e) => setMotifRefus(e.target.value)}
          placeholder="Raison du rejet"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowRejeter(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleRejeter} isLoading={submitting}>Rejeter</Button>
        </div>
      </Modal>
    </div>
  );
}
