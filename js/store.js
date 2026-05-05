/* ============================================
   FinTrack — Data Store
   Поддерживает Telegram CloudStorage (если запущен в TG)
   и localStorage как fallback (браузер / локальный тест)
   ============================================ */

const Store = {
  KEYS: {
    TRANSACTIONS: 'fintrack_transactions',
    BUDGETS: 'fintrack_budgets',
    DEBTS: 'fintrack_debts',
    SAVINGS: 'fintrack_savings'
  },

  // Кэш данных в памяти (чтобы не обращаться к хранилищу на каждый read)
  _cache: {},

  // Определяем доступность Telegram CloudStorage
  get _tgStorage() {
    return window.Telegram?.WebApp?.CloudStorage || null;
  },

  // Инициализация: загружаем все ключи из CloudStorage в кэш
  init() {
    if (!this._tgStorage) {
      // Fallback: читаем из localStorage в кэш
      Object.values(this.KEYS).forEach(key => {
        try { this._cache[key] = JSON.parse(localStorage.getItem(key)) || []; }
        catch { this._cache[key] = []; }
      });
      this.loadDemoData();
      return Promise.resolve();
    }

    // Telegram CloudStorage: загружаем все ключи разом
    return new Promise((resolve) => {
      this._tgStorage.getItems(Object.values(this.KEYS), (err, values) => {
        if (!err && values) {
          Object.values(this.KEYS).forEach(key => {
            try { this._cache[key] = JSON.parse(values[key]) || []; }
            catch { this._cache[key] = []; }
          });
        } else {
          Object.values(this.KEYS).forEach(key => { this._cache[key] = []; });
        }
        this.loadDemoData();
        resolve();
      });
    });
  },

  // Синхронное чтение из кэша
  _get(key) {
    return this._cache[key] || [];
  },

  // Запись: обновляем кэш + сохраняем асинхронно в хранилище
  _set(key, data) {
    this._cache[key] = data;
    const serialized = JSON.stringify(data);
    if (this._tgStorage) {
      this._tgStorage.setItem(key, serialized, () => {}); // async, без блокировки
    } else {
      localStorage.setItem(key, serialized);
    }
  },

  clearAll() {
    Object.values(this.KEYS).forEach(k => {
      this._cache[k] = [];
      if (this._tgStorage) {
        this._tgStorage.removeItem(k, () => {});
      } else {
        localStorage.removeItem(k);
      }
    });
  },

  // --- Transactions ---
  getTransactions() {
    return this._get(this.KEYS.TRANSACTIONS).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  addTransaction(t) {
    const txns = this._get(this.KEYS.TRANSACTIONS);
    t.id = Utils.generateId();
    t.createdAt = Date.now();
    txns.push(t);
    this._set(this.KEYS.TRANSACTIONS, txns);
    return t;
  },

  updateTransaction(id, updates) {
    const txns = this._get(this.KEYS.TRANSACTIONS);
    const idx = txns.findIndex(t => t.id === id);
    if (idx !== -1) { txns[idx] = { ...txns[idx], ...updates }; this._set(this.KEYS.TRANSACTIONS, txns); }
  },

  deleteTransaction(id) {
    const txns = this._get(this.KEYS.TRANSACTIONS).filter(t => t.id !== id);
    this._set(this.KEYS.TRANSACTIONS, txns);
  },

  getTransactionsByMonth(monthKey) {
    return this.getTransactions().filter(t => Utils.getMonthKey(t.date) === monthKey);
  },

  getMonthlyIncome(monthKey) {
    return this.getTransactionsByMonth(monthKey || Utils.getCurrentMonthKey())
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getMonthlyExpense(monthKey) {
    return this.getTransactionsByMonth(monthKey || Utils.getCurrentMonthKey())
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getTotalBalance() {
    const txns = this._get(this.KEYS.TRANSACTIONS);
    return txns.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  },

  getExpensesByCategory(monthKey) {
    const txns = this.getTransactionsByMonth(monthKey || Utils.getCurrentMonthKey())
      .filter(t => t.type === 'expense');
    const grouped = {};
    txns.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = 0;
      grouped[t.category] += t.amount;
    });
    return Object.entries(grouped)
      .map(([cat, amount]) => ({ ...getCategoryById(cat), amount }))
      .sort((a, b) => b.amount - a.amount);
  },

  getLast7DaysBalance() {
    const txns = this._get(this.KEYS.TRANSACTIONS);
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayTxns = txns.filter(t => t.date <= dayStr);
      const balance = dayTxns.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
      data.push({ date: dayStr, label: Utils.formatDate(dayStr), balance });
    }
    return data;
  },

  getMonthlyStats(months = 6) {
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = Utils.getMonthKey(d);
      data.push({
        month: key,
        label: Utils.getMonthName(key),
        income: this.getMonthlyIncome(key),
        expense: this.getMonthlyExpense(key)
      });
    }
    return data;
  },

  // --- Budgets ---
  getBudgets(monthKey) {
    const key = monthKey || Utils.getCurrentMonthKey();
    return this._get(this.KEYS.BUDGETS).filter(b => b.month === key);
  },

  addBudget(b) {
    const budgets = this._get(this.KEYS.BUDGETS);
    b.id = Utils.generateId();
    budgets.push(b);
    this._set(this.KEYS.BUDGETS, budgets);
    return b;
  },

  updateBudget(id, updates) {
    const budgets = this._get(this.KEYS.BUDGETS);
    const idx = budgets.findIndex(b => b.id === id);
    if (idx !== -1) { budgets[idx] = { ...budgets[idx], ...updates }; this._set(this.KEYS.BUDGETS, budgets); }
  },

  deleteBudget(id) {
    const budgets = this._get(this.KEYS.BUDGETS).filter(b => b.id !== id);
    this._set(this.KEYS.BUDGETS, budgets);
  },

  getBudgetSpent(category, monthKey) {
    return this.getTransactionsByMonth(monthKey || Utils.getCurrentMonthKey())
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  // --- Debts ---
  getDebts() {
    return this._get(this.KEYS.DEBTS).filter(d => !d.settled).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getAllDebts() {
    return this._get(this.KEYS.DEBTS).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  addDebt(d) {
    const debts = this._get(this.KEYS.DEBTS);
    d.id = Utils.generateId();
    d.remaining = d.amount;
    d.payments = [];
    d.settled = false;
    debts.push(d);
    this._set(this.KEYS.DEBTS, debts);
    return d;
  },

  addDebtPayment(debtId, amount) {
    const debts = this._get(this.KEYS.DEBTS);
    const idx = debts.findIndex(d => d.id === debtId);
    if (idx !== -1) {
      debts[idx].payments.push({ amount, date: Utils.getToday() });
      debts[idx].remaining = Math.max(0, debts[idx].remaining - amount);
      if (debts[idx].remaining <= 0) debts[idx].settled = true;
      this._set(this.KEYS.DEBTS, debts);
    }
  },

  deleteDebt(id) {
    const debts = this._get(this.KEYS.DEBTS).filter(d => d.id !== id);
    this._set(this.KEYS.DEBTS, debts);
  },

  getDebtsTotalOwed() {
    return this.getDebts().filter(d => d.type === 'owed').reduce((sum, d) => sum + d.remaining, 0);
  },

  getDebtsTotalOwe() {
    return this.getDebts().filter(d => d.type === 'owe').reduce((sum, d) => sum + d.remaining, 0);
  },

  // --- Savings (Копилка) ---
  getSavings() {
    return this._get(this.KEYS.SAVINGS).sort((a, b) => b.createdAt - a.createdAt);
  },

  getActiveSavings() {
    return this.getSavings().filter(s => !s.completed);
  },

  addSavingGoal(goal) {
    const savings = this._get(this.KEYS.SAVINGS);
    goal.id = Utils.generateId();
    goal.currentAmount = 0;
    goal.deposits = [];
    goal.completed = false;
    goal.createdAt = Date.now();
    savings.push(goal);
    this._set(this.KEYS.SAVINGS, savings);
    return goal;
  },

  addSavingDeposit(goalId, amount, note) {
    const savings = this._get(this.KEYS.SAVINGS);
    const idx = savings.findIndex(s => s.id === goalId);
    if (idx !== -1) {
      savings[idx].deposits.push({ amount, note: note || '', date: Utils.getToday() });
      savings[idx].currentAmount += amount;
      if (savings[idx].currentAmount >= savings[idx].targetAmount) savings[idx].completed = true;
      this._set(this.KEYS.SAVINGS, savings);
    }
  },

  withdrawSaving(goalId, amount, note) {
    const savings = this._get(this.KEYS.SAVINGS);
    const idx = savings.findIndex(s => s.id === goalId);
    if (idx !== -1) {
      savings[idx].deposits.push({ amount: -amount, note: note || 'Снятие', date: Utils.getToday() });
      savings[idx].currentAmount = Math.max(0, savings[idx].currentAmount - amount);
      savings[idx].completed = false;
      this._set(this.KEYS.SAVINGS, savings);
    }
  },

  deleteSavingGoal(id) {
    const savings = this._get(this.KEYS.SAVINGS).filter(s => s.id !== id);
    this._set(this.KEYS.SAVINGS, savings);
  },

  getTotalSaved() {
    return this.getActiveSavings().reduce((sum, s) => sum + s.currentAmount, 0);
  },

  getTotalSavingsTarget() {
    return this.getActiveSavings().reduce((sum, s) => sum + s.targetAmount, 0);
  },

  // --- Demo Data ---
  loadDemoData() {
    if (this._get(this.KEYS.TRANSACTIONS).length > 0) return;

    const today = new Date();
    const demoTxns = [];
    const expenseCats = CATEGORIES.expense;
    const incomeCats = CATEGORIES.income;

    // Generate 30 days of data
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // 1-3 expenses per day
      const numExpenses = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numExpenses; j++) {
        const cat = expenseCats[Math.floor(Math.random() * expenseCats.length)];
        demoTxns.push({
          id: Utils.generateId(),
          type: 'expense',
          amount: Math.round((Math.random() * 2000 + 100) / 10) * 10,
          category: cat.id,
          description: cat.name,
          date: dateStr,
          createdAt: Date.now() - i * 86400000
        });
      }

      // Income every ~7 days
      if (i % 7 === 0) {
        const cat = incomeCats[Math.floor(Math.random() * 3)];
        demoTxns.push({
          id: Utils.generateId(),
          type: 'income',
          amount: Math.round((Math.random() * 30000 + 20000) / 100) * 100,
          category: cat.id,
          description: cat.name,
          date: dateStr,
          createdAt: Date.now() - i * 86400000
        });
      }
    }

    this._set(this.KEYS.TRANSACTIONS, demoTxns);

    // Demo budgets
    const monthKey = Utils.getCurrentMonthKey();
    const demoBudgets = [
      { id: Utils.generateId(), category: 'food', limit: 15000, month: monthKey },
      { id: Utils.generateId(), category: 'transport', limit: 5000, month: monthKey },
      { id: Utils.generateId(), category: 'entertainment', limit: 8000, month: monthKey },
      { id: Utils.generateId(), category: 'shopping', limit: 10000, month: monthKey }
    ];
    this._set(this.KEYS.BUDGETS, demoBudgets);

    // Demo debts
    const demoDebts = [
      { id: Utils.generateId(), type: 'owed', person: 'Алексей', amount: 5000, remaining: 3000, description: 'За обед', date: '2025-04-15', payments: [{ amount: 2000, date: '2025-04-25' }], settled: false },
      { id: Utils.generateId(), type: 'owe', person: 'Мария', amount: 3000, remaining: 3000, description: 'Билеты в кино', date: '2025-04-20', payments: [], settled: false }
    ];
    this._set(this.KEYS.DEBTS, demoDebts);
  }
};
