/* ============================================
   FinTrack — Savings (Копилка)
   ============================================ */

const SAVING_ICONS = ['🎯', '📱', '✈️', '🏠', '🚗', '💻', '🎮', '👟', '🎓', '💍', '🎁', '💰', '🏖️', '🛍️', '📸', '🎵'];

const Savings = {
  render() {
    const goals = Store.getSavings();
    const active = goals.filter(g => !g.completed);
    const completed = goals.filter(g => g.completed);
    const totalSaved = Store.getTotalSaved();
    const totalTarget = Store.getTotalSavingsTarget();
    const overallPct = totalTarget > 0 ? Math.min(totalSaved / totalTarget * 100, 100) : 0;

    const el = document.getElementById('page-savings');
    el.innerHTML = `
      <div class="card animate-fade-in-up" style="margin-bottom: var(--space-base); text-align: center; padding: var(--space-xl);">
        <div style="font-size: var(--fs-sm); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--space-sm);">Всего отложено</div>
        <div class="font-mono" style="font-size: var(--fs-2xl); font-weight: 700; color: var(--accent-purple-light); margin-bottom: var(--space-md);">${Utils.formatMoney(totalSaved)}</div>
        ${totalTarget > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: var(--fs-xs); color: var(--text-secondary); margin-bottom: var(--space-xs);">
            <span>Прогресс</span>
            <span class="font-mono">${Math.round(overallPct)}%</span>
          </div>
          <div class="budget-item__bar">
            <div class="budget-item__fill budget-item__fill--ok" style="width: ${overallPct}%; background: linear-gradient(90deg, var(--accent-purple), var(--accent-purple-light));"></div>
          </div>
        ` : ''}
      </div>

      <div class="section-header animate-fade-in-up stagger-1">
        <div class="section-title">Цели накоплений</div>
        <button class="btn btn--sm btn--primary" onclick="Savings.openAddModal()">+ Новая цель</button>
      </div>

      <div id="savings-list" class="animate-fade-in-up stagger-2">
        ${active.length ? active.map(g => this.renderGoal(g)).join('') : ''}
        ${completed.length ? `
          <div style="margin-top: var(--space-lg);">
            <div style="font-size: var(--fs-sm); color: var(--text-secondary); margin-bottom: var(--space-sm); font-weight: 600;">✅ Достигнутые цели</div>
            ${completed.map(g => this.renderGoal(g)).join('')}
          </div>
        ` : ''}
        ${!active.length && !completed.length ? '<div class="empty-state"><div class="empty-state__icon">🎯</div><div class="empty-state__title">Нет целей</div><div class="empty-state__text">Создайте первую цель, чтобы начать копить</div></div>' : ''}
      </div>
    `;
  },

  renderGoal(g) {
    const pct = g.targetAmount > 0 ? Math.min(g.currentAmount / g.targetAmount * 100, 100) : 0;
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);

    return `
      <div class="card" style="margin-bottom: var(--space-sm); padding: var(--space-base); ${g.completed ? 'opacity: 0.7;' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md);">
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <span style="font-size: var(--fs-xl);">${g.icon || '🎯'}</span>
            <div>
              <div style="font-weight: 600; font-size: var(--fs-md);">${g.name}</div>
              ${g.description ? `<div style="font-size: var(--fs-xs); color: var(--text-tertiary);">${g.description}</div>` : ''}
            </div>
          </div>
          <button class="btn btn--icon btn--danger" onclick="Savings.delete('${g.id}')" title="Удалить" style="width:24px;height:24px;font-size:11px;">✕</button>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: var(--fs-sm); margin-bottom: var(--space-xs);">
          <span class="font-mono" style="color: var(--accent-purple-light); font-weight: 600;">${Utils.formatMoney(g.currentAmount)}</span>
          <span class="font-mono text-secondary">${Utils.formatMoney(g.targetAmount)}</span>
        </div>

        <div class="budget-item__bar" style="margin-bottom: var(--space-md);">
          <div class="budget-item__fill" style="width: ${pct}%; background: ${g.completed ? 'linear-gradient(90deg, var(--accent-green), #059669)' : 'linear-gradient(90deg, var(--accent-purple), var(--accent-purple-light))'};"></div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: var(--fs-xs); color: var(--text-secondary);">
            ${g.completed ? '🎉 Цель достигнута!' : `Осталось: <span class="font-mono" style="color: var(--text-primary);">${Utils.formatMoney(remaining)}</span>`}
          </div>
          ${!g.completed ? `
            <div style="display: flex; gap: var(--space-xs);">
              <button class="btn btn--sm btn--ghost" onclick="Savings.openDepositModal('${g.id}')">+ Внести</button>
              ${g.currentAmount > 0 ? `<button class="btn btn--sm btn--danger" onclick="Savings.openWithdrawModal('${g.id}')">− Снять</button>` : ''}
            </div>
          ` : ''}
        </div>

        ${g.deposits.length ? `
          <details style="margin-top: var(--space-md); border-top: 1px solid var(--border-subtle); padding-top: var(--space-sm);">
            <summary style="font-size: var(--fs-xs); color: var(--text-tertiary); cursor: pointer; user-select: none;">История (${g.deposits.length})</summary>
            <div style="margin-top: var(--space-sm);">
              ${g.deposits.slice().reverse().map(d => `
                <div style="font-size: var(--fs-xs); color: var(--text-secondary); display: flex; justify-content: space-between; padding: 2px 0;">
                  <span>${Utils.formatDate(d.date)} ${d.note ? '· ' + d.note : ''}</span>
                  <span class="font-mono ${d.amount >= 0 ? 'text-green' : 'text-red'}">${d.amount >= 0 ? '+' : ''}${Utils.formatMoney(d.amount)}</span>
                </div>
              `).join('')}
            </div>
          </details>
        ` : ''}
      </div>
    `;
  },

  openAddModal() {
    document.getElementById('saving-name-input').value = '';
    document.getElementById('saving-target-input').value = '';
    document.getElementById('saving-desc-input').value = '';
    // Render icon picker
    const picker = document.getElementById('saving-icon-picker');
    picker.innerHTML = SAVING_ICONS.map((icon, i) =>
      `<button type="button" class="saving-icon-btn ${i === 0 ? 'active' : ''}" onclick="Savings.selectIcon(this, '${icon}')">${icon}</button>`
    ).join('');
    document.getElementById('saving-icon-value').value = SAVING_ICONS[0];
    App.openModal('saving-modal');
  },

  selectIcon(btn, icon) {
    document.querySelectorAll('.saving-icon-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('saving-icon-value').value = icon;
  },

  saveFromModal() {
    const name = document.getElementById('saving-name-input').value.trim();
    const targetAmount = parseFloat(document.getElementById('saving-target-input').value);
    const description = document.getElementById('saving-desc-input').value.trim();
    const icon = document.getElementById('saving-icon-value').value;

    if (!name) { alert('Введите название цели'); return; }
    if (!targetAmount || targetAmount <= 0) { alert('Введите целевую сумму'); return; }

    Store.addSavingGoal({ name, targetAmount, description, icon });
    App.closeModal('saving-modal');
    this.render();
  },

  openDepositModal(goalId) {
    const goal = Store.getSavings().find(s => s.id === goalId);
    if (!goal) return;
    document.getElementById('saving-action-id').value = goalId;
    document.getElementById('saving-action-type').value = 'deposit';
    document.getElementById('saving-action-title').textContent = `Внести в "${goal.name}"`;
    document.getElementById('saving-action-amount').value = '';
    document.getElementById('saving-action-note').value = '';
    const remaining = goal.targetAmount - goal.currentAmount;
    document.getElementById('saving-action-amount').placeholder = `Осталось: ${Utils.formatMoney(remaining)}`;
    App.openModal('saving-action-modal');
  },

  openWithdrawModal(goalId) {
    const goal = Store.getSavings().find(s => s.id === goalId);
    if (!goal) return;
    document.getElementById('saving-action-id').value = goalId;
    document.getElementById('saving-action-type').value = 'withdraw';
    document.getElementById('saving-action-title').textContent = `Снять из "${goal.name}"`;
    document.getElementById('saving-action-amount').value = '';
    document.getElementById('saving-action-note').value = '';
    document.getElementById('saving-action-amount').placeholder = `Макс: ${Utils.formatMoney(goal.currentAmount)}`;
    App.openModal('saving-action-modal');
  },

  saveAction() {
    const goalId = document.getElementById('saving-action-id').value;
    const type = document.getElementById('saving-action-type').value;
    const amount = parseFloat(document.getElementById('saving-action-amount').value);
    const note = document.getElementById('saving-action-note').value.trim();

    if (!amount || amount <= 0) { alert('Введите сумму'); return; }

    if (type === 'deposit') {
      Store.addSavingDeposit(goalId, amount, note);
    } else {
      Store.withdrawSaving(goalId, amount, note);
    }

    App.closeModal('saving-action-modal');
    this.render();
  },

  delete(id) {
    if (confirm('Удалить цель?')) {
      Store.deleteSavingGoal(id);
      this.render();
    }
  }
};
