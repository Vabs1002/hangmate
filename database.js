const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      students: [],
      matches: [],
      emailLogs: [],
      settings: {
        eventTitle: 'HangMate 2026',
        disclaimer: "THIS INFO WON'T BE SHARED WITH ANYONE ELSE. FEEL FREE."
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning fallback empty structure:', err);
    return { students: [], matches: [], emailLogs: [], settings: {} };
  }
}

function saveDatabase(data) {
  try {
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// Student operations
function getAllStudents() {
  const db = loadDatabase();
  return db.students;
}

function getStudentById(id) {
  const db = loadDatabase();
  return db.students.find(s => s.id === id) || null;
}

function addStudent(studentData) {
  const db = loadDatabase();
  
  // Check if email already registered
  const existing = db.students.find(s => s.email.toLowerCase() === studentData.email.toLowerCase().trim());
  if (existing) {
    throw new Error('This email address has already been registered!');
  }

  const newStudent = {
    id: 'std_' + crypto.randomBytes(6).toString('hex'),
    name: studentData.name.trim(),
    email: studentData.email.toLowerCase().trim(),
    phone: studentData.phone ? studentData.phone.trim() : '',
    insta: studentData.insta ? studentData.insta.trim().replace(/^@/, '') : '',
    gender: studentData.gender,
    year: studentData.year,
    musicTaste: studentData.musicTaste ? studentData.musicTaste.trim() : '',
    hobbies: studentData.hobbies ? studentData.hobbies.trim() : '',
    personality: studentData.personality || 'Ambivert',
    isMatched: false,
    matchedWithId: null,
    createdAt: new Date().toISOString()
  };

  db.students.push(newStudent);
  saveDatabase(db);
  return newStudent;
}

function deleteStudent(id) {
  const db = loadDatabase();
  // Unpair if matched
  const student = db.students.find(s => s.id === id);
  if (student && student.isMatched) {
    unpairByStudentId(id);
  }
  const updatedDb = loadDatabase();
  updatedDb.students = updatedDb.students.filter(s => s.id !== id);
  saveDatabase(updatedDb);
  return true;
}

// Match operations
function getAllMatches() {
  const db = loadDatabase();
  return db.matches.map(m => {
    const s1 = db.students.find(s => s.id === m.student1Id) || { name: 'Unknown', email: '' };
    const s2 = db.students.find(s => s.id === m.student2Id) || { name: 'Unknown', email: '' };
    return {
      ...m,
      student1: s1,
      student2: s2
    };
  });
}

function createManualPair(student1Id, student2Id) {
  if (student1Id === student2Id) {
    throw new Error('Cannot pair a student with themselves!');
  }

  const db = loadDatabase();
  const s1 = db.students.find(s => s.id === student1Id);
  const s2 = db.students.find(s => s.id === student2Id);

  if (!s1 || !s2) {
    throw new Error('One or both students not found.');
  }

  if (s1.isMatched || s2.isMatched) {
    throw new Error('One of these students is already matched. Unpair them first.');
  }

  const matchId = 'mtch_' + crypto.randomBytes(6).toString('hex');
  const newMatch = {
    id: matchId,
    student1Id: s1.id,
    student2Id: s2.id,
    emailSent: false,
    sentAt: null,
    emailLogs: [],
    createdAt: new Date().toISOString()
  };

  s1.isMatched = true;
  s1.matchedWithId = s2.id;
  s2.isMatched = true;
  s2.matchedWithId = s1.id;

  db.matches.unshift(newMatch);
  saveDatabase(db);

  return {
    ...newMatch,
    student1: s1,
    student2: s2
  };
}

function unpairMatch(matchId) {
  const db = loadDatabase();
  const matchIndex = db.matches.findIndex(m => m.id === matchId);
  if (matchIndex === -1) {
    throw new Error('Match not found.');
  }

  const match = db.matches[matchIndex];
  const s1 = db.students.find(s => s.id === match.student1Id);
  const s2 = db.students.find(s => s.id === match.student2Id);

  if (s1) {
    s1.isMatched = false;
    s1.matchedWithId = null;
  }
  if (s2) {
    s2.isMatched = false;
    s2.matchedWithId = null;
  }

  db.matches.splice(matchIndex, 1);
  saveDatabase(db);
  return true;
}

function unpairByStudentId(studentId) {
  const db = loadDatabase();
  const match = db.matches.find(m => m.student1Id === studentId || m.student2Id === studentId);
  if (match) {
    return unpairMatch(match.id);
  }
  return false;
}

function updateMatchEmailStatus(matchId, statusDetails) {
  const db = loadDatabase();
  const match = db.matches.find(m => m.id === matchId);
  if (match) {
    match.emailSent = true;
    match.sentAt = new Date().toISOString();
    match.emailLogs.push(statusDetails);
    saveDatabase(db);
  }
}

function getStats() {
  const db = loadDatabase();
  const total = db.students.length;
  const matched = db.students.filter(s => s.isMatched).length;
  const unmatched = total - matched;
  const maleCount = db.students.filter(s => (s.gender || '').toLowerCase() === 'male').length;
  const femaleCount = db.students.filter(s => (s.gender || '').toLowerCase() === 'female').length;
  const otherCount = total - (maleCount + femaleCount);
  const matchesCount = db.matches.length;
  const emailsSentCount = db.matches.filter(m => m.emailSent).length;

  return {
    totalStudents: total,
    matchedStudents: matched,
    unmatchedStudents: unmatched,
    maleCount,
    femaleCount,
    otherCount,
    matchesCount,
    emailsSentCount
  };
}

module.exports = {
  loadDatabase,
  getAllStudents,
  getStudentById,
  addStudent,
  deleteStudent,
  getAllMatches,
  createManualPair,
  unpairMatch,
  updateMatchEmailStatus,
  getStats
};
