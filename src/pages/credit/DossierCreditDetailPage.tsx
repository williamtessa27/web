import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineXMark, HiOutlineBanknotes, HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlinePlus } from 'react-icons/hi2';
import { creditApi, garantieApi, assuranceApi, typeGarantieApi, typeAssuranceApi } from '@/core/api';
import type { DossierCredit, Echeance } from '@/types';
import type { Garantie, Assurance, TypeGarantie, TypeAssurance } from '@/core/api';
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
    [StatutDossierCredit.CONTENTIEUX]: { label: 'Contentieux', variant: 'danger' },
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

const garantieStatutBadge = (statut: Garantie['statut']) => {
  const map: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
    EN_ATTENTE: { label: 'En attente', variant: 'warning' },
    VALIDEE: { label: 'Validée', variant: 'success' },
    REFUSEE: { label: 'Refusée', variant: 'danger' },
    EXPIREE: { label: 'Expirée', variant: 'neutral' },
  };
  const { label, variant } = map[statut] ?? { label: statut, variant: 'neutral' as const };
  return <Badge variant={variant}>{label}</Badge>;
};

const assuranceStatutBadge = (statut: Assurance['statut']) => {
  const map: Record<string, { label: string; variant: 'success' | 'neutral' | 'danger' }> = {
    ACTIVE: { label: 'Active', variant: 'success' },
    EXPIREE: { label: 'Expirée', variant: 'neutral' },
    RESILIEE: { label: 'Résiliée', variant: 'danger' },
  };
  const { label, variant } = map[statut] ?? { label: statut, variant: 'neutral' as const };
  return <Badge variant={variant}>{label}</Badge>;
};

