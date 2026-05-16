"use client";

import { useState, useEffect } from "react";
import TaskBoard from "../components/TaskBoard";
import { LayoutDashboard, CheckSquare, PiggyBank, BookHeart, BrainCircuit, Sparkles } from "lucide-react";

import FinanceBoard from "../components/FinanceBoard";
import LifeBoard from "../components/LifeBoard";

import DashboardBoard from "../components/DashboardBoard";
import PomodoroTimer from "../components/PomodoroTimer";
import FocusBoard from "../components/FocusBoard";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FAFB] text-zinc-900 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-zinc-200 bg-white flex flex-col z-20">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 px-2 mb-6">
            <h1 className="font-extrabold text-2xl tracking-tight text-zinc-900">
              AI <span className="text-zinc-400 font-medium">OS</span>
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1.5 p-4 pt-0 overflow-y-auto custom-scrollbar">
          <NavItem 
            icon={<LayoutDashboard className="w-[18px] h-[18px]" />} 
            label="Dashboard" 
            isActive={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
          />
          <NavItem 
            icon={<CheckSquare className="w-[18px] h-[18px]" />} 
            label="Tasks" 
            isActive={activeTab === "tasks"} 
            onClick={() => setActiveTab("tasks")} 
          />
          <NavItem 
            icon={<BrainCircuit className="w-[18px] h-[18px]" />} 
            label="Focus" 
            isActive={activeTab === "focus"} 
            onClick={() => setActiveTab("focus")} 
          />
          <NavItem 
            icon={<PiggyBank className="w-[18px] h-[18px]" />} 
            label="Finance" 
            isActive={activeTab === "finance"} 
            onClick={() => setActiveTab("finance")} 
          />
          <NavItem 
            icon={<BookHeart className="w-[18px] h-[18px]" />} 
            label="Life OS" 
            isActive={activeTab === "life"} 
            onClick={() => setActiveTab("life")} 
          />
        </nav>

        {/* User Profile */}
        <div className="p-6 border-t border-zinc-100 mt-auto">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-medium shadow-sm group-hover:scale-105 transition-transform">
              H
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Hien</p>
              <p className="text-xs text-zinc-500">Premium Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto flex flex-col relative">
        {/* Top Header */}
        <header className="h-[80px] flex items-center justify-between px-10 bg-[#F9FAFB]/80 backdrop-blur-md sticky top-0 z-10 border-b border-zinc-200/50">
          <div className="relative w-96">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Ask AI or search anything..." 
              className="w-full bg-zinc-100 border-none rounded-full py-2.5 pl-10 pr-4 text-sm text-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white transition-all hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="p-10 flex-1">
          {activeTab === "dashboard" ? (
            <DashboardBoard />
          ) : activeTab === "tasks" ? (
            <TaskBoard />
          ) : activeTab === "finance" ? (
            <FinanceBoard />
          ) : activeTab === "life" ? (
            <LifeBoard />
          ) : activeTab === "focus" ? (
            <FocusBoard />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400 flex-col gap-4">
              <BrainCircuit className="w-12 h-12 opacity-20" />
              <p>Module "{activeTab}" is currently under construction.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-[14px] font-medium transition-all ${
        isActive 
          ? "bg-[#1E1E1E] text-white shadow-sm" 
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
