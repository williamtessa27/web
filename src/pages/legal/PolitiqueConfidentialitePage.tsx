import { Link } from 'react-router-dom';
import { AppRoutes } from '@/config/routes.config';
import { useSEO } from '@/hooks/useSEO';

const sections = [
  {
    title: 'Introduction',
    content:
      "Kimistack (« nous », « notre ») s'engage à protéger la confidentialité et la sécurité des données personnelles de ses utilisateurs (« vous », « Utilisateur ») dans le cadre de l'utilisation de l'application Kimifinance. La présente politique explique quelles données sont collectées, comment elles sont utilisées, stockées, sécurisées et vos droits en matière de protection de vos informations.",
  },
  {
    title: 'Données collectées',
    items: [
      "Informations personnelles : nom, prénom, numéro de téléphone, adresse, date de naissance, photo, documents d'identité.",
      "Informations financières : informations sur vos comptes d'épargne, crédit, collecte, transactions.",
      "Données de connexion et appareil : type d'appareil, système d'exploitation, adresses IP, logs d'activité.",
      "Données de localisation : uniquement si vous utilisez des fonctionnalités de collecte terrain.",
      "Communications : messages envoyés via l'application, notifications ou demandes de support.",
    ],
  },
  {
    title: 'Utilisation des données',
    content:
      "Les données collectées servent à : fournir et gérer les services de microfinance (épargne, crédit, collecte, reporting) ; vérifier l'identité et la solvabilité des clients ; communiquer avec vous sur vos comptes, produits et services ; améliorer l'application, ses fonctionnalités et la sécurité ; respecter les obligations légales et réglementaires locales (Cameroun).",
  },
  {
    title: 'Partage des données',
    items: [
      'Avec les autorités financières si requis par la loi.',
      'Avec nos partenaires de services (intégration mobile money, partenaires assureurs), uniquement pour l\'exécution du service.',
      'Avec nos prestataires techniques, sous contrat strict de confidentialité.',
    ],
  },
  {
    title: 'Sécurité des données',
    items: [
      'Chiffrement des données en transit et au repos.',
      "Contrôle d'accès strict basé sur les rôles (collecteur, gestionnaire, chef d'agence, DG).",
      'Sauvegardes régulières et audits internes.',
    ],
  },
  {
    title: 'Conservation des données',
    content:
      "Les informations sont conservées pendant la durée nécessaire à la fourniture des services et conformément aux obligations légales. Les données des utilisateurs inactifs peuvent être archivées ou anonymisées après notification.",
  },
  {
    title: 'Vos droits',
    content:
      "Vous pouvez : accéder à vos données personnelles ; les corriger ou compléter ; demander leur suppression (dans les limites légales) ; retirer votre consentement pour certaines utilisations marketing. Pour exercer vos droits, contactez : Éditeur : Kimistack — Application : Kimifinance — Pays : Cameroun — Contact : via l'application ou le site web officiel associé au service.",
  },
  {
    title: 'Modifications de la politique',
    content:
      "Nous pouvons mettre à jour cette politique. Toute modification sera publiée dans l'application ou sur le site officiel et prendra effet immédiatement.",
  },
];

export default function PolitiqueConfidentialitePage() {
  useSEO({
    title: 'Politique de confidentialité',
    description: 'Politique de confidentialité — Kimifinance',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link to={AppRoutes.HOME} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            ← Retour à l'accueil
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Politique de confidentialité – Kimifinance</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-10 space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {i + 1} {s.title}
              </h2>
              {s.content && <p className="text-gray-600 leading-relaxed">{s.content}</p>}
              {s.items && (
                <ul className="list-disc list-inside text-gray-600 leading-relaxed space-y-2">
                  {s.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
