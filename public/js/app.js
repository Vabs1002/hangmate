document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('matchForm');
  const submitBtn = document.getElementById('submitBtn');
  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Quick tag chips interaction
  document.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const targetInputId = chip.getAttribute('data-target');
      const val = chip.getAttribute('data-val');
      const input = document.getElementById(targetInputId);

      if (input) {
        if (!input.value.trim()) {
          input.value = val;
        } else {
          // If not already in input, append with comma
          const existing = input.value.split(',').map(s => s.trim().toLowerCase());
          if (!existing.includes(val.toLowerCase())) {
            input.value += ', ' + val;
          }
        }
        chip.classList.add('bg-rose-500/20', 'border-rose-500/40', 'text-rose-300');
      }
    });
  });

  // Handle form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Saving your details...
      `;

      const formData = new FormData(form);
      const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        insta: formData.get('insta'),
        gender: formData.get('gender'),
        year: formData.get('year'),
        musicTaste: formData.get('musicTaste'),
        hobbies: formData.get('hobbies'),
        personality: formData.get('personality')
      };

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
          form.reset();
          successModal.classList.remove('hidden');
        } else {
          alert('⚠️ ' + (data.error || 'Something went wrong. Please check your details.'));
        }
      } catch (err) {
        alert('⚠️ Network error: Could not reach the server. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      successModal.classList.add('hidden');
    });
  }

  // Secret Admin Access: Triple-click or triple-tap the HangMate title
  let clickCount = 0;
  let clickTimer = null;
  const headerTitle = document.querySelector('h1');
  if (headerTitle) {
    headerTitle.style.cursor = 'default';
    headerTitle.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      if (clickCount >= 3) {
        clickCount = 0;
        window.location.href = '/admin.html';
      } else {
        clickTimer = setTimeout(() => { clickCount = 0; }, 600);
      }
    });
  }
});
