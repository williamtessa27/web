import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { permissionApi, type MatricePermission } from '@/core/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { RoleUtilisateur } from '@/types';

export default function PermissionsPage() {
  const [data, setData] = useState<MatricePermission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    permissionApi
      .getMatrice()
      .then((d) => {
        setData(d);
        setEdited(d.matrix);
        const firstEditable = d.roles.find((r) => r === RoleUtilisateur.Gestionnaire);
        setSelectedRole(firstEditable ?? d.roles[0] ?? null);
      })
      .catch((err: any) => {
        toast.error(err?.message || 'Erreur lors du chargement des permissions.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (role: string, code: string, value: boolean) => {
    setEdited((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] ?? {}),
        [code]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedRole || !data) return;
    const codes = Object.entries(edited[selectedRole] ?? {}).filter(([, v]) => v).map(([c]) => c);
    setSaving(true);
    try {
      await permissionApi.updateMatrice(selectedRole, codes);
      toast.success('Permissions mises à jour.');
      setData((d) => (d ? { ...d, matrix: { ...d.matrix, [selectedRole]: edited[selectedRole] } } : d));
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return <PageLoader />;

  const rolesEditable = [
    RoleUtilisateur.Gestionnaire,
    RoleUtilisateur.Directeur,
    RoleUtilisateur.ChefAgence,
    RoleUtilisateur.GestionnaireCredit,
    RoleUtilisateur.Caissier,
    RoleUtilisateur.Auditeur,
  ];
  const currentMatrix = edited[selectedRole ?? ''] ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des permissions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Définir les permissions accordées à chaque rôle. SuperAdmin et AdminEntreprise conservent tous les droits.
          Les cases cochées ici pilotent le CRUD (boutons Créer, Modifier, Valider, Supprimer) dans chaque rubrique de l&apos;application.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {data.roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRole === role
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {selectedRole && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {rolesEditable.includes(selectedRole as RoleUtilisateur)
                ? `Modifier les permissions pour le rôle « ${selectedRole} ». Cliquez sur les cases pour activer/désactiver.`
                : selectedRole === RoleUtilisateur.SuperAdmin || selectedRole === RoleUtilisateur.AdminEntreprise
                  ? `Rôle « ${selectedRole} » : plein accès automatique, non modifiable.`
                : `Rôle « ${selectedRole} » : lecture seule (non modifiable depuis cette interface).`}
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase">Activé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.permissions.map((p) => {
                    const checked = !!currentMatrix[p.code];
                    const canEdit = rolesEditable.includes(selectedRole as RoleUtilisateur);
                    return (
                      <tr key={p.code} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{p.libelle}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{p.module}</td>
                        <td className="py-3 px-4 text-center">
                          {canEdit ? (
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => handleToggle(selectedRole, p.code, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          ) : (
                            <span className={checked ? 'text-green-600' : 'text-gray-400'}>
                              {checked ? 'Oui' : 'Non'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {rolesEditable.includes(selectedRole as RoleUtilisateur) && (
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} isLoading={saving} disabled={saving}>
                  Enregistrer les modifications
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
