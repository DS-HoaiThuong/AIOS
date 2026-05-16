import { useState, useEffect } from 'react';
import { fetchTransactions, createTransaction, deleteTransaction } from '../lib/api';
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, Trash2, Loader2, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function FinanceBoard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('expense');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    
    try {
      const newTx = await createTransaction({
        title,
        amount: parseFloat(amount),
        type,
        category: 'General',
        date: new Date().toISOString()
      });
      setTransactions([newTx, ...transactions]);
      setTitle('');
      setAmount('');
    } catch (error) {
      console.error('Failed to create transaction', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  // Process data for chart
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const chartDataMap = new Map();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    chartDataMap.set(dateStr, {
      name: i === 0 ? 'Today' : days[d.getDay()],
      date: dateStr,
      Income: 0,
      Expense: 0
    });
  }

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const dateStr = txDate.toISOString().split('T')[0];
    if (chartDataMap.has(dateStr)) {
      const data = chartDataMap.get(dateStr);
      if (tx.type === 'income') data.Income += tx.amount;
      else data.Expense += tx.amount;
    }
  });

  const chartData = Array.from(chartDataMap.values());

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Finance Overview</h2>
          <p className="text-zinc-500 text-sm mt-1">Track your income and expenses.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-zinc-500 mb-4">
            <Wallet className="w-5 h-5 text-indigo-500" />
            <h3 className="font-medium text-sm tracking-wide uppercase">Total Balance</h3>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900">${balance.toFixed(2)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-4">
            <ArrowUpRight className="w-5 h-5" />
            <h3 className="font-medium text-sm tracking-wide uppercase">Total Income</h3>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">${income.toFixed(2)}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-rose-600 mb-4">
            <ArrowDownRight className="w-5 h-5" />
            <h3 className="font-medium text-sm tracking-wide uppercase">Total Expense</h3>
          </div>
          <p className="text-3xl font-extrabold text-rose-600">${expense.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-col h-64">
        <div className="flex items-center gap-3 text-zinc-500 mb-4">
          <BarChart2 className="w-5 h-5 text-indigo-500" />
          <h3 className="font-medium text-sm tracking-wide uppercase">Cash Flow (Last 7 Days)</h3>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                cursor={{ fill: '#F4F4F5' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E4E4E7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#18181B', fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`]}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
              <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-8 flex-1 overflow-hidden">
        <div className="w-1/3">
          <h3 className="font-bold text-lg mb-4 text-zinc-900">Add Transaction</h3>
          <form onSubmit={handleCreate} className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-zinc-500 uppercase tracking-wide mb-2">Type</label>
              <div className="flex bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  Income
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-zinc-500 uppercase tracking-wide mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Groceries"
                className="w-full bg-white border border-zinc-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 outline-none shadow-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-zinc-500 uppercase tracking-wide mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-zinc-200 focus:border-indigo-500 rounded-xl px-4 py-3 pl-8 text-zinc-900 placeholder:text-zinc-400 outline-none shadow-sm transition-colors"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 shadow-sm shadow-indigo-500/20 active:scale-[0.98]">
              <Plus className="w-5 h-5" />
              Add Transaction
            </button>
          </form>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <h3 className="font-bold text-lg mb-4 text-zinc-900">Recent Transactions</h3>
          <div className="flex-1 bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-400 font-medium">
                  No transactions yet. Add one to get started!
                </div>
              ) : (
                <div className="space-y-1">
                  {transactions.map(tx => (
                    <div key={tx.id} className="group flex items-center justify-between p-4 hover:bg-zinc-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-[15px] text-zinc-900 mb-0.5">{tx.title}</p>
                          <p className="text-xs font-medium text-zinc-500">{new Date(tx.date).toLocaleDateString()} • {tx.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={`font-extrabold text-lg ${tx.type === 'income' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </p>
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
