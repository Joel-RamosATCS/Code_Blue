/* Only summary statistics and preferences are stored — never an in-progress patient or answer. */
const Storage = {
  key: 'codeBlueProgress',
  defaults: { highScore:0, longestStreak:0, total:0, bestAccuracy:0,
    settings:{difficulty:'resident', hints:false, dynamic:false, muted:false} },
  get() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.key));
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return this.fresh();
      const settings = saved.settings && typeof saved.settings === 'object' ? saved.settings : {};
      return {
        highScore: Number.isFinite(saved.highScore) && saved.highScore >= 0 ? saved.highScore : 0,
        longestStreak: Number.isFinite(saved.longestStreak) && saved.longestStreak >= 0 ? saved.longestStreak : 0,
        total: Number.isFinite(saved.total) && saved.total >= 0 ? saved.total : 0,
        bestAccuracy: Number.isFinite(saved.bestAccuracy) && saved.bestAccuracy >= 0 ? saved.bestAccuracy : 0,
        settings: {
          difficulty: ['student','resident','codeblue'].includes(settings.difficulty) ? settings.difficulty : 'resident',
          hints: Boolean(settings.hints), dynamic: Boolean(settings.dynamic), muted: Boolean(settings.muted)
        }
      };
    } catch { return this.fresh(); }
  },
  fresh() { return { ...this.defaults, settings:{...this.defaults.settings} }; },
  save(data) { try { localStorage.setItem(this.key, JSON.stringify(data)); } catch { /* Storage is optional. */ } },
  reset() { try { localStorage.removeItem(this.key); } catch {} }
};
