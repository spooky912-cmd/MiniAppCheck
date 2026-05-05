/* ============================================
   FinTrack — Dashboard
   ============================================ */

const Dashboard = {
  miniChart: null,

  render() {
    const balance = Store.getTotalBalance();
    const income = Store.getMonthlyIncome();
    const expense = Store.getMonthlyExpense();
    const recent = Store.getTransactions().slice(0, 5);
    const chartData = Store.getLast7DaysBalance();

    const el = document.getElementById('page-dashboard');
    el.innerHTML = `
      <div class="balance-card animate-fade-in-up">
        <div class="balance-card__label">Общий баланс</div>
        <div class="balance-card__amount font-mono" id="balance-amount">${Utils.formatMoney(balance)}</div>
        <div class="balance-card__row">
          <div class="balance-mini">
            <div class="balance-mini__icon balance-mini__icon--income">↑</div>
            <div class="balance-mini__info">
              <div class="balance-mini__label">Доходы</div>
              <div class="balance-mini__amount text-green">${Utils.formatMoney(income)}</div>
            </div>
          </div>
          <div class="balance-mini">
            <div class="balance-mini__icon balance-mini__icon--expense">↓</div>
            <div class="balance-mini__info">
              <div class="balance-mini__label">Расходы</div>
              <div class="balance-mini__amount text-red">${Utils.formatMoney(expense)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card animate-fade-in-up stagger-2" style="margin-top: var(--space-base);">
        <div class="section-header">
          <div class="section-title">Баланс за 7 дней</div>
        </div>
        <div class="mini-chart">
          <canvas id="dashboard-chart"></canvas>
        </div>
      </div>

      <div class="animate-fade-in-up stagger-3" style="margin-top: var(--space-base);">
        <div class="section-header">
          <div class="section-title">Последние операции</div>
          <button class="section-link" onclick="App.switchTab('transactions')">Все →</button>
        </div>
        <div class="card" id="recent-transactions">
          ${recent.length ? recent.map(t => this.renderTransaction(t)).join('') : '<div class="empty-state"><div class="empty-state__icon">📭</div><div class="empty-state__title">Нет операций</div><div class="empty-state__text">Нажмите + чтобы добавить первую</div></div>'}
        </div>
      </div>
    `;

    this.renderMiniChart(chartData);
  },

  renderTransaction(t) {
    const cat = getCategoryById(t.category);
    const isIncome = t.type === 'income';
    return `
      <div class="transaction-item" onclick="Transactions.showEdit('${t.id}')">
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
      </div>
    `;
  },

  renderMiniChart(data) {
    const ctx = document.getElementById('dashboard-chart');
    if (!ctx) return;

    if (this.miniChart) this.miniChart.destroy();

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 120);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

    this.miniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.balance),
          borderColor: '#8B5CF6',
          borderWidth: 2.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHitRadius: 20,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#8B5CF6',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: 'rgba(20,20,24,0.95)',
          titleColor: '#8E8E93',
          bodyColor: '#F5F5F7',
          bodyFont: { family: 'JetBrains Mono', weight: '600' },
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          callbacks: { label: (ctx) => Utils.formatMoney(ctx.parsed.y) }
        }},
        scales: {
          x: { display: true, grid: { display: false }, ticks: { color: '#5A5A5E', font: { size: 10, family: 'Inter' } }, border: { display: false } },
          y: { display: false }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }
};
