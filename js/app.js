/* ============================================
   FinTrack — Main App Controller
   ============================================ */

const App = {
  currentPage: 'dashboard',
  tg: window.Telegram?.WebApp || null,

  init() {
    // --- Telegram Web App Init ---
    if (this.tg) {
      this.tg.ready();           // Сообщаем TG, что приложение готово
      this.tg.expand();          // Раскрываем на весь экран
      this.tg.disableVerticalSwipes(); // Отключаем закрытие свайпом вниз

      // Подстраиваем цветовую схему под тему Telegram
      this._applyTelegramTheme();

      // Обрабатываем кнопку "Назад" в Telegram
      this.tg.BackButton.onClick(() => {
        if (this.currentPage !== 'dashboard') {
          this.switchTab('dashboard');
        } else {
          this.tg.close();
        }
      });
    }

    this.setupNavigation();
    this.setupModals();
    this._initializing = true;   // флаг: не рендерить во время init
    this.switchTab('dashboard');
    this._initializing = false;

    // Загружаем данные из CloudStorage при старте, затем рендерим
    Store.init().then(() => {
      this.renderPage(this.currentPage);
    });
  },

  _applyTelegramTheme() {
    if (!this.tg) return;
    const tp = this.tg.themeParams;
    // Если TG передаёт тёмную тему — используем её цвета, иначе оставляем свои
    if (tp && this.tg.colorScheme === 'dark') {
      document.documentElement.style.setProperty('--tg-safe-area-top', `${this.tg.safeAreaInset?.top || 0}px`);
    }
  },

  setupNavigation() {
    document.querySelectorAll('.tab-item[data-page]').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.page));
    });

    // FAB button
    document.getElementById('fab-btn').addEventListener('click', () => {
      this.openTransactionModal({ type: 'expense' });
    });
  },

  switchTab(page) {
    this.currentPage = page;

    // Update tab bar
    document.querySelectorAll('.tab-item[data-page]').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');

    // Update header
    const titles = {
      dashboard: 'FinTrack',
      transactions: 'Операции',
      budget: 'Бюджет',
      savings: 'Копилка',
      debts: 'Долги',
      stats: 'Статистика'
    };
    document.getElementById('header-title').textContent = titles[page] || 'FinTrack';

    // Show/hide stats button
    document.getElementById('header-stats-btn').style.display = page === 'dashboard' ? '' : 'none';

    // Telegram BackButton — показываем на всех страницах кроме главной
    if (this.tg) {
      page !== 'dashboard' ? this.tg.BackButton.show() : this.tg.BackButton.hide();
    }

    // Render page
    if (!this._initializing) this.renderPage(page);
  },

  renderPage(page) {
    switch (page) {
      case 'dashboard': Dashboard.render(); break;
      case 'transactions': Transactions.render(); break;
      case 'budget': Budget.render(); break;
      case 'savings': Savings.render(); break;
      case 'debts': Debts.render(); break;
      case 'stats': Stats.render(); break;
    }
  },

  // --- Modals ---
  setupModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal(overlay.id);
      });
    });
  },

  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
    document.body.style.overflow = '';
  },

  openTransactionModal(prefill = {}) {
    const type = prefill.type || 'expense';
    const modal = document.getElementById('transaction-modal');

    // Set toggle state
    document.querySelectorAll('#txn-toggle .toggle-item').forEach(t => {
      t.className = 'toggle-item';
      if (t.dataset.type === type) {
        t.classList.add(type === 'income' ? 'active--income' : 'active--expense');
      }
    });

    // Populate categories
    this.updateCategoryOptions(type);

    // Set fields
    document.getElementById('modal-amount').value = prefill.amount || '';
    document.getElementById('modal-description').value = prefill.description || '';
    document.getElementById('modal-date').value = prefill.date || Utils.getToday();

    if (prefill.category) {
      setTimeout(() => {
        document.getElementById('modal-category').value = prefill.category;
      }, 10);
    }

    // Modal title
    document.getElementById('txn-modal-title').textContent = Transactions.editingId ? 'Редактировать' : 'Новая операция';

    this.openModal('transaction-modal');
  },

  updateCategoryOptions(type) {
    const cats = CATEGORIES[type] || CATEGORIES.expense;
    document.getElementById('modal-category').innerHTML =
      '<option value="">Выберите категорию</option>' +
      cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  },

  toggleTransactionType(el) {
    const type = el.dataset.type;
    document.querySelectorAll('#txn-toggle .toggle-item').forEach(t => {
      t.className = 'toggle-item';
    });
    el.classList.add(type === 'income' ? 'active--income' : 'active--expense');
    this.updateCategoryOptions(type);
  }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => App.init());
