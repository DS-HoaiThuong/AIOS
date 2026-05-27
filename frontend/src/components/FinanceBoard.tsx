import { useState, useEffect, useRef } from 'react';
import {
  fetchTransactions, createTransaction, deleteTransaction,
  fetchGoals, createGoal, updateGoal,
  fetchSubscriptions, createSubscription,
  fetchBudgetItems, createBudgetItem, deleteBudgetItem
} from '../lib/api';
import {
  Sparkles, TrendingUp, TrendingDown, Plus, Terminal, Cloud, Brain,
  X, Loader2, Trash2, ArrowUpCircle, ArrowDownCircle, ChevronLeft,
  ChevronRight, CalendarDays, Target, Wallet, BarChart3,
  CreditCard, PiggyBank, Receipt, CircleDollarSign
} from 'lucide-react';

const CATEGORIES = ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Sức khỏe', 'Giải trí', 'Học tập', 'Lương', 'Đầu tư', 'Freelance', 'Khác'];

// ─── Format helpers ───
const formatVND = (amount: number) => {
  if (amount === 0) return '0 ₫';
  const abs = Math.abs(amount);
  return (amount < 0 ? '-' : '') + new Intl.NumberFormat('vi-VN').format(abs) + ' ₫';
};

const formatVNDShort = (amount: number) => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace('.0', '')}tr`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`;
  return `${sign}${abs} ₫`;
};

const formatInputMoney = (value: string): string => {
  const num = value.replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(num));
};

const parseMoneyInput = (formatted: string): number => {
  return parseInt(formatted.replace(/\D/g, '') || '0');
};

const getMonthLabel = (date: Date): string => {
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
};

const getMonthKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// ─── Money Input Component ───
function MoneyInput({ value, onChange, placeholder, id }: {
  value: string; onChange: (raw: string) => void; placeholder?: string; id?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value ? formatInputMoney(value) : ''}
        onChange={handleChange}
        placeholder={placeholder || '0'}
        className="w-full border border-[#E5E5E1] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111]/10 pr-10 tabular-nums transition-all"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#999] font-medium">₫</span>
    </div>
  );
}

