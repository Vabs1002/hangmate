const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./database');
const { sendMatchEmails, buildEmailHtml } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tinku696867';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Admin authentication middleware
function requireAdminAuth(req, res, next) {
  const token = req.headers['x-admin-password'] || req.query.adminKey;
  if (!token || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Password' });
  }
  next();
}

// ==================== PUBLIC STUDENT ROUTES ====================

// Register new student
app.post('/api/register', (req, res) => {
  try {
    const { name, email, phone, insta, gender, year, musicTaste, hobbies, personality } = req.body;

    if (!name || !email || !gender || !year) {
      return res.status(400).json({ success: false, error: 'Please fill in all required fields (Name, Email, Gender, Year).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const newStudent = db.addStudent({
      name,
      email,
      phone,
      insta,
      gender,
      year,
      musicTaste,
      hobbies,
      personality
    });

    res.json({
      success: true,
      message: 'Registration successful! Watch your email for match announcements!',
      student: { id: newStudent.id, name: newStudent.name }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== ADMIN PORTAL ROUTES ====================

// Verify admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Authenticated successfully' });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect Admin Password' });
  }
});

// Get dashboard statistics
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get list of students with filters
app.get('/api/admin/students', requireAdminAuth, (req, res) => {
  try {
    let students = db.getAllStudents();
    const { search, gender, year, unmatchedOnly, personality } = req.query;

    if (unmatchedOnly === 'true') {
      students = students.filter(s => !s.isMatched);
    }
    if (gender && gender !== 'ALL') {
      students = students.filter(s => (s.gender || '').toLowerCase() === gender.toLowerCase());
    }
    if (year && year !== 'ALL') {
      students = students.filter(s => s.year === year);
    }
    if (personality && personality !== 'ALL') {
      students = students.filter(s => s.personality === personality);
    }
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.insta && s.insta.toLowerCase().includes(q)) ||
        (s.musicTaste && s.musicTaste.toLowerCase().includes(q)) ||
        (s.hobbies && s.hobbies.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: students.length, students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create manual match
app.post('/api/admin/pair', requireAdminAuth, (req, res) => {
  try {
    const { student1Id, student2Id } = req.body;
    if (!student1Id || !student2Id) {
      return res.status(400).json({ success: false, error: 'Both student IDs are required to pair.' });
    }

    const match = db.createManualPair(student1Id, student2Id);
    res.json({ success: true, message: 'Matched successfully!', match });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Unpair a match
app.post('/api/admin/unpair', requireAdminAuth, (req, res) => {
  try {
    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ success: false, error: 'matchId is required' });
    }
    db.unpairMatch(matchId);
    res.json({ success: true, message: 'Match successfully undone.' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all matches
app.get('/api/admin/matches', requireAdminAuth, (req, res) => {
  try {
    const matches = db.getAllMatches();
    res.json({ success: true, count: matches.length, matches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Preview email for a match
app.get('/api/admin/preview-email/:matchId', requireAdminAuth, (req, res) => {
  try {
    const matches = db.getAllMatches();
    const match = matches.find(m => m.id === req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    const html1 = buildEmailHtml(match.student1, match.student2);
    const html2 = buildEmailHtml(match.student2, match.student1);

    res.json({
      success: true,
      emailToStudent1: { to: match.student1.email, name: match.student1.name, html: html1 },
      emailToStudent2: { to: match.student2.email, name: match.student2.name, html: html2 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send email for a single match
app.post('/api/admin/send-email', requireAdminAuth, async (req, res) => {
  try {
    const { matchId } = req.body;
    const matches = db.getAllMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    const result = await sendMatchEmails(match.student1, match.student2);
    if (result.success) {
      db.updateMatchEmailStatus(matchId, result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send emails to all pending matches
app.post('/api/admin/send-all-emails', requireAdminAuth, async (req, res) => {
  try {
    const matches = db.getAllMatches().filter(m => !m.emailSent);
    if (matches.length === 0) {
      return res.json({ success: true, message: 'No pending matches to notify.', dispatched: 0 });
    }

    const results = [];
    for (const match of matches) {
      const resSend = await sendMatchEmails(match.student1, match.student2);
      if (resSend.success) {
        db.updateMatchEmailStatus(match.id, resSend);
        results.push({ matchId: match.id, status: 'sent' });
      } else {
        results.push({ matchId: match.id, status: 'failed', error: resSend.error });
      }
    }

    res.json({
      success: true,
      message: `Finished dispatching emails to ${results.length} pairs.`,
      dispatched: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete student
app.delete('/api/admin/student/:id', requireAdminAuth, (req, res) => {
  try {
    db.deleteStudent(req.params.id);
    res.json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Export data as CSV
app.get('/api/admin/export-csv', requireAdminAuth, (req, res) => {
  try {
    const students = db.getAllStudents();
    let csv = 'ID,Name,Email,Phone,Instagram,Gender,Year,Personality,Music Taste,Hobbies,Is Matched,Matched With\n';
    
    students.forEach(s => {
      const safe = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      csv += `${safe(s.id)},${safe(s.name)},${safe(s.email)},${safe(s.phone)},${safe(s.insta)},${safe(s.gender)},${safe(s.year)},${safe(s.personality)},${safe(s.musicTaste)},${safe(s.hobbies)},${s.isMatched ? 'YES' : 'NO'},${safe(s.matchedWithId)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="matchmaker_students.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`✨ College Matchmaker Server running on http://localhost:${PORT}`);
  console.log(`📝 Student Form:  http://localhost:${PORT}`);
  console.log(`👑 Admin Portal:  http://localhost:${PORT}/admin.html`);
  console.log(`🔑 Admin Pass:    ${ADMIN_PASSWORD}`);
  console.log(`=================================================`);
});
