// HangMate Storage Engine (Synced with Google Sheets)
export const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbx-h56L-dnNuY4AlbExUy88TOrEkbPpuC2x3GJcicRu9Bcf_03sdq2GN8JGTY4kAX99-Q/exec';

export type Gender = 'Male' | 'Female' | 'Other';
export type YearOfStudy = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'Postgraduate / Masters';
export type Personality = 'Introvert' | 'Ambivert' | 'Extrovert';

export interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  instagram_handle: string;
  gender: Gender;
  year_of_study: YearOfStudy;
  music_tastes: string[];
  hobbies: string[];
  personality: Personality;
  created_at: string;
}

export interface Match {
  id: string;
  peer1_id: string;
  peer2_id: string;
  created_at: string;
}

export const GENDER_OPTIONS: { value: Gender; label: string; emoji: string }[] = [
  { value: 'Male', label: 'Male', emoji: '👨' },
  { value: 'Female', label: 'Female', emoji: '👩' },
  { value: 'Other', label: 'Other', emoji: '✨' },
];

export const YEAR_OPTIONS: YearOfStudy[] = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Postgraduate / Masters',
];

export const MUSIC_OPTIONS = [
  'Hip-Hop',
  'Pop',
  'Indie',
  'Rock',
  'Bollywood',
  'Punjabi',
  'EDM',
  'R&B',
  'K-Pop',
];

export const HOBBY_OPTIONS = [
  'Gaming',
  'Gym',
  'Movies',
  'Cafes',
  'Photography',
  'Reading',
  'Coding',
];

export const PERSONALITY_OPTIONS: { value: Personality; label: string; emoji: string; desc: string }[] = [
  { value: 'Introvert', label: 'Introvert', emoji: '🧘', desc: 'Chill & quiet' },
  { value: 'Ambivert', label: 'Ambivert', emoji: '🌿', desc: 'Best of both' },
  { value: 'Extrovert', label: 'Extrovert', emoji: '⚡', desc: 'High energy' },
];

const INITIAL_SAMPLE_DATA: Registration[] = [
  {
    id: 'reg_1',
    full_name: 'Aarav Patel',
    email: 'aarav.patel@gmail.com',
    phone: '+91 98234 12345',
    instagram_handle: 'aarav_vibes',
    gender: 'Male',
    year_of_study: '2nd Year',
    music_tastes: ['Hip-Hop', 'Pop'],
    hobbies: ['Gaming', 'Gym'],
    personality: 'Extrovert',
    created_at: new Date().toISOString()
  },
  {
    id: 'reg_2',
    full_name: 'Diya Sharma',
    email: 'diya.sharma@gmail.com',
    phone: '+91 98765 01234',
    instagram_handle: 'diya_lens',
    gender: 'Female',
    year_of_study: '2nd Year',
    music_tastes: ['Indie', 'Pop'],
    hobbies: ['Cafes', 'Photography', 'Reading'],
    personality: 'Introvert',
    created_at: new Date().toISOString()
  },
  {
    id: 'reg_3',
    full_name: 'Rohan Varma',
    email: 'rohan.v@gmail.com',
    phone: '+91 91234 56789',
    instagram_handle: 'rohan_rock',
    gender: 'Male',
    year_of_study: '3rd Year',
    music_tastes: ['Rock', 'Indie'],
    hobbies: ['Gym', 'Coding'],
    personality: 'Ambivert',
    created_at: new Date().toISOString()
  },
  {
    id: 'reg_4',
    full_name: 'Ananya Iyer',
    email: 'ananya.iyer@gmail.com',
    phone: '+91 97654 32100',
    instagram_handle: 'ananya_clicks',
    gender: 'Female',
    year_of_study: '3rd Year',
    music_tastes: ['Rock', 'R&B'],
    hobbies: ['Cafes', 'Reading'],
    personality: 'Introvert',
    created_at: new Date().toISOString()
  }
];

function getStoredRegistrations(): Registration[] {
  const raw = localStorage.getItem('hangmate_registrations');
  if (!raw) {
    localStorage.setItem('hangmate_registrations', JSON.stringify(INITIAL_SAMPLE_DATA));
    return INITIAL_SAMPLE_DATA;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_DATA;
  }
}

function getStoredMatches(): Match[] {
  const raw = localStorage.getItem('hangmate_matches');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const storageApi = {
  async register(student: Omit<Registration, 'id' | 'created_at'>) {
    const id = 'reg_' + Math.random().toString(36).substring(2, 9);
    const safePhone = student.phone ? (student.phone.startsWith('+') ? "'" + student.phone : student.phone) : '';
    const newStudent: Registration = {
      ...student,
      phone: student.phone || '',
      id,
      created_at: new Date().toISOString()
    };

    // Save to local storage
    const list = getStoredRegistrations();
    list.unshift(newStudent);
    localStorage.setItem('hangmate_registrations', JSON.stringify(list));

    // Sync to your Google Sheet
    if (GOOGLE_SHEET_URL) {
      try {
        const payload = {
          ...newStudent,
          phone: safePhone
        };
        fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', registration: payload })
        }).catch(err => console.warn('Google Sheet sync background:', err));
      } catch (err) {
        console.warn('Google Sheet sync error:', err);
      }
    }

    return { data: newStudent, error: null };
  },

  async getRegistrations(): Promise<Registration[]> {
    if (GOOGLE_SHEET_URL) {
      try {
        const res = await fetch(GOOGLE_SHEET_URL);
        const data = await res.json();
        if (data.registrations && Array.isArray(data.registrations) && data.registrations.length > 0) {
          localStorage.setItem('hangmate_registrations', JSON.stringify(data.registrations));
          return data.registrations;
        }
      } catch (e) {
        console.warn('Using local cache data:', e);
      }
    }
    return getStoredRegistrations();
  },

  async getMatches(): Promise<Match[]> {
    if (GOOGLE_SHEET_URL) {
      try {
        const res = await fetch(GOOGLE_SHEET_URL);
        const data = await res.json();
        if (data.matches && Array.isArray(data.matches)) {
          localStorage.setItem('hangmate_matches', JSON.stringify(data.matches));
          return data.matches;
        }
      } catch (e) {
        console.warn('Using local cache data:', e);
      }
    }
    return getStoredMatches();
  },

  async pair(peer1_id: string, peer2_id: string) {
    const matchId = 'mtch_' + Math.random().toString(36).substring(2, 9);
    const newMatch: Match = {
      id: matchId,
      peer1_id,
      peer2_id,
      created_at: new Date().toISOString()
    };

    const matches = getStoredMatches();
    matches.unshift(newMatch);
    localStorage.setItem('hangmate_matches', JSON.stringify(matches));

    if (GOOGLE_SHEET_URL) {
      try {
        fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action: 'pair', matchId, peer1_id, peer2_id })
        }).catch(() => {});
      } catch {}
    }

    return { data: newMatch, error: null };
  },

  async unpair(matchId: string) {
    let matches = getStoredMatches();
    matches = matches.filter(m => m.id !== matchId);
    localStorage.setItem('hangmate_matches', JSON.stringify(matches));

    if (GOOGLE_SHEET_URL) {
      try {
        fetch(GOOGLE_SHEET_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action: 'unpair', matchId })
        }).catch(() => {});
      } catch {}
    }

    return { error: null };
  }
};