export default function DossierCreditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dossier, setDossier] = useState<DossierCredit | null>(null);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [garanties, setGaranties] = useState<Garantie[]>([]);
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [typesGarantie, setTypesGarantie] = useState<TypeGarantie[]>([]);
  const [typesAssurance, setTypesAssurance] = useState<TypeAssurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showValider, setShowValider] = useState(false);
  const [showRejeter, setShowRejeter] = useState(false);
  const [montantAccorde, setMontantAccorde] = useState('');
  const [motifRefus, setMotifRefus] = useState('');
  const [showAddGarantie, setShowAddGarantie] = useState(false);
  const [showAddAssurance, setShowAddAssurance] = useState(false);
  const [garantieValiderRefuser, setGarantieValiderRefuser] = useState<{ id: string; note: string } | null>(null);
  const [formGarantie, setFormGarantie] = useState({ idTypeGarantie: '', valeurEstimee: '', dateValidite: '', note: '', documentUrl: '' });
  const [formAssurance, setFormAssurance] = useState({ idTypeAssurance: '', montantCouvert: '', dateDebut: '', dateFin: '', prime: '0' });

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      creditApi.getDossier(id),
      creditApi.getEcheances(id),
      garantieApi.listByDossier(id),
      assuranceApi.listByDossier(id),
      typeGarantieApi.list(false),
      typeAssuranceApi.list(false),
    ])
      .then(([d, e, g, a, tg, ta]) => {
        setDossier(d);
        setEcheances(Array.isArray(e) ? e : []);
        setGaranties(Array.isArray(g) ? g : []);
        setAssurances(Array.isArray(a) ? a : []);
        setTypesGarantie(Array.isArray(tg) ? tg : []);
        setTypesAssurance(Array.isArray(ta) ? ta : []);
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

  const handlePasserEnContentieux = async () => {
    if (!id) return;
    const motif = window.prompt('Motif du passage en contentieux (optionnel) :');
    if (motif === null) return; // Annulé
    setSubmitting(true);
    try {
      const d = await creditApi.passerEnContentieux(id, motif.trim() || undefined);
      setDossier(d);
      load();
      toast.success('Dossier passé en contentieux.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const canEditGarantiesAssurances = dossier && [StatutDossierCredit.BROUILLON, StatutDossierCredit.EN_ATTENTE, StatutDossierCredit.VALIDE].includes(dossier.statut);

  const handleAddGarantie = async () => {
    if (!id || !formGarantie.idTypeGarantie || !formGarantie.valeurEstimee || !formGarantie.dateValidite) {
      toast.error('Remplissez le type, la valeur et la date de validité.');
      return;
    }
    setSubmitting(true);
    try {
      await garantieApi.create({
        idDossierCredit: id,
        idTypeGarantie: formGarantie.idTypeGarantie,
        valeurEstimee: Number(formGarantie.valeurEstimee),
        dateValidite: formGarantie.dateValidite,
        note: formGarantie.note || undefined,
        documentUrl: formGarantie.documentUrl || undefined,
      });
      toast.success('Garantie ajoutée.');
      setShowAddGarantie(false);
      setFormGarantie({ idTypeGarantie: '', valeurEstimee: '', dateValidite: '', note: '', documentUrl: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValiderRefuserGarantie = async (statut: 'VALIDEE' | 'REFUSEE') => {
    if (!garantieValiderRefuser) return;
    setSubmitting(true);
    try {
      await garantieApi.valider(garantieValiderRefuser.id, { statut, note: garantieValiderRefuser.note || undefined });
      toast.success(statut === 'VALIDEE' ? 'Garantie validée.' : 'Garantie refusée.');
      setGarantieValiderRefuser(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGarantie = async (garantieId: string) => {
    if (!window.confirm('Supprimer cette garantie ?')) return;
    setSubmitting(true);
    try {
      await garantieApi.delete(garantieId);
      toast.success('Garantie supprimée.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAssurance = async () => {
    if (!id || !formAssurance.idTypeAssurance || !formAssurance.montantCouvert || !formAssurance.dateDebut || !formAssurance.dateFin) {
      toast.error('Remplissez le type, le montant couvert et les dates.');
      return;
    }
    setSubmitting(true);
    try {
      await assuranceApi.create({
        idDossierCredit: id,
        idTypeAssurance: formAssurance.idTypeAssurance,
        montantCouvert: Number(formAssurance.montantCouvert),
        dateDebut: formAssurance.dateDebut,
        dateFin: formAssurance.dateFin,
        prime: Number(formAssurance.prime) || 0,
      });
      toast.success('Assurance ajoutée.');
      setShowAddAssurance(false);
      setFormAssurance({ idTypeAssurance: '', montantCouvert: '', dateDebut: '', dateFin: '', prime: '0' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const hasGarantieValidee = garanties.some((g) => g.statut === 'VALIDEE');
  const needGarantieForOctroi = garanties.length > 0 && !hasGarantieValidee;

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
            <>
              <Button onClick={handleOctroyer} disabled={submitting || needGarantieForOctroi}>
                <HiOutlineBanknotes className="h-4 w-4" /> Octroyer le crédit
              </Button>
              {needGarantieForOctroi && (
                <span className="text-sm text-amber-600">Une garantie doit être validée avant l&apos;octroi.</span>
              )}
            </>
          )}
          {dossier.statut === StatutDossierCredit.ACTIF && (
            <>
              <Button variant="secondary" onClick={handleRemboursementAnticipe} disabled={submitting}>
                Remboursement anticipé
              </Button>
              <Button variant="danger" onClick={handlePasserEnContentieux} disabled={submitting}>
                Passer en contentieux
              </Button>
            </>
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

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiOutlineShieldCheck className="h-5 w-5" />
            Garanties
          </h2>
          {canEditGarantiesAssurances && (
            <Button size="sm" onClick={() => setShowAddGarantie(true)}>
              <HiOutlinePlus className="h-4 w-4" /> Ajouter
            </Button>
          )}
        </div>
        {garanties.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune garantie. {canEditGarantiesAssurances && 'Ajoutez une garantie pour sécuriser le crédit.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium text-right">Valeur estimée</th>
                  <th className="pb-2 font-medium">Date validité</th>
                  <th className="pb-2 font-medium">Statut</th>
                  {canEditGarantiesAssurances && <th className="pb-2 font-medium"></th>}
                </tr>
              </thead>
              <tbody>
                {garanties.map((g) => (
                  <tr key={g.id} className="border-b border-gray-100">
                    <td className="py-2">{g.typeGarantie?.libelle ?? g.idTypeGarantie}</td>
                    <td className="py-2 text-right">{Number(g.valeurEstimee).toLocaleString('fr-FR')} XAF</td>
                    <td className="py-2">{format(new Date(g.dateValidite), 'dd MMM yyyy', { locale: fr })}</td>
                    <td className="py-2">{garantieStatutBadge(g.statut)}</td>
                    {canEditGarantiesAssurances && (
                      <td className="py-2">
                        {g.statut === 'EN_ATTENTE' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setGarantieValiderRefuser({ id: g.id, note: '' })}>Valider / Refuser</Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteGarantie(g.id)}>Supprimer</Button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiOutlineDocumentText className="h-5 w-5" />
            Assurances
          </h2>
          {canEditGarantiesAssurances && (
            <Button size="sm" onClick={() => setShowAddAssurance(true)}>
              <HiOutlinePlus className="h-4 w-4" /> Ajouter
            </Button>
          )}
        </div>
        {assurances.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune assurance. {canEditGarantiesAssurances && 'Vous pouvez associer une assurance au crédit.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium text-right">Montant couvert</th>
                  <th className="pb-2 font-medium">Début / Fin</th>
                  <th className="pb-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {assurances.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="py-2">{a.typeAssurance?.libelle ?? a.idTypeAssurance}</td>
                    <td className="py-2 text-right">{Number(a.montantCouvert).toLocaleString('fr-FR')} XAF</td>
                    <td className="py-2">{format(new Date(a.dateDebut), 'dd MMM yy', { locale: fr })} — {format(new Date(a.dateFin), 'dd MMM yy', { locale: fr })}</td>
                    <td className="py-2">{assuranceStatutBadge(a.statut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      <Modal open={showAddGarantie} onClose={() => setShowAddGarantie(false)} title="Ajouter une garantie" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de garantie *</label>
            <select
              value={formGarantie.idTypeGarantie}
              onChange={(e) => setFormGarantie((p) => ({ ...p, idTypeGarantie: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">— Choisir —</option>
              {typesGarantie.map((t) => (
                <option key={t.id} value={t.id}>{t.libelle}</option>
              ))}
            </select>
          </div>
          <Input label="Valeur estimée (XAF) *" type="number" min={0} value={formGarantie.valeurEstimee} onChange={(e) => setFormGarantie((p) => ({ ...p, valeurEstimee: e.target.value }))} />
          <Input label="Date de validité *" type="date" value={formGarantie.dateValidite} onChange={(e) => setFormGarantie((p) => ({ ...p, dateValidite: e.target.value }))} />
          <Input label="Note (optionnel)" value={formGarantie.note} onChange={(e) => setFormGarantie((p) => ({ ...p, note: e.target.value }))} />
          <Input label="Document justificatif (URL optionnel)" value={formGarantie.documentUrl} onChange={(e) => setFormGarantie((p) => ({ ...p, documentUrl: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowAddGarantie(false)}>Annuler</Button>
          <Button onClick={handleAddGarantie} isLoading={submitting}>Enregistrer</Button>
        </div>
      </Modal>

      <Modal open={showAddAssurance} onClose={() => setShowAddAssurance(false)} title="Ajouter une assurance" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type d&apos;assurance *</label>
            <select
              value={formAssurance.idTypeAssurance}
              onChange={(e) => setFormAssurance((p) => ({ ...p, idTypeAssurance: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">— Choisir —</option>
              {typesAssurance.map((t) => (
                <option key={t.id} value={t.id}>{t.libelle}</option>
              ))}
            </select>
          </div>
          <Input label="Montant couvert (XAF) *" type="number" min={0} value={formAssurance.montantCouvert} onChange={(e) => setFormAssurance((p) => ({ ...p, montantCouvert: e.target.value }))} />
          <Input label="Date début *" type="date" value={formAssurance.dateDebut} onChange={(e) => setFormAssurance((p) => ({ ...p, dateDebut: e.target.value }))} />
          <Input label="Date fin *" type="date" value={formAssurance.dateFin} onChange={(e) => setFormAssurance((p) => ({ ...p, dateFin: e.target.value }))} />
          <Input label="Prime (XAF)" type="number" min={0} value={formAssurance.prime} onChange={(e) => setFormAssurance((p) => ({ ...p, prime: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowAddAssurance(false)}>Annuler</Button>
          <Button onClick={handleAddAssurance} isLoading={submitting}>Enregistrer</Button>
        </div>
      </Modal>

      <Modal open={!!garantieValiderRefuser} onClose={() => setGarantieValiderRefuser(null)} title="Valider ou refuser la garantie" size="sm">
        <Input label="Note (optionnel)" value={garantieValiderRefuser?.note ?? ''} onChange={(e) => setGarantieValiderRefuser((p) => p ? { ...p, note: e.target.value } : null)} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setGarantieValiderRefuser(null)}>Annuler</Button>
          <Button variant="danger" onClick={() => handleValiderRefuserGarantie('REFUSEE')} isLoading={submitting}>Refuser</Button>
          <Button variant="success" onClick={() => handleValiderRefuserGarantie('VALIDEE')} isLoading={submitting}>Valider</Button>
        </div>
      </Modal>
    </div>
  );
}
