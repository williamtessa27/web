import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineBuildingOffice2, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineChartBar, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { agenceApi, rapportApi, type KPIAgence } from '@/core/api';
import type { Agence } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { exportToExcel } from '@/utils/export.utils';

type AgenceForm = { nom: string; adresse?: string; telephone?: string };

export default function AgencesPage() {
  const [agences, setAgences] = useState<Agence[]>([]);
  const [kpis, setKpis] = useState<KPIAgence[]>([]);
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAgence, setEditingAgence] = useState<Agence | null>(null);
  const [agenceToDelete, setAgenceToDelete] = useState<Agence | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<AgenceForm>();

  const load = () => {
    agenceApi.list(false).then(setAgences).catch(() => {}).finally(() => setLoading(false));
  };

  const loadKpis = () => {
    rapportApi.kpisAgences({ dateDebut, dateFin }).then(setKpis).catch(() => setKpis([]));
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, []);

  useEffect(() => {
    loadKpis();
  }, [dateDebut, dateFin]);

  const onCreate = async (data: AgenceForm) => {
    setIsSubmitting(true);
    try {
      await agenceApi.create({ nom: data.nom, adresse: data.adresse || undefined, telephone: data.telephone || undefined });
      toast.success('Agence créée.');
      setShowCreate(false);
      reset();
      setLoading(true);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEdit = (agence: Agence) => {
    setEditingAgence(agence);
    setValue('nom', agence.nom);
    setValue('adresse', agence.adresse ?? '');
    setValue('telephone', agence.telephone ?? '');
  };

  const onUpdate = async (data: AgenceForm) => {
    if (!editingAgence) return;
    setIsSubmitting(true);
    try {
      await agenceApi.update(editingAgence.id, { nom: data.nom, adresse: data.adresse || undefined, telephone: data.telephone || undefined });
      toast.success('Agence mise à jour.');
      setEditingAgence(null);
      reset();
      setLoading(true);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canDeleteAgence = (a: Agence) => !a.zones?.length && !a.collecteurs?.length;

  const onConfirmDelete = async () => {
    if (!agenceToDelete) return;
    setIsDeleting(true);
    try {
      await agenceApi.delete(agenceToDelete.id);
      toast.success('Agence supprimée.');
      setAgenceToDelete(null);
      setLoading(true);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !agences.length) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agences</h1>
          <p className="text-gray-500 mt-1">Agences et points de présence</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <HiOutlinePlus className="h-4 w-4" /> Créer une agence
        </Button>
      </div>

      {kpis.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineChartBar className="h-5 w-5" /> KPIs par agence
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportToExcel(
                kpis.map((k) => ({
                  Agence: k.nomAgence,
                  'Nombre collectes': k.nombreCollectes,
                  'Montant total (XAF)': k.totalMontant,
                  Collecteurs: k.nbCollecteurs,
                  Clients: k.nbClients,
                })),
                `kpis-agences-${dateDebut}-${dateFin}`,
              )}
            >
              <HiOutlineArrowDownTray className="h-4 w-4" /> Export Excel
            </Button>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            />
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((k) => (
              <div key={k.idAgence} className="rounded-xl border border-gray-200 p-4 bg-white">
                <h3 className="font-semibold text-gray-900 mb-3">{k.nomAgence}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Collectes</span><p className="font-medium">{k.nombreCollectes}</p></div>
                  <div><span className="text-gray-500">Montant</span><p className="font-medium">{k.totalMontant.toLocaleString('fr-FR')} XAF</p></div>
                  <div><span className="text-gray-500">Collecteurs</span><p className="font-medium">{k.nbCollecteurs}</p></div>
                  <div><span className="text-gray-500">Clients</span><p className="font-medium">{k.nbClients}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!agences.length ? (
        <Card>
          <EmptyState
            title="Aucune agence"
            description="Créez des agences pour organiser zones et collecteurs."
            icon={<HiOutlineBuildingOffice2 className="h-16 w-16" />}
            action={<Button onClick={() => setShowCreate(true)}><HiOutlinePlus className="h-4 w-4" /> Créer une agence</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agences.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary-50 text-secondary-500 shrink-0">
                  <HiOutlineBuildingOffice2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{a.nom}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(a)}
                        title="Modifier l'agence"
                      >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => canDeleteAgence(a) && setAgenceToDelete(a)}
                        disabled={!canDeleteAgence(a)}
                        title={canDeleteAgence(a) ? "Supprimer l'agence" : 'Impossible : zones ou collecteurs rattachés'}
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {a.adresse && <p className="text-sm text-gray-600 mt-1">{a.adresse}</p>}
                  {a.telephone && <p className="text-sm text-gray-500 mt-0.5">{a.telephone}</p>}
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span>{a.zones?.length || 0} zone(s)</span>
                    <span>{a.collecteurs?.length || 0} collecteur(s)</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Créer une agence" size="md">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input
            label="Nom de l'agence *"
            placeholder="Ex: Agence Akwa"
            error={errors.nom?.message}
            {...register('nom', { required: "Le nom est requis" })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={2}
              placeholder="123 Avenue Kennedy, Douala"
              {...register('adresse')}
            />
          </div>
          <Controller
            name="telephone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                label="Téléphone"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button type="submit" isLoading={isSubmitting}>Créer</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editingAgence != null}
        onClose={() => { setEditingAgence(null); reset(); }}
        title="Modifier l'agence"
        size="md"
      >
        <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
          <Input
            label="Nom de l'agence *"
            placeholder="Ex: Agence Akwa"
            error={errors.nom?.message}
            {...register('nom', { required: "Le nom est requis" })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={2}
              placeholder="123 Avenue Kennedy, Douala"
              {...register('adresse')}
            />
          </div>
          <Controller
            name="telephone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                label="Téléphone"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setEditingAgence(null); reset(); }}>Annuler</Button>
            <Button type="submit" isLoading={isSubmitting}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={agenceToDelete != null}
        onClose={() => setAgenceToDelete(null)}
        title="Supprimer l'agence"
        size="sm"
      >
        <p className="text-gray-600 text-sm">
          Êtes-vous sûr de vouloir supprimer l'agence <strong>{agenceToDelete?.nom}</strong> ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={() => setAgenceToDelete(null)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirmDelete} isLoading={isDeleting}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
