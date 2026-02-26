import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlineVideoCamera, HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { AppRoutes } from '@/config/routes.config';
import { ApiConfig } from '@/config/api.config';
import { contactApi, type RendezVousRequest } from '@/core/api';
import { useSEO } from '@/hooks/useSEO';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Footer } from '@/pages/LandingPage';

const TYPE_OPTIONS = [
  { value: 'presentiel', label: 'Présentiel (Douala)' },
  { value: 'en_ligne', label: 'En ligne' },
];

const PLATEFORME_OPTIONS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'microsoft_teams', label: 'Microsoft Teams' },
];

/** Créneaux : lun–ven 8h–18h (30 min), sam 8h–12h. Dimanche = aucun. */
function getCreneauxForDate(dateStr: string): { value: string; label: string }[] {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  if (day === 0) return [];
  const isSaturday = day === 6;
  const start = 8;
  const end = isSaturday ? 12 : 18;
  const slots: { value: string; label: string }[] = [];
  for (let h = start; h < end; h++) {
    for (const m of [0, 30]) {
      if (h === end - 1 && m === 30) break;
      const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ value: v, label: `${h}h${m === 0 ? '00' : '30'}` });
    }
  }
  return slots;
}

function isSunday(dateStr: string): boolean {
  return new Date(dateStr + 'T12:00:00').getDay() === 0;
}

function getMinDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ContactPage() {
  useSEO({
    title: 'Contact',
    description: 'Prenez rendez-vous avec Kimifinance — en présentiel à Douala ou en ligne (Zoom, Google Meet, WhatsApp). Demande de rendez-vous en quelques clics.',
  });

  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<import('react-google-recaptcha').ReCAPTCHAInstance | null>(null);
  const [form, setForm] = useState<Partial<RendezVousRequest>>({
    typeRendezVous: 'en_ligne',
    plateforme: 'zoom',
    date: '',
    heure: '',
    nom: '',
    email: '',
    telephone: '',
    nomEntreprise: '',
    lieuResidence: '',
  });

  const recaptchaSiteKey = ApiConfig.recaptchaSiteKey;

  const creneaux = useMemo(
    () => (form.date ? getCreneauxForDate(form.date) : []),
    [form.date],
  );

  const dateError = form.date && isSunday(form.date)
    ? 'Aucun rendez-vous le dimanche. Choisissez un jour en semaine (lun–sam).'
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.heure || !form.nom || !form.email || !form.telephone) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (isSunday(form.date)) {
      toast.error('Les rendez-vous ne sont pas possibles le dimanche.');
      return;
    }
    if (!creneaux.some((c) => c.value === form.heure)) {
      toast.error('Veuillez choisir un créneau valide pour ce jour.');
      return;
    }
    if (form.typeRendezVous === 'en_ligne' && !form.plateforme) {
      toast.error('Veuillez choisir une plateforme pour le rendez-vous en ligne.');
      return;
    }
    const recaptchaToken = recaptchaSiteKey ? recaptchaRef.current?.getValue() : null;
    if (recaptchaSiteKey && !recaptchaToken) {
      toast.error('Veuillez valider le reCAPTCHA.');
      return;
    }

    setLoading(true);
    try {
      const payload: RendezVousRequest = {
        typeRendezVous: form.typeRendezVous!,
        date: form.date!,
        heure: form.heure!,
        nom: form.nom!,
        email: form.email!,
        telephone: form.telephone!,
      };
      if (form.typeRendezVous === 'en_ligne') payload.plateforme = form.plateforme;
      if (form.nomEntreprise) payload.nomEntreprise = form.nomEntreprise;
      if (form.lieuResidence) payload.lieuResidence = form.lieuResidence;
      if (recaptchaToken) payload.recaptchaToken = recaptchaToken;

      const res = await contactApi.rendezVous(payload);
      if (res.sent) {
        toast.success('Votre demande a bien été envoyée. Nous vous recontacterons rapidement.');
        setForm((f) => ({
          ...f,
          date: '',
          heure: '',
          nom: '',
          email: '',
          telephone: '',
          nomEntreprise: '',
          lieuResidence: '',
        }));
        recaptchaRef.current?.reset();
      } else {
        toast.error('L\'envoi a échoué. Réessayez ou contactez-nous par email.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (err as { message?: string })?.message ?? 'Erreur lors de l\'envoi.';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo_collect.png" alt="Kimifinance" className="h-9 w-9 object-contain shrink-0" />
            <span className="text-lg font-bold text-gray-900">Kimifinance</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to={AppRoutes.HOME} className="text-sm font-medium text-gray-600 hover:text-primary-600 px-3 py-2 transition-colors">Accueil</Link>
            <Link to={AppRoutes.LOGIN} className="text-sm font-medium text-gray-600 hover:text-primary-600 px-3 py-2 transition-colors">Connexion</Link>
            <Link to={AppRoutes.REGISTER} className="text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2.5 rounded-xl transition-colors shadow-sm">Commencer</Link>
          </div>
        </div>
      </nav>

      {/* Formulaire à gauche, bloc Prendre rendez-vous + image à droite */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-white to-accent-500/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-stretch gap-10 lg:gap-12">
             {/* Droite : bloc Prendre rendez-vous + image */}
             <div className="flex-1 min-w-0 lg:max-w-xl order-2 lg:order-1">
              <div className="text-center lg:text-left">
              <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider">Contact</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Prenez rendez-vous avec nous
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-xl">
                En présentiel à Douala ou en ligne (Zoom, Google Meet, WhatsApp). Choisissez le jour et l’heure qui vous conviennent.
              </p>
              <ul className="mt-6 space-y-3 text-gray-600">
                <li className="flex items-center gap-2 justify-center lg:justify-start">
                  <HiOutlineCalendar className="h-5 w-5 text-primary-500 shrink-0" />
                  <span>Lundi–vendredi 8h–18h · Samedi 8h–12h</span>
                </li>
                <li className="flex items-center gap-2 justify-center lg:justify-start">
                  <HiOutlineVideoCamera className="h-5 w-5 text-primary-500 shrink-0" />
                  <span>Rendez-vous en ligne ou sur place</span>
                </li>
              </ul>
              </div>
              <div className="flex-shrink-0 w-full max-w-md mt-6">
                <img
                  src="/contact.avif"
                  alt="Équipe et rendez-vous"
                  className="rounded-2xl shadow-xl w-full h-64 object-cover"
                />
              </div>
            </div>
            {/* Gauche : formulaire */}
            <div className="flex-1 flex flex-col gap-6 order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <HiOutlineBuildingOffice2 className="h-6 w-6 text-primary-500" />
              Demande de rendez-vous
            </h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Type de rendez-vous"
                  value={form.typeRendezVous ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, typeRendezVous: e.target.value as 'presentiel' | 'en_ligne' }))}
                  options={TYPE_OPTIONS}
                />
                {form.typeRendezVous === 'en_ligne' ? (
                  <Select
                    label="Plateforme"
                    value={form.plateforme ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, plateforme: e.target.value as 'zoom' | 'google_meet' | 'whatsapp' }))}
                    options={PLATEFORME_OPTIONS}
                  />
                ) : (
                  <div />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date souhaitée"
                  type="date"
                  min={getMinDate()}
                  value={form.date ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, heure: '' }))}
                  error={dateError ?? undefined}
                />
                <Select
                  label="Créneau horaire"
                  value={form.heure ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, heure: e.target.value }))}
                  options={[{ value: '', label: form.date ? 'Choisir…' : 'Choisir d\'abord une date' }, ...creneaux]}
                  disabled={!form.date || creneaux.length === 0}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nom complet"
                  required
                  value={form.nom ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  placeholder="Jean Dupont"
                />
                <Input
                  label="Adresse email"
                  type="email"
                  required
                  value={form.email ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jean@example.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PhoneInput
                  label="Téléphone"
                  required
                  value={form.telephone ?? ''}
                  onChange={(e164) => setForm((f) => ({ ...f, telephone: e164 }))}
                  placeholder="6 57 78 05 96"
                />
                <Input
                  label="Nom de l'entreprise (optionnel)"
                  value={form.nomEntreprise ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nomEntreprise: e.target.value }))}
                  placeholder="Ma Microfinance SARL"
                />
              </div>

              <Input
                label="Lieu de résidence (optionnel)"
                value={form.lieuResidence ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, lieuResidence: e.target.value }))}
                placeholder="Douala, Akwa"
              />

              {recaptchaSiteKey ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Vérification de sécurité</p>
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={recaptchaSiteKey}
                    theme="light"
                    size="normal"
                  />
                </div>
              ) : (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  reCAPTCHA non configuré (définir VITE_RECAPTCHA_SITE_KEY). Le formulaire peut être soumis sans vérification.
                </p>
              )}

              <div className="pt-2">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? 'Envoi en cours…' : 'Envoyer la demande'}
                </Button>
              </div>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
              Vous serez recontacté par notre équipe pour confirmer le rendez-vous.
            </p>
          </div>
            </div>
           
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <Footer />
    </div>
  );
}