// ─── Main Component ───
export default function FinanceBoard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalType, setModalType] = useState<'transaction' | 'goal' | 'subscription' | 'budget' | null>(null);

  // Transaction form
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState('expense');
  const [txCategory, setTxCategory] = useState('Khác');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // Budget form
  const [budgetTitle, setBudgetTitle] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetType, setBudgetType] = useState('expected-expense');
  const [budgetCategory, setBudgetCategory] = useState('Khác');
  const [budgetRecurring, setBudgetRecurring] = useState(false);

  // Goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalColor, setGoalColor] = useState('#6366f1');

  // Sub form
  const [subTitle, setSubTitle] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState('monthly');
  const [subIcon, setSubIcon] = useState('terminal');

  // Active tab for transactions section
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');

  const monthKey = getMonthKey(currentMonth);

  useEffect(() => {
    loadData();
  }, [monthKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txData, goalData, subData, budgetData] = await Promise.all([
        fetchTransactions(monthKey),
        fetchGoals(),
        fetchSubscriptions(),
        fetchBudgetItems(monthKey),
      ]);
      setTransactions(txData);
      setGoals(goalData);
      setSubscriptions(subData);
      setBudgetItems(budgetData);
    } catch (error) {
      console.error('Failed to load finance data', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (dir: -1 | 1) => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  // ─── Handlers ───
  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;
    try {
      const newTx = await createTransaction({
        title: txTitle,
        amount: parseMoneyInput(txAmount),
        type: txType,
        category: txCategory,
        date: new Date(txDate).toISOString(),
      });
      setTransactions([newTx, ...transactions]);
      setModalType(null);
      setTxTitle(''); setTxAmount(''); setTxCategory('Khác');
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (!window.confirm('Xóa giao dịch này?')) return;
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetTitle || !budgetAmount) return;
    try {
      const item = await createBudgetItem({
        title: budgetTitle,
        amount: parseMoneyInput(budgetAmount),
        type: budgetType,
        month: monthKey,
        isRecurring: budgetRecurring,
        category: budgetCategory,
      });
      setBudgetItems([item, ...budgetItems]);
      setModalType(null);
      setBudgetTitle(''); setBudgetAmount(''); setBudgetRecurring(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudgetItem(id);
      setBudgetItems(budgetItems.filter(b => b.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;
    try {
      const newGoal = await createGoal({
        title: goalTitle,
        targetAmount: parseMoneyInput(goalTarget),
        currentAmount: goalCurrent ? parseMoneyInput(goalCurrent) : 0,
        color: goalColor,
      });
      setGoals([...goals, newGoal]);
      setModalType(null);
      setGoalTitle(''); setGoalTarget(''); setGoalCurrent('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddMoneyToGoal = async (goal: any) => {
    const amountStr = window.prompt(`Nhập số tiền muốn thêm vào "${goal.title}":`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr.replace(/\D/g, ''));
    if (isNaN(amount) || amount <= 0) { alert('Số tiền không hợp lệ'); return; }
    try {
      const updatedGoal = await updateGoal(goal.id, { currentAmount: goal.currentAmount + amount });
      setGoals(goals.map(g => g.id === goal.id ? updatedGoal : g));
    } catch (error) {
      console.error(error);
      alert('Lỗi khi cập nhật mục tiêu');
    }
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle || !subAmount) return;
    try {
      const newSub = await createSubscription({
        title: subTitle,
        amount: parseMoneyInput(subAmount),
        billingCycle: subCycle,
        icon: subIcon,
      });
      setSubscriptions([...subscriptions, newSub]);
      setModalType(null);
      setSubTitle(''); setSubAmount('');
    } catch (error) {
      console.error(error);
    }
  };

  // ─── Computed ───
  const actualIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const actualExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = actualIncome - actualExpense;

  const expectedIncome = budgetItems.filter(b => b.type === 'expected-income').reduce((s, b) => s + b.amount, 0);
  const expectedExpense = budgetItems.filter(b => b.type === 'expected-expense').reduce((s, b) => s + b.amount, 0);
  const expectedBalance = expectedIncome - expectedExpense;

  const incomeProgress = expectedIncome > 0 ? Math.min(100, Math.round((actualIncome / expectedIncome) * 100)) : 0;
  const expenseProgress = expectedExpense > 0 ? Math.min(100, Math.round((actualExpense / expectedExpense) * 100)) : 0;

  const filteredTx = txFilter === 'all' ? transactions : transactions.filter(t => t.type === txFilter);

  const totalSubCost = subscriptions.reduce((acc, sub) => acc + sub.amount, 0);

  const getSubIcon = (name: string) => {
    switch (name) {
      case 'cloud': return <Cloud className="w-4 h-4" />;
      case 'brain': return <Brain className="w-4 h-4" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto w-full pb-10">

      {/* ═══ Header with Month Selector ═══ */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-[28px] sm:text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold text-[#111]">
            Tài chính
          </h2>
          <p className="text-[15px] leading-[1.6] text-[#666] mt-1">
            Theo dõi dòng tiền, lập kế hoạch thu chi hàng tháng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[#e5e5e5] rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => navigateMonth(-1)} className="px-3 py-2.5 hover:bg-[#f5f5f5] transition-colors">
              <ChevronLeft className="w-4 h-4 text-[#666]" />
            </button>
            <div className="px-4 py-2.5 flex items-center gap-2 min-w-[160px] justify-center border-x border-[#e5e5e5]">
              <CalendarDays className="w-4 h-4 text-[#6366f1]" />
              <span className="text-[14px] font-semibold text-[#111] capitalize">{getMonthLabel(currentMonth)}</span>
            </div>
            <button onClick={() => navigateMonth(1)} className="px-3 py-2.5 hover:bg-[#f5f5f5] transition-colors">
              <ChevronRight className="w-4 h-4 text-[#666]" />
            </button>
          </div>
          <button
            onClick={() => setModalType('transaction')}
            className="bg-[#111] text-white px-4 py-2.5 rounded-xl text-[13px] font-medium flex items-center gap-2 hover:bg-[#333] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Ghi thu/chi
          </button>
        </div>
      </div>

      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Actual Income */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[12px] font-semibold text-[#999] uppercase tracking-wide">Thu thực tế</span>
          </div>
          <div className="text-[22px] font-bold text-emerald-600 tabular-nums leading-tight">
            {formatVNDShort(actualIncome)}
          </div>
          {expectedIncome > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${incomeProgress}%` }} />
              </div>
              <p className="text-[11px] text-[#999] mt-1">{incomeProgress}% của dự thu</p>
            </div>
          )}
        </div>

        {/* Actual Expense */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-[12px] font-semibold text-[#999] uppercase tracking-wide">Chi thực tế</span>
          </div>
          <div className="text-[22px] font-bold text-red-500 tabular-nums leading-tight">
            {formatVNDShort(actualExpense)}
          </div>
          {expectedExpense > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-red-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${expenseProgress > 100 ? 'bg-red-600' : 'bg-red-400'}`} style={{ width: `${Math.min(100, expenseProgress)}%` }} />
              </div>
              <p className={`text-[11px] mt-1 ${expenseProgress > 100 ? 'text-red-500 font-semibold' : 'text-[#999]'}`}>
                {expenseProgress > 100 ? `⚠ Vượt ${expenseProgress - 100}%` : `${expenseProgress}% của dự chi`}
              </p>
            </div>
          )}
        </div>

        {/* Expected Income */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[12px] font-semibold text-[#999] uppercase tracking-wide">Dự thu</span>
          </div>
          <div className="text-[22px] font-bold text-blue-600 tabular-nums leading-tight">
            {formatVNDShort(expectedIncome)}
          </div>
          <p className="text-[11px] text-[#999] mt-2">
            Còn thiếu: {formatVNDShort(Math.max(0, expectedIncome - actualIncome))}
          </p>
        </div>

        {/* Expected Expense */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[12px] font-semibold text-[#999] uppercase tracking-wide">Dự chi</span>
          </div>
          <div className="text-[22px] font-bold text-amber-600 tabular-nums leading-tight">
            {formatVNDShort(expectedExpense)}
          </div>
          <p className="text-[11px] text-[#999] mt-2">
            Còn lại: {formatVNDShort(Math.max(0, expectedExpense - actualExpense))}
          </p>
        </div>
      </div>

      {/* ═══ Balance Banner ═══ */}
      <div className={`rounded-2xl p-5 mb-6 flex items-center justify-between border ${balance >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${balance >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <Wallet className={`w-5 h-5 ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`} />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#999] uppercase tracking-wide">Số dư thực tế tháng này</p>
            <p className={`text-[24px] font-bold tabular-nums ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {balance >= 0 ? '+' : ''}{formatVND(balance)}
            </p>
          </div>
        </div>
        {expectedBalance !== 0 && (
          <div className="text-right hidden sm:block">
            <p className="text-[12px] text-[#999]">Chênh lệch dự kiến</p>
            <p className={`text-[18px] font-bold tabular-nums ${expectedBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              {expectedBalance >= 0 ? '+' : ''}{formatVND(expectedBalance)}
            </p>
          </div>
        )}
      </div>

      {/* ═══ Main Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Budget + Comparison ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Comparison Chart */}
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#6366f1]" />
                <h3 className="text-[16px] font-semibold text-[#111]">So sánh Dự kiến vs Thực tế</h3>
              </div>
            </div>

            <div className="space-y-6">
              {/* Income comparison */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] font-medium text-[#666]">Thu nhập</span>
                  <span className="text-[12px] text-[#999] tabular-nums">
                    {formatVNDShort(actualIncome)} / {formatVNDShort(expectedIncome || actualIncome)}
                  </span>
                </div>
                <div className="relative h-8 bg-[#f5f5f5] rounded-lg overflow-hidden">
                  {expectedIncome > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-100 rounded-lg"
                      style={{ width: `${Math.min(100, (expectedIncome / Math.max(expectedIncome, actualIncome)) * 100)}%` }}
                    />
                  )}
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500 rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${expectedIncome > 0 ? Math.min(100, (actualIncome / Math.max(expectedIncome, actualIncome)) * 100) : 50}%` }}
                  >
                    <span className="text-[11px] font-bold text-white">{formatVNDShort(actualIncome)}</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-1.5">
                  <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Thực tế
                  </span>
                  <span className="text-[11px] text-blue-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-200 inline-block" /> Dự kiến
                  </span>
                </div>
              </div>

              {/* Expense comparison */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] font-medium text-[#666]">Chi tiêu</span>
                  <span className="text-[12px] text-[#999] tabular-nums">
                    {formatVNDShort(actualExpense)} / {formatVNDShort(expectedExpense || actualExpense)}
                  </span>
                </div>
                <div className="relative h-8 bg-[#f5f5f5] rounded-lg overflow-hidden">
                  {expectedExpense > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 bg-amber-100 rounded-lg"
                      style={{ width: `${Math.min(100, (expectedExpense / Math.max(expectedExpense, actualExpense)) * 100)}%` }}
                    />
                  )}
                  <div
                    className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-700 flex items-center justify-end pr-2 ${expenseProgress > 100 ? 'bg-red-500' : 'bg-red-400'}`}
                    style={{ width: `${expectedExpense > 0 ? Math.min(100, (actualExpense / Math.max(expectedExpense, actualExpense)) * 100) : 50}%` }}
                  >
                    <span className="text-[11px] font-bold text-white">{formatVNDShort(actualExpense)}</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-1.5">
                  <span className="text-[11px] text-red-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Thực tế
                  </span>
                  <span className="text-[11px] text-amber-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-200 inline-block" /> Dự kiến
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expected Income */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h4 className="text-[14px] font-semibold text-[#111]">Dự thu</h4>
                </div>
                <button
                  onClick={() => { setBudgetType('expected-income'); setModalType('budget'); }}
                  className="w-7 h-7 rounded-lg bg-[#f5f5f5] hover:bg-[#eee] flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#666]" />
                </button>
              </div>
              {budgetItems.filter(b => b.type === 'expected-income').length === 0 ? (
                <p className="text-[12px] text-[#bbb] text-center py-6">Chưa có khoản dự thu nào</p>
              ) : (
                <div className="space-y-2">
                  {budgetItems.filter(b => b.type === 'expected-income').map(item => (
                    <div key={item.id} className="flex items-center justify-between group py-1.5 px-2 rounded-lg hover:bg-[#fafafa] transition-colors">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#333] truncate">{item.title}</p>
                        <p className="text-[11px] text-[#bbb]">
                          {item.category}{item.isRecurring ? ' · 🔄 Lặp lại' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[13px] font-semibold text-emerald-600 tabular-nums">{formatVNDShort(item.amount)}</span>
                        <button onClick={() => handleDeleteBudget(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[#ccc] hover:text-red-500 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex justify-between">
                <span className="text-[12px] text-[#999]">Tổng dự thu</span>
                <span className="text-[13px] font-bold text-emerald-600 tabular-nums">{formatVND(expectedIncome)}</span>
              </div>
            </div>

            {/* Expected Expense */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <h4 className="text-[14px] font-semibold text-[#111]">Dự chi</h4>
                </div>
                <button
                  onClick={() => { setBudgetType('expected-expense'); setModalType('budget'); }}
                  className="w-7 h-7 rounded-lg bg-[#f5f5f5] hover:bg-[#eee] flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#666]" />
                </button>
              </div>
              {budgetItems.filter(b => b.type === 'expected-expense').length === 0 ? (
                <p className="text-[12px] text-[#bbb] text-center py-6">Chưa có khoản dự chi nào</p>
              ) : (
                <div className="space-y-2">
                  {budgetItems.filter(b => b.type === 'expected-expense').map(item => (
                    <div key={item.id} className="flex items-center justify-between group py-1.5 px-2 rounded-lg hover:bg-[#fafafa] transition-colors">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#333] truncate">{item.title}</p>
                        <p className="text-[11px] text-[#bbb]">
                          {item.category}{item.isRecurring ? ' · 🔄 Lặp lại' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[13px] font-semibold text-amber-600 tabular-nums">{formatVNDShort(item.amount)}</span>
                        <button onClick={() => handleDeleteBudget(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[#ccc] hover:text-red-500 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex justify-between">
                <span className="text-[12px] text-[#999]">Tổng dự chi</span>
                <span className="text-[13px] font-bold text-amber-600 tabular-nums">{formatVND(expectedExpense)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Transactions ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[16px] font-semibold text-[#111]">Giao dịch tháng này</h3>
              <button
                onClick={() => setModalType('transaction')}
                className="w-7 h-7 rounded-lg bg-[#f5f5f5] hover:bg-[#eee] flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#666]" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-0.5 bg-[#f5f5f5] rounded-lg mb-4">
              {[
                { key: 'all' as const, label: 'Tất cả' },
                { key: 'income' as const, label: 'Thu' },
                { key: 'expense' as const, label: 'Chi' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTxFilter(tab.key)}
                  className={`flex-1 py-1.5 text-[12px] font-medium rounded-md transition-all ${txFilter === tab.key ? 'bg-white text-[#111] shadow-sm' : 'text-[#999] hover:text-[#666]'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredTx.length === 0 ? (
              <div className="text-center py-10">
                <Receipt className="w-10 h-10 text-[#ddd] mx-auto mb-2" />
                <p className="text-[13px] text-[#bbb]">Chưa có giao dịch nào trong tháng</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                {filteredTx.slice(0, 30).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-2.5 hover:bg-[#fafafa] rounded-xl transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {tx.type === 'income'
                          ? <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                          : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#222] truncate">{tx.title}</p>
                        <p className="text-[11px] text-[#bbb]">
                          {tx.category} · {new Date(tx.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[13px] font-semibold tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                      </span>
                      <button
                        onClick={() => handleDeleteTx(tx.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#ccc] hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Bottom Grid: Goals + Subscriptions ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

        {/* Goals */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#6366f1]" />
              <h3 className="text-[16px] font-semibold text-[#111]">Mục tiêu tài chính</h3>
            </div>
            <button
              onClick={() => setModalType('goal')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Mới
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-8">
              <PiggyBank className="w-10 h-10 text-[#ddd] mx-auto mb-2" />
              <p className="text-[13px] text-[#bbb]">Chưa có mục tiêu nào</p>
              <p className="text-[11px] text-[#ccc] mt-1">Thêm mục tiêu để bắt đầu tiết kiệm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => {
                const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                const remaining = goal.targetAmount - goal.currentAmount;
                const isCompleted = remaining <= 0;
                return (
                  <div
                    key={goal.id}
                    className="group relative rounded-xl p-4 transition-all duration-300 hover:shadow-sm cursor-default"
                    style={{
                      background: `linear-gradient(135deg, ${goal.color}08 0%, ${goal.color}04 100%)`,
                      border: `1px solid ${goal.color}20`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[14px] font-semibold text-[#222]">{goal.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold tabular-nums" style={{ color: goal.color }}>{percentage}%</span>
                        <button
                          onClick={() => handleAddMoneyToGoal(goal)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all text-white"
                          style={{ background: goal.color }}
                        >
                          <Plus className="w-3 h-3" /> Nạp
                        </button>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden mb-2" style={{ background: `${goal.color}15` }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%`, background: goal.color }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[#888] tabular-nums">{formatVND(goal.currentAmount)}</span>
                      <span className="text-[11px] tabular-nums" style={{ color: isCompleted ? '#10b981' : '#999' }}>
                        {isCompleted ? '🎉 Hoàn thành!' : `Mục tiêu: ${formatVND(goal.targetAmount)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscriptions */}
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#6366f1]" />
              <h3 className="text-[16px] font-semibold text-[#111]">Gói đăng ký</h3>
            </div>
            <span className="text-[12px] font-semibold text-[#999] bg-[#f5f5f5] px-2.5 py-1 rounded-md tabular-nums">
              {formatVNDShort(totalSubCost)}/kỳ
            </span>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <CircleDollarSign className="w-10 h-10 text-[#ddd] mx-auto mb-2" />
              <p className="text-[13px] text-[#bbb]">Chưa có gói đăng ký nào</p>
            </div>
          ) : (
            <div className="space-y-1">
              {subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 hover:bg-[#fafafa] rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] flex items-center justify-center text-[#666]">
                      {getSubIcon(sub.icon)}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#222]">{sub.title}</p>
                      <p className="text-[11px] text-[#bbb]">
                        {sub.billingCycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-[#333] tabular-nums">{formatVND(sub.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setModalType('subscription')}
            className="w-full mt-4 py-2.5 text-center text-[13px] font-medium text-[#999] hover:text-[#333] border border-dashed border-[#e5e5e5] hover:border-[#ccc] rounded-xl transition-all"
          >
            + Thêm gói đăng ký
          </button>
        </div>
      </div>

      {/* ═══════════════════════ MODAL ═══════════════════════ */}
      {modalType && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalType(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#e5e5e5] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#f0f0f0] flex justify-between items-center">
              <h3 className="text-[18px] font-semibold text-[#111]">
                {modalType === 'transaction' && 'Ghi thu / chi'}
                {modalType === 'budget' && (budgetType === 'expected-income' ? 'Thêm khoản dự thu' : 'Thêm khoản dự chi')}
                {modalType === 'goal' && 'Tạo mục tiêu'}
                {modalType === 'subscription' && 'Thêm gói đăng ký'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-[#ccc] hover:text-[#333] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* ── Transaction Form ── */}
              {modalType === 'transaction' && (
                <form onSubmit={handleCreateTx} className="space-y-4">
                  <div className="flex gap-2 p-0.5 bg-[#f5f5f5] rounded-lg">
                    <button type="button" onClick={() => setTxType('expense')}
                      className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${txType === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-[#999]'}`}>
                      Chi tiêu
                    </button>
                    <button type="button" onClick={() => setTxType('income')}
                      className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${txType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-[#999]'}`}>
                      Thu nhập
                    </button>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Mô tả</label>
                    <input type="text" value={txTitle} onChange={e => setTxTitle(e.target.value)} required
                      className="w-full border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111]/10 transition-all"
                      placeholder="Ví dụ: Lương tháng 5, Cafe..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Số tiền</label>
                      <MoneyInput value={txAmount} onChange={setTxAmount} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Danh mục</label>
                      <select value={txCategory} onChange={e => setTxCategory(e.target.value)}
                        className="w-full border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#111] bg-white transition-all">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Ngày</label>
                    <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)}
                      className="w-full border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#111] transition-all" />
                  </div>
                  <button type="submit" className="w-full bg-[#111] text-white rounded-xl py-3 text-[14px] font-semibold hover:bg-[#333] transition-colors">
                    Lưu giao dịch
                  </button>
                </form>
              )}

              {/* ── Budget Form ── */}
              {modalType === 'budget' && (
                <form onSubmit={handleCreateBudget} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Tên khoản</label>
                    <input type="text" value={budgetTitle} onChange={e => setBudgetTitle(e.target.value)} required
                      className="w-full border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111]/10 transition-all"
                      placeholder={budgetType === 'expected-income' ? 'VD: Lương công ty, Freelance...' : 'VD: Tiền nhà, Học phí...'} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Số tiền dự kiến</label>
                      <MoneyInput value={budgetAmount} onChange={setBudgetAmount} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Danh mục</label>
                      <select value={budgetCategory} onChange={e => setBudgetCategory(e.target.value)}
                        className="w-full border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#111] bg-white transition-all">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-[#fafafa] rounded-xl cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                    <input type="checkbox" checked={budgetRecurring} onChange={e => setBudgetRecurring(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#6366f1]" />
                    <div>
                      <span className="text-[13px] font-medium text-[#333]">🔄 Lặp lại hàng tháng</span>
                      <p className="text-[11px] text-[#999]">Tự động tạo khoản này cho các tháng tiếp theo</p>
                    </div>
                  </label>
                  <button type="submit" className="w-full bg-[#111] text-white rounded-xl py-3 text-[14px] font-semibold hover:bg-[#333] transition-colors">
                    Lưu khoản dự {budgetType === 'expected-income' ? 'thu' : 'chi'}
                  </button>
                </form>
              )}

              {/* ── Goal Form ── */}
              {modalType === 'goal' && (
                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Tên mục tiêu</label>
                    <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} required
                      className="w-full border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111]/10 transition-all"
                      placeholder="Ví dụ: Mua Macbook, Du lịch..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Cần đạt</label>
                      <MoneyInput value={goalTarget} onChange={setGoalTarget} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Đã có</label>
                      <MoneyInput value={goalCurrent} onChange={setGoalCurrent} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Màu sắc</label>
                    <div className="flex gap-2">
                      {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#000000'].map(c => (
                        <button key={c} type="button" onClick={() => setGoalColor(c)}
                          className={`w-8 h-8 rounded-lg transition-all ${goalColor === c ? 'ring-2 ring-offset-2 ring-[#111] scale-110' : 'hover:scale-105'}`}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#111] text-white rounded-xl py-3 text-[14px] font-semibold hover:bg-[#333] transition-colors">
                    Lưu mục tiêu
                  </button>
                </form>
              )}

              {/* ── Subscription Form ── */}
              {modalType === 'subscription' && (
                <form onSubmit={handleCreateSub} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Tên gói</label>
                    <input type="text" value={subTitle} onChange={e => setSubTitle(e.target.value)} required
                      className="w-full border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111]/10 transition-all"
                      placeholder="Ví dụ: Netflix, ChatGPT..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Số tiền</label>
                      <MoneyInput value={subAmount} onChange={setSubAmount} />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Chu kỳ</label>
                      <select value={subCycle} onChange={e => setSubCycle(e.target.value)}
                        className="w-full border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-[15px] outline-none focus:border-[#111] bg-white transition-all">
                        <option value="monthly">Hàng tháng</option>
                        <option value="annually">Hàng năm</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#999] mb-1.5 uppercase tracking-wide">Icon</label>
                    <div className="flex gap-2">
                      {[
                        { key: 'terminal', icon: <Terminal className="w-4 h-4" />, label: 'Dev' },
                        { key: 'cloud', icon: <Cloud className="w-4 h-4" />, label: 'Cloud' },
                        { key: 'brain', icon: <Brain className="w-4 h-4" />, label: 'AI' },
                      ].map(opt => (
                        <button key={opt.key} type="button" onClick={() => setSubIcon(opt.key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${subIcon === opt.key ? 'border-[#111] bg-[#111] text-white' : 'border-[#e5e5e5] text-[#666] hover:border-[#ccc]'}`}>
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#111] text-white rounded-xl py-3 text-[14px] font-semibold hover:bg-[#333] transition-colors">
                    Lưu gói đăng ký
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
