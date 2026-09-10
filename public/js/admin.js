// Admin Matchmaker Studio Controller
let adminPassword = localStorage.getItem('hangmate_admin_pass') || '';
let currentStudents = [];
let currentMatches = [];

let selectedSlotA = null;
let selectedSlotB = null;

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupEventListeners();
  if (adminPassword) {
    verifyAndLoad();
  }
});

// Authentication
function initAuth() {
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const passInput = document.getElementById('adminPassInput');
  const loginError = document.getElementById('loginError');

  if (!adminPassword) {
    loginModal.classList.remove('hidden');
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = passInput.value.trim();
    if (!pass) return;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        adminPassword = pass;
        localStorage.setItem('hangmate_admin_pass', pass);
        loginModal.classList.add('hidden');
        loginError.classList.add('hidden');
        loadAllData();
      } else {
        loginError.classList.remove('hidden');
      }
    } catch (err) {
      loginError.textContent = 'Server connection error';
      loginError.classList.remove('hidden');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('hangmate_admin_pass');
    adminPassword = '';
    window.location.reload();
  });
}

async function verifyAndLoad() {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword })
    });
    if (res.ok) {
      document.getElementById('loginModal').classList.add('hidden');
      loadAllData();
    } else {
      localStorage.removeItem('hangmate_admin_pass');
      document.getElementById('loginModal').classList.remove('hidden');
    }
  } catch (err) {
    document.getElementById('loginModal').classList.remove('hidden');
  }
}

// Fetch headers
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-password': adminPassword
  };
}

// Setup Event Listeners
function setupEventListeners() {
  // Tabs
  const tabPoolBtn = document.getElementById('tabPoolBtn');
  const tabMatchesBtn = document.getElementById('tabMatchesBtn');
  const poolView = document.getElementById('poolView');
  const matchesView = document.getElementById('matchesView');
  const poolFilters = document.getElementById('poolFilters');

  tabPoolBtn.addEventListener('click', () => {
    tabPoolBtn.className = 'tab-btn pb-3 px-1 text-sm font-bold text-rose-400 border-b-2 border-rose-500 flex items-center gap-2';
    tabMatchesBtn.className = 'tab-btn pb-3 px-1 text-sm font-bold text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center gap-2';
    poolView.classList.remove('hidden');
    matchesView.classList.add('hidden');
    poolFilters.classList.remove('hidden');
  });

  tabMatchesBtn.addEventListener('click', () => {
    tabMatchesBtn.className = 'tab-btn pb-3 px-1 text-sm font-bold text-rose-400 border-b-2 border-rose-500 flex items-center gap-2';
    tabPoolBtn.className = 'tab-btn pb-3 px-1 text-sm font-bold text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center gap-2';
    matchesView.classList.remove('hidden');
    poolView.classList.add('hidden');
    poolFilters.classList.add('hidden');
    loadMatches();
  });

  // Filters & Search
  document.getElementById('searchInput').addEventListener('input', renderStudentPool);
  document.getElementById('genderFilter').addEventListener('change', renderStudentPool);
  document.getElementById('yearFilter').addEventListener('change', renderStudentPool);
  document.getElementById('unmatchedOnlyCheck').addEventListener('change', renderStudentPool);

  // Clear Workbench
  document.getElementById('clearWorkbenchBtn').addEventListener('click', clearWorkbench);

  // Confirm Match Button
  document.getElementById('createPairBtn').addEventListener('click', handleCreatePair);

  // Dispatch All
  document.getElementById('dispatchAllBtn').addEventListener('click', handleDispatchAll);

  // Export CSV
  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    window.location.href = `/api/admin/export-csv?adminKey=${encodeURIComponent(adminPassword)}`;
  });

  // Email Preview Modal Close
  const emailPreviewModal = document.getElementById('emailPreviewModal');
  document.getElementById('closePreviewBtn').addEventListener('click', () => emailPreviewModal.classList.add('hidden'));
  document.getElementById('closePreviewBtn2').addEventListener('click', () => emailPreviewModal.classList.add('hidden'));
}

