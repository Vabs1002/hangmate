import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  storageApi,
  type Registration,
  type Match,
  GENDER_OPTIONS,
  YEAR_OPTIONS,
} from '@/lib/storage';
import { navigate } from '@/App';
import {
  Check,
  Copy,
  Download,
  Heart,
  Link2,
  Lock,
  Mail,
  Music,
  Search,
  Sparkles,
  Users,
  UserPlus,
  UserMinus,
  X,
} from 'lucide-react';

// PASSCODE CONFIGURED AS REQUESTED
const COORDINATOR_PASSCODE = 'tinku696867';

type MatchWithPeers = Match & {
  peer1?: Registration;
  peer2?: Registration;
};

export default function CoordinatorConsole() {
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<MatchWithPeers[]>([]);
  const [loading, setLoading] = useState(true);

  const [slotA, setSlotA] = useState<Registration | null>(null);
  const [slotB, setSlotB] = useState<Registration | null>(null);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [unmatchedOnly, setUnmatchedOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [regs, mList] = await Promise.all([
      storageApi.getRegistrations(),
      storageApi.getMatches(),
    ]);

    const populated: MatchWithPeers[] = mList.map((m) => ({
      ...m,
      peer1: regs.find((r) => r.id === m.peer1_id),
      peer2: regs.find((r) => r.id === m.peer2_id),
    }));

    setRegistrations(regs);
    setMatches(populated);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchData();
  }, [authed, fetchData]);

  const matchedIds = useMemo(() => {
    const ids = new Set<string>();
    matches.forEach((m) => {
      ids.add(m.peer1_id);
      ids.add(m.peer2_id);
    });
    return ids;
  }, [matches]);

  const unmatchedCount = useMemo(
    () => registrations.filter((r) => !matchedIds.has(r.id)).length,
    [registrations, matchedIds]
  );

  const filteredPool = useMemo(() => {
    return registrations.filter((r) => {
      if (unmatchedOnly && matchedIds.has(r.id)) return false;
      if (genderFilter && r.gender !== genderFilter) return false;
      if (yearFilter && r.year_of_study !== yearFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const inName = r.full_name.toLowerCase().includes(q);
        const inInsta = r.instagram_handle.toLowerCase().includes(q);
        const inMusic = r.music_tastes.some((m) => m.toLowerCase().includes(q));
        const inHobby = r.hobbies.some((h) => h.toLowerCase().includes(q));
        if (!inName && !inInsta && !inMusic && !inHobby) return false;
      }
      return true;
    });
  }, [registrations, unmatchedOnly, genderFilter, yearFilter, search, matchedIds]);

  const handleStudentClick = (student: Registration) => {
    if (slotA?.id === student.id) {
      setSlotA(null);
      return;
    }
    if (slotB?.id === student.id) {
      setSlotB(null);
      return;
    }
    if (!slotA) {
      setSlotA(student);
    } else if (!slotB) {
      setSlotB(student);
    } else {
      setSlotA(student);
      setSlotB(null);
    }
  };

  const confirmPair = async () => {
    if (!slotA || !slotB) return;
    await storageApi.pair(slotA.id, slotB.id);
    setSlotA(null);
    setSlotB(null);
    fetchData();
  };

  const unpair = async (matchId: string) => {
    await storageApi.unpair(matchId);
    fetchData();
  };

  const exportCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Instagram',
      'Gender',
      'Year',
      'Music',
      'Hobbies',
      'Personality',
      'Status',
      'Registered At',
    ];
    const rows = registrations.map((r) => [
      r.full_name,
      r.email,
      r.phone || '',
      `@${r.instagram_handle}`,
      r.gender,
      r.year_of_study,
      r.music_tastes.join('; '),
      r.hobbies.join('; '),
      r.personality,
      matchedIds.has(r.id) ? 'matched' : 'unmatched',
      new Date(r.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hangmate-registrations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildMatchSummary = (peer: Registration, other: Registration): string => {
    return `🤙 HANGMATE MATCH ANNOUNCEMENT 🤙

Hi ${peer.full_name}!

Great news — you've been matched on HangMate! Here's your peer buddy:

  Name: ${other.full_name}
  Email: ${other.email}
  Instagram: @${other.instagram_handle}${other.phone ? `\n  Phone/WhatsApp: ${other.phone}` : ''}

  Year: ${other.year_of_study}
  Personality: ${other.personality}
  Music: ${other.music_tastes.join(', ') || 'N/A'}
  Hobbies: ${other.hobbies.join(', ') || 'N/A'}

Reach out and say hi! 🎉

— HangMate Campus Connection Network`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openMailto = (peer: Registration, other: Registration) => {
    const subject = encodeURIComponent(`🤙 Your HangMate Match: ${other.full_name}!`);
    const body = encodeURIComponent(buildMatchSummary(peer, other));
    window.location.href = `mailto:${peer.email}?subject=${subject}&body=${body}`;
  };

  const compatibilityScore = (a: Registration, b: Registration): number => {
    let score = 0;
    const sharedMusic = a.music_tastes.filter((m) => b.music_tastes.includes(m)).length;
    score += sharedMusic * 15;
    const sharedHobbies = a.hobbies.filter((h) => b.hobbies.includes(h)).length;
    score += sharedHobbies * 15;
    if (a.year_of_study === b.year_of_study) score += 10;
    if (a.personality === b.personality) score += 10;
    return Math.min(score, 100);
  };

  // Passcode gate (Password: tinku696867)
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-violet-500/5 to-amber-400/5" />
        <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-violet-500/20">
              <Lock className="h-7 w-7 text-rose-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Coordinator Access</h1>
            <p className="mt-1 text-sm text-slate-500">Enter passcode to continue</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (passcode === COORDINATOR_PASSCODE) {
                setAuthed(true);
              } else {
                setPasscodeError(true);
              }
            }}
          >
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setPasscodeError(false);
              }}
              placeholder="Enter passcode..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-center text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            />
            {passcodeError && (
              <p className="mt-2 text-center text-xs text-rose-400">Incorrect passcode. Try again.</p>
            )}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
            >
              Unlock Console
            </button>
          </form>
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full text-center text-xs text-slate-600 transition hover:text-slate-400 cursor-pointer"
          >
            ← Back to registration
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500">Loading coordinator console...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white pb-16">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-violet-500">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">HangMate Coordinator</h1>
              <p className="text-xs text-slate-500">Pairing Console</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 transition hover:text-slate-300 cursor-pointer"
          >
            ← Public Registration
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6 space-y-6">
        {/* Metrics Bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <MetricCard
            icon={<Users className="h-5 w-5" />}
            label="Total Participants"
            value={registrations.length}
            color="violet"
          />
          <MetricCard
            icon={<UserPlus className="h-5 w-5" />}
            label="Unmatched Pool"
            value={unmatchedCount}
            color="amber"
          />
          <MetricCard
            icon={<Heart className="h-5 w-5" />}
            label="Completed Matches"
            value={matches.length}
            color="rose"
          />
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/50 px-4 py-4 text-sm font-medium text-slate-300 transition hover:border-violet-500 hover:text-violet-300 cursor-pointer"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        </div>

        {/* Pairing Workbench */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Link2 className="h-5 w-5 text-rose-500" />
            Manual Pairing Workbench
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Slot A */}
            <SlotCard
              label="Slot A: Peer 1"
              student={slotA}
              color="rose"
              onClear={() => setSlotA(null)}
            />
            {/* Slot B */}
            <SlotCard
              label="Slot B: Peer 2"
              student={slotB}
              color="violet"
              onClear={() => setSlotB(null)}
            />
          </div>

          {/* Compatibility Summary */}
          {slotA && slotB && (
            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-800/30 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Compatibility Summary
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all"
                      style={{ width: `${compatibilityScore(slotA, slotB)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-200">
                    {compatibilityScore(slotA, slotB)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Music comparison */}
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Music className="h-3.5 w-3.5" /> Music
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="mb-1 text-[10px] text-rose-400">{slotA.full_name.split(' ')[0]}</p>
                      <div className="flex flex-wrap gap-1">
                        {slotA.music_tastes.map((m) => (
                          <span
                            key={m}
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              slotB.music_tastes.includes(m)
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] text-violet-400">{slotB.full_name.split(' ')[0]}</p>
                      <div className="flex flex-wrap gap-1">
                        {slotB.music_tastes.map((m) => (
                          <span
                            key={m}
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              slotA.music_tastes.includes(m)
                                ? 'bg-violet-500/20 text-violet-300'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hobbies comparison */}
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Sparkles className="h-3.5 w-3.5" /> Hobbies
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="mb-1 text-[10px] text-rose-400">{slotA.full_name.split(' ')[0]}</p>
                      <div className="flex flex-wrap gap-1">
                        {slotA.hobbies.map((h) => (
                          <span
                            key={h}
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              slotB.hobbies.includes(h)
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] text-violet-400">{slotB.full_name.split(' ')[0]}</p>
                      <div className="flex flex-wrap gap-1">
                        {slotB.hobbies.map((h) => (
                          <span
                            key={h}
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              slotA.hobbies.includes(h)
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Year & Personality */}
                <div className="col-span-1 grid grid-cols-2 gap-4 sm:col-span-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Year of Study
                    </h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className={slotA.year_of_study === slotB.year_of_study ? 'text-rose-300' : 'text-slate-400'}>
                        {slotA.year_of_study}
                      </span>
                      <span className="text-slate-600">vs</span>
                      <span className={slotA.year_of_study === slotB.year_of_study ? 'text-violet-300' : 'text-slate-400'}>
                        {slotB.year_of_study}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Personality
                    </h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className={slotA.personality === slotB.personality ? 'text-rose-300' : 'text-slate-400'}>
                        {slotA.personality}
                      </span>
                      <span className="text-slate-600">vs</span>
                      <span className={slotA.personality === slotB.personality ? 'text-violet-300' : 'text-slate-400'}>
                        {slotB.personality}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={confirmPair}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-rose-500 via-violet-500 to-amber-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/40 cursor-pointer"
              >
                Confirm Pair 💖
              </button>
            </div>
          )}
        </div>

        {/* Student Pool */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="mb-4 flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-violet-500" />
              Available Student Pool
            </h2>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, Instagram, music, or hobby..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 outline-none focus:border-violet-500"
              >
                <option value="">All Genders</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.emoji} {g.label}
                  </option>
                ))}
              </select>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 outline-none focus:border-violet-500"
              >
                <option value="">All Years</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={unmatchedOnly}
                  onChange={(e) => setUnmatchedOnly(e.target.checked)}
                  className="h-3.5 w-3.5 accent-violet-500"
                />
                Unmatched Only
              </label>
            </div>
          </div>

          {/* Student Cards */}
          {filteredPool.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No students match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPool.map((student) => {
                const isSelected = slotA?.id === student.id || slotB?.id === student.id;
                const isMatched = matchedIds.has(student.id);
                return (
                  <div
                    key={student.id}
                    className={`rounded-xl border p-4 transition ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10'
                        : isMatched
                        ? 'border-slate-800 bg-slate-900/30 opacity-50'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">{student.full_name}</h3>
                        <p className="text-xs text-slate-500">@{student.instagram_handle}</p>
                      </div>
                      {isMatched && (
                        <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-400">
                          Matched
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-400">
                        {student.gender}
                      </span>
                      <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-400">
                        {student.year_of_study}
                      </span>
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
                        {student.personality}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {student.music_tastes.slice(0, 4).map((m) => (
                        <span
                          key={m}
                          className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {student.hobbies.slice(0, 4).map((h) => (
                        <span
                          key={h}
                          className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleStudentClick(student)}
                      disabled={isMatched}
                      className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500/20 text-rose-300'
                          : isMatched
                          ? 'cursor-not-allowed bg-slate-800/50 text-slate-600'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-violet-500/20 hover:text-violet-300'
                      }`}
                    >
                      {isSelected ? 'Selected ✓' : isMatched ? 'Already matched' : 'Select for Match'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmed Matches */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Heart className="h-5 w-5 text-rose-500" />
            Confirmed Matches
            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">
              {matches.length}
            </span>
          </h2>

          {matches.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matches confirmed yet. Use the workbench above to pair students.
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => {
                const p1 = match.peer1;
                const p2 = match.peer2;
                if (!p1 || !p2) return null;
                return (
                  <div
                    key={match.id}
                    className="rounded-xl border border-slate-700 bg-slate-800/30 p-4"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Peer 1 */}
                      <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                        <p className="text-sm font-semibold text-slate-100">{p1.full_name}</p>
                        <p className="text-xs text-slate-500">@{p1.instagram_handle}</p>
                        <p className="mt-1 text-xs text-slate-500">{p1.email}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-400">
                            {p1.year_of_study}
                          </span>
                          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
                            {p1.personality}
                          </span>
                        </div>
                      </div>
                      {/* Peer 2 */}
                      <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                        <p className="text-sm font-semibold text-slate-100">{p2.full_name}</p>
                        <p className="text-xs text-slate-500">@{p2.instagram_handle}</p>
                        <p className="mt-1 text-xs text-slate-500">{p2.email}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-400">
                            {p2.year_of_study}
                          </span>
                          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
                            {p2.personality}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions for manual email sending */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => copyToClipboard(buildMatchSummary(p1, p2), `${match.id}-p1`)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-rose-500 hover:text-rose-300 cursor-pointer"
                      >
                        {copiedId === `${match.id}-p1` ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy Summary for {p1.full_name.split(' ')[0]}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(buildMatchSummary(p2, p1), `${match.id}-p2`)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-500 hover:text-violet-300 cursor-pointer"
                      >
                        {copiedId === `${match.id}-p2` ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy Summary for {p2.full_name.split(' ')[0]}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => openMailto(p1, p2)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email {p1.full_name.split(' ')[0]}
                      </button>
                      <button
                        onClick={() => openMailto(p2, p1)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email {p2.full_name.split(' ')[0]}
                      </button>
                      <button
                        onClick={() => unpair(match.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20 cursor-pointer"
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Unpair
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'violet' | 'amber' | 'rose';
}) {
  const colors = {
    violet: 'border-violet-500/20 bg-violet-500/5 text-violet-400',
    amber: 'border-amber-400/20 bg-amber-400/5 text-amber-400',
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
    </div>
  );
}

function SlotCard({
  label,
  student,
  color,
  onClear,
}: {
  label: string;
  student: Registration | null;
  color: 'rose' | 'violet';
  onClear: () => void;
}) {
  const borderColor = color === 'rose' ? 'border-rose-500/30' : 'border-violet-500/30';
  const bgColor = color === 'rose' ? 'bg-rose-500/5' : 'bg-violet-500/5';
  const accentColor = color === 'rose' ? 'text-rose-400' : 'text-violet-400';

  if (!student) {
    return (
      <div className={`rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/20 p-6 text-center`}>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-3 text-sm text-slate-600">Click a student from the pool below</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${accentColor}`}>{label}</p>
          <h3 className="mt-2 text-base font-semibold text-slate-100">{student.full_name}</h3>
          <p className="text-xs text-slate-500">@{student.instagram_handle}</p>
        </div>
        <button onClick={onClear} className="text-slate-500 transition hover:text-slate-300 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-400">
          {student.gender}
        </span>
        <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[10px] text-slate-400">
          {student.year_of_study}
        </span>
        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
          {student.personality}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {student.music_tastes.map((m) => (
          <span key={m} className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
            {m}
          </span>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {student.hobbies.map((h) => (
          <span key={h} className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-300">
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}
