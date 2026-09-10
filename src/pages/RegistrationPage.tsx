import { useState } from 'react';
import {
  MUSIC_OPTIONS,
  HOBBY_OPTIONS,
  PERSONALITY_OPTIONS,
  GENDER_OPTIONS,
  YEAR_OPTIONS,
  storageApi,
  type Gender,
  type YearOfStudy,
  type Personality,
} from '@/lib/storage';
import { Check, Lock, Music, Sparkles, X } from 'lucide-react';

export default function RegistrationPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [year, setYear] = useState<YearOfStudy | ''>('');
  const [music, setMusic] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [personality, setPersonality] = useState<Personality | ''>('');
  const [musicText, setMusicText] = useState('');
  const [hobbyText, setHobbyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !instagram || !gender || !year || !personality) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const allMusic = [...music];
    if (musicText.trim()) allMusic.push(...musicText.split(',').map((s) => s.trim()).filter(Boolean));

    const allHobbies = [...hobbies];
    if (hobbyText.trim())
      allHobbies.push(...hobbyText.split(',').map((s) => s.trim()).filter(Boolean));

    const { error: insertError } = await storageApi.register({
      full_name: fullName,
      email,
      phone: phone || null,
      instagram_handle: instagram,
      gender: gender as Gender,
      year_of_study: year as YearOfStudy,
      music_tastes: allMusic,
      hobbies: allHobbies,
      personality: personality as Personality,
    });

    setSubmitting(false);

    if (insertError) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setShowModal(true);
    setFullName('');
    setEmail('');
    setPhone('');
    setInstagram('');
    setGender('');
    setYear('');
    setMusic([]);
    setHobbies([]);
    setPersonality('');
    setMusicText('');
    setHobbyText('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-violet-500/10 to-amber-400/10" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl px-5 py-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-rose-500 via-violet-500 to-amber-400 bg-clip-text text-transparent">
              HangMate
            </span>{' '}
            <span className="text-3xl sm:text-4xl">🤙</span>
          </h1>
          <p className="mt-3 text-base text-slate-400 sm:text-lg">
            Find college friends with shared music tastes, hobbies, and campus vibes.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        {/* Privacy Banner */}
        <div className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
          <div className="flex items-center gap-2 text-amber-400">
            <Lock className="h-5 w-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Privacy Guarantee</h2>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-200">
            THIS INFO WON'T BE SHARED WITH ANYONE ELSE. FEEL FREE.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Your contact details are only shared directly with your assigned peer match.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Your Details
            </h3>

            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com (Any email is fine)"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">Where your match announcement will be sent</p>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Phone / WhatsApp Number <span className="text-slate-600">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Instagram Handle <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/50 transition focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20">
                <span className="pl-4 pr-1 text-slate-500">@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace(/^@/, ''))}
                  placeholder="your_handle"
                  className="w-full rounded-r-xl bg-transparent py-3 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Gender <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={`rounded-xl border px-3 py-3 text-center text-sm font-medium transition ${
                      gender === g.value
                        ? 'border-rose-500 bg-rose-500/15 text-rose-300'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="block text-xl">{g.emoji}</span>
                    <span className="mt-1 block">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Year of Study */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Year of Study <span className="text-rose-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value as YearOfStudy)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="">Select year...</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Music Taste */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                <Music className="mr-1 inline h-4 w-4 text-violet-500" />
                Music Taste <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {MUSIC_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleChip(m, music, setMusic)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      music.includes(m)
                        ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={musicText}
                onChange={(e) => setMusicText(e.target.value)}
                placeholder="Add other genres (comma-separated)..."
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Hobbies */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Hobbies & Interests <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {HOBBY_OPTIONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleChip(h, hobbies, setHobbies)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      hobbies.includes(h)
                        ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={hobbyText}
                onChange={(e) => setHobbyText(e.target.value)}
                placeholder="Add other hobbies (comma-separated)..."
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            {/* Personality */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Personality Style <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PERSONALITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPersonality(p.value)}
                    className={`rounded-xl border p-3 text-center transition ${
                      personality === p.value
                        ? 'border-rose-500 bg-rose-500/15'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <span className="block text-2xl">{p.emoji}</span>
                    <span
                      className={`mt-1 block text-sm font-medium ${
                        personality === p.value ? 'text-rose-300' : 'text-slate-400'
                      }`}
                    >
                      {p.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-slate-500">
                      {p.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-violet-500 to-amber-400 px-6 py-4 text-base font-bold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Finding your match...' : 'Find My HangMate 🤙'}
          </button>
        </form>

        {/* Clean Footer (Zero Bolt logo) */}
        <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
          HangMate © 2026 • Campus Connection Network
        </footer>
      </main>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-500 transition hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-violet-500/20">
              <Check className="h-8 w-8 text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Registration received! 🎉</h2>
            <p className="mt-3 text-sm text-slate-400">
              Peer matching is in progress. Check your email inbox for your match announcement! 🤙
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