// Load All Data
async function loadAllData() {
  await Promise.all([loadStats(), loadStudents(), loadMatches()]);
}

// Load Stats
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats', { headers: getHeaders() });
    const data = await res.json();
    if (data.success) {
      const { totalStudents, unmatchedStudents, matchedStudents, maleCount, femaleCount, otherCount, matchesCount, emailsSentCount } = data.stats;
      document.getElementById('statTotal').textContent = totalStudents;
      document.getElementById('statGenderBreakdown').textContent = `${maleCount} M • ${femaleCount} F • ${otherCount} Other`;
      document.getElementById('statUnmatched').textContent = unmatchedStudents;
      document.getElementById('statMatches').textContent = matchesCount;
      document.getElementById('statEmails').textContent = emailsSentCount;
      document.getElementById('poolBadge').textContent = unmatchedStudents;
      document.getElementById('matchesBadge').textContent = matchesCount;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Load Students
async function loadStudents() {
  try {
    const res = await fetch('/api/admin/students', { headers: getHeaders() });
    const data = await res.json();
    if (data.success) {
      currentStudents = data.students;
      renderStudentPool();
    }
  } catch (err) {
    console.error('Failed to load students:', err);
  }
}

// Render Student Pool with filtering
function renderStudentPool() {
  const container = document.getElementById('poolContainer');
  const emptyState = document.getElementById('poolEmpty');
  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const gender = document.getElementById('genderFilter').value;
  const year = document.getElementById('yearFilter').value;
  const unmatchedOnly = document.getElementById('unmatchedOnlyCheck').checked;

  let filtered = currentStudents.filter(s => {
    if (unmatchedOnly && s.isMatched) return false;
    if (gender !== 'ALL' && (s.gender || '').toLowerCase() !== gender.toLowerCase()) return false;
    if (year !== 'ALL' && s.year !== year) return false;
    if (search) {
      const matchName = s.name.toLowerCase().includes(search);
      const matchMusic = (s.musicTaste || '').toLowerCase().includes(search);
      const matchHobby = (s.hobbies || '').toLowerCase().includes(search);
      const matchInsta = (s.insta || '').toLowerCase().includes(search);
      if (!matchName && !matchMusic && !matchHobby && !matchInsta) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  container.innerHTML = filtered.map(s => {
    const isSelectedInA = selectedSlotA && selectedSlotA.id === s.id;
    const isSelectedInB = selectedSlotB && selectedSlotB.id === s.id;
    const isSelected = isSelectedInA || isSelectedInB;

    let borderClass = 'border-slate-800 hover:border-slate-700';
    if (isSelectedInA) borderClass = 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500';
    if (isSelectedInB) borderClass = 'border-purple-500 bg-purple-950/20 ring-1 ring-purple-500';

    return `
      <div class="bg-slate-900/90 border ${borderClass} rounded-2xl p-5 transition flex flex-col justify-between group shadow-sm hover:shadow-md">
        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 class="font-bold text-white text-base leading-snug flex items-center gap-1.5">
                ${s.name}
                <span class="text-xs font-normal text-slate-400">(${s.gender || '?'})</span>
              </h3>
              <p class="text-xs text-rose-400 font-medium">@${s.insta || 'no_insta'}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                ${s.year || 'Student'}
              </span>
              <span class="text-[10px] px-2 py-0.2 rounded-full ${s.personality === 'Extrovert' ? 'bg-amber-500/20 text-amber-300' : s.personality === 'Introvert' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}">
                ${s.personality || 'Ambivert'}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-xs mt-3">
            <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span class="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">🎧 Music Taste</span>
              <p class="text-slate-200 mt-0.5 line-clamp-2">${s.musicTaste || 'Not specified'}</p>
            </div>
            <div class="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span class="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">🎨 Hobbies</span>
              <p class="text-slate-200 mt-0.5 line-clamp-2">${s.hobbies || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          ${s.isMatched ? `
            <span class="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              ✓ Already Matched
            </span>
          ` : `
            <button 
              onclick="selectStudentForSlot('${s.id}')"
              class="w-full py-2 px-3 rounded-xl ${isSelected ? 'bg-slate-800 text-rose-400' : 'bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30'} text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              ${isSelectedInA ? '✓ Selected in Slot A' : isSelectedInB ? '✓ Selected in Slot B' : '➕ Select for Match'}
            </button>
          `}
          <button 
            onclick="deleteStudentPrompt('${s.id}', '${s.name.replace(/'/g, "\\'")}')" 
            title="Delete Student" 
            class="p-2 rounded-xl text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 transition text-xs"
          >
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Slot Selection Logic
window.selectStudentForSlot = function(id) {
  const student = currentStudents.find(s => s.id === id);
  if (!student) return;

  if (selectedSlotA && selectedSlotA.id === id) {
    selectedSlotA = null;
  } else if (selectedSlotB && selectedSlotB.id === id) {
    selectedSlotB = null;
  } else if (!selectedSlotA) {
    selectedSlotA = student;
  } else if (!selectedSlotB) {
    selectedSlotB = student;
  } else {
    // If both slots full, overwrite Slot B
    selectedSlotB = student;
  }

  updateWorkbenchUI();
  renderStudentPool();
};

function updateWorkbenchUI() {
  const slotAEl = document.getElementById('slotA');
  const slotBEl = document.getElementById('slotB');
  const vibeComparison = document.getElementById('vibeComparison');
  const vibeSummary = document.getElementById('vibeSummary');

  // Slot A Render
  if (selectedSlotA) {
    slotAEl.querySelector('.slot-empty').classList.add('hidden');
    const content = slotAEl.querySelector('.slot-content');
    content.classList.remove('hidden');
    content.innerHTML = renderSlotCard(selectedSlotA, 'Slot A', 'clearSlotA');
    slotAEl.classList.remove('border-dashed');
    slotAEl.classList.add('border-rose-500', 'bg-rose-950/20');
  } else {
    slotAEl.querySelector('.slot-empty').classList.remove('hidden');
    slotAEl.querySelector('.slot-content').classList.add('hidden');
    slotAEl.classList.add('border-dashed');
    slotAEl.classList.remove('border-rose-500', 'bg-rose-950/20');
  }

  // Slot B Render
  if (selectedSlotB) {
    slotBEl.querySelector('.slot-empty').classList.add('hidden');
    const content = slotBEl.querySelector('.slot-content');
    content.classList.remove('hidden');
    content.innerHTML = renderSlotCard(selectedSlotB, 'Slot B', 'clearSlotB');
    slotBEl.classList.remove('border-dashed');
    slotBEl.classList.add('border-purple-500', 'bg-purple-950/20');
  } else {
    slotBEl.querySelector('.slot-empty').classList.remove('hidden');
    slotBEl.querySelector('.slot-content').classList.add('hidden');
    slotBEl.classList.add('border-dashed');
    slotBEl.classList.remove('border-purple-500', 'bg-purple-950/20');
  }

  // Both Slots Filled: Vibe Check
  if (selectedSlotA && selectedSlotB) {
    vibeComparison.classList.remove('hidden');
    
    const p1 = selectedSlotA.personality;
    const p2 = selectedSlotB.personality;
    let personalityVibe = 'Great conversational harmony';
    if (p1 === 'Introvert' && p2 === 'Extrovert') personalityVibe = 'Opposites attract! Quiet meets vibrant energy 🧲';
    else if (p1 === 'Extrovert' && p2 === 'Introvert') personalityVibe = 'Opposites attract! High energy meets chill listener 🧲';
    else if (p1 === p2) personalityVibe = `Twin vibe match: Both are ${p1}s! ✨`;

    vibeSummary.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div><strong>Years:</strong> ${selectedSlotA.year} ⚡ ${selectedSlotB.year}</div>
        <div><strong>Vibe:</strong> ${personalityVibe}</div>
        <div class="truncate"><strong>${selectedSlotA.name}'s Music:</strong> ${selectedSlotA.musicTaste}</div>
        <div class="truncate"><strong>${selectedSlotB.name}'s Music:</strong> ${selectedSlotB.musicTaste}</div>
      </div>
    `;
  } else {
    vibeComparison.classList.add('hidden');
  }
}

function renderSlotCard(student, slotName, clearFn) {
  return `
    <div class="flex items-start justify-between">
      <div>
        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-rose-300">${slotName}</span>
        <h4 class="text-lg font-bold text-white mt-1">${student.name}</h4>
        <p class="text-xs text-rose-400 font-medium">@${student.insta || 'no_insta'} • ${student.gender} • ${student.year}</p>
      </div>
      <button onclick="${clearFn}()" class="text-xs p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">✕ Remove</button>
    </div>
    <div class="mt-3 text-xs space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
      <div><span class="text-slate-500 font-bold">🎧 Music:</span> <span class="text-slate-300">${student.musicTaste || 'None'}</span></div>
      <div><span class="text-slate-500 font-bold">🎨 Hobbies:</span> <span class="text-slate-300">${student.hobbies || 'None'}</span></div>
    </div>
  `;
}

window.clearSlotA = () => { selectedSlotA = null; updateWorkbenchUI(); renderStudentPool(); };
window.clearSlotB = () => { selectedSlotB = null; updateWorkbenchUI(); renderStudentPool(); };

function clearWorkbench() {
  selectedSlotA = null;
  selectedSlotB = null;
  updateWorkbenchUI();
  renderStudentPool();
}

// Handle Match Creation
async function handleCreatePair() {
  if (!selectedSlotA || !selectedSlotB) {
    alert('Please select both Slot A and Slot B to create a match.');
    return;
  }

  const btn = document.getElementById('createPairBtn');
  btn.disabled = true;
  btn.textContent = 'Pairing...';

  try {
    const res = await fetch('/api/admin/pair', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        student1Id: selectedSlotA.id,
        student2Id: selectedSlotB.id
      })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      clearWorkbench();
      await loadAllData();
      // Switch to matches tab
      document.getElementById('tabMatchesBtn').click();
    } else {
      alert('⚠️ ' + (data.error || 'Failed to create match.'));
    }
  } catch (err) {
    alert('Network error while pairing.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm & Create Match 💖';
  }
}

// Load Matches
async function loadMatches() {
  try {
    const res = await fetch('/api/admin/matches', { headers: getHeaders() });
    const data = await res.json();
    if (data.success) {
      currentMatches = data.matches;
      renderMatches();
    }
  } catch (err) {
    console.error('Failed to load matches:', err);
  }
}

// Render Matches View
function renderMatches() {
  const container = document.getElementById('matchesContainer');
  const emptyState = document.getElementById('matchesEmpty');

  if (currentMatches.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  container.innerHTML = currentMatches.map(m => {
    const s1 = m.student1;
    const s2 = m.student2;

    return `
      <div class="bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
        
        <!-- Top Status Bar -->
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full ${m.emailSent ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}"></span>
            <span class="text-xs font-bold uppercase tracking-wider ${m.emailSent ? 'text-emerald-400' : 'text-amber-400'}">
              ${m.emailSent ? 'Email Dispatched ✓' : 'Pending Notification'}
            </span>
          </div>
          <span class="text-[11px] text-slate-500">${new Date(m.createdAt).toLocaleDateString()}</span>
        </div>

        <!-- Two Students Side-by-Side Cards -->
        <div class="grid grid-cols-2 gap-3 mb-5">
          <!-- Student 1 -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <h4 class="font-bold text-white text-base leading-tight">${s1.name}</h4>
            <p class="text-xs text-rose-400 font-medium mt-0.5">@${s1.insta || 'no_insta'}</p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">${s1.gender}</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">${s1.year}</span>
            </div>
            <div class="mt-3 text-[11px] text-slate-400 space-y-1">
              <p class="truncate">🎧 ${s1.musicTaste || 'None'}</p>
              <p class="truncate">🎨 ${s1.hobbies || 'None'}</p>
            </div>
          </div>

          <!-- Student 2 -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <h4 class="font-bold text-white text-base leading-tight">${s2.name}</h4>
            <p class="text-xs text-purple-400 font-medium mt-0.5">@${s2.insta || 'no_insta'}</p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">${s2.gender}</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">${s2.year}</span>
            </div>
            <div class="mt-3 text-[11px] text-slate-400 space-y-1">
              <p class="truncate">🎧 ${s2.musicTaste || 'None'}</p>
              <p class="truncate">🎨 ${s2.hobbies || 'None'}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
          <div class="flex items-center gap-2">
            <button 
              onclick="previewMatchEmail('${m.id}')" 
              class="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition cursor-pointer"
            >
              👁️ Preview Email
            </button>
            <button 
              onclick="sendSingleMatchEmail('${m.id}')" 
              class="text-xs px-3 py-1.5 rounded-xl ${m.emailSent ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30'} font-bold transition cursor-pointer"
            >
              ${m.emailSent ? '✉️ Resend Email' : '🚀 Send Email'}
            </button>
          </div>

          <button 
            onclick="unpairPrompt('${m.id}')" 
            class="text-xs px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 font-medium transition cursor-pointer"
          >
            ↩️ Unpair
          </button>
        </div>

      </div>
    `;
  }).join('');
}

// Unpair action
window.unpairPrompt = async function(matchId) {
  if (!confirm('Are you sure you want to unpair this couple? Both students will return to the available pool.')) {
    return;
  }

  try {
    const res = await fetch('/api/admin/unpair', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ matchId })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      await loadAllData();
    } else {
      alert('⚠️ ' + (data.error || 'Failed to unpair.'));
    }
  } catch (err) {
    alert('Network error while unpairing.');
  }
};

// Preview Match Email Modal
window.previewMatchEmail = async function(matchId) {
  try {
    const res = await fetch(`/api/admin/preview-email/${matchId}`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok && data.success) {
      const modal = document.getElementById('emailPreviewModal');
      const recipientText = document.getElementById('previewRecipient');
      const iframeContainer = document.getElementById('emailIframeContainer');

      recipientText.textContent = `Sample email being delivered to: ${data.emailToStudent1.name} (${data.emailToStudent1.to})`;
      iframeContainer.innerHTML = `<iframe srcdoc="${encodeURIComponent(data.emailToStudent1.html)}" class="w-full h-[450px] border-0"></iframe>`;
      modal.classList.remove('hidden');
    } else {
      alert('Failed to generate preview.');
    }
  } catch (err) {
    alert('Error loading email preview.');
  }
};

// Send single match email
window.sendSingleMatchEmail = async function(matchId) {
  if (!confirm('Dispatch match notification emails to both students now?')) {
    return;
  }

  try {
    const res = await fetch('/api/admin/send-email', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ matchId })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('✅ ' + data.message);
      await loadAllData();
    } else {
      alert('⚠️ ' + (data.error || 'Failed to send email.'));
    }
  } catch (err) {
    alert('Network error while sending email.');
  }
};

// Dispatch all pending match emails
async function handleDispatchAll() {
  const pendingCount = currentMatches.filter(m => !m.emailSent).length;
  if (pendingCount === 0) {
    alert('No pending matches to notify! All current matches have already been emailed.');
    return;
  }

  if (!confirm(`Are you ready to send emails to all ${pendingCount} pending match pairs?`)) {
    return;
  }

  const btn = document.getElementById('dispatchAllBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Dispatching emails...</span>';

  try {
    const res = await fetch('/api/admin/send-all-emails', {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert(`🎉 Done! ${data.message}`);
      await loadAllData();
    } else {
      alert('⚠️ ' + (data.error || 'Failed to dispatch emails.'));
    }
  } catch (err) {
    alert('Network error during bulk email dispatch.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🚀 Send All Pending Emails</span>';
  }
}

// Delete student prompt
window.deleteStudentPrompt = async function(id, name) {
  if (!confirm(`Delete ${name} from the system? If they are currently matched, that match will also be removed.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/student/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (res.ok && data.success) {
      await loadAllData();
    } else {
      alert('⚠️ ' + (data.error || 'Could not delete student.'));
    }
  } catch (err) {
    alert('Network error while deleting.');
  }
};
