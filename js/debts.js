/* ============================================
   FinTrack — Debts
   ============================================ */

const Debts = {
  activeTab: 'owed', // owed | owe

  render() {
    const debts = Store.getDebts();
    const owed = debts.filter(d => d.type === 'owed');
    const owe = debts.filter(d => d.type === 'owe');
    const totalOwed = Store.getDebtsTotalOwed();
    const totalOwe = Store.getDebtsTotalOwe();
    const current = this.activeTab === 'owed' ? owed : owe;
    const emptyText = this.activeTab === 'owed' ? 'Никто вам не должен' : 'Вы никому не должны';

    const emptyState = `<div class="empty-state"><div class="empty-state__icon">🤝</div><div class="empty-state__title">Нет долгов</div><div class="empty-state__text">${emptyText}</div></div>`;

    const el = document.getElementById('page-debts');
    el.innerHTML = `
      <div class="stats-row animate-fade-in-up">
        <div class="card stat-card">
          <div class="stat-card__value text-green font-mono">${Utils.formatMoney(totalOwed)}</div>
          <div class="stat-card__label">Мне должны</div>
        </div>
        <div class="card stat-card">
          <div class="stat-card__value text-red font-mono">${Utils.formatMoney(totalOwe)}</div>
          <div class="stat-card__label">Я должен</div>
        </div>
      </div>

      <div class="debt-tabs animate-fade-in-up stagger-1">
        <button class="debt-tab ${this.activeTab === 'owed' ? 'active' : ''}" onclick="Debts.setTab('owed')">Мне должны (${owed.length})</button>
        <button class="debt-tab ${this.activeTab === 'owe' ? 'active' : ''}" onclick="Debts.setTab('owe')">Я должен (${owe.length})</button>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-bottom: var(--space-md);" class="animate-fade-in-up stagger-2">
        <button class="btn btn--sm btn--primary" onclick="Debts.openAddModal()">+ Новый долг</button>
      </div>

      <div id="debt-list" class="animate-fade-in-up stagger-3">
        ${current.length ? current.map(d => this.renderItem(d)).join('') : emptyState}
      </div>
    `;
  },

  renderItem(d) {
    const paid = d.amount - d.remaining;
    const pct = d.amount > 0 ? (paid / d.amount * 100) : 0;
    const isOwed = d.type === 'owed';

    return `
      <div class="card debt-item" style="margin-bottom: var(--space-sm);">
        <div class="debt-item__header">
          <div>
            <div class="debt-item__person">${d.person}</div>
            <div class="debt-item__desc">${d.description || ''}</div>
          </div>
          <div class="debt-item__amount ${isOwed ? 'text-green' : 'text-red'}">${Utils.formatMoney(d.amount)}</div>
        </div>
        <div class="debt-item__bar">
          <div class="debt-item__fill" style="width: ${pct}%"></div>
        </div>
        <div class="debt-item__footer">
          <div class="debt-item__remaining">Осталось: <span>${Utils.formatMoney(d.remaining)}</span></div>
          <div style="display: flex; gap: var(--space-sm);">
            <button class="btn btn--sm btn--ghost" onclick="Debts.openPayModal('${d.id}')">💸 Внести</button>
            <button class="btn btn--sm btn--danger" onclick="Debts.delete('${d.id}')">✕</button>
          </div>
        </div>
        ${d.payments.length ? `
          <div style="margin-top: var(--space-md); border-top: 1px solid var(--border-subtle); padding-top: var(--space-sm);">
            <div style="font-size: var(--fs-xs); color: var(--text-tertiary); margin-bottom: var(--space-xs);">История платежей:</div>
            ${d.payments.map(p => `<div style="font-size: var(--fs-xs); color: var(--text-secondary); display: flex; justify-content: space-between;"><span>${Utils.formatDate(p.date)}</span><span class="font-mono">−${Utils.formatMoney(p.amount)}</span></div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  setTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  openAddModal() {
    document.getElementById('debt-person-input').value = '';
    document.getElementById('debt-amount-input').value = '';
    document.getElementById('debt-desc-input').value = '';
    document.getElementById('debt-type-select').value = this.activeTab;
    App.openModal('debt-modal');
  },

  saveFromModal() {
    const type = document.getElementById('debt-type-select').value;
    const person = document.getElementById('debt-person-input').value.trim();
    const amount = parseFloat(document.getElementById('debt-amount-input').value);
    const description = document.getElementById('debt-desc-input').value.trim();

    if (!person) { alert('Введите имя'); return; }
    if (!amount || amount <= 0) { alert('Введите сумму'); return; }

    Store.addDebt({ type, person, amount, description, date: Utils.getToday() });
    App.closeModal('debt-modal');
    this.render();
  },

  openPayModal(debtId) {
    const debt = Store.getAllDebts().find(d => d.id === debtId);
    if (!debt) return;
    document.getElementById('pay-debt-id').value = debtId;
    document.getElementById('pay-amount-input').value = '';
    document.getElementById('pay-amount-input').placeholder = `Макс: ${Utils.formatMoney(debt.remaining)}`;
    document.getElementById('pay-amount-input').max = debt.remaining;
    App.openModal('payment-modal');
  },

  savePayment() {
    const debtId = document.getElementById('pay-debt-id').value;
    const amount = parseFloat(document.getElementById('pay-amount-input').value);

    if (!amount || amount <= 0) { alert('Введите сумму'); return; }

    Store.addDebtPayment(debtId, amount);
    App.closeModal('payment-modal');
    this.render();
  },

  delete(id) {
    if (confirm('Удалить долг?')) {
      Store.deleteDebt(id);
      this.render();
    }
  }
};
