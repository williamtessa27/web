import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppRoutes } from '@/config/routes.config';
import clsx from 'clsx';

// ─── DATA ────────────────────────────────────────────

const problems = [
  {
    icon: '💸',
    title: 'Pertes de fonds non traçables',
    desc: 'Les collecteurs gèrent du cash quotidiennement sans suivi fiable, ce qui entraîne des écarts et des pertes.',
  },
  {
    icon: '📵',
    title: 'Zones sans connexion',
    desc: "Les collecteurs travaillent souvent dans des zones rurales sans accès internet. Impossible d'utiliser un outil classique.",
  },
  {
    icon: '📋',
    title: 'Cahiers et registres papier',
    desc: 'Le suivi manuel sur papier est source d\'erreurs, de litiges et de retards dans les réconciliations.',
  },
  {
    icon: '🔍',
    title: 'Aucune visibilité en temps réel',
    desc: "Les responsables n'ont aucun moyen de suivre l'avancement des tournées et des collectes en cours.",
  },
];

const features = [
  {
    icon: '📱',
    title: 'Application mobile offline',
    desc: 'Les collecteurs saisissent les paiements même sans internet. Tout se synchronise automatiquement au retour du réseau.',
    color: 'bg-primary-50 text-primary-600',
  },
  {
    icon: '🗺️',
    title: 'Gestion des tournées',
    desc: "Planifiez les circuits de collecte, assignez des zones aux collecteurs et suivez leur progression en temps réel.",
    color: 'bg-accent-50 text-accent-600',
  },
  {
    icon: '👥',
    title: 'Gestion des clients',
    desc: "Fichier client complet avec historique de paiements, souscriptions actives et solde en temps réel.",
    color: 'bg-secondary-50 text-secondary-500',
  },
  {
    icon: '📊',
    title: 'Tableau de bord en temps réel',
    desc: "Visualisez les montants collectés, les performances des collecteurs et les tendances journalières.",
    color: 'bg-primary-50 text-primary-600',
  },
  {
    icon: '💰',
    title: 'Commissions automatiques',
    desc: "Calculez automatiquement les commissions des collecteurs selon les règles que vous définissez.",
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: '🔐',
    title: 'Sécurité & rôles',
    desc: "Super Admin, Admin Entreprise, Collecteur — chaque rôle a des accès adaptés. Données isolées par entreprise.",
    color: 'bg-rose-50 text-rose-600',
  },
];

const steps = [
  { num: '01', title: 'Créez votre entreprise', desc: "Inscrivez votre structure et configurez vos zones de collecte." },
  { num: '02', title: 'Ajoutez vos collecteurs', desc: "Créez les comptes de vos agents terrain et assignez-leur des zones." },
  { num: '03', title: 'Enregistrez vos clients', desc: "Ajoutez les clients avec leurs souscriptions et plans de paiement." },
  { num: '04', title: 'Collectez & suivez', desc: "Vos collecteurs saisissent les paiements (même offline), vous suivez tout en temps réel." },
];

const stats = [
  { value: '100%', label: 'Offline', desc: 'Fonctionne sans internet' },
  { value: '<2s', label: 'Sync', desc: 'Synchronisation instantanée' },
  { value: 'Multi', label: 'Entreprise', desc: 'Architecture multi-tenant' },
  { value: '24/7', label: 'Suivi', desc: 'Tableau de bord temps réel' },
];

const faqs = [
  {
    q: "L'application fonctionne-t-elle sans internet ?",
    a: "Oui ! Les collecteurs peuvent enregistrer les paiements hors ligne. Les données se synchronisent automatiquement dès que la connexion est rétablie.",
  },
  {
    q: "Combien coûte Kimifinance ?",
    a: "Kimifinance est actuellement gratuit pendant la phase de lancement. Aucune carte de crédit n'est requise.",
  },
  {
    q: "Peut-on gérer plusieurs entreprises ?",
    a: "Oui, l'architecture multi-tenant permet de gérer plusieurs entreprises indépendantes, chacune avec ses propres collecteurs, clients et données.",
  },
  {
    q: "Comment les commissions des collecteurs sont-elles calculées ?",
    a: "Vous définissez les règles de commissionnement (pourcentage, fixe, paliers) et le système calcule automatiquement les commissions sur chaque collecte.",
  },
  {
    q: "Existe-t-il une application mobile ?",
    a: "Oui, une application mobile Flutter est disponible pour les collecteurs sur le terrain, avec mode offline complet et géolocalisation.",
  },
];

