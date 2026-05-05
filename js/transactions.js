/* ============================================
   FinTrack — Transactions
   ============================================ */

const Transactions = {
  filter: 'all', // all | income | expense
  editingId: null,

  render() {
    const allTxns = Store.getTransactions();
    const filtered = this.filter === 'all' ? allTxns : allTxns.filter(t => t.type === this.filter);

    const el = document.getElementById('page-transactions');
    el.innerHTML = `
      <div class="search-bar animate-fade-in-up">
        <div class="search-bar__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <input class="form-input" id="txn-search" type="text" placeholder="Поиск операций..." oninput="Transactions.onSearch(this.value)">
      </div>

      <div class="filter-tabs animate-fade-in-up stagger-1">
        <button class="filter-tab ${this.filter === 'all' ? 'active' : ''}" onclick="Transactions.setFilter('all')">Все</button>
        <button class="filter-tab ${this.filter === 'income' ? 'active' : ''}" onclick="Transactions.setFilter('income')">Доходы</button>
        <button class="filter-tab ${this.filter === 'expense' ? 'active' : ''}" onclick="Transactions.setFilter('expense')">Расходы</button>
      </div>

      <div class="card animate-fade-in-up stagger-2" id="txn-list">
        ${filtered.length ? filtered.map(t => this.renderItem(t)).join('') : '<div class="empty-state"><div class="empty-state__icon">📭</div><div class="empty-state__title">Нет операций</div><div class="empty-state__text">Добавьте первую операцию через кнопку +</div></div>'}
      </div>
    `;
  },

  renderItem(t) {
    const cat = getCategoryById(t.category);
    const isIncome = t.type === 'income';
    return `
      <div class="transaction-item">
        <div class="transaction-item__icon transaction-item__icon--${t.type}">${cat.icon}</div>
        <div class="transaction-item__info">
          <div class="transaction-item__category">${cat.name}</div>
          <div class="transaction-item__desc">${t.description || ''}</div>
        </div>
        <div class="transaction-item__right">
          <div class="transaction-item__amount transaction-item__amount--${t.type}">
            ${isIncome ? '+' : '−'}${Utils.formatMoney(t.amount)}
          </div>
          <div class="transaction-item__date">${Utils.daysAgo(t.date)}</div>
        </div>
        <button class="transaction-item__delete" onclick="event.stopPropagation(); Transactions.delete('${t.id}')" title="Удалить">✕</button>
      </div>
    `;
  },

  setFilter(f) {
    this.filter = f;
    this.render();
  },

  onSearch(query) {
    const q = query.toLowerCase().trim();
    const items = document.querySelectorAll('#txn-list .transaction-item');
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? '' : 'none';
    });
  },

  delete(id) {
    if (confirm('Удалить операцию?')) {
      Store.deleteTransaction(id);
      this.render();
      Dashboard.render();
    }
  },

  showEdit(id) {
    this.editingId = id;
    const t = Store.getTransactions().find(t => t.id === id);
    if (!t) return;
    App.openTransactionModal(t);
  },

  // --- Modal Logic ---
  openModal(prefillType) {
    this.editingId = null;
    App.openTransactionModal({ type: prefillType || 'expense' });
  },

  saveFromModal() {
    const type = document.querySelector('.toggle-item.active--income, .toggle-item.active--expense')?.dataset.type || 'expense';
    const amount = parseFloat(document.getElementById('modal-amount').value);
    const category = document.getElementById('modal-category').value;
    const description = document.getElementById('modal-description').value;
    const date = document.getElementById('modal-date').value;

    if (!amount || amount <= 0) { alert('Введите сумму'); return; }
    if (!category) { alert('Выберите категорию'); return; }
    if (!date) { alert('Выберите дату'); return; }

    const data = { type, amount, category, description, date };

    if (this.editingId) {
      Store.updateTransaction(this.editingId, data);
    } else {
      Store.addTransaction(data);
    }

    App.closeModal('transaction-modal');
    this.editingId = null;

    // Re-render active page
    const activePage = document.querySelector('.page.active')?.id;
    if (activePage === 'page-dashboard') Dashboard.render();
    if (activePage === 'page-transactions') this.render();
    if (activePage === 'page-budget') Budget.render();
    if (activePage === 'page-stats') Stats.render();
  }
};
