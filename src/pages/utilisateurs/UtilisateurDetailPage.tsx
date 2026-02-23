import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi2';
import { utilisateurApi, agenceApi } from '@/core/api';
import type { Utilisateur, Agence } from '@/types';
import { RoleUtilisateur } from '@/types';
import { AppRoutes } from '@/config/routes.config';
import { useAuthStore } from '@/core/store/auth.store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import ImageUpload from '@/components/ui/ImageUpload';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const roleLabels: Record<RoleUtilisateur, string> = {
  [RoleUtilisateur.SuperAdmin]: 'Super Admin',
  [RoleUtilisateur.AdminEntreprise]: 'Admin Entreprise',
  [RoleUtilisateur.Gestionnaire]: 'Gestionnaire',
  [RoleUtilisateur.Collecteur]: 'Collecteur',
  [RoleUtilisateur.Client]: 'Client',
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

/** Admin et Gestionnaire peuvent modifier les utilisateurs de leur entreprise ; SuperAdmin tous. */
function canEditUser(currentUser: Utilisateur | null, targetUser: Utilisateur): boolean {
  if (!currentUser) return false;
  if (currentUser.role === RoleUtilisateur.SuperAdmin) return true;
  if (targetUser.role === RoleUtilisateur.SuperAdmin) return false;
  const sameCompany =
    !targetUser.idEntreprise ||
    targetUser.idEntreprise === currentUser.idEntreprise;
  return (
    sameCompany &&
    (currentUser.role === RoleUtilisateur.AdminEntreprise ||
      currentUser.role === RoleUtilisateur.Gestionnaire)
  );
}

/** Seuls AdminEntreprise et SuperAdmin peuvent modifier l'agence d'un utilisateur. */
function canEditAgence(currentUser: Utilisateur | null): boolean {
  if (!currentUser) return false;
  return currentUser.role === RoleUtilisateur.SuperAdmin || currentUser.role === RoleUtilisateur.AdminEntreprise;
}

