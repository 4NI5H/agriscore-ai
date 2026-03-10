/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Layout, Users, FileText, LayoutDashboard, PlusCircle, ShieldCheck, Settings, LogOut, Bell, Search, Sparkles, WifiOff, CloudOff, RefreshCw, Send, MapPin, Phone, Mail, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import FarmerForm from './components/FarmerForm';
import FarmerList from './components/FarmerList';
import FarmerDetail from './components/FarmerDetail';

type Page = 'dashboard' | 'list' | 'form' | 'detail' | 'agents' | 'settings';

// Mock Field Agents View
function AgentsView() {
  const agents = [
    { id: 1, name: 'Ramesh Kumar', region: 'Maharashtra North', active: 24, completed: 156 },
    { id: 2, name: 'Sita Patel', region: 'Gujarat East', active: 18, completed: 204 },
    { id: 3, name: 'Vijay Singh', region: 'Punjab South', active: 31, completed: 89 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Field Agents</h2>
        <p className="text-gray-500 mt-1 font-medium">Manage on-ground personnel and their assessment territories.</p>
      </header>
      <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map(agent => (
            <div key={agent.id} className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 hover:border-emerald-200 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-display font-bold">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{agent.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} /> {agent.region}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm">
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-emerald-600">{agent.active}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</p>
                </div>
                <div className="w-px h-8 bg-gray-100" />
                <div className="text-center">
                  <p className="text-2xl font-display font-bold text-gray-900">{agent.completed}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock Settings View
function SettingsView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Platform Settings</h2>
        <p className="text-gray-500 mt-1 font-medium">Configure AI models, risk thresholds, and localization.</p>
      </header>
      <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm space-y-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Engine Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900">Auto-Reject Threshold</p>
                <p className="text-xs text-gray-500">AgriScore below which applications are automatically rejected.</p>
              </div>
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-900">45</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900">Climate Risk Weightage</p>
                <p className="text-xs text-gray-500">Impact of weather anomalies on the final score.</p>
              </div>
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-900">25%</div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Localization</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div>
              <p className="font-bold text-gray-900">Default Assessment Language</p>
              <p className="text-xs text-gray-500">Primary language for voice interactions.</p>
            </div>
            <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none">
              <option>English (en-IN)</option>
              <option>Hindi (hi-IN)</option>
              <option>Marathi (mr-IN)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null);
  const [listFilter, setListFilter] = useState<string>('');
  const [listSearch, setListSearch] = useState<string>('');
  const [isOffline, setIsOffline] = useState(false);
  const [syncPending, setSyncPending] = useState(3);

  const navigateToDetail = (id: number) => {
    setSelectedFarmerId(id);
    setCurrentPage('detail');
  };

  const navigateToList = (filter?: string, search?: string) => {
    setListFilter(filter || '');
    setListSearch(search || '');
    setCurrentPage('list');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex font-sans text-gray-900 overflow-hidden print:overflow-visible">
      {/* Premium Dark Sidebar */}
      <aside className="w-72 bg-[#064E3B] text-white flex flex-col fixed h-full z-20 shadow-2xl print:hidden">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight text-white">AgriCopilot</h1>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-[0.2em] flex items-center gap-1">
                <Sparkles size={10} /> AI Credit Engine
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="px-4 mb-4">
            <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">Main Menu</p>
          </div>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
              currentPage === 'dashboard' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} className={currentPage === 'dashboard' ? 'text-emerald-400' : 'group-hover:text-emerald-400 transition-colors'} />
            <span className="text-sm font-bold uppercase tracking-widest">Dashboard</span>
          </button>
          <button
            onClick={() => navigateToList()}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
              currentPage === 'list' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users size={20} className={currentPage === 'list' ? 'text-emerald-400' : 'group-hover:text-emerald-400 transition-colors'} />
            <span className="text-sm font-bold uppercase tracking-widest">Repository</span>
          </button>
          <button
            onClick={() => setCurrentPage('form')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
              currentPage === 'form' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <PlusCircle size={20} className={currentPage === 'form' ? 'text-emerald-400' : 'group-hover:text-emerald-400 transition-colors'} />
            <span className="text-sm font-bold uppercase tracking-widest">Assessment</span>
          </button>

          <div className="px-4 pt-8 mb-4">
            <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">Pilot Deployment</p>
          </div>
          <button 
            onClick={() => setCurrentPage('agents')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
              currentPage === 'agents' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Send size={20} className={currentPage === 'agents' ? 'text-emerald-400' : 'group-hover:text-emerald-400 transition-colors'} />
            <span className="text-sm font-bold uppercase tracking-widest">Field Agents</span>
          </button>
          <button 
            onClick={() => setCurrentPage('settings')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
              currentPage === 'settings' ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-emerald-100/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings size={20} className={currentPage === 'settings' ? 'text-emerald-400' : 'group-hover:text-emerald-400 transition-colors'} />
            <span className="text-sm font-bold uppercase tracking-widest">Settings</span>
          </button>
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-[#022C22] rounded-[32px] p-6 text-white relative overflow-hidden group cursor-pointer border border-white/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 rounded-full -mr-12 -mt-12 opacity-10 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <span className="font-bold text-emerald-400">NF</span>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-tight">Nandini Finance</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Premium Partner</p>
                </div>
              </div>
              <button className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-white transition-colors">
                Logout
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-72 flex flex-col h-screen overflow-y-auto print:ml-0 print:h-auto print:overflow-visible">
        {/* Top Header */}
        <header className="h-20 glass-panel border-b border-gray-200/50 flex items-center justify-between px-10 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-gray-400 bg-white/50 px-4 py-2 rounded-full border border-gray-200/50 hover:bg-white transition-colors cursor-text w-64">
              <Search size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Global Search...</span>
            </div>
            
            {/* Spotty Internet / Offline Indicator */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${isOffline ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {isOffline ? (
                <>
                  <WifiOff size={14} className="animate-pulse" />
                  <span>Offline Mode Active</span>
                </>
              ) : (
                <>
                  <CloudOff size={14} />
                  <span>Local-First Sync</span>
                </>
              )}
            </div>
            {syncPending > 0 && (
              <button 
                onClick={() => {
                  if (!isOffline) {
                    setSyncPending(0);
                    alert("Syncing 3 pending profiles to cloud...");
                  } else {
                    alert("Cannot sync while offline. Waiting for connection...");
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} className={!isOffline ? "animate-spin" : ""} />
                <span>{syncPending} Pending Syncs</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-gray-900 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-gray-900 tracking-tight group-hover:text-emerald-600 transition-colors">Ashutosh M.</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Senior Analyst</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border border-gray-200 flex items-center justify-center font-bold text-gray-600 shadow-sm group-hover:shadow-md transition-all">
                AM
              </div>
            </div>
          </div>
        </header>

        <main className="p-10 flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {currentPage === 'dashboard' && <Dashboard onFarmerClick={navigateToDetail} onNavigateToList={navigateToList} />}
              {currentPage === 'list' && <FarmerList onFarmerClick={navigateToDetail} initialFilter={listFilter} initialSearch={listSearch} />}
              {currentPage === 'form' && <FarmerForm onComplete={(id) => navigateToDetail(id)} />}
              {currentPage === 'detail' && selectedFarmerId && (
                <FarmerDetail farmerId={selectedFarmerId} onBack={() => navigateToList()} />
              )}
              {currentPage === 'agents' && <AgentsView />}
              {currentPage === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