// ─── COMPONENTS ──────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo_collect.png"
            alt="Kimifinance"
            className="h-9 w-9 object-contain shrink-0"
          />
          <div>
            <span className="text-lg font-bold text-gray-900">Kimifinance</span>
            <span className="text-[10px] text-gray-400 ml-2 font-medium">par Kimistack</span>
          </div>    
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-primary-600 transition-colors">Fonctionnalités</a>
          <a href="#how-it-works" className="hover:text-primary-600 transition-colors">Comment ça marche</a>
          <a href="#faq" className="hover:text-primary-600 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={AppRoutes.LOGIN}
            className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors px-4 py-2"
          >
            Se connecter
          </Link>
          <Link
            to={AppRoutes.LOGIN}
            className="text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Commencer
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-32 left-[10%] w-[500px] h-[500px] rounded-full bg-primary-400/10 blur-[100px] animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-20 right-[5%] w-[600px] h-[600px] rounded-full bg-accent-400/10 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8">
            <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/80 font-medium">Mode offline &middot; Multi-entreprise</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight">
            La collecte de{' '}
            <span className="relative">
              <span className="relative z-10">paiements</span>
              <span className="absolute bottom-2 left-0 right-0 h-4 bg-accent-400/30 rounded-sm -z-0" />
            </span>
            <br />
            simplifiée.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed">
            Gérez vos collecteurs, suivez les paiements journaliers et pilotez votre activité
            — même sans connexion internet.
            <span className="text-white font-semibold"> Tout, en temps réel.</span>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to={AppRoutes.LOGIN}
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold text-base px-8 py-4 rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
            >
              Commencer gratuitement
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-medium text-base px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Découvrir les fonctionnalités
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-16 flex items-center gap-6">
            <div className="flex -space-x-3">
              {['#4A154B', '#1264A3', '#2EB886', '#ECB22E', '#E01E5A'].map((color, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-white/60 text-sm">
              <span className="text-white font-semibold">+50 entreprises</span> utilisent Kimifinance
            </p>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-20 relative">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-3 shadow-2xl">
            <div className="bg-gray-900/80 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/90 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white/5 rounded-lg text-xs text-white/40">app.collect.kimistack.com</div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: "Collectes aujourd'hui", value: '47', color: 'bg-primary-500' },
                  { label: 'Montant collecté', value: '2.4M', color: 'bg-accent-500' },
                  { label: 'Collecteurs actifs', value: '12', color: 'bg-amber-500' },
                  { label: 'Clients', value: '348', color: 'bg-primary-500' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 rounded-xl p-4">
                    <div className={`w-8 h-8 ${stat.color} rounded-lg mb-3 opacity-80`} />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/40 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary-600/20 blur-3xl rounded-full" />
        </div>
      </div>
    </section>
  );
}

function Problems() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Le problème</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            La collecte terrain est <span className="text-primary-600">encore archaïque</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Dans la plupart des entreprises de collecte en Afrique, ces problèmes persistent au quotidien.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <span className="text-3xl mb-4 block">{problem.icon}</span>
              <h3 className="text-base font-bold text-gray-900 mb-2">{problem.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{problem.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">La solution</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Kimifinance digitalise entièrement votre processus de collecte de paiements journaliers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4', feature.color)}>
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-20 bg-gradient-to-b from-primary-700 to-primary-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold text-white">{stat.value}</div>
              <div className="mt-2 text-sm font-semibold text-white/80">{stat.label}</div>
              <div className="text-xs text-white/40 mt-1">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Comment ça marche</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Opérationnel en <span className="text-primary-600">4 étapes</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative">
              <div className="text-6xl font-black text-primary-100 mb-4">{step.num}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">FAQ</p>
          <h2 className="mt-3 text-4xl font-extrabold text-gray-900 tracking-tight">
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                <svg
                  className={clsx('w-5 h-5 text-gray-400 shrink-0 transition-transform', openIndex === i && 'rotate-180')}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Prêt à digitaliser vos collectes ?
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
              Rejoignez les entreprises qui utilisent Kimifinance pour suivre leurs paiements journaliers en toute sérénité.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={AppRoutes.LOGIN}
                className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-lg text-base"
              >
                Commencer gratuitement
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/40">Gratuit pendant le lancement &middot; Aucune carte requise</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src="/logo_collect.png"
                alt="Kimifinance"
                className="h-9 w-9 object-contain shrink-0"
              />
              <span className="text-lg font-bold">Kimifinance</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Application de collecte de paiements journaliers par Kimistack.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">Produit</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">Comment ça marche</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">Plateforme</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to={AppRoutes.LOGIN} className="hover:text-white transition-colors">Connexion</Link></li>
              <li><a href="/" className="hover:text-white transition-colors">Kimistack Portal</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">Légal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; 2026 Kimistack. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-600">
            Fait avec passion en Afrique
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── MAIN LANDING PAGE ───────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Problems />
      <Features />
      <Stats />
      <HowItWorks />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
