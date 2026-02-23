import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlineUser } from 'react-icons/hi2';
import { collecteurApi, utilisateurApi, zoneApi, agenceApi } from '@/core/api';
import { AppRoutes } from '@/config/routes.config';
import type { Collecteur, Zone, Agence } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import PhoneInput from '@/components/ui/PhoneInput';
import ImageUpload from '@/components/ui/ImageUpload';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function CollecteurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [collecteur, setCollecteur] = useState<Collecteur | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelephone, setFormTelephone] = useState('');
  const [formZoneIds, setFormZoneIds] = useState<string[]>([]);
  const [formAgenceId, setFormAgenceId] = useState<string>('');
  const [formActif, setFormActif] = useState(true);
  const [agences, setAgences] = useState<Agence[]>([]);

  useEffect(() => {
    if (!id) return;
    collecteurApi
      .get(id)
      .then((c) => {
        setCollecteur(c);
        setFormNom(c.utilisateur?.nom ?? '');
        setFormPrenom(c.utilisateur?.prenom ?? '');
        setFormEmail(c.utilisateur?.email ?? '');
        setFormTelephone(c.utilisateur?.telephone ?? '');
        setFormZoneIds(c.zones?.map((z) => z.id) ?? []);
        setFormAgenceId(c.idAgence ?? '');
        setFormActif(c.actif ?? true);
      })
      .catch(() => toast.error('Collecteur introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    zoneApi.list().then((list) => setZones(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);
  useEffect(() => {
    agenceApi.list(true).then((list) => setAgences(list ?? [])).catch(() => {});
  }, []);

  const onPhotoChange = async (url: string) => {
    if (!collecteur?.utilisateur?.id) return;
    try {
      const updatedUser = await utilisateurApi.update(collecteur.utilisateur.id, { photoProfilUrl: url });
      setCollecteur((c) => (c ? { ...c, utilisateur: { ...c.utilisateur!, ...updatedUser } } : null));
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleSave = async () => {
    if (!collecteur?.utilisateur?.id) return;
    const tel = (formTelephone || '').trim();
    if (!tel) {
      toast.error('Le téléphone est requis');
      return;
    }
    setSubmitting(true);
    try {
      await Promise.all([
        utilisateurApi.update(collecteur.utilisateur.id, {
          nom: formNom,
          prenom: formPrenom || undefined,
          email: formEmail,
          telephone: tel,
        }),
        collecteurApi.update(id!, {
          zoneIds: formZoneIds,
          idAgence: formAgenceId || undefined,
          actif: formActif,
        }),
      ]);
      const updated = await collecteurApi.get(id!);
      setCollecteur(updated);
      setEditing(false);
      toast.success('Modifications enregistrées.');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !collecteur) return <PageLoader />;

  const u = collecteur.utilisateur;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={AppRoutes.COLLECTEURS}>
            <Button variant="secondary">
              <HiOutlineArrowLeft className="h-4 w-4" /> Retour
            </Button>
          </Link>
          {editing ? (
            <ImageUpload
              value={u?.photoProfilUrl}
              onChange={onPhotoChange}
              editable
              placeholderType="initials"
              placeholderText={[u?.nom, u?.prenom].filter(Boolean).map((x) => x?.charAt(0)).join('').toUpperCase() || '?'}
              folder="collect_app/utilisateurs"
              size="md"
              shape="circle"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
              {u?.photoProfilUrl ? (
                <img src={u.photoProfilUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                [u?.nom, u?.prenom].filter(Boolean).map((x) => x?.charAt(0)).join('').toUpperCase() || '?'
              )}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {u?.prenom ? `${u.nom} ${u.prenom}` : u?.nom ?? collecteur.codeCollecteur}
            </h1>
            <p className="text-gray-500 mt-0.5">
              {collecteur.codeCollecteur}
              {collecteur.zones?.length ? ` · ${collecteur.zones.map((z) => z.nom).join(', ')}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={collecteur.actif ? 'success' : 'neutral'}>
            {collecteur.actif ? 'Actif' : 'Inactif'}
          </Badge>
          {u?.id && (
            <Link
              to={AppRoutes.UTILISATEUR_DETAIL.replace(':id', u.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
            >
              <HiOutlineUser className="h-4 w-4" /> Fiche utilisateur
            </Link>
          )}
          {!editing ? (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <HiOutlinePencil className="h-4 w-4" /> Modifier
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={submitting}>
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
        {!editing ? (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><dt className="text-sm text-gray-500">Code</dt><dd className="font-mono text-gray-900">{collecteur.codeCollecteur}</dd></div>
            <div><dt className="text-sm text-gray-500">Zones</dt><dd className="text-gray-900">{collecteur.zones?.length ? collecteur.zones.map((z) => z.nom).join(', ') : '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Agence</dt><dd className="text-gray-900">{collecteur.agence?.nom ?? '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Nom</dt><dd className="text-gray-900">{u?.nom ?? '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Prénom</dt><dd className="text-gray-900">{u?.prenom ?? '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Email</dt><dd className="text-gray-900">{u?.email ?? '—'}</dd></div>
            <div><dt className="text-sm text-gray-500">Téléphone</dt><dd className="text-gray-900">{u?.telephone ?? '—'}</dd></div>
          </dl>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nom" value={formNom} onChange={(e) => setFormNom(e.target.value)} />
            <Input label="Prénom" value={formPrenom} onChange={(e) => setFormPrenom(e.target.value)} />
            <Input label="Email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            <PhoneInput label="Téléphone *" value={formTelephone} onChange={setFormTelephone} />
            <Select
              label="Agence"
              value={formAgenceId}
              onChange={(e) => setFormAgenceId(e.target.value)}
            >
              <option value="">— Aucune —</option>
              {agences.map((a) => (
                <option key={a.id} value={a.id}>{a.nom}</option>
              ))}
            </Select>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Zones assignées</label>
              <ul className="space-y-2">
                {zones.map((z) => (
                  <li key={z.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`edit-zone-${z.id}`}
                      checked={formZoneIds.includes(z.id)}
                      onChange={() => setFormZoneIds((prev) => prev.includes(z.id) ? prev.filter((id) => id !== z.id) : [...prev, z.id])}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor={`edit-zone-${z.id}`} className="cursor-pointer font-medium text-gray-900">{z.nom}</label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="actif"
                checked={formActif}
                onChange={(e) => setFormActif(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="actif" className="text-sm text-gray-700">Collecteur actif</label>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
