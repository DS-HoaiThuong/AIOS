import { useState, useEffect } from 'react';
import { 
  fetchTransactions, createTransaction, deleteTransaction,
  fetchGoals, createGoal, updateGoal,
  fetchSubscriptions, createSubscription 
} from '../lib/api';
import { Sparkles, MoreHorizontal, TrendingUp, Plus, Terminal, Cloud, Brain, X, Loader2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const CATEGORIES = ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Sức khỏe', 'Giải trí', 'Học tập', 'Lương', 'Đầu tư', 'Khác'];

// Format helper
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function FinanceBoard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'transaction' | 'goal' | 'subscription'>('transaction');

  // Form States
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState('expense');
  const [txCategory, setTxCategory] = useState('Khác');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalColor, setGoalColor] = useState('#000000');

  const [subTitle, setSubTitle] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState('monthly');
  const [subIcon, setSubIcon] = useState('terminal');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txData, goalData, subData] = await Promise.all([
        fetchTransactions(),
        fetchGoals(),
        fetchSubscriptions()
      ]);
      setTransactions(txData);
      setGoals(goalData);
      setSubscriptions(subData);
    } catch (error) {
      console.error('Failed to load finance data', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit Handlers
  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;
    try {
      const newTx = await createTransaction({
        title: txTitle,
        amount: parseFloat(txAmount),
        type: txType,
        category: txCategory,
        date: new Date().toISOString()
      });
      setTransactions([newTx, ...transactions]);
      setIsModalOpen(false);
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

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;
    try {
      const newGoal = await createGoal({
        title: goalTitle,
        targetAmount: parseFloat(goalTarget),
        currentAmount: goalCurrent ? parseFloat(goalCurrent) : 0,
        color: goalColor
      });
      setGoals([...goals, newGoal]);
      setIsModalOpen(false);
      setGoalTitle(''); setGoalTarget(''); setGoalCurrent('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddMoneyToGoal = async (goal: any) => {
    const amountStr = window.prompt(`Nhập số tiền muốn thêm vào mục tiêu "${goal.title}":`);
    if (!amountStr) return;
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Số tiền không hợp lệ');
      return;
    }

    try {
      const newCurrentAmount = goal.currentAmount + amount;
      const updatedGoal = await updateGoal(goal.id, { currentAmount: newCurrentAmount });
      
      setGoals(goals.map(g => g.id === goal.id ? updatedGoal : g));
      
      // Optionally also add a transaction for this expense? We'll just update the goal for now.
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
        amount: parseFloat(subAmount),
        billingCycle: subCycle,
        icon: subIcon
      });
      setSubscriptions([...subscriptions, newSub]);
      setIsModalOpen(false);
      setSubTitle(''); setSubAmount('');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#000000]" />
      </div>
    );
  }

  // Computed values
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;
  const healthScore = income > 0 ? Math.min(100, Math.round(((income - expense) / income) * 100)) : 0;
  
  const totalSubCost = subscriptions.reduce((acc, sub) => acc + sub.amount, 0);

  // Compute 7 days chart data based on expenses
  const chartDays = 7;
  const today = new Date();
  const recentExpenses = Array.from({ length: chartDays }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (chartDays - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    const dayTotal = transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(dateStr))
      .reduce((acc, t) => acc + t.amount, 0);
    return { date: d, amount: dayTotal };
  });

  const maxExpense = Math.max(...recentExpenses.map(d => d.amount), 1); // Avoid div by 0

  const getSubIcon = (name: string) => {
    switch (name) {
      case 'cloud': return <Cloud className="w-4 h-4 text-[#444748]" />;
      case 'brain': return <Brain className="w-4 h-4 text-[#444748]" />;
      default: return <Terminal className="w-4 h-4 text-[#444748]" />;
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full pb-10">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold text-[#000000]">Financial Equilibrium</h2>
          <p className="text-[18px] leading-[1.6] text-[#444748] mt-2 max-w-2xl">
            Your cognitive wealth dashboard. Monitoring patterns to maintain financial clarity.
          </p>
        </div>
        <button 
          onClick={() => { setModalTab('transaction'); setIsModalOpen(true); }}
          className="bg-[#000000] text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {/* AI Insights Glow Block */}
      <div className="mb-10 rounded-xl border border-[#B3B1D2] bg-[#B3B1D2]/10 p-6 flex items-start gap-6">
        <div className="p-2 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <Sparkles className="text-[#708a7a] w-6 h-6" />
        </div>
        <div>
          <h3 className="text-[20px] leading-[1.4] tracking-[-0.01em] font-medium text-[#000000] mb-1">
            AI Insight
          </h3>
          <p className="text-[15px] leading-[1.6] text-[#444748]">
            Dựa trên dòng tiền hiện tại, bạn có khoản thặng dư {formatVND(balance > 0 ? balance : 0)} trong tháng này. Hãy cân nhắc phân bổ vào quỹ mục tiêu để duy trì trạng thái tài chính khỏe mạnh.
          </p>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Health Score Block */}
        <div className="md:col-span-4 bg-white border border-[#E5E5E1] rounded-2xl p-6 flex flex-col justify-between h-[280px]">
          <div className="flex justify-between items-start">
            <span className="text-[13px] leading-[1.2] tracking-[0.01em] font-medium text-[#444748] uppercase">
              Financial Health
            </span>
            <button className="text-[#c4c7c7] hover:text-[#000000] transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mt-4">
            <div className="text-[72px] leading-none font-semibold text-[#000000] tracking-tight">
              {healthScore > 0 ? healthScore : '--'}
            </div>
            <div className="text-[13px] leading-[1.2] tracking-[0.01em] font-medium text-[#708a7a] mt-2 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Tổng thu: {formatVND(income)}
            </div>
          </div>
          <div className="mt-auto">
            <div className="h-1.5 w-full bg-[#ebe7e6] rounded-full overflow-hidden">
              <div className="h-full bg-[#000000] rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, healthScore)}%` }}></div>
            </div>
            <div className="flex justify-between mt-2 text-[11px] leading-[1] tracking-[0.03em] font-semibold text-[#c4c7c7]">
              <span>Cảnh báo</span>
              <span>Tối ưu</span>
            </div>
          </div>
        </div>

        {/* Monthly Flow Chart Block */}
        <div className="md:col-span-8 bg-white border border-[#E5E5E1] rounded-2xl p-6 h-[280px] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[13px] leading-[1.2] tracking-[0.01em] font-medium text-[#444748] uppercase">
                7-Day Cash Flow
              </span>
              <div className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold text-[#000000] mt-1">
                {formatVND(expense)} <span className="text-[15px] text-[#c4c7c7] font-normal ml-2">Đã chi</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-[11px] leading-[1] tracking-[0.03em] font-semibold bg-[#ebe7e6] rounded-md text-[#000000]">
                7D
              </button>
            </div>
          </div>
          
          {/* Abstract Monochrome Chart Representation */}
          <div className="flex-1 flex items-end gap-2 px-2 relative">
            <div className="absolute inset-x-0 bottom-8 border-b border-dashed border-[#c4c7c7] opacity-50"></div>
            {/* Bars */}
            {recentExpenses.map((day, i) => {
              const heightPercent = maxExpense > 0 ? (day.amount / maxExpense) * 100 : 0;
              const isToday = i === chartDays - 1;
              return (
                <div key={i} className={`flex-1 transition-all rounded-t-sm relative group cursor-pointer ${isToday ? 'bg-[#000000]' : 'bg-[#ebe7e6] hover:bg-[#c8c6c5]'}`} style={{ height: `${Math.max(5, heightPercent)}%` }}>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#313030] text-[#f4f0ef] text-[11px] font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {formatVND(day.amount)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3 text-[11px] leading-[1] tracking-[0.03em] font-semibold text-[#c4c7c7] px-2">
            <span>{recentExpenses[0].date.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
            <span>{recentExpenses[Math.floor(chartDays/2)].date.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
            <span>Hôm nay</span>
          </div>
        </div>

        {/* Goals Block - Redesigned */}
        <div className="md:col-span-6 bg-white border border-[#E5E5E1] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <span className="text-[20px] leading-[1.4] tracking-[-0.01em] font-semibold text-[#000000]">
                Mục tiêu tài chính
              </span>
              <p className="text-[12px] text-[#aaa] mt-0.5">
                {goals.length > 0 ? `${goals.length} mục tiêu đang theo dõi` : 'Chưa có mục tiêu nào'}
              </p>
            </div>
            <button
              onClick={() => { setModalTab('goal'); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] text-white rounded-full text-[12px] font-medium hover:bg-[#333] transition-all duration-200 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Mới
            </button>
          </div>

          <div className="space-y-3">
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f0f0f0] to-[#e5e5e5] flex items-center justify-center mb-3 shadow-inner">
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-[13px] font-semibold text-[#333]">Chưa có mục tiêu nào</p>
                <p className="text-[12px] text-[#999] mt-1">Thêm mục tiêu để bắt đầu tiết kiệm</p>
              </div>
            ) : (
              goals.map(goal => {
                const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                const remaining = goal.targetAmount - goal.currentAmount;
                const radius = 26;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                const isCompleted = remaining <= 0;

                return (
                  <div
                    key={goal.id}
                    className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:shadow-md cursor-default"
                    style={{
                      background: `linear-gradient(135deg, ${goal.color}12 0%, ${goal.color}06 100%)`,
                      border: `1px solid ${goal.color}30`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Circular Progress Ring */}
                      <div className="relative flex-shrink-0 w-[64px] h-[64px]">
                        <svg width="64" height="64" viewBox="0 0 64 64">
                          {/* Track */}
                          <circle
                            cx="32" cy="32" r={radius}
                            fill="none"
                            stroke={`${goal.color}20`}
                            strokeWidth="5"
                          />
                          {/* Progress */}
                          <circle
                            cx="32" cy="32" r={radius}
                            fill="none"
                            stroke={goal.color}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 32 32)"
                            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {isCompleted ? (
                            <span className="text-[15px]">✓</span>
                          ) : (
                            <span className="text-[12px] font-bold tabular-nums" style={{ color: goal.color }}>
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Goal Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-[14px] font-semibold text-[#111] truncate leading-tight">
                            {goal.title}
                          </h4>
                          <button
                            onClick={() => handleAddMoneyToGoal(goal)}
                            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-sm"
                            style={{ background: goal.color, color: '#fff' }}
                            title="Nạp tiền vào mục tiêu"
                          >
                            <Plus className="w-3 h-3" /> Nạp
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2 mb-1.5 h-1.5 w-full rounded-full overflow-hidden" style={{ background: `${goal.color}18` }}>
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${goal.color}99, ${goal.color})`,
                            }}
                          />
                        </div>

                        {/* Amounts */}
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-[#666] tabular-nums">
                            {formatVND(goal.currentAmount)}
                            <span className="text-[#bbb]"> / {formatVND(goal.targetAmount)}</span>
                          </span>
                          {isCompleted ? (
                            <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-0.5">
                              🎉 Hoàn thành!
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium tabular-nums" style={{ color: goal.color }}>
                              còn {formatVND(remaining)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Subscriptions Block */}
        <div className="md:col-span-6 bg-white border border-[#E5E5E1] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[20px] leading-[1.4] tracking-[-0.01em] font-medium text-[#000000]">
              Gói đăng ký (Active)
            </span>
            <span className="text-[13px] leading-[1.2] tracking-[0.01em] font-medium text-[#444748]">
              {formatVND(totalSubCost)}/kỳ
            </span>
          </div>
          <div className="space-y-1">
            {subscriptions.length === 0 ? (
              <div className="text-[13px] text-[#c4c7c7] text-center py-4">Chưa có gói đăng ký nào.</div>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-2 hover:bg-[#f7f3f2] rounded-lg transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#e5e2e1] flex items-center justify-center">
                      {getSubIcon(sub.icon)}
                    </div>
                    <div>
                      <div className="text-[13px] leading-[1.2] tracking-[0.01em] font-medium text-[#000000]">
                        {sub.title}
                      </div>
                      <div className="text-[11px] leading-[1] tracking-[0.03em] font-semibold text-[#c4c7c7]">
                        Thanh toán {sub.billingCycle === 'monthly' ? 'hàng tháng' : 'hàng năm'}
                      </div>
                    </div>
                  </div>
                  <div className="text-[13px] leading-[1.2] tracking-[0.01em] font-medium text-[#000000]">
                    {formatVND(sub.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => { setModalTab('subscription'); setIsModalOpen(true); }}
            className="w-full mt-4 py-2 text-center text-[13px] leading-[1.2] tracking-[0.01em] font-medium text-[#444748] hover:text-[#000000] border border-transparent hover:border-[#E5E5E1] rounded-lg transition-all"
          >
            + Thêm gói đăng ký
          </button>
        </div>

      </div>

      {/* Recent Transactions */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl p-6 mt-6">
        <div className="flex justify-between items-center mb-5">
          <span className="text-[20px] leading-[1.4] tracking-[-0.01em] font-medium text-[#000000]">Giao dịch gần đây</span>
          <button onClick={() => { setModalTab('transaction'); setIsModalOpen(true); }} className="flex items-center gap-1 text-[11px] font-semibold text-[#444748] hover:text-[#000000] transition-colors">
            <Plus className="w-4 h-4" /> Thêm mới
          </button>
        </div>
        {transactions.length === 0 ? (
          <p className="text-[13px] text-[#c4c7c7] text-center py-6">Chưa có giao dịch nào.</p>
        ) : (
          <div className="space-y-1">
            {transactions.slice(0, 15).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-2.5 hover:bg-[#f7f3f2] rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {tx.type === 'income'
                      ? <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                      : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#000000]">{tx.title}</p>
                    <p className="text-[11px] text-[#c4c7c7]">{tx.category} · {new Date(tx.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[13px] font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteTx(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[#c4c7c7] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Universal Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#E5E5E1] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E5E1] flex justify-between items-center bg-[#fdf8f8]">
              <h3 className="text-[20px] font-medium text-[#000000]">Tạo mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#c4c7c7] hover:text-[#000000] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-[#ebe7e6] rounded-lg mb-6">
                <button 
                  onClick={() => setModalTab('transaction')}
                  className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all ${modalTab === 'transaction' ? 'bg-white text-[#000000] shadow-sm' : 'text-[#747878] hover:text-[#000000]'}`}
                >
                  Thu / Chi
                </button>
                <button 
                  onClick={() => setModalTab('goal')}
                  className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all ${modalTab === 'goal' ? 'bg-white text-[#000000] shadow-sm' : 'text-[#747878] hover:text-[#000000]'}`}
                >
                  Mục tiêu
                </button>
                <button 
                  onClick={() => setModalTab('subscription')}
                  className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all ${modalTab === 'subscription' ? 'bg-white text-[#000000] shadow-sm' : 'text-[#747878] hover:text-[#000000]'}`}
                >
                  Gói đăng ký
                </button>
              </div>

              {/* Form Content */}
              {modalTab === 'transaction' && (
                <form onSubmit={handleCreateTx} className="space-y-4">
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 text-[13px] text-[#444748] cursor-pointer">
                      <input type="radio" checked={txType === 'expense'} onChange={() => setTxType('expense')} className="accent-[#000000]" />
                      Khoản chi
                    </label>
                    <label className="flex items-center gap-2 text-[13px] text-[#444748] cursor-pointer">
                      <input type="radio" checked={txType === 'income'} onChange={() => setTxType('income')} className="accent-[#000000]" />
                      Khoản thu
                    </label>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#444748] mb-1">Mô tả</label>
                    <input type="text" value={txTitle} onChange={(e) => setTxTitle(e.target.value)} required className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000]" placeholder="Ví dụ: Lương, Cafe..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-medium text-[#444748] mb-1">Số tiền (VNĐ)</label>
                      <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000]" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#444748] mb-1">Danh mục</label>
                      <select value={txCategory} onChange={e => setTxCategory(e.target.value)} className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000] bg-white">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#000000] text-white rounded-lg py-2 mt-2 text-[13px] font-medium hover:opacity-90">Lưu giao dịch</button>
                </form>
              )}

              {modalTab === 'goal' && (
                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#444748] mb-1">Tên mục tiêu</label>
                    <input type="text" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} required className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000]" placeholder="Ví dụ: Mua Macbook" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#444748] mb-1">Cần đạt (VNĐ)</label>
                      <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} required className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000]" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#444748] mb-1">Đã có (VNĐ)</label>
                      <input type="number" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000]" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#444748] mb-1">Màu sắc</label>
                    <input type="color" value={goalColor} onChange={(e) => setGoalColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer border border-[#E5E5E1] p-1" />
                  </div>
                  <button type="submit" className="w-full bg-[#000000] text-white rounded-lg py-2 mt-4 text-[13px] font-medium hover:opacity-90">Lưu mục tiêu</button>
                </form>
              )}

              {modalTab === 'subscription' && (
                <form onSubmit={handleCreateSub} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#444748] mb-1">Tên gói</label>
                    <input type="text" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} required className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000]" placeholder="Ví dụ: Netflix" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#444748] mb-1">Số tiền (VNĐ)</label>
                    <input type="number" value={subAmount} onChange={(e) => setSubAmount(e.target.value)} required className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000]" placeholder="0" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#444748] mb-1">Chu kỳ</label>
                      <select value={subCycle} onChange={(e) => setSubCycle(e.target.value)} className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000] bg-white">
                        <option value="monthly">Hàng tháng</option>
                        <option value="annually">Hàng năm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#444748] mb-1">Icon</label>
                      <select value={subIcon} onChange={(e) => setSubIcon(e.target.value)} className="w-full border border-[#E5E5E1] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#000000] bg-white">
                        <option value="terminal">Developer</option>
                        <option value="cloud">Cloud Storage</option>
                        <option value="brain">AI Service</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#000000] text-white rounded-lg py-2 mt-4 text-[13px] font-medium hover:opacity-90">Lưu gói đăng ký</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
