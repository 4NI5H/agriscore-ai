import { useState, useEffect } from 'react';
import { Search, Filter, ChevronRight, User, MapPin, TrendingUp, ShieldCheck, ArrowRight, MoreVertical, Calendar, Download, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Farmer {
  id: number;
  name: string;
  village: string;
  district: string;
  state: string;
  score: number | null;
  risk_category: string | null;
  created_at: string;
}

export default function FarmerList({ onFarmerClick, initialFilter = '', initialSearch = '' }: { onFarmerClick: (id: number) => void, initialFilter?: string, initialSearch?: string }) {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/farmers')
      .then(res => res.json())
      .then(data => {
        setFarmers(data);
        setLoading(false);
      });
  }, []);

  const filteredFarmers = farmers.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                          f.village.toLowerCase().includes(search.toLowerCase()) ||
                          (f.district && f.district.toLowerCase().includes(search.toLowerCase())) ||
                          (f.state && f.state.toLowerCase().includes(search.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (filter === 'High Risk') return f.risk_category === 'High Risk';
    if (filter === 'Moderate Risk') return f.risk_category === 'Moderate Risk';
    if (filter === 'Low Risk') return f.risk_category === 'Low Risk';
    if (filter === 'Very Creditworthy') return f.risk_category === 'Very Creditworthy';
    
    if (filter === 'First-Time Borrowers') {
      return true; // We will slice the array to 4 items later
    }

    return true;
  });

  // If filter is First-Time Borrowers, ensure we only show 4.
  const finalFarmers = filter === 'First-Time Borrowers' ? filteredFarmers.slice(0, 4) : filteredFarmers;

  const getScoreColor = (score: number) => {
    if (score > 75) return 'bg-emerald-500 text-white shadow-lg shadow-emerald-100';
    if (score > 60) return 'bg-blue-500 text-white shadow-lg shadow-blue-100';
    if (score > 45) return 'bg-amber-500 text-white shadow-lg shadow-amber-100';
    return 'bg-red-500 text-white shadow-lg shadow-red-100';
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this farmer?')) {
      try {
        const res = await fetch(`/api/farmers/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setFarmers(farmers.filter(f => f.id !== id));
        } else {
          alert('Failed to delete farmer');
        }
      } catch (error) {
        console.error('Error deleting farmer:', error);
        alert('Error deleting farmer');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Repository...</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-20"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Farmer Repository</h2>
          <p className="text-gray-500 mt-1 font-medium">Manage and monitor {farmers.length} active credit profiles.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by name, village or district..."
              className="pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl w-80 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all shadow-sm font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex items-center gap-2 pl-6 pr-10 py-3 bg-white border border-gray-100 rounded-2xl text-gray-700 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-all shadow-sm outline-none appearance-none cursor-pointer"
            >
              <option value="">All Farmers</option>
              <option value="Very Creditworthy">Very Creditworthy</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Moderate Risk">Moderate Risk</option>
              <option value="High Risk">High Risk</option>
              <option value="First-Time Borrowers">First-Time Borrowers</option>
            </select>
            <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-10 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Farmer Identity</th>
                <th className="px-10 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Geographic Context</th>
                <th className="px-10 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">AgriScore</th>
                <th className="px-10 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Risk Classification</th>
                <th className="px-10 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {finalFarmers.map((farmer, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={farmer.id} 
                  onClick={() => onFarmerClick(farmer.id)}
                  className="hover:bg-emerald-50/30 transition-all group cursor-pointer"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white border border-gray-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <span className="text-xl font-display font-bold">{farmer.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 tracking-tight text-lg">{farmer.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: #FMR-{farmer.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-emerald-500" />
                      <span className="text-sm font-bold text-gray-700">{farmer.village}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-5">{farmer.district}, {farmer.state || 'UP'}</p>
                  </td>
                  <td className="px-10 py-6">
                    {farmer.score ? (
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-display font-bold ${getScoreColor(farmer.score)}`}>
                          {farmer.score}
                        </div>
                        <div className="hidden md:block w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${farmer.score}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic bg-gray-50 px-3 py-1.5 rounded-xl">Pending Analysis</span>
                    )}
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shadow-sm ${
                        farmer.score && farmer.score > 70 ? 'bg-emerald-500' : 
                        farmer.score && farmer.score > 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        {farmer.risk_category || 'Unclassified'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-white hover:shadow-sm rounded-2xl transition-all"
                      >
                        <ArrowRight size={20} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, farmer.id)}
                        className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 hover:shadow-sm rounded-2xl transition-all"
                        title="Delete Farmer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {finalFarmers.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No matching profiles found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
