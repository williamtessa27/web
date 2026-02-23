import { Link } from 'react-router-dom';
import { HiOutlineBanknotes, HiOutlineCreditCard, HiOutlineUserGroup } from 'react-icons/hi2';
import { AppRoutes } from '@/config/routes.config';
import Card from '@/components/ui/Card';

export default function ProduitsMicrofinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produits microfinance</h1>
        <p className="text-gray-500 mt-1">
          Les produits microfinance sont les offres auxquelles un client doit être lié pour en bénéficier : Épargne, Crédit, Tontine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <HiOutlineBanknotes className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Épargne</h2>
              <p className="text-sm text-gray-500 mt-1">
                Comptes épargne : le client dépose régulièrement et peut retirer selon les conditions. Les montants de collecte sont définis dans les <strong>plans de collecte</strong>.
              </p>
              <Link to={AppRoutes.PLANS_COLLECTE} className="text-sm text-primary-600 hover:underline mt-2 inline-block">
                Voir les plans de collecte →
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <HiOutlineCreditCard className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Crédit</h2>
              <p className="text-sm text-gray-500 mt-1">
                Prêts aux clients : création de dossiers crédit, validation, octroi, remboursement des échéances.
              </p>
              <Link to={AppRoutes.CREDIT} className="text-sm text-primary-600 hover:underline mt-2 inline-block">
                Dossiers crédit →
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <HiOutlineUserGroup className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tontine</h2>
              <p className="text-sm text-gray-500 mt-1">
                Cotisations rotatives : les clients s'inscrivent via une souscription à un plan de collecte de type tontine.
              </p>
              <Link to={AppRoutes.SOUSCRIPTIONS} className="text-sm text-primary-600 hover:underline mt-2 inline-block">
                Souscriptions →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Distinction importante</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <strong>Plans de collecte</strong> (Paramètres) : montants quotidiens (1000 XAF, 2000 XAF…). Ils définissent ce que le collecteur récupère chez le client à chaque passage.
          </li>
          <li>
            <strong>Produits microfinance</strong> : Épargne, Crédit, Tontine. Ce sont les produits auxquels le client s'abonne. Un client doit être lié à un produit pour en bénéficier.
          </li>
          <li>
            Une <strong>souscription</strong> lie un client à un plan de collecte (ex. collecte 1000 XAF/jour). Les collectes enregistrées alimentent ce plan.
          </li>
        </ul>
      </Card>
    </div>
  );
}
