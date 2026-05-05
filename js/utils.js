/* ============================================
   FinTrack — Utility Functions
   ============================================ */

const Utils = {
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  formatMoney(amount, showSign = false) {
    const abs = Math.abs(amount);
    const formatted = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(abs);
    const sign = showSign ? (amount >= 0 ? '+' : '−') : (amount < 0 ? '−' : '');
    return `${sign}${formatted} ₽`;
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  },

  formatDateFull(dateStr) {
    const d = new Date(dateStr);
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  },

  getMonthKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  getMonthName(monthKey) {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const [, m] = monthKey.split('-');
    return months[parseInt(m) - 1];
  },

  getToday() {
    return new Date().toISOString().split('T')[0];
  },

  getCurrentMonthKey() {
    return this.getMonthKey(new Date());
  },

  isCurrentMonth(dateStr) {
    return this.getMonthKey(dateStr) === this.getCurrentMonthKey();
  },

  daysAgo(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Сегодня';
    if (diff === 1) return 'Вчера';
    return this.formatDate(dateStr);
  },

  animateCounter(el, target, duration = 800) {
    const start = parseFloat(el.textContent.replace(/[^\d.-]/g, '')) || 0;
    const startTime = performance.now();
    const update = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      el.textContent = Utils.formatMoney(current);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },

  clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  },

  groupBy(arr, keyFn) {
    return arr.reduce((acc, item) => {
      const key = keyFn(item);
      (acc[key] = acc[key] || []).push(item);
      return acc;
    }, {});
  }
};

/* --- Category Definitions --- */
const CATEGORIES = {
  expense: [
    { id: 'food', name: 'Еда', icon: '🍔' },
    { id: 'housing', name: 'Жильё', icon: '🏠' },
    { id: 'transport', name: 'Транспорт', icon: '🚗' },
    { id: 'entertainment', name: 'Развлечения', icon: '🎮' },
    { id: 'clothing', name: 'Одежда', icon: '👕' },
    { id: 'health', name: 'Здоровье', icon: '💊' },
    { id: 'education', name: 'Образование', icon: '📚' },
    { id: 'telecom', name: 'Связь', icon: '📱' },
    { id: 'shopping', name: 'Покупки', icon: '🛒' },
    { id: 'other_expense', name: 'Другое', icon: '📦' }
  ],
  income: [
    { id: 'salary', name: 'Зарплата', icon: '💼' },
    { id: 'freelance', name: 'Фриланс', icon: '💰' },
    { id: 'sales', name: 'Продажи', icon: '🏷️' },
    { id: 'gift', name: 'Подарки', icon: '🎁' },
    { id: 'investments', name: 'Инвестиции', icon: '📈' },
    { id: 'refund', name: 'Возврат', icon: '🔄' },
    { id: 'other_income', name: 'Другое', icon: '📦' }
  ]
};

function getCategoryById(id) {
  const all = [...CATEGORIES.expense, ...CATEGORIES.income];
  return all.find(c => c.id === id) || { id, name: id, icon: '📦' };
}
