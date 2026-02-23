import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineMapPin, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { zoneApi, agenceApi } from '@/core/api';
import type { Zone, Agence } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';

type ZoneForm = { nom: string; description?: string; idAgence?: string };

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ZoneForm>();

  const load = () => {
    Promise.all([zoneApi.list(), agenceApi.list(true)])
      .then(([z, a]) => { setZones(z); setAgences(a ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, []);

  const onCreate = async (data: ZoneForm) => {
    setIsSubmitting(true);
    try {
      await zoneApi.create({ nom: data.nom, description: data.description || undefined, idAgence: data.idAgence || undefined });
      toast.success('Zone créée.');
      setShowCreate(false);
      reset();
      setLoading(true);
      zoneApi.list().then(setZones).catch(() => {}).finally(() => setLoading(false));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEdit = (zone: Zone) => {
    setEditingZone(zone);
    setValue('nom', zone.nom);
    setValue('description', zone.description ?? '');
    setValue('idAgence', zone.idAgence ?? '');
  };

  const onUpdate = async (data: ZoneForm) => {
    if (!editingZone) return;
    setIsSubmitting(true);
    try {
      await zoneApi.update(editingZone.id, { nom: data.nom, description: data.description || undefined, idAgence: data.idAgence || undefined });
      toast.success('Zone mise à jour.');
      setEditingZone(null);
      reset();
      setLoading(true);
      zoneApi.list().then(setZones).catch(() => {}).finally(() => setLoading(false));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canDeleteZone = (z: Zone) => !z.collecteurs?.length;

  const onConfirmDelete = async () => {
    if (!zoneToDelete) return;
    setIsDeleting(true);
    try {
      await zoneApi.delete(zoneToDelete.id);
      toast.success('Zone supprimée.');
      setZoneToDelete(null);
      setLoading(true);
      zoneApi.list().then(setZones).catch(() => {}).finally(() => setLoading(false));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !zones.length) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zones</h1>
          <p className="text-gray-500 mt-1">Zones géographiques de collecte</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <HiOutlinePlus className="h-4 w-4" /> Créer une zone
        </Button>
      </div>

      {!zones.length ? (
        <Card>
          <EmptyState
            title="Aucune zone"
            description="Organisez vos collecteurs par zone géographique."
            icon={<HiOutlineMapPin className="h-16 w-16" />}
            action={<Button onClick={() => setShowCreate(true)}><HiOutlinePlus className="h-4 w-4" /> Créer une zone</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((z) => (
            <Card key={z.id}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary-50 text-secondary-500 shrink-0">
                  <HiOutlineMapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{z.nom}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(z)}
                        title="Modifier la zone"
                      >
                        <HiOutlinePencilSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => canDeleteZone(z) && setZoneToDelete(z)}
                        disabled={!canDeleteZone(z)}
                        title={canDeleteZone(z) ? 'Supprimer la zone' : 'Impossible : des collecteurs sont affectés à cette zone'}
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {z.description && <p className="text-sm text-gray-500 mt-1">{z.description}</p>}
                  {z.agence && <p className="text-sm text-primary-600 mt-1">{z.agence.nom}</p>}
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span>{z.collecteurs?.length || 0} collecteur(s)</span>
                    <span>{z.clients?.length || 0} client(s)</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Créer une zone" size="md">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input
            label="Nom de la zone *"
            placeholder="Ex: Zone Akwa"
            error={errors.nom?.message}
            {...register('nom', { required: 'Le nom est requis' })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={3}
              placeholder="Quartier et alentours..."
              {...register('description')}
            />
          </div>
          <Select
            label="Agence"
            {...register('idAgence')}
          >
            <option value="">— Aucune —</option>
            {agences.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button type="submit" isLoading={isSubmitting}>Créer</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editingZone != null}
        onClose={() => { setEditingZone(null); reset(); }}
        title="Modifier la zone"
        size="md"
      >
        <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
          <Input
            label="Nom de la zone *"
            placeholder="Ex: Zone Akwa"
            error={errors.nom?.message}
            {...register('nom', { required: 'Le nom est requis' })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows={3}
              placeholder="Quartier et alentours..."
              {...register('description')}
            />
          </div>
          <Select
            label="Agence"
            {...register('idAgence')}
          >
            <option value="">— Aucune —</option>
            {agences.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setEditingZone(null); reset(); }}>Annuler</Button>
            <Button type="submit" isLoading={isSubmitting}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={zoneToDelete != null}
        onClose={() => setZoneToDelete(null)}
        title="Supprimer la zone"
        size="sm"
      >
        <p className="text-gray-600 text-sm">
          Êtes-vous sûr de vouloir supprimer la zone <strong>{zoneToDelete?.nom}</strong> ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={() => setZoneToDelete(null)}>
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