export default function UtilisateurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelephone, setFormTelephone] = useState('');
  const [formAdresse, setFormAdresse] = useState('');
  const [formVille, setFormVille] = useState('');
  const [formPays, setFormPays] = useState('');
  const [formIdAgence, setFormIdAgence] = useState('');
  const [agences, setAgences] = useState<Agence[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmDesactiver, setShowConfirmDesactiver] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingActif, setTogglingActif] = useState(false);

  useEffect(() => {
    if (!id) return;
    utilisateurApi
      .get(id)
      .then((u) => {
        setUser(u);
        setFormNom(u.nom ?? '');
        setFormPrenom(u.prenom ?? '');
        setFormEmail(u.email ?? '');
        setFormTelephone(u.telephone ?? '');
        setFormAdresse(u.adresse ?? '');
        setFormVille(u.ville ?? '');
        setFormPays(u.pays ?? '');
        setFormIdAgence(u.idAgence ?? '');
      })
      .catch(() => toast.error('Utilisateur introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (editing) agenceApi.list(true).then(setAgences).catch(() => setAgences([]));
  }, [editing]);

  const handleToggleActif = async () => {
    if (!id) return;
    setTogglingActif(true);
    setShowConfirmDesactiver(false);
    try {
      const updated = await utilisateurApi.update(id, { actif: !user?.actif });
      setUser(updated);
      toast.success(updated.actif ? 'Compte activé. L\'utilisateur peut se connecter.' : 'Compte désactivé. L\'utilisateur ne peut plus se connecter (web et mobile).');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setTogglingActif(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await utilisateurApi.delete(id);
      toast.success('Utilisateur supprimé.');
      setShowDeleteConfirm(false);
      navigate(AppRoutes.UTILISATEURS);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setDeleting(false);
    }
  };

  const onPhotoChange = async (url: string) => {
    if (!id) return;
    try {
      const updated = await utilisateurApi.update(id, { photoProfilUrl: url });
      setUser(updated);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleSaveInfo = async () => {
    if (!id) return;
    const tel = (formTelephone || '').trim();
    if (!tel) {
      toast.error('Le téléphone est requis');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Parameters<typeof utilisateurApi.update>[1] = {
        nom: formNom,
        prenom: formPrenom || undefined,
        email: formEmail || undefined,
        telephone: tel,
        adresse: formAdresse || undefined,
        ville: formVille || undefined,
        pays: formPays || undefined,
      };
      if (canEditAgence(currentUser)) {
        payload.idAgence = formIdAgence || undefined;
      }
      const updated = await utilisateurApi.update(id, payload);
      setUser(updated);
      setEditing(false);
      toast.success('Modifications enregistrées.');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Erreur';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const editable = user ? canEditUser(currentUser, user) : false;
  const editableAgence = canEditAgence(currentUser);
  const isSelf = currentUser?.id === user?.id;

  if (loading) return <PageLoader />;
  if (!user) {
    return (
      <div className="space-y-4">
        <Link to={AppRoutes.UTILISATEURS}>
          <Button variant="secondary">
            <HiOutlineArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
        </Link>
        <Card>
          <p className="text-gray-500">Utilisateur introuvable.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={AppRoutes.UTILISATEURS}>
            <Button variant="secondary">
              <HiOutlineArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.prenom ? `${user.nom} ${user.prenom}` : user.nom}
            </h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={user.actif ? 'success' : 'neutral'}>
            {user.actif ? 'Actif' : 'Inactif'}
          </Badge>
          <Badge variant="info">{roleLabels[user.role] ?? user.role}</Badge>
          {editable && user.role !== RoleUtilisateur.SuperAdmin && !editing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
              title="Modifier les informations"
            >
              <HiOutlinePencil className="h-4 w-4" /> Modifier
            </Button>
          )}
          {editable && editing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  if (user) setFormIdAgence(user.idAgence ?? '');
                }}
              >
                Annuler
              </Button>
              <Button size="sm" onClick={handleSaveInfo} isLoading={submitting}>
                Enregistrer
              </Button>
            </>
          )}
          {user.role !== RoleUtilisateur.SuperAdmin &&
            editable &&
            (user.actif ? !isSelf && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmDesactiver(true)}
                isLoading={togglingActif}
                title="Désactiver le compte (l'utilisateur ne pourra plus se connecter)"
              >
                Désactiver le compte
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleToggleActif}
                isLoading={togglingActif}
                title="Activer le compte"
              >
                Activer le compte
              </Button>
            ))}
          {(user.role === RoleUtilisateur.Gestionnaire || user.role === RoleUtilisateur.Collecteur) &&
            editable && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                title="Supprimer (impossible si collecteur avec collectes ou clients assignés)"
              >
                <HiOutlineTrash className="h-4 w-4" /> Supprimer
              </Button>
            )}
        </div>
      </div>

      <Modal
        open={showConfirmDesactiver}
        onClose={() => setShowConfirmDesactiver(false)}
        title="Désactiver le compte"
        size="sm"
      >
        <p className="text-gray-600 text-sm">
          Confirmer la désactivation du compte de <strong>{user.prenom ? `${user.nom} ${user.prenom}` : user.nom}</strong> ({roleLabels[user.role] ?? user.role}) ? Il ou elle ne pourra plus se connecter sur le web ni sur l&apos;application mobile.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={() => setShowConfirmDesactiver(false)}>Annuler</Button>
          <Button variant="secondary" onClick={handleToggleActif} isLoading={togglingActif}>Désactiver le compte</Button>
        </div>
      </Modal>

      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Supprimer l'utilisateur"
        size="sm"
      >
        <p className="text-gray-600 text-sm">
          Êtes-vous sûr de vouloir supprimer <strong>{user.prenom ? `${user.nom} ${user.prenom}` : user.nom}</strong> ? Pour un collecteur, la suppression est impossible s'il a des collectes ou des clients assignés.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} isLoading={deleting}>Supprimer</Button>
        </div>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Identité</h2>
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
            {editing ? (
              <ImageUpload
                value={user.photoProfilUrl}
                onChange={onPhotoChange}
                editable
                placeholderType="initials"
                placeholderText={[user.nom, user.prenom].filter(Boolean).map((x) => x?.charAt(0)).join('').toUpperCase() || '?'}
                folder="collect_app/utilisateurs"
                size="md"
                shape="circle"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
                {user.photoProfilUrl ? (
                  <img src={user.photoProfilUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  [user.nom, user.prenom].filter(Boolean).map((x) => x?.charAt(0)).join('').toUpperCase() || '?'
                )}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{user.prenom ? `${user.nom} ${user.prenom}` : user.nom}</p>
              <p className="text-sm text-gray-500">{roleLabels[user.role] ?? user.role}</p>
            </div>
          </div>
          {!editing ? (
            <dl className="space-y-0">
              <DetailRow label="Nom" value={user.nom} />
              <DetailRow label="Prénom" value={user.prenom} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Téléphone" value={user.telephone} />
              <DetailRow label="Genre" value={user.genre} />
              <DetailRow
                label="Date de naissance"
                value={
                  user.dateNaissance
                    ? format(new Date(user.dateNaissance), 'dd MMMM yyyy', { locale: fr })
                    : undefined
                }
              />
              <DetailRow label="Lieu de naissance" value={user.lieuNaissance} />
            </dl>
          ) : (
            <div className="space-y-4">
              <Input label="Nom" value={formNom} onChange={(e) => setFormNom(e.target.value)} />
              <Input label="Prénom" value={formPrenom} onChange={(e) => setFormPrenom(e.target.value)} />
              <Input label="Email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              <PhoneInput label="Téléphone *" value={formTelephone} onChange={setFormTelephone} />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adresse & pièce d'identité</h2>
          {!editing ? (
            <dl className="space-y-0">
              <DetailRow label="Adresse" value={user.adresse} />
              <DetailRow label="Ville" value={user.ville} />
              <DetailRow label="Pays" value={user.pays} />
              <DetailRow label="Type de pièce" value={user.typePieceIdentite} />
              <DetailRow label="Numéro de pièce" value={user.numeroPieceIdentite} />
            </dl>
          ) : (
            <div className="space-y-4">
              <Input label="Adresse" value={formAdresse} onChange={(e) => setFormAdresse(e.target.value)} />
              <Input label="Ville" value={formVille} onChange={(e) => setFormVille(e.target.value)} />
              <Input label="Pays" value={formPays} onChange={(e) => setFormPays(e.target.value)} />
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Compte</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 space-y-0">
            <DetailRow label="Rôle" value={roleLabels[user.role] ?? user.role} />
            <DetailRow label="Mode d'authentification" value={user.authMode} />
            {!editing ? (
              <DetailRow label="Agence" value={user.agence?.nom ?? (user.idAgence ? '—' : null)} />
            ) : editableAgence ? (
              <div className="py-3 border-b border-gray-50 last:border-0">
                <dt className="text-sm font-medium text-gray-500 mb-1">Agence</dt>
                <dd className="mt-0.5">
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={formIdAgence}
                    onChange={(e) => setFormIdAgence(e.target.value)}
                  >
                    <option value="">— Toute l&apos;entreprise —</option>
                    {agences.map((a) => (
                      <option key={a.id} value={a.id}>{a.nom}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Modifiable uniquement par l&apos;admin.</p>
                </dd>
              </div>
            ) : (
              <DetailRow label="Agence" value={user.agence?.nom ?? (user.idAgence ? '—' : null)} />
            )}
            <DetailRow
              label="Date de création"
              value={
                user.createdAt
                  ? format(new Date(user.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })
                  : undefined
              }
            />
            <DetailRow label="Nombre de connexions" value={String(user.nombreConnexions ?? 0)} />
          </dl>
        </Card>
      </div>
    </div>
  );
}
