/* ============================================
   FinTrack — Statistics
   ============================================ */

const Stats = {
  doughnutChart: null,
  barChart: null,
  lineChart: null,
  period: 'month', // week | month | 3months | year

  render() {
    const expenses = Store.getExpensesByCategory();
    const monthlyStats = Store.getMonthlyStats(6);
    const income = Store.getMonthlyIncome();
    const expense = Store.getMonthlyExpense();
    const balance = Store.getTotalBalance();
    const txnCount = Store.getTransactions().length;

    const el = document.getElementById('page-stats');
    el.innerHTML = `
      <div class="stats-row animate-fade-in-up">
        <div class="card stat-card">
          <div class="stat-card__value text-purple font-mono">${Utils.formatMoney(balance)}</div>
          <div class="stat-card__label">Баланс</div>
        </div>
        <div class="card stat-card">
          <div class="stat-card__value font-mono">${txnCount}</div>
          <div class="stat-card__label">Операций</div>
        </div>
      </div>

      <div class="card animate-fade-in-up stagger-1" style="margin-bottom: var(--space-base);">
        <div class="section-title" style="margin-bottom: var(--space-md);">Расходы по категориям</div>
        <div class="chart-container" style="height: 220px;">
          <canvas id="stats-doughnut"></canvas>
        </div>
        <div id="top-categories" style="margin-top: var(--space-base);">
          ${expenses.map((c, i) => {
            const maxAmount = expenses[0]?.amount || 1;
            return `<div class="top-cat">
              <div class="top-cat__icon">${c.icon}</div>
              <div class="top-cat__info">
                <div class="top-cat__name">${c.name}</div>
                <div class="top-cat__bar"><div class="top-cat__fill" style="width: ${(c.amount / maxAmount * 100)}%; background: ${this.getColor(i)};"></div></div>
              </div>
              <div class="top-cat__amount">${Utils.formatMoney(c.amount)}</div>
            </div>`;
          }).join('')}
          ${expenses.length === 0 ? '<div class="text-secondary" style="text-align:center; font-size: var(--fs-sm); padding: var(--space-base);">Нет данных за этот период</div>' : ''}
        </div>
      </div>

      <div class="card animate-fade-in-up stagger-2" style="margin-bottom: var(--space-base);">
        <div class="section-title" style="margin-bottom: var(--space-md);">Доходы vs Расходы</div>
        <div class="chart-container" style="height: 200px;">
          <canvas id="stats-bar"></canvas>
        </div>
      </div>

      <div class="card animate-fade-in-up stagger-3" style="margin-bottom: var(--space-base);">
        <div class="section-title" style="margin-bottom: var(--space-md);">Динамика баланса</div>
        <div class="chart-container" style="height: 180px;">
          <canvas id="stats-line"></canvas>
        </div>
      </div>
    `;

    this.renderDoughnut(expenses);
    this.renderBar(monthlyStats);
    this.renderLine();
  },

  colors: ['#8B5CF6', '#34D399', '#F87171', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA', '#6EE7B7', '#FCA5A5', '#FCD34D'],

  getColor(i) {
    return this.colors[i % this.colors.length];
  },

  renderDoughnut(expenses) {
    const ctx = document.getElementById('stats-doughnut');
    if (!ctx || !expenses.length) return;
    if (this.doughnutChart) this.doughnutChart.destroy();

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: expenses.map(c => c.name),
        datasets: [{
          data: expenses.map(c => c.amount),
          backgroundColor: expenses.map((_, i) => this.getColor(i)),
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20,20,24,0.95)',
            titleColor: '#8E8E93',
            bodyColor: '#F5F5F7',
            bodyFont: { family: 'JetBrains Mono' },
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: { label: (ctx) => ` ${Utils.formatMoney(ctx.parsed)}` }
          }
        }
      }
    });
  },

  renderBar(monthlyStats) {
    const ctx = document.getElementById('stats-bar');
    if (!ctx) return;
    if (this.barChart) this.barChart.destroy();

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthlyStats.map(m => m.label.substring(0, 3)),
        datasets: [
          {
            label: 'Доходы',
            data: monthlyStats.map(m => m.income),
            backgroundColor: 'rgba(52, 211, 153, 0.7)',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            label: 'Расходы',
            data: monthlyStats.map(m => m.expense),
            backgroundColor: 'rgba(248, 113, 113, 0.7)',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#8E8E93', font: { size: 11, family: 'Inter' }, boxWidth: 10, boxHeight: 10, borderRadius: 3, useBorderRadius: true, padding: 16 }
          },
          tooltip: {
            backgroundColor: 'rgba(20,20,24,0.95)',
            bodyFont: { family: 'JetBrains Mono' },
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${Utils.formatMoney(ctx.parsed.y)}` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#5A5A5E', font: { size: 10 } }, border: { display: false } },
          y: { display: false }
        }
      }
    });
  },

  renderLine() {
    const ctx = document.getElementById('stats-line');
    if (!ctx) return;
    if (this.lineChart) this.lineChart.destroy();

    const data = Store.getLast7DaysBalance();
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

    this.lineChart = new Chart(ctx, {
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
          pointRadius: 4,
          pointBackgroundColor: '#8B5CF6',
          pointBorderColor: '#0A0A0B',
          pointBorderWidth: 2,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20,20,24,0.95)',
            bodyFont: { family: 'JetBrains Mono', weight: '600' },
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: { label: (ctx) => Utils.formatMoney(ctx.parsed.y) }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#5A5A5E', font: { size: 10 } }, border: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5A5A5E', font: { size: 10, family: 'JetBrains Mono' }, callback: v => (v / 1000) + 'к' }, border: { display: false } }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }
};
