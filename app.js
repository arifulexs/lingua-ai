/**
 * LinguaAI — Advanced English Tutor
 * Version: 4.0.0
 * New: Heart Recovery Modal (drill or 1-min timer), Idiom Trainer,
 *      Speed Challenge, 10 New Roleplay Scenarios, 8 Drill Types,
 *      Idiom of the Day, Earn-Heart-Back via Drill Streak
 */

const App = {

  /* ══════════════════════════════════════════════════════════
     1. CONFIG & CONSTANTS
  ══════════════════════════════════════════════════════════ */
  config: {
    API_PROXY_URL:    '/api/gemini-proxy',
    DAILY_GOAL_XP:    50,
    MAX_HEARTS:       5,
    HEART_REGEN_MS:   60 * 1000,   // ← 1 minute auto-refill
    HEART_DRILL_STREAK: 3,          // ← correct drills in a row to earn 1 heart back
    XP_PER_LEVEL:     100,
    RETRY_LIMIT:      2,
    INITIAL_DELAY:    1500,
    SPEED_DURATION:   60,           // seconds
    SPEED_XP_PER_Q:   5,
  },

  BADGES: [
    { id: 'first_word',    emoji: '📖', name: 'First Step',        desc: 'Look up your first word',            check: s => s.wordsLearned >= 1 },
    { id: 'vocab_5',       emoji: '🗂️', name: 'Collector',         desc: 'Save 5 words',                       check: s => s.vocabBank.length >= 5 },
    { id: 'vocab_20',      emoji: '📚', name: 'Bookworm',          desc: 'Save 20 words',                      check: s => s.vocabBank.length >= 20 },
    { id: 'streak_3',      emoji: '🔥', name: 'On Fire',           desc: '3-day streak',                       check: s => s.streak >= 3 },
    { id: 'streak_7',      emoji: '⚡', name: 'Electric',          desc: '7-day streak',                       check: s => s.streak >= 7 },
    { id: 'xp_100',        emoji: '🎓', name: 'Scholar',           desc: 'Earn 100 XP',                        check: s => s.points >= 100 },
    { id: 'xp_500',        emoji: '🏆', name: 'Champion',          desc: 'Earn 500 XP',                        check: s => s.points >= 500 },
    { id: 'drill_5',       emoji: '✏️', name: 'Grammarian',        desc: 'Get 5 drills right in a row',        check: s => s.drillStreak >= 5 },
    { id: 'roleplay_3',    emoji: '💬', name: 'Conversationalist', desc: 'Complete 3 roleplays',               check: s => s.roleplayCount >= 3 },
    { id: 'roleplay_10',   emoji: '🎭', name: 'Actor',             desc: 'Complete 10 roleplays',              check: s => s.roleplayCount >= 10 },
    { id: 'perfect_score', emoji: '⭐', name: 'Perfect Writer',    desc: 'Score 90+ on a writing review',      check: s => s.bestWritingScore >= 90 },
    { id: 'speed_10',      emoji: '🚀', name: 'Speed Demon',       desc: 'Answer 10 questions in a Speed Sprint', check: s => s.bestSpeedScore >= 10 },
    { id: 'speed_20',      emoji: '💨', name: 'Lightning',         desc: 'Answer 20 questions in a Speed Sprint', check: s => s.bestSpeedScore >= 20 },
    { id: 'idiom_10',      emoji: '🦉', name: 'Idiom Master',      desc: 'Learn 10 idioms',                    check: s => s.idiomsLearned >= 10 },
    { id: 'heart_hero',    emoji: '❤️', name: 'Heart Hero',        desc: 'Recover a heart by completing a drill', check: s => s.heartsRecovered >= 1 },
  ],

  /* ══════════════════════════════════════════════════════════
     2. STATE
  ══════════════════════════════════════════════════════════ */
  state: {
    points: 0, streak: 0, hearts: 5, dailyXP: 0,
    drillStreak: 0, wordsLearned: 0, roleplayCount: 0,
    bestWritingScore: 0, earnedBadgeIds: [],
    bestSpeedScore: 0, idiomsLearned: 0, heartsRecovered: 0,
    lastLogin: null, lastHeartLost: null, lastDailyReset: null,
    isDarkMode: false, currentView: 'dashboard',
    cache: {}, vocabBank: [],
    roleplayHistory: [], wordOfDay: null, wordOfDayDate: null,
    idiomOfDay: null, idiomOfDayDate: null,
    speedDifficulty: 'beginner',
  },

  // Internal references
  _imageFile:         null,
  _heartCountdownInterval: null,
  _speedTimerInterval: null,
  _speedData:         { correct: 0, wrong: 0, streak: 0, bestStreak: 0, timeLeft: 60 },

  /* ══════════════════════════════════════════════════════════
     3. INIT
  ══════════════════════════════════════════════════════════ */
  init() {
    this.loadState();
    this.bindEvents();
    this.initTheme();
    this.updateAllUI();
    this.checkStreak();
    this.checkDailyReset();
    this.checkHeartRegen();
    this.renderBadges();
    this.loadWordOfDay();
    this.loadIdiomOfDay();
    this.setGreeting();
  },

  loadState() {
    try {
      const saved = localStorage.getItem('lingua_v4_state');
      if (saved) this.state = { ...this.state, ...JSON.parse(saved) };
    } catch(e) { console.warn('State load failed', e); }
  },

  saveState() {
    try {
      localStorage.setItem('lingua_v4_state', JSON.stringify(this.state));
    } catch(e) { console.warn('State save failed', e); }
    this.updateAllUI();
  },

  /* ══════════════════════════════════════════════════════════
     4. EVENT BINDING
  ══════════════════════════════════════════════════════════ */
  bindEvents() {
    // Sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.target));
    });

    // Theme
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

    // Word Explorer
    document.getElementById('btn-learn').addEventListener('click', () => this.handleWordLookup());
    document.getElementById('btn-demo').addEventListener('click',  () => this.loadDemoWord());
    document.getElementById('word-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.handleWordLookup();
    });

    // Grammar Drills
    document.getElementById('btn-new-drill').addEventListener('click', () => this.loadGrammarDrill());

    // Roleplay
    document.querySelectorAll('.scenario-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });
    document.getElementById('btn-start-roleplay').addEventListener('click', () => this.startRoleplay());
    document.getElementById('btn-send-chat').addEventListener('click', () => this.sendChatTurn());
    document.getElementById('btn-end-chat').addEventListener('click', () => this.endRoleplay());
    document.getElementById('chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.sendChatTurn();
    });

    // Writing Lab
    document.getElementById('btn-review-writing').addEventListener('click', () => this.handleWritingReview());
    const uploadZone = document.getElementById('upload-zone');
    const fileInput  = document.getElementById('image-upload');
    uploadZone.addEventListener('click', e => {
      if (!e.target.closest('#btn-remove-img')) fileInput.click();
    });
    fileInput.addEventListener('change', e => this.handleImageSelect(e));
    document.getElementById('btn-remove-img').addEventListener('click', e => {
      e.stopPropagation(); this.clearImageUpload();
    });
    uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', e => {
      e.preventDefault(); uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this.processImageFile(file);
    });

    // Word of Day
    document.getElementById('wotd-speak').addEventListener('click', () => {
      if (this.state.wordOfDay) this.speak(this.state.wordOfDay.word);
    });
    document.getElementById('wotd-save').addEventListener('click', () => {
      if (this.state.wordOfDay) this.saveToVocab(this.state.wordOfDay);
    });
    document.getElementById('wotd-refresh').addEventListener('click', () => this.fetchWordOfDay(true));

    // Idiom of Day (dashboard)
    document.getElementById('iotd-speak').addEventListener('click', () => {
      if (this.state.idiomOfDay) this.speak(this.state.idiomOfDay.phrase);
    });
    document.getElementById('iotd-new').addEventListener('click', () => this.fetchIdiomOfDay(true));

    // Vocab Bank
    document.getElementById('btn-quiz-vocab').addEventListener('click',  () => this.startVocabQuiz());
    document.getElementById('btn-clear-vocab').addEventListener('click', () => this.clearVocabBank());

    // Idiom Trainer
    document.getElementById('btn-new-idiom').addEventListener('click', () => this.loadIdiomDrill());

    // Speed Challenge
    document.getElementById('btn-start-speed').addEventListener('click', () => this.startSpeedChallenge());
    document.getElementById('btn-speed-retry').addEventListener('click', () => this.resetSpeedChallenge());
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.speedDifficulty = btn.dataset.diff;
      });
    });

    // Heart Recovery Modal
    document.getElementById('btn-get-heart-drill').addEventListener('click', () => this.loadHeartRecoveryDrill());
    document.getElementById('btn-close-heart-modal').addEventListener('click', () => this.closeHeartModal());
  },

  /* ══════════════════════════════════════════════════════════
     5. NAVIGATION & THEME
  ══════════════════════════════════════════════════════════ */
  switchTab(id) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-target="${id}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => { v.classList.add('hidden'); v.classList.remove('active'); });
    const section = document.getElementById(id);
    if (section) { section.classList.remove('hidden'); section.classList.add('active'); }
    this.state.currentView = id;
    if (id === 'vocab') this.renderVocabBank();
    if (id === 'speed') {
      document.getElementById('speed-best').textContent = this.state.bestSpeedScore;
    }
  },

  toggleTheme() {
    this.state.isDarkMode = !this.state.isDarkMode;
    document.body.classList.toggle('dark-mode', this.state.isDarkMode);
    document.querySelector('#theme-toggle i').className =
      this.state.isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    this.saveState();
  },

  initTheme() {
    if (this.state.isDarkMode) {
      document.body.classList.add('dark-mode');
      document.querySelector('#theme-toggle i').className = 'fa-solid fa-sun';
    }
  },

  /* ══════════════════════════════════════════════════════════
     6. UI UPDATES
  ══════════════════════════════════════════════════════════ */
  updateAllUI() {
    this.updateStatsBar();
    this.updateHearts();
    this.updateXPBar();
    this.updateDailyGoal();
    this.updateVocabCount();
  },

  updateStatsBar() {
    document.getElementById('ui-points').textContent  = this.state.points.toLocaleString();
    document.getElementById('ui-streak').textContent  = this.state.streak;
    document.getElementById('ui-badges').textContent  = this.state.earnedBadgeIds.length;
  },

  updateXPBar() {
    const level = Math.floor(this.state.points / this.config.XP_PER_LEVEL) + 1;
    const xpIn  = this.state.points % this.config.XP_PER_LEVEL;
    const pct   = (xpIn / this.config.XP_PER_LEVEL) * 100;
    document.getElementById('ui-level').textContent  = `Lv.${level}`;
    document.getElementById('ui-xp-bar').style.width = `${pct}%`;
    document.getElementById('ui-xp-text').textContent = `${xpIn} / ${this.config.XP_PER_LEVEL} XP`;
  },

  updateHearts() {
    const container = document.getElementById('hearts-display');
    container.innerHTML = '';
    for (let i = 0; i < this.config.MAX_HEARTS; i++) {
      const span = document.createElement('span');
      span.className = `heart-icon ${i < this.state.hearts ? '' : 'empty'}`;
      span.textContent = '❤️';
      container.appendChild(span);
    }
  },

  updateDailyGoal() {
    const pct = Math.min(100, (this.state.dailyXP / this.config.DAILY_GOAL_XP) * 100);
    document.getElementById('daily-goal-bar').style.width = `${pct}%`;
    document.getElementById('daily-goal-label').textContent =
      `${Math.min(this.state.dailyXP, this.config.DAILY_GOAL_XP)} / ${this.config.DAILY_GOAL_XP} XP`;
  },

  updateVocabCount() {
    document.getElementById('ui-vocab-count').textContent = this.state.vocabBank.length;
    const countEl = document.getElementById('vocab-total-count');
    if (countEl) countEl.textContent = `${this.state.vocabBank.length} words`;
  },

  setGreeting() {
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning! 👋' : h < 17 ? 'Good afternoon! ☀️' : 'Good evening! 🌙';
    document.getElementById('greeting-text').textContent = g;
  },

  /* ══════════════════════════════════════════════════════════
     7. XP, HEARTS & STREAK
  ══════════════════════════════════════════════════════════ */
  awardXP(amount, reason = '') {
    const prevLevel = Math.floor(this.state.points / this.config.XP_PER_LEVEL) + 1;
    this.state.points  += amount;
    this.state.dailyXP += amount;
    const newLevel = Math.floor(this.state.points / this.config.XP_PER_LEVEL) + 1;
    this.showXPPopup(amount);
    this.playSound('xp');
    this.saveState();
    if (newLevel > prevLevel) this.onLevelUp(newLevel);
    this.checkBadges();
  },

  showXPPopup(amount) {
    const popup = document.getElementById('xp-popup');
    document.getElementById('xp-amount').textContent = amount;
    popup.classList.remove('hidden');
    popup.style.animation = 'none';
    requestAnimationFrame(() => {
      popup.style.animation = '';
      setTimeout(() => popup.classList.add('hidden'), 1600);
    });
  },

  onLevelUp(level) {
    this.toast(`🎉 Level Up! You're now Level ${level}!`, 'success', 4000);
    this.launchConfetti();
    this.playSound('levelup');
  },

  loseHeart() {
    if (this.state.hearts > 0) {
      this.state.hearts--;
      this.state.lastHeartLost = Date.now();
      this.saveState();
      const hearts = document.querySelectorAll('.heart-icon');
      const h = hearts[this.state.hearts];
      if (h) h.classList.add('pop');
      setTimeout(() => this.updateHearts(), 500);
    }
    if (this.state.hearts === 0) {
      setTimeout(() => this.showHeartModal(), 600);
    }
  },

  checkHeartRegen() {
    if (this.state.hearts >= this.config.MAX_HEARTS || !this.state.lastHeartLost) return;
    const elapsed = Date.now() - this.state.lastHeartLost;
    const regen   = Math.floor(elapsed / this.config.HEART_REGEN_MS);
    if (regen > 0) {
      const prev = this.state.hearts;
      this.state.hearts = Math.min(this.config.MAX_HEARTS, this.state.hearts + regen);
      if (this.state.hearts >= this.config.MAX_HEARTS) this.state.lastHeartLost = null;
      else this.state.lastHeartLost += regen * this.config.HEART_REGEN_MS;
      if (this.state.hearts > prev) this.saveState();
    }
  },

  checkStreak() {
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (this.state.lastLogin === today) return;
    this.state.streak    = this.state.lastLogin === yesterday ? this.state.streak + 1 : 1;
    this.state.lastLogin = today;
    this.saveState();
    if (this.state.streak > 1) this.toast(`🔥 ${this.state.streak}-day streak! Keep going!`, 'success');
  },

  checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];
    if (this.state.lastDailyReset !== today) {
      this.state.dailyXP = 0;
      this.state.lastDailyReset = today;
      this.saveState();
    }
  },

  /* ══════════════════════════════════════════════════════════
     8. ❤️ HEART RECOVERY MODAL
  ══════════════════════════════════════════════════════════ */
  showHeartModal() {
    const modal = document.getElementById('heart-modal');
    modal.classList.remove('hidden');
    document.getElementById('heart-drill-area').innerHTML = `
      <div class="heart-drill-placeholder">
        <i class="fa-solid fa-bolt" style="color:var(--orange);font-size:1.5rem;"></i>
        <p>Press the button below to get a quick drill and win a heart back instantly!</p>
      </div>`;
    this._startHeartCountdown();
  },

  closeHeartModal() {
    document.getElementById('heart-modal').classList.add('hidden');
    this._clearHeartCountdown();
  },

  _startHeartCountdown() {
    this._clearHeartCountdown();
    let remaining = Math.ceil(this.config.HEART_REGEN_MS / 1000);
    const total   = remaining;
    const countdownEl = document.getElementById('heart-countdown');
    const fillEl      = document.getElementById('heart-timer-fill');

    const tick = () => {
      if (remaining <= 0) {
        this._clearHeartCountdown();
        // Auto-give 1 heart
        this.state.hearts = Math.min(this.config.MAX_HEARTS, this.state.hearts + 1);
        if (this.state.hearts < this.config.MAX_HEARTS) {
          this.state.lastHeartLost = Date.now();
        } else {
          this.state.lastHeartLost = null;
        }
        this.saveState();
        this.toast('❤️ Heart refilled!', 'success');
        this.closeHeartModal();
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      if (countdownEl) countdownEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
      if (fillEl) fillEl.style.width = `${(remaining / total) * 100}%`;
      remaining--;
    };
    tick();
    this._heartCountdownInterval = setInterval(tick, 1000);
  },

  _clearHeartCountdown() {
    if (this._heartCountdownInterval) {
      clearInterval(this._heartCountdownInterval);
      this._heartCountdownInterval = null;
    }
  },

  async loadHeartRecoveryDrill() {
    const area = document.getElementById('heart-drill-area');
    area.innerHTML = `<div class="heart-drill-loading"><div class="loader-ring" style="width:40px;height:40px;"></div><p>Generating your drill...</p></div>`;
    document.getElementById('btn-get-heart-drill').disabled = true;

    try {
      const data = await this.callGeminiAPI('grammar', { type: 'fill_blank', level: 'beginner' }, true);
      this._renderHeartRecoveryDrill(data);
    } catch(e) {
      // Demo fallback
      this._renderHeartRecoveryDrill({
        typeLabel: 'Fill in the Blank',
        question: 'She ___ to school every day.',
        options: ['go', 'goes', 'going', 'gone'],
        correctIndex: 1,
        explanation: 'With "she", use the -s form of the verb in present simple.',
      });
    }
  },

  _renderHeartRecoveryDrill(data) {
    const area = document.getElementById('heart-drill-area');
    const optHTML = (data.options || []).map((opt, i) => `
      <button class="heart-drill-option" onclick="App._checkHeartDrill(${i}, ${data.correctIndex}, this, '${(data.explanation||'').replace(/'/g,"\\'")}')">
        ${opt}
      </button>`).join('');
    area.innerHTML = `
      <div class="heart-drill-question">${(data.question||'').replace(/___/g, '<span class="blank">___</span>')}</div>
      <div class="heart-drill-options">${optHTML}</div>
      <div id="heart-drill-result"></div>`;
    document.getElementById('btn-get-heart-drill').disabled = false;
  },

  _checkHeartDrill(selected, correct, btn, explanation) {
    const all = btn.closest('.heart-drill-options').querySelectorAll('.heart-drill-option');
    all.forEach(b => b.disabled = true);
    const resultEl = document.getElementById('heart-drill-result');

    if (selected === correct) {
      btn.classList.add('correct');
      this.playSound('correct');
      resultEl.innerHTML = `<div class="heart-drill-success">✅ Correct! You earned a ❤️ back!</div>`;
      // Restore 1 heart
      this.state.hearts = Math.min(this.config.MAX_HEARTS, this.state.hearts + 1);
      if (this.state.hearts >= this.config.MAX_HEARTS) this.state.lastHeartLost = null;
      this.state.heartsRecovered = (this.state.heartsRecovered || 0) + 1;
      this.awardXP(10, 'heart recovery drill');
      this.saveState();
      this.launchConfetti();
      setTimeout(() => this.closeHeartModal(), 1800);
    } else {
      btn.classList.add('wrong');
      all[correct]?.classList.add('correct');
      this.playSound('wrong');
      resultEl.innerHTML = `
        <div class="heart-drill-fail">❌ ${explanation || 'Not quite — try the next one!'}</div>
        <button class="btn-primary" style="margin-top:.75rem;" onclick="App.loadHeartRecoveryDrill()">
          <i class="fa-solid fa-redo"></i> Try Another Drill
        </button>`;
    }
  },

  /* ══════════════════════════════════════════════════════════
     9. BADGES
  ══════════════════════════════════════════════════════════ */
  checkBadges() {
    this.BADGES.forEach(b => {
      if (!this.state.earnedBadgeIds.includes(b.id) && b.check(this.state)) {
        this.state.earnedBadgeIds.push(b.id);
        this.saveState();
        this.toast(`🏅 Badge Unlocked: "${b.name}"!`, 'success', 4000);
        this.renderBadges();
      }
    });
  },

  renderBadges() {
    const grid = document.getElementById('badges-grid');
    if (!grid) return;
    grid.innerHTML = this.BADGES.map(b => {
      const earned = this.state.earnedBadgeIds.includes(b.id);
      return `
        <div class="badge-item ${earned ? 'earned' : 'locked'}" title="${b.desc}">
          <span class="badge-emoji">${b.emoji}</span>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>`;
    }).join('');
  },

  /* ══════════════════════════════════════════════════════════
     10. API BRIDGE — with JSON fence stripping & retry
  ══════════════════════════════════════════════════════════ */
  async callGeminiAPI(mode, payload, silent = false) {
    if (!silent) this.toggleLoader(true);

    const variant   = document.getElementById('variant-select').value;
    const slangOn   = document.getElementById('slang-toggle').checked;
    const slangNote = slangOn
      ? 'You may use informal, colloquial slang naturally.'
      : 'Use formal, standard English only.';

    let promptText = '';
    switch (mode) {
      case 'lookup':
        promptText = `Give a learner a full breakdown of the English word "${payload.word}".
Return ONLY a JSON object with these exact keys:
{
  "word": string,
  "partOfSpeech": string,
  "phonetic": string (IPA phonetic spelling, e.g. /ɪˈfɛm.ər.əl/),
  "definition": string (clear, simple definition),
  "example": string (1 natural example sentence),
  "synonyms": string[] (3 synonyms),
  "antonyms": string[] (2 antonyms),
  "task": { "question": string, "options": string[4], "correctIndex": number }
}`;
        break;

      case 'wotd':
        promptText = `Pick an interesting, intermediate-level English word for today's "word of the day".
Return ONLY a JSON object:
{
  "word": string,
  "partOfSpeech": string,
  "definition": string,
  "example": string
}`;
        break;

      case 'grammar':
        promptText = `Create one ${(payload.type||'fill_blank').replace(/_/g,' ')} grammar exercise for ${payload.level||'intermediate'} English learners.
Return ONLY a JSON object:
{
  "typeLabel": string (short human-readable type name),
  "question": string (the full sentence or prompt, use ___ for blanks),
  "options": string[4] (4 answer choices),
  "correctIndex": number (0-3),
  "explanation": string (brief 1-sentence grammar explanation)
}`;
        break;

      case 'roleplay':
        promptText = `You are roleplaying as a native ${variant} English speaker in a scenario: "${payload.scenario}".
Conversation history (JSON): ${JSON.stringify(payload.history.slice(-6))}.
The learner's last message: "${payload.lastMessage}".
Reply naturally IN CHARACTER (2-3 sentences max), then suggest 2 short phrases the learner could say next.
Return ONLY a JSON object:
{
  "reply": string,
  "suggestions": string[2]
}`;
        break;

      case 'roleplay_score':
        promptText = `Score this ${variant} English roleplay conversation:
Scenario: "${payload.scenario}"
History: ${JSON.stringify(payload.history)}
Return ONLY JSON:
{
  "fluency": number (0-10),
  "vocabulary": number (0-10),
  "grammar": number (0-10),
  "naturalness": number (0-10),
  "overall": number (0-100),
  "feedback": string (2-3 encouraging sentences with specific tips)
}`;
        break;

      case 'writing':
        promptText = `Review this English writing sample${payload.imageBase64 ? ' (from the uploaded image)' : ''}: "${payload.text || '(see image)'}".
Return ONLY a JSON object:
{
  "score": number (0-100),
  "transcription": string (if image was provided, the detected text; otherwise empty string),
  "correctedText": string (fully corrected version),
  "feedback": string[3] (3 specific improvement tips),
  "strengths": string[2] (2 things done well)
}`;
        break;

      case 'vocab_quiz':
        promptText = `Create a multiple-choice quiz question testing the meaning of: "${payload.word}" (definition: "${payload.definition}").
Make 3 wrong options plausible but clearly wrong.
Return ONLY JSON:
{
  "question": string,
  "options": string[4],
  "correctIndex": number
}`;
        break;

      case 'idiom':
        promptText = `Pick one interesting English idiom from the category: "${payload.category}". Level: ${payload.level}.
Return ONLY a JSON object:
{
  "phrase": string (the idiom, e.g. "hit the sack"),
  "meaning": string (clear explanation of what it means),
  "example": string (a natural example sentence using the idiom),
  "origin": string (1 sentence about its origin or usage context),
  "quiz": {
    "question": string (e.g. 'What does "hit the sack" mean in this sentence?'),
    "options": string[4],
    "correctIndex": number
  }
}`;
        break;

      case 'speed_drill':
        promptText = `Create one quick ${payload.level} English grammar question. Keep it very short and clear.
Return ONLY JSON:
{
  "question": string (short, max 15 words, use ___ for blanks),
  "options": string[4] (very short labels, 1-3 words each),
  "correctIndex": number
}`;
        break;
    }

    let attempt = 0, delay = this.config.INITIAL_DELAY;
    while (attempt < this.config.RETRY_LIMIT) {
      try {
        const body = {
          prompt: promptText,
          systemInstruction: `You are an expert ${variant} English tutor. ${slangNote} ALWAYS return ONLY valid JSON — no markdown, no extra text.`,
          imageBase64:  payload.imageBase64  || null,
          imageMimeType: payload.imageMimeType || null,
        };
        const res = await fetch(this.config.API_PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          if (res.status === 429) throw new Error('rate_limit');
          throw new Error(`Server ${res.status}`);
        }
        const raw = await res.json();
        if (!raw.text) throw new Error('Empty response');
        const cleaned = raw.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
        const data = JSON.parse(cleaned);
        if (!silent) this.toggleLoader(false);
        return data;
      } catch (err) {
        attempt++;
        if (attempt >= this.config.RETRY_LIMIT) {
          if (!silent) this.toggleLoader(false);
          const msg = err.message === 'rate_limit'
            ? 'Rate limit hit — wait a moment and retry.'
            : `AI error: ${err.message}`;
          if (!silent) this.toast(msg, 'error');
          throw err;
        }
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
  },

  toggleLoader(show) {
    document.getElementById('global-loader').classList.toggle('hidden', !show);
  },

  /* ══════════════════════════════════════════════════════════
     11. WORD OF THE DAY
  ══════════════════════════════════════════════════════════ */
  loadWordOfDay() {
    const today = new Date().toISOString().split('T')[0];
    if (this.state.wordOfDay && this.state.wordOfDayDate === today) {
      this.renderWOTD(this.state.wordOfDay);
    } else {
      this.fetchWordOfDay();
    }
  },

  async fetchWordOfDay(force = false) {
    const today = new Date().toISOString().split('T')[0];
    if (!force && this.state.wordOfDay && this.state.wordOfDayDate === today) return;
    try {
      const data = await this.callGeminiAPI('wotd', {});
      this.state.wordOfDay = data;
      this.state.wordOfDayDate = today;
      this.saveState();
      this.renderWOTD(data);
    } catch (e) {
      this.renderWOTD({ word: 'Ephemeral', partOfSpeech: 'adjective',
        definition: 'Lasting for a very short time.', example: 'The beauty of a sunset is ephemeral.' });
    }
  },

  renderWOTD(data) {
    document.getElementById('wotd-word').textContent    = data.word || '—';
    document.getElementById('wotd-pos').textContent     = data.partOfSpeech || '';
    document.getElementById('wotd-def').textContent     = data.definition || '';
    document.getElementById('wotd-example').textContent = data.example ? `"${data.example}"` : '';
  },

  /* ══════════════════════════════════════════════════════════
     12. IDIOM OF THE DAY (Dashboard)
  ══════════════════════════════════════════════════════════ */
  loadIdiomOfDay() {
    const today = new Date().toISOString().split('T')[0];
    if (this.state.idiomOfDay && this.state.idiomOfDayDate === today) {
      this.renderIdiomOfDay(this.state.idiomOfDay);
    } else {
      this.fetchIdiomOfDay();
    }
  },

  async fetchIdiomOfDay(force = false) {
    const today = new Date().toISOString().split('T')[0];
    if (!force && this.state.idiomOfDay && this.state.idiomOfDayDate === today) return;
    try {
      const data = await this.callGeminiAPI('idiom', { category: 'general', level: 'intermediate' });
      this.state.idiomOfDay = data;
      this.state.idiomOfDayDate = today;
      this.saveState();
      this.renderIdiomOfDay(data);
    } catch (e) {
      this.renderIdiomOfDay({ phrase: 'Break the ice', meaning: 'To say or do something to relieve tension.',
        example: 'He told a joke to break the ice at the meeting.' });
    }
  },

  renderIdiomOfDay(data) {
    document.getElementById('iotd-phrase').textContent  = data.phrase  || '—';
    document.getElementById('iotd-meaning').textContent = data.meaning || '';
    document.getElementById('iotd-example').textContent = data.example ? `"${data.example}"` : '';
  },

  saveToVocab(wordData) {
    const word = (wordData.word || '').toLowerCase();
    if (!word) return;
    if (this.state.vocabBank.some(w => w.word.toLowerCase() === word)) {
      this.toast('Already in your vocab bank!', 'warning'); return;
    }
    this.state.vocabBank.push({
      word: wordData.word, definition: wordData.definition || '',
      example: wordData.example || '', savedAt: Date.now(),
    });
    this.state.wordsLearned++;
    this.awardXP(5, 'save word');
    this.toast(`📌 "${wordData.word}" saved to vocab bank!`, 'success');
    this.saveState();
    this.checkBadges();
  },

  /* ══════════════════════════════════════════════════════════
     13. WORD EXPLORER
  ══════════════════════════════════════════════════════════ */
  async handleWordLookup() {
    const input = document.getElementById('word-input');
    const word  = input.value.trim().toLowerCase();
    if (!word) { this.toast('Type a word first!', 'error'); return; }
    if (this.state.cache[word]) {
      this.renderWordCard(this.state.cache[word]);
      this.toast('Loaded from cache 🧠');
      return;
    }
    try {
      const data = await this.callGeminiAPI('lookup', { word });
      this.state.cache[word] = data;
      this.state.wordsLearned++;
      this.saveState();
      this.renderWordCard(data);
      this.awardXP(10, 'word lookup');
      this.checkBadges();
    } catch (e) {
      this.loadDemoWord();
    }
  },

  renderWordCard(data) {
    const container = document.getElementById('word-result-container');
    const optionsHTML = (data.task?.options || []).map((opt, i) => `
      <button class="quiz-option" data-index="${i}" onclick="App.checkWordQuiz(${i}, ${data.task.correctIndex}, this)">
        ${opt}
      </button>`).join('');

    const synonymsHTML = data.synonyms?.length
      ? `<div class="tag-row">${data.synonyms.map(s => `<span class="tag tag-purple">↔ ${s}</span>`).join('')}</div>`
      : '';
    const antonymsHTML = data.antonyms?.length
      ? `<div class="tag-row">${data.antonyms.map(a => `<span class="tag tag-red">≠ ${a}</span>`).join('')}</div>`
      : '';

    container.innerHTML = `
      <div class="word-card">
        <div class="word-card-header">
          <div>
            <div class="word-title">${data.word || 'Word'}</div>
            <div class="word-pos">${data.partOfSpeech || ''} ${data.phonetic ? `<span class="phonetic">${data.phonetic}</span>` : ''}</div>
          </div>
          <div style="display:flex;gap:.5rem;">
            <button class="word-speak-btn" onclick="App.speak('${(data.word||'').replace(/'/g,"\\'")}')">
              <i class="fa-solid fa-volume-high"></i> Hear it
            </button>
          </div>
        </div>
        <div class="word-card-body">
          <p class="word-def">${data.definition || ''}</p>
          <p class="word-example">${data.example || ''}</p>
          ${synonymsHTML}${antonymsHTML}
          <div class="word-actions" style="margin-top:1rem;">
            <button class="word-save-btn" onclick="App.saveToVocab(${JSON.stringify(data).replace(/"/g,'&quot;')})">
              <i class="fa-solid fa-bookmark"></i> Save to Vocab
            </button>
          </div>
          ${data.task ? `
          <div class="word-quiz">
            <div class="quiz-question">🧠 ${data.task.question}</div>
            <div class="quiz-options">${optionsHTML}</div>
          </div>` : ''}
        </div>
      </div>`;
  },

  checkWordQuiz(selected, correct, btn) {
    const allBtns = btn.closest('.quiz-options').querySelectorAll('.quiz-option');
    allBtns.forEach(b => b.disabled = true);
    if (selected === correct) {
      btn.classList.add('correct');
      this.awardXP(20, 'quiz correct');
      this.playSound('correct');
      this.toast('🎯 Correct! +20 XP', 'success');
    } else {
      btn.classList.add('wrong');
      allBtns[correct].classList.add('correct');
      this.loseHeart();
      this.playSound('wrong');
      this.toast('❌ Not quite — check the meaning again.', 'error');
    }
  },

  loadDemoWord() {
    const demo = {
      word: 'Ephemeral', partOfSpeech: 'adjective', phonetic: '/ɪˈfɛm.ər.əl/',
      definition: 'Lasting for a very short time; transitory.',
      example: 'The beauty of a sunset is ephemeral, fading within minutes.',
      synonyms: ['fleeting', 'transient', 'momentary'],
      antonyms: ['permanent', 'enduring'],
      task: {
        question: 'Which sentence uses "ephemeral" correctly?',
        options: [
          'The mountain is ephemeral and will stand forever.',
          'Her joy was ephemeral, disappearing as quickly as it came.',
          'He ephemeral walked to the store.',
          'The ephemeral rock stood for millions of years.',
        ],
        correctIndex: 1,
      },
    };
    this.renderWordCard(demo);
    this.toast('Demo mode — API not connected.', 'warning');
  },

  /* ══════════════════════════════════════════════════════════
     14. GRAMMAR DRILLS
  ══════════════════════════════════════════════════════════ */
  async loadGrammarDrill() {
    const type  = document.getElementById('drill-type').value;
    const level = document.getElementById('drill-level').value;
    try {
      const data = await this.callGeminiAPI('grammar', { type, level });
      this.renderDrillCard(data);
    } catch (e) {
      this.renderDrillCard(this.getDemoDrill());
    }
  },

  renderDrillCard(data) {
    const container = document.getElementById('drill-container');
    const optionsHTML = (data.options || []).map((opt, i) => `
      <button class="drill-option" data-index="${i}"
        onclick="App.checkDrillAnswer(${i}, ${data.correctIndex}, this, '${(data.explanation||'').replace(/'/g,"\\'")}')">
        ${opt}
      </button>`).join('');
    container.innerHTML = `
      <div class="drill-card">
        <div class="drill-type-label">${data.typeLabel || 'Grammar Exercise'}</div>
        <div class="drill-question">${(data.question||'').replace(/___/g, '<span class="blank">___</span>')}</div>
        <div class="drill-options">${optionsHTML}</div>
        <div id="drill-explanation"></div>
      </div>`;
  },

  checkDrillAnswer(selected, correct, btn, explanation) {
    const allBtns = btn.closest('.drill-options').querySelectorAll('.drill-option');
    allBtns.forEach(b => b.disabled = true);
    const explEl = document.getElementById('drill-explanation');

    if (selected === correct) {
      btn.classList.add('correct');
      this.state.drillStreak++;
      this.awardXP(15, 'drill correct');
      this.playSound('correct');
      this.toast('✅ Correct! +15 XP', 'success');

      // Update drill streak display
      const streakEl = document.getElementById('drill-streak-count');
      const streakDisplay = document.getElementById('drill-streak-display');
      if (streakEl) streakEl.textContent = this.state.drillStreak;
      if (streakDisplay && this.state.drillStreak >= 2) streakDisplay.classList.remove('hidden');

      // ★ Earn heart back via drill streak
      if (this.state.drillStreak % this.config.HEART_DRILL_STREAK === 0 && this.state.hearts < this.config.MAX_HEARTS) {
        this.state.hearts = Math.min(this.config.MAX_HEARTS, this.state.hearts + 1);
        this.state.heartsRecovered = (this.state.heartsRecovered || 0) + 1;
        this.saveState();
        this.toast(`❤️ Drill streak ${this.state.drillStreak}! You earned a heart back!`, 'success', 4000);
        this.launchConfetti();
      }
    } else {
      btn.classList.add('wrong');
      if (allBtns[correct]) allBtns[correct].classList.add('correct');
      this.state.drillStreak = 0;
      document.getElementById('drill-streak-display')?.classList.add('hidden');
      this.loseHeart();
      this.playSound('wrong');
      this.toast('❌ Wrong — read the explanation below.', 'error');
    }

    if (explEl && explanation) {
      explEl.innerHTML = `<div class="drill-explanation"><strong>💡 Explanation:</strong> ${explanation}</div>
        <button class="btn-primary drill-next-btn" onclick="App.loadGrammarDrill()">
          <i class="fa-solid fa-forward"></i> Next Question
        </button>`;
    }
    this.saveState();
    this.checkBadges();
  },

  getDemoDrill() {
    return {
      typeLabel: 'Fill in the Blank',
      question: 'She ___ to the market every Sunday.',
      options: ['go', 'goes', 'going', 'gone'],
      correctIndex: 1,
      explanation: 'With third-person singular subjects (she, he, it), add -s to the base verb in present simple.',
    };
  },

  /* ══════════════════════════════════════════════════════════
     15. ROLEPLAY
  ══════════════════════════════════════════════════════════ */
  startRoleplay() {
    const card = document.querySelector('.scenario-card.active');
    if (!card) { this.toast('Pick a scenario!', 'error'); return; }
    const scenario = card.dataset.scenario;
    const emoji    = card.querySelector('.scenario-emoji').textContent;
    const label    = card.querySelector('span:last-child').textContent;

    this.state.roleplayHistory  = [];
    this.state.currentScenario  = scenario;

    document.getElementById('scenario-picker').style.display = 'none';
    const wrapper = document.getElementById('chat-wrapper');
    wrapper.classList.remove('hidden');
    document.querySelector('#chat-scenario-title span').textContent = `${emoji} ${label}`;
    document.getElementById('chat-window').innerHTML = '';
    this.appendMsg('system', `Scenario started: <strong>${label}</strong>. Start the conversation!`);
    document.getElementById('suggestion-pills').classList.add('hidden');
    document.getElementById('chat-input').focus();
  },

  appendMsg(role, text) {
    const win = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = `<div class="chat-bubble">${text}</div>`;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
  },

  async sendChatTurn() {
    const input = document.getElementById('chat-input');
    const text  = input.value.trim();
    if (!text) return;
    input.value = '';
    document.getElementById('suggestion-pills').classList.add('hidden');

    this.appendMsg('user', text);
    this.state.roleplayHistory.push({ role: 'user', text });

    try {
      const data = await this.callGeminiAPI('roleplay', {
        scenario: this.state.currentScenario,
        history:  this.state.roleplayHistory,
        lastMessage: text,
      });
      this.appendMsg('ai', data.reply);
      this.state.roleplayHistory.push({ role: 'ai', text: data.reply });
      this.renderSuggestionPills(data.suggestions || []);
      this.awardXP(5, 'roleplay turn');
    } catch(e) {
      this.appendMsg('system', '⚠️ Could not get a response. Try again.');
    }
  },

  renderSuggestionPills(suggestions) {
    const pills = document.getElementById('suggestion-pills');
    if (!suggestions.length) { pills.classList.add('hidden'); return; }
    pills.innerHTML =
      suggestions.map(s => `<button class="suggestion-pill" onclick="App.useSuggestion(this)">${s}</button>`).join('');
    pills.classList.remove('hidden');
  },

  useSuggestion(btn) {
    document.getElementById('chat-input').value = btn.textContent.trim();
    document.getElementById('suggestion-pills').classList.add('hidden');
    document.getElementById('chat-input').focus();
  },

  async endRoleplay() {
    if (this.state.roleplayHistory.length < 2) {
      document.getElementById('chat-wrapper').classList.add('hidden');
      document.getElementById('scenario-picker').style.display = '';
      return;
    }
    try {
      const data = await this.callGeminiAPI('roleplay_score', {
        scenario: this.state.currentScenario,
        history:  this.state.roleplayHistory,
      });
      this.renderRoleplayScore(data);
    } catch (e) {
      this.renderRoleplayScore({ fluency:7, vocabulary:7, grammar:7, naturalness:7, overall:70,
        feedback: 'Great effort! Keep practicing to build confidence.' });
    }
    this.state.roleplayCount++;
    this.awardXP(30, 'roleplay');
    this.checkBadges();
  },

  renderRoleplayScore(data) {
    document.getElementById('chat-wrapper').classList.add('hidden');
    document.getElementById('scenario-picker').style.display = '';
    const color = data.overall >= 70 ? 'var(--green)' : data.overall >= 50 ? 'var(--orange)' : 'var(--red)';
    const resultDiv = document.createElement('div');
    resultDiv.innerHTML = `
      <div class="word-card" style="margin-top:1.5rem;animation:bounceIn .5s;">
        <div class="word-card-header" style="background:linear-gradient(135deg,${color},${color}99);">
          <div>
            <div class="word-title">Session Complete! 🎉</div>
            <div class="word-pos">Overall Score: ${data.overall}/100</div>
          </div>
        </div>
        <div class="word-card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.25rem;">
            ${['fluency','vocabulary','grammar','naturalness'].map(k => `
              <div style="background:var(--bg);border-radius:var(--radius-xs);padding:.75rem;border:2px solid var(--border);">
                <div style="font-size:.75rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;">${k}</div>
                <div style="font-size:1.4rem;font-weight:900;color:var(--green-dark);">${data[k]}<small style="font-size:.75rem;color:var(--text-muted)">/10</small></div>
              </div>`).join('')}
          </div>
          <div style="padding:1rem;background:var(--blue-light);border-radius:var(--radius-xs);border:2px solid var(--blue);font-weight:600;font-size:.9rem;color:var(--blue-dark);">
            ${data.feedback}
          </div>
          <button class="btn-primary" style="margin-top:1rem;" onclick="this.closest('.word-card').remove()">
            <i class="fa-solid fa-redo"></i> Try Another
          </button>
        </div>
      </div>`;
    document.getElementById('roleplay').appendChild(resultDiv);
  },

  /* ══════════════════════════════════════════════════════════
     16. WRITING LAB
  ══════════════════════════════════════════════════════════ */
  handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) this.processImageFile(file);
  },

  processImageFile(file) {
    if (file.size > 2 * 1024 * 1024) { this.toast('File too large — max 2MB.', 'error'); return; }
    const preview = document.getElementById('image-preview');
    const wrap    = document.getElementById('image-preview-wrap');
    const reader  = new FileReader();
    reader.onload = e => { preview.src = e.target.result; wrap.classList.remove('hidden'); };
    reader.readAsDataURL(file);
    this._imageFile = file;
  },

  clearImageUpload() {
    document.getElementById('image-upload').value = '';
    document.getElementById('image-preview-wrap').classList.add('hidden');
    document.getElementById('image-preview').src = '';
    this._imageFile = null;
  },

  async handleWritingReview() {
    const text = document.getElementById('writing-input').value.trim();
    const file = this._imageFile;
    if (!text && !file) { this.toast('Add text or upload an image first.', 'error'); return; }
    let imageBase64 = null, imageMimeType = null;
    if (file) { imageBase64 = await this.toBase64(file); imageMimeType = file.type; }
    try {
      const data = await this.callGeminiAPI('writing', { text, imageBase64, imageMimeType });
      this.renderWritingResult(data);
      if (data.score > this.state.bestWritingScore) this.state.bestWritingScore = data.score;
      this.awardXP(data.score >= 80 ? 40 : 25, 'writing review');
      this.checkBadges();
    } catch (e) { console.error(e); }
  },

  renderWritingResult(data) {
    const container = document.getElementById('writing-result-container');
    const score     = data.score || 0;
    const deg       = Math.round((score / 100) * 360);
    const color     = score >= 70 ? 'var(--green)' : score >= 50 ? 'var(--orange)' : 'var(--red)';
    const strengthsHTML = (data.strengths || []).map(s =>
      `<div class="tip-item" style="border-left:3px solid var(--green);background:var(--green-light)">✅ ${s}</div>`).join('');
    const tipsHTML = (data.feedback || []).map(t => `<div class="tip-item">${t}</div>`).join('');
    container.innerHTML = `
      <div class="writing-result">
        <div class="score-row">
          <div class="score-ring-wrap">
            <div class="score-ring" id="score-ring-el">
              <span class="score-number">${score}</span>
            </div>
          </div>
          <div>
            <h3 style="font-size:1.2rem;font-weight:900;">Writing Score: ${score}/100</h3>
            <p style="color:var(--text-muted);font-weight:600;font-size:.9rem;margin-top:.25rem;">
              ${score >= 80 ? '🌟 Excellent work!' : score >= 60 ? '👍 Good effort!' : '📈 Keep practicing!'}
            </p>
            ${data.transcription ? `<p style="font-size:.85rem;margin-top:.5rem;font-weight:600;"><strong>Detected text:</strong> ${data.transcription}</p>` : ''}
          </div>
        </div>
        ${strengthsHTML ? `<h4 style="font-weight:800;margin:.75rem 0 .5rem;">What you did well:</h4>${strengthsHTML}` : ''}
        <h4 style="font-weight:800;margin:.75rem 0 .5rem;">Corrected Version:</h4>
        <div class="corrected-box">${data.correctedText || ''}</div>
        <h4 style="font-weight:800;margin:.75rem 0 .5rem;">Tips for Improvement:</h4>
        <div class="tips-list">${tipsHTML}</div>
      </div>`;
    setTimeout(() => {
      const ring = document.getElementById('score-ring-el');
      if (ring) ring.style.background = `conic-gradient(${color} ${deg}deg, var(--border) 0deg)`;
    }, 100);
  },

  /* ══════════════════════════════════════════════════════════
     17. 💡 IDIOM TRAINER TAB
  ══════════════════════════════════════════════════════════ */
  async loadIdiomDrill() {
    const category = document.getElementById('idiom-category').value;
    const level    = document.getElementById('idiom-level').value;
    try {
      const data = await this.callGeminiAPI('idiom', { category, level });
      this.renderIdiomCard(data);
      this.state.idiomsLearned = (this.state.idiomsLearned || 0) + 1;
      this.saveState();
      this.checkBadges();
    } catch(e) {
      this.renderIdiomCard({
        phrase: 'Break the ice',
        meaning: 'To do or say something to relieve tension or awkwardness in a social situation.',
        example: 'He told a funny joke to break the ice at the party.',
        origin:  'From the practice of ships breaking ice to open trade routes.',
        quiz: {
          question: 'What does "break the ice" mean?',
          options: ['To literally smash frozen water', 'To relieve tension in a social situation', 'To start a fight', 'To cool down a drink'],
          correctIndex: 1,
        },
      });
    }
  },

  renderIdiomCard(data) {
    const container = document.getElementById('idiom-container');
    const optHTML = (data.quiz?.options || []).map((opt, i) => `
      <button class="quiz-option" onclick="App.checkIdiomQuiz(${i}, ${data.quiz.correctIndex}, this)">
        ${opt}
      </button>`).join('');

    container.innerHTML = `
      <div class="idiom-card">
        <div class="idiom-card-phrase">
          <span class="idiom-emoji">💡</span>
          <h2>${data.phrase || '—'}</h2>
          <button class="word-speak-btn" onclick="App.speak('${(data.phrase||'').replace(/'/g,"\\'")}')">
            <i class="fa-solid fa-volume-high"></i>
          </button>
        </div>
        <div class="idiom-meaning"><strong>Meaning:</strong> ${data.meaning || ''}</div>
        <div class="idiom-example">"${data.example || ''}"</div>
        ${data.origin ? `<div class="idiom-origin"><i class="fa-solid fa-book-open"></i> ${data.origin}</div>` : ''}
        ${data.quiz ? `
        <div class="idiom-quiz">
          <div class="quiz-question">🧠 ${data.quiz.question}</div>
          <div class="quiz-options">${optHTML}</div>
        </div>` : ''}
        <div id="idiom-quiz-result"></div>
      </div>`;
    this.awardXP(5, 'idiom learned');
  },

  checkIdiomQuiz(selected, correct, btn) {
    const all = btn.closest('.quiz-options').querySelectorAll('.quiz-option');
    all.forEach(b => b.disabled = true);
    const resultEl = document.getElementById('idiom-quiz-result');
    if (selected === correct) {
      btn.classList.add('correct');
      this.awardXP(20, 'idiom quiz');
      this.playSound('correct');
      resultEl.innerHTML = `<div class="drill-explanation" style="color:var(--green-dark);background:var(--green-light);border:none;">🎉 Correct! You're mastering English idioms!</div>`;
      this.toast('🦉 Idiom mastered! +20 XP', 'success');
    } else {
      btn.classList.add('wrong');
      all[correct]?.classList.add('correct');
      this.loseHeart();
      this.playSound('wrong');
      resultEl.innerHTML = `<div class="drill-explanation">💡 Review the meaning above and try the next idiom!</div>`;
    }
    resultEl.innerHTML += `<button class="btn-primary" style="margin-top:.75rem;" onclick="App.loadIdiomDrill()">
      <i class="fa-solid fa-forward"></i> Next Idiom
    </button>`;
  },

  /* ══════════════════════════════════════════════════════════
     18. ⚡ SPEED CHALLENGE
  ══════════════════════════════════════════════════════════ */
  startSpeedChallenge() {
    document.getElementById('speed-lobby').classList.add('hidden');
    document.getElementById('speed-results').classList.add('hidden');
    document.getElementById('speed-arena').classList.remove('hidden');

    this._speedData = { correct: 0, wrong: 0, streak: 0, bestStreak: 0,
      timeLeft: this.config.SPEED_DURATION, question: null, answered: false };

    document.getElementById('speed-score').textContent  = '0';
    document.getElementById('speed-streak').textContent = '0';
    document.getElementById('speed-timer-text').textContent = this.config.SPEED_DURATION;

    this._loadSpeedQuestion();
    this._startSpeedTimer();
  },

  _startSpeedTimer() {
    if (this._speedTimerInterval) clearInterval(this._speedTimerInterval);
    const total = this.config.SPEED_DURATION;
    const circumference = 213.6;

    this._speedTimerInterval = setInterval(() => {
      this._speedData.timeLeft--;
      const t = this._speedData.timeLeft;
      document.getElementById('speed-timer-text').textContent = t;
      document.getElementById('speed-timer-bar').style.width  = `${(t / total) * 100}%`;

      const offset = circumference * (1 - t / total);
      const circle = document.getElementById('speed-ring-circle');
      if (circle) circle.style.strokeDashoffset = offset;

      if (t <= 0) {
        clearInterval(this._speedTimerInterval);
        this._endSpeedChallenge();
      }
    }, 1000);
  },

  async _loadSpeedQuestion() {
    const area = document.getElementById('speed-question-area');
    area.innerHTML = `<div class="speed-loading"><div class="loader-ring" style="width:36px;height:36px;"></div></div>`;
    try {
      const data = await this.callGeminiAPI('speed_drill',
        { level: this.state.speedDifficulty || 'beginner' }, true);
      this._speedData.question = data;
      this._renderSpeedQuestion(data);
    } catch(e) {
      this._renderSpeedQuestion({
        question: 'She ___ to school every day.',
        options: ['go', 'goes', 'going', 'gone'],
        correctIndex: 1,
      });
    }
  },

  _renderSpeedQuestion(data) {
    if (this._speedData.timeLeft <= 0) return;
    const area = document.getElementById('speed-question-area');
    const optHTML = (data.options || []).map((opt, i) => `
      <button class="speed-option" onclick="App._checkSpeedAnswer(${i}, ${data.correctIndex}, this)">
        ${opt}
      </button>`).join('');
    area.innerHTML = `
      <div class="speed-question">${(data.question||'').replace(/___/g, '<span class="blank">___</span>')}</div>
      <div class="speed-options">${optHTML}</div>`;
    this._speedData.answered = false;
  },

  _checkSpeedAnswer(selected, correct, btn) {
    if (this._speedData.answered) return;
    this._speedData.answered = true;

    const all = btn.closest('.speed-options').querySelectorAll('.speed-option');
    all.forEach(b => b.disabled = true);

    if (selected === correct) {
      btn.classList.add('correct');
      this._speedData.correct++;
      this._speedData.streak++;
      this._speedData.bestStreak = Math.max(this._speedData.bestStreak, this._speedData.streak);
      document.getElementById('speed-score').textContent  = this._speedData.correct;
      document.getElementById('speed-streak').textContent = this._speedData.streak;
      this.playSound('correct');
    } else {
      btn.classList.add('wrong');
      all[correct]?.classList.add('correct');
      this._speedData.wrong++;
      this._speedData.streak = 0;
      document.getElementById('speed-streak').textContent = '0';
      this.playSound('wrong');
    }

    // Load next question after short delay
    setTimeout(() => {
      if (this._speedData.timeLeft > 0) this._loadSpeedQuestion();
    }, 600);
  },

  _endSpeedChallenge() {
    document.getElementById('speed-arena').classList.add('hidden');
    document.getElementById('speed-results').classList.remove('hidden');

    const { correct, wrong, bestStreak } = this._speedData;
    const xpEarned = correct * this.config.SPEED_XP_PER_Q;

    document.getElementById('result-correct').textContent = correct;
    document.getElementById('result-wrong').textContent   = wrong;
    document.getElementById('result-xp').textContent      = xpEarned;
    document.getElementById('result-streak').textContent  = bestStreak;

    let icon = '⚡', title = 'Sprint Complete!', feedback = '';
    if (correct >= 20) { icon = '🔥'; title = 'Incredible!'; feedback = 'You\'re a grammar machine! Amazing speed and accuracy.'; }
    else if (correct >= 10) { icon = '🎉'; title = 'Great Sprint!'; feedback = 'Excellent work! Keep pushing your speed limits.'; }
    else if (correct >= 5)  { icon = '👍'; title = 'Good Job!'; feedback = 'Nice effort! Practice more drills to get faster.'; }
    else { icon = '💪'; title = 'Keep Training!'; feedback = 'Don\'t give up! Every sprint makes you stronger.'; }

    document.getElementById('speed-result-icon').textContent    = icon;
    document.getElementById('speed-result-title').textContent   = title;
    document.getElementById('speed-result-feedback').textContent = feedback;

    if (correct > this.state.bestSpeedScore) {
      this.state.bestSpeedScore = correct;
      this.toast(`🏆 New best: ${correct} correct!`, 'success', 4000);
    }
    if (xpEarned > 0) this.awardXP(xpEarned, 'speed challenge');
    this.checkBadges();
  },

  resetSpeedChallenge() {
    document.getElementById('speed-results').classList.add('hidden');
    document.getElementById('speed-lobby').classList.remove('hidden');
    document.getElementById('speed-best').textContent = this.state.bestSpeedScore;
  },

  /* ══════════════════════════════════════════════════════════
     19. VOCAB BANK
  ══════════════════════════════════════════════════════════ */
  renderVocabBank() {
    const empty   = document.getElementById('vocab-empty');
    const content = document.getElementById('vocab-content');
    const grid    = document.getElementById('vocab-grid');
    this.updateVocabCount();
    if (!this.state.vocabBank.length) {
      empty.classList.remove('hidden'); content.classList.add('hidden'); return;
    }
    empty.classList.add('hidden'); content.classList.remove('hidden');
    grid.innerHTML = this.state.vocabBank.map((w, i) => `
      <div class="vocab-item" title="${w.example || ''}">
        <button class="vocab-item-del" onclick="App.deleteVocabWord(${i}, event)">✕</button>
        <div class="vocab-item-word">${w.word}</div>
        <div class="vocab-item-def">${w.definition}</div>
      </div>`).join('');
  },

  deleteVocabWord(index, e) {
    e.stopPropagation();
    this.state.vocabBank.splice(index, 1);
    this.saveState();
    this.renderVocabBank();
    this.toast('Word removed.', 'warning');
  },

  clearVocabBank() {
    if (!confirm('Clear all saved words?')) return;
    this.state.vocabBank = [];
    this.saveState();
    this.renderVocabBank();
    this.toast('Vocab bank cleared.', 'warning');
  },

  async startVocabQuiz() {
    if (!this.state.vocabBank.length) { this.toast('No words to quiz!', 'error'); return; }
    const pick = this.state.vocabBank[Math.floor(Math.random() * this.state.vocabBank.length)];
    try {
      const data = await this.callGeminiAPI('vocab_quiz', { word: pick.word, definition: pick.definition });
      this.renderVocabQuiz(pick, data);
    } catch (e) {
      this.renderVocabQuiz(pick, {
        question: `What does "${pick.word}" mean?`,
        options: [pick.definition, 'A type of weather', 'An action verb', 'A place or location'],
        correctIndex: 0,
      });
    }
  },

  renderVocabQuiz(word, quiz) {
    const grid = document.getElementById('vocab-grid');
    const optHTML = (quiz.options || []).map((o, i) => `
      <button class="quiz-option" onclick="App.checkVocabQuiz(${i}, ${quiz.correctIndex}, this)">
        ${o}
      </button>`).join('');
    const quizDiv = document.createElement('div');
    quizDiv.className = 'word-card';
    quizDiv.style.marginBottom = '1.5rem';
    quizDiv.innerHTML = `
      <div class="word-card-header">
        <div><div class="word-title">${word.word}</div><div class="word-pos">Quick Quiz</div></div>
      </div>
      <div class="word-card-body">
        <div class="quiz-question">🧠 ${quiz.question}</div>
        <div class="quiz-options">${optHTML}</div>
      </div>`;
    const content = document.getElementById('vocab-content');
    content.insertBefore(quizDiv, grid);
    quizDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  checkVocabQuiz(selected, correct, btn) {
    const all = btn.closest('.quiz-options').querySelectorAll('.quiz-option');
    all.forEach(b => b.disabled = true);
    if (selected === correct) {
      btn.classList.add('correct');
      this.awardXP(15, 'vocab quiz');
      this.playSound('correct');
      this.toast('🎯 Correct! +15 XP', 'success');
    } else {
      btn.classList.add('wrong');
      all[correct]?.classList.add('correct');
      this.loseHeart();
      this.playSound('wrong');
    }
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-primary';
    nextBtn.style.marginTop = '.75rem';
    nextBtn.innerHTML = '<i class="fa-solid fa-forward"></i> Next Word';
    nextBtn.onclick = () => { btn.closest('.word-card').remove(); this.startVocabQuiz(); };
    btn.closest('.word-card-body').appendChild(nextBtn);
  },

  /* ══════════════════════════════════════════════════════════
     20. TTS
  ══════════════════════════════════════════════════════════ */
  speak(text) {
    const synth = window.speechSynthesis;
    if (!synth) return this.toast('TTS not supported.', 'error');
    synth.cancel();
    const doSpeak = () => {
      const utt    = new SpeechSynthesisUtterance(text);
      const lang   = document.getElementById('variant-select').value === 'UK' ? 'en-GB' : 'en-US';
      const voices = synth.getVoices();
      utt.voice    = voices.find(v => v.lang === lang)
                  || voices.find(v => v.lang.startsWith('en-'))
                  || voices[0];
      utt.rate = 0.9; utt.pitch = 1;
      synth.speak(utt);
    };
    if (synth.getVoices().length > 0) doSpeak();
    else synth.addEventListener('voiceschanged', doSpeak, { once: true });
  },

  /* ══════════════════════════════════════════════════════════
     21. SOUND EFFECTS
  ══════════════════════════════════════════════════════════ */
  playSound(type) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx  = new AC();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      const note = (freq, start, dur, vol = 0.2) => {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      if (type === 'correct') { note(523,0,.1); note(659,.08,.1); note(784,.16,.2); }
      else if (type === 'wrong') { note(300,0,.12,.15); note(220,.1,.2,.15); }
      else if (type === 'xp') { note(660,0,.08,.1); note(880,.06,.1,.1); }
      else if (type === 'levelup') { [523,659,784,1047].forEach((f,i) => note(f,i*.1,.15,.25)); }
    } catch(_) {}
  },

  /* ══════════════════════════════════════════════════════════
     22. CONFETTI
  ══════════════════════════════════════════════════════════ */
  launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx    = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    const colors = ['#58CC02','#1CB0F6','#FF9600','#FFD900','#CE82FF','#FF4B4B'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random()*canvas.width, y: -20-Math.random()*100,
      vx: (Math.random()-.5)*5, vy: Math.random()*3+2,
      rot: Math.random()*360, rotV: (Math.random()-.5)*12,
      w: Math.random()*10+5, h: Math.random()*5+3,
      color: colors[Math.floor(Math.random()*colors.length)],
    }));
    let alive = true;
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.rot+=p.rotV; p.vy+=.04;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
      });
      if (alive) requestAnimationFrame(draw);
    };
    draw();
    setTimeout(() => { alive=false; canvas.style.display='none'; }, 3000);
  },

  /* ══════════════════════════════════════════════════════════
     23. TOAST SYSTEM
  ══════════════════════════════════════════════════════════ */
  toast(msg, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    const icons = { success:'circle-check', error:'circle-xmark', warning:'triangle-exclamation', info:'circle-info' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa-solid fa-${icons[type]||'circle-info'}"></i> ${msg}`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 400); }, duration);
  },

  /* ══════════════════════════════════════════════════════════
     24. UTILS
  ══════════════════════════════════════════════════════════ */
  toBase64: file => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  }),
};

document.addEventListener('DOMContentLoaded', () => App.init());