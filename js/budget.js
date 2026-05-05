/* ============================================
   FinTrack — Budget
   ============================================ */

const Budget = {
  render() {
    const monthKey = Utils.getCurrentMonthKey();
    const budgets = Store.getBudgets(monthKey);
    const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + Store.getBudgetSpent(b.category, monthKey), 0);

    const el = document.getElementById('page-budget');
    el.innerHTML = `
      <div class="card animate-fade-in-up" style="margin-bottom: var(--space-base);">
        <div class="section-header">
          <div class="section-title">Бюджет на ${Utils.getMonthName(monthKey)}</div>
          <button class="btn btn--sm btn--ghost" onclick="Budget.openAddModal()">+ Добавить</button>
        </div>
        ${totalLimit > 0 ? `
          <div style="margin-top: var(--space-sm);">
            <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-xs);">
              <span class="text-secondary" style="font-size: var(--fs-sm);">Потрачено</span>
              <span class="font-mono" style="font-size: var(--fs-sm);">${Utils.formatMoney(totalSpent)} / ${Utils.formatMoney(totalLimit)}</span>
            </div>
            <div class="budget-item__bar">
              <div class="budget-item__fill ${this.getBarClass(totalSpent, totalLimit)}" style="width: ${Math.min(totalSpent / totalLimit * 100, 100)}%"></div>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="animate-fade-in-up stagger-1" id="budget-list">
        ${budgets.length ? budgets.map(b => this.renderItem(b, monthKey)).join('') : '<div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__title">Нет бюджетов</div><div class="empty-state__text">Установите лимиты расходов по категориям</div></div>'}
      </div>
    `;
  },

  renderItem(b, monthKey) {
    const cat = getCategoryById(b.category);
    const spent = Store.getBudgetSpent(b.category, monthKey);
    const pct = b.limit > 0 ? Math.min(spent / b.limit * 100, 100) : 0;
    const barClass = this.getBarClass(spent, b.limit);

    return `
      <div class="card budget-item" style="margin-bottom: var(--space-sm);">
        <div class="budget-item__header">
          <div class="budget-item__category">
            <span>${cat.icon}</span>
            <span>${cat.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <div class="budget-item__amounts">${Utils.formatMoney(spent)} / ${Utils.formatMoney(b.limit)}</div>
            <button class="btn btn--icon btn--danger" onclick="Budget.delete('${b.id}')" title="Удалить" style="width:24px;height:24px;font-size:11px;">✕</button>
          </div>
        </div>
        <div class="budget-item__bar">
          <div class="budget-item__fill ${barClass}" style="width: ${pct}%"></div>
        </div>
        ${spent > b.limit ? '<div style="font-size: var(--fs-xs); color: var(--accent-red); margin-top: var(--space-xs);">⚠ Лимит превышен!</div>' : ''}
        ${spent > b.limit * 0.8 && spent <= b.limit ? '<div style="font-size: var(--fs-xs); color: var(--accent-amber); margin-top: var(--space-xs);">⚡ Почти на лимите</div>' : ''}
      </div>
    `;
  },

  getBarClass(spent, limit) {
    if (limit <= 0) return 'budget-item__fill--ok';
    const pct = spent / limit;
    if (pct > 1) return 'budget-item__fill--over';
    if (pct > 0.8) return 'budget-item__fill--warn';
    return 'budget-item__fill--ok';
  },

  openAddModal() {
    const monthKey = Utils.getCurrentMonthKey();
    const existingCats = Store.getBudgets(monthKey).map(b => b.category);
    const availableCats = CATEGORIES.expense.filter(c => !existingCats.includes(c.id));

    if (availableCats.length === 0) {
      alert('Бюджеты установлены для всех категорий!');
      return;
    }

    const modal = document.getElementById('budget-modal');
    document.getElementById('budget-category-select').innerHTML = availableCats.map(c =>
      `<option value="${c.id}">${c.icon} ${c.name}</option>`
    ).join('');
    document.getElementById('budget-limit-input').value = '';
    App.openModal('budget-modal');
  },

  saveFromModal() {
    const category = document.getElementById('budget-category-select').value;
    const limit = parseFloat(document.getElementById('budget-limit-input').value);

    if (!limit || limit <= 0) { alert('Введите лимит'); return; }

    Store.addBudget({ category, limit, month: Utils.getCurrentMonthKey() });
    App.closeModal('budget-modal');
    this.render();
  },

  delete(id) {
    if (confirm('Удалить бюджет?')) {
      Store.deleteBudget(id);
      this.render();
    }
  }
};
