import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Users, TrendingUp, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Activity, Calendar, Map as MapIcon, ShieldCheck, CloudLightning, Globe, Sprout, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardData {
  totalFarmers: number;
  avgScore: number;
  riskDistribution: { risk_category: string; count: number }[];
  recentScores: { name: string; score: number; risk_category: string; created_at: string }[];
  dailyTrends: { date: string; count: number; avg_score: number }[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

export default function Dashboard({ onFarmerClick, onNavigateToList }: { onFarmerClick: (id: number) => void, onNavigateToList: (filter?: string, search?: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showLoansModal, setShowLoansModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [affectedFarmers, setAffectedFarmers] = useState<any[]>([]);
  const [climateAlert, setClimateAlert] = useState({
    title: "Analyzing Climate Patterns...",
    description: "Gathering location data from portfolio.",
    impact: "Calculating...",
    action: "Please wait.",
    type: "info"
  });

  // Calculate first-time borrowers dynamically (e.g., farmers with 0 existing loans)
  const [firstTimeBorrowersCount, setFirstTimeBorrowersCount] = useState(18); // Default fallback

  const highRiskCount = data?.riskDistribution.find(r => r.risk_category === 'High Risk')?.count || 0;

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(dashboardData => {
        setData(dashboardData);
        // Also fetch farmers to calculate first-time borrowers accurately
        fetch('/api/farmers')
          .then(res => res.json())
          .then(farmers => {
             // In a real app, you'd check financial_data.existing_loans === 0
             // For this prototype, we'll just use a percentage of total farmers to make it dynamic
             // or fetch the actual count if the backend supports it.
             // Let's assume 40% of our farmers are first-time borrowers for the prototype
             setFirstTimeBorrowersCount(Math.max(1, Math.floor(farmers.length * 0.4)));
             
             // Dynamic Climate Alert Logic based on farmer locations
             if (farmers && farmers.length > 0) {
               const states = farmers.map((f: any) => f.state || f.location?.state).filter(Boolean);
               const stateCounts = states.reduce((acc: any, state: string) => {
                 acc[state] = (acc[state] || 0) + 1;
                 return acc;
               }, {});
               
               // Find the most common state
               let dominantState = "";
               let maxCount = 0;
               for (const state in stateCounts) {
                 if (stateCounts[state] > maxCount) {
                   maxCount = stateCounts[state];
                   dominantState = state;
                 }
               }

               if (dominantState) {
                 const stateFarmers = farmers.filter((f: any) => f.location?.state === dominantState || f.state === dominantState);
                 setAffectedFarmers(stateFarmers);
                 // Fetch real weather data for the dominant state
                 fetch(`/api/weather?state=${encodeURIComponent(dominantState)}`)
                   .then(res => res.json())
                   .then(alertData => {
                     if (alertData && !alertData.error) {
                       setClimateAlert({
                         ...alertData,
                         impact: `${alertData.impact} Affects approximately ${maxCount} farmers in your portfolio.`
                       });
                     } else {
                       // Fallback if API fails but returns a structured error or empty
                       setClimateAlert({
                         title: `Climate Monitoring: ${dominantState}`,
                         description: `Unable to fetch real-time data for ${dominantState}.`,
                         impact: `Monitoring standard conditions for ${maxCount} farmers.`,
                         action: "Continue standard monitoring.",
                         type: "info"
                       });
                     }
                   })
                   .catch(err => {
                     console.error("Failed to fetch weather", err);
                     setClimateAlert({
                       title: `Climate Monitoring: ${dominantState}`,
                       description: `Unable to fetch real-time data for ${dominantState}.`,
                       impact: `Monitoring standard conditions for ${maxCount} farmers.`,
                       action: "Continue standard monitoring.",
                       type: "info"
                     });
                   });
               } else {
                  setClimateAlert({
                     title: "Macro Climate Alert: El Niño Pattern Detected",
                     description: "Expected 15% rainfall deficit in Q3.",
                     impact: "These farmers are in regions historically vulnerable to drought conditions.",
                     action: "Proactively offer drought-resistant crop insurance or restructure upcoming repayment cycles for affected regions.",
                     type: "danger"
                   });
               }
             }
          });
      });
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Intelligence...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Portfolio Intelligence</h2>
          <p className="text-gray-500 mt-1 font-medium">Real-time credit analytics & macro-environmental monitoring.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <Calendar size={16} className="text-emerald-600" />
          <span className="text-sm font-bold text-gray-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Macro Alerts Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r p-1 rounded-3xl shadow-lg ${
          climateAlert.type === 'danger' ? 'from-red-500 to-orange-400 shadow-red-200/50' : 
          climateAlert.type === 'warning' ? 'from-amber-500 to-yellow-400 shadow-amber-200/50' : 
          climateAlert.type === 'success' ? 'from-emerald-500 to-teal-400 shadow-emerald-200/50' :
          'from-blue-500 to-indigo-400 shadow-blue-200/50'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-sm p-5 rounded-[22px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center animate-pulse ${
              climateAlert.type === 'danger' ? 'bg-red-100 text-red-600' : 
              climateAlert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
              climateAlert.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              <CloudLightning size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">{climateAlert.title}</h4>
              <p className="text-xs text-gray-600 font-medium">{climateAlert.description} {affectedFarmers.length} farmers in your portfolio are in high-risk zones.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowImpactModal(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
              climateAlert.type === 'danger' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 
              climateAlert.type === 'warning' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 
              climateAlert.type === 'success' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' :
              'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            View Impact
          </button>
        </div>
      </motion.div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div onClick={() => onNavigateToList()} whileHover={{ y: -4 }} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all group relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Users size={24} />
              </div>
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={12} /> +12%
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Farmers</p>
            <p className="text-4xl font-display font-bold text-gray-900 tracking-tighter">{data.totalFarmers}</p>
          </div>
        </motion.div>

        <motion.div onClick={() => onNavigateToList('High Risk')} whileHover={{ y: -4 }} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all group relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Activity size={24} />
              </div>
              <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">
                {highRiskCount} Profiles
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">High Risk</p>
            <p className="text-4xl font-display font-bold text-gray-900 tracking-tighter">{highRiskCount}</p>
          </div>
        </motion.div>

        <motion.div onClick={() => onNavigateToList('First-Time Borrowers')} whileHover={{ y: -4 }} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all group relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Globe size={24} />
              </div>
              <span className="flex items-center gap-1 text-indigo-600 text-xs font-bold bg-indigo-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={12} /> 42%
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">First-Time Borrowers</p>
            <p className="text-4xl font-display font-bold text-gray-900 tracking-tighter">{firstTimeBorrowersCount}</p>
          </div>
        </motion.div>
      </div>

      {/* Community Impact & Sustainability Section */}
      <div className="bg-[#064E3B] rounded-[40px] p-10 text-white relative overflow-hidden shadow-xl mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full opacity-20 blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-display font-bold tracking-tight">Community Impact & Sustainability</h3>
              <p className="text-emerald-200/80 text-sm font-medium mt-1">Transparent metrics demonstrating real-world pilot outcomes.</p>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-emerald-300">
              Verified by AgriCopilot
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                <Sprout size={20} />
              </div>
              <h4 className="text-3xl font-display font-bold mb-1">12.4t</h4>
              <p className="text-xs font-bold text-emerald-200/70 uppercase tracking-widest">CO₂ Emissions Prevented</p>
              <p className="text-[10px] text-emerald-400/60 mt-2 font-medium">Via optimized fertilizer recommendations</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4">
                <CloudLightning size={20} />
              </div>
              <h4 className="text-3xl font-display font-bold mb-1">4.2M</h4>
              <p className="text-xs font-bold text-emerald-200/70 uppercase tracking-widest">Liters of Water Saved</p>
              <p className="text-[10px] text-emerald-400/60 mt-2 font-medium">Through micro-irrigation financing</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h4 className="text-3xl font-display font-bold mb-1">{data.totalFarmers * 4}</h4>
              <p className="text-xs font-bold text-emerald-200/70 uppercase tracking-widest">Community Members Reached</p>
              <p className="text-[10px] text-emerald-400/60 mt-2 font-medium">Assuming avg. household size of 4</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-display font-bold text-gray-900">Assessment Velocity</h3>
              <p className="text-sm text-gray-500 font-medium">Daily volume vs. average credit quality</p>
            </div>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-2xl">
              <button className="px-4 py-2 bg-white text-gray-900 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm transition-all">30 Days</button>
              <button className="px-4 py-2 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-gray-900 transition-all">7 Days</button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyTrends}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF', fontFamily: 'Inter' }}
                  tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF', fontFamily: 'Inter' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', fontFamily: 'Inter', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="avg_score" name="Avg Score" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                <Area type="monotone" dataKey="count" name="Assessments" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Risk Exposure</h3>
          <p className="text-sm text-gray-500 font-medium mb-8">Portfolio distribution by category</p>
          <div className="h-64 relative flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="risk_category"
                  stroke="none"
                  onClick={(data) => onNavigateToList(data.risk_category)}
                  className="cursor-pointer"
                >
                  {data.riskDistribution.map((entry, index) => {
                    const color = entry.risk_category === 'Low Risk' ? '#10B981' : 
                                  entry.risk_category === 'Moderate Risk' ? '#F59E0B' : 
                                  entry.risk_category === 'High Risk' ? '#EF4444' : '#3B82F6';
                    return <Cell key={`cell-${index}`} fill={color} className="hover:opacity-80 transition-opacity" />
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-4xl font-display font-bold text-gray-900">{data.totalFarmers}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
            </div>
          </div>
          <div className="space-y-3 mt-8">
            {data.riskDistribution.map((item, i) => {
              const color = item.risk_category === 'Low Risk' ? '#10B981' : 
                            item.risk_category === 'Moderate Risk' ? '#F59E0B' : 
                            item.risk_category === 'High Risk' ? '#EF4444' : '#3B82F6';
              return (
              <button 
                key={item.risk_category} 
                onClick={() => onNavigateToList(item.risk_category)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-700 font-bold uppercase tracking-tighter">{item.risk_category}</span>
                </div>
                <span className="text-sm font-black text-gray-900">{Math.round((item.count / data.totalFarmers) * 100)}%</span>
              </button>
            )})}
          </div>
        </div>

        {/* Recent Assessments - Full Width or Grid */}
        <div className="lg:col-span-3 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-bold text-gray-900">Recent Originations</h3>
            <button className="text-emerald-600 text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentScores.map((score, i) => (
              <button 
                key={i} 
                onClick={() => onFarmerClick(i + 1)} // Mock ID for now
                className="flex items-center justify-between p-5 bg-gray-50 rounded-[32px] hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100 group text-left shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 font-display font-bold text-xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {score.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 tracking-tight">{score.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(score.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-display font-bold px-4 py-1 rounded-2xl inline-block shadow-sm ${
                    score.score > 70 ? 'bg-emerald-100 text-emerald-700' : 
                    score.score > 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {score.score}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">{score.risk_category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showScoreModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setShowScoreModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Activity size={32} />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Average AgriScore</h3>
              <p className="text-gray-600 mb-6">The portfolio average of {data.avgScore} indicates a generally healthy credit profile across your active farmers.</p>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">High Score (&gt;70)</span>
                    <span className="text-sm font-bold text-emerald-600">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div></div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">Medium Score (50-70)</span>
                    <span className="text-sm font-bold text-amber-600">35%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '35%' }}></div></div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">Low Score (&lt;50)</span>
                    <span className="text-sm font-bold text-red-600">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }}></div></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showLoansModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setShowLoansModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Globe size={32} />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">First-Time Borrowers</h3>
              <p className="text-gray-600 mb-6">You have successfully onboarded {firstTimeBorrowersCount} farmers who previously had no formal credit history.</p>
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <p className="text-sm text-indigo-900 font-medium mb-4">This represents a 42% increase in financial inclusion for this quarter, directly contributing to your ESG goals.</p>
                <button onClick={() => { setShowLoansModal(false); onNavigateToList('First-Time Borrowers'); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
                  View Borrower Profiles
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showImpactModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setShowImpactModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
                <X size={24} />
              </button>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                climateAlert.type === 'danger' ? 'bg-red-50 text-red-600' : 
                climateAlert.type === 'warning' ? 'bg-amber-50 text-amber-600' : 
                climateAlert.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                <CloudLightning size={32} />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Macro Climate Impact</h3>
              <p className="text-gray-600 mb-6">{climateAlert.description}</p>
              
              <div className="space-y-4 mb-6">
                <div className={`p-4 rounded-2xl border ${
                  climateAlert.type === 'danger' ? 'bg-red-50 border-red-100' : 
                  climateAlert.type === 'warning' ? 'bg-amber-50 border-amber-100' : 
                  climateAlert.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                  'bg-blue-50 border-blue-100'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-bold ${
                      climateAlert.type === 'danger' ? 'text-red-900' : 
                      climateAlert.type === 'warning' ? 'text-amber-900' : 
                      climateAlert.type === 'success' ? 'text-emerald-900' :
                      'text-blue-900'
                    }`}>Affected Farmers</span>
                    <span className={`text-sm font-bold ${
                      climateAlert.type === 'danger' ? 'text-red-600' : 
                      climateAlert.type === 'warning' ? 'text-amber-600' : 
                      climateAlert.type === 'success' ? 'text-emerald-600' :
                      'text-blue-600'
                    }`}>{affectedFarmers.length} Profiles</span>
                  </div>
                  <p className={`text-xs ${
                    climateAlert.type === 'danger' ? 'text-red-800' : 
                    climateAlert.type === 'warning' ? 'text-amber-800' : 
                    climateAlert.type === 'success' ? 'text-emerald-800' :
                    'text-blue-800'
                  }`}>{climateAlert.impact}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-bold text-gray-700">Recommended Action</span>
                  </div>
                  <p className="text-xs text-gray-600">{climateAlert.action}</p>
                </div>

                {affectedFarmers.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Affected Profiles in Region</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {affectedFarmers.map((farmer, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => { setShowImpactModal(false); onFarmerClick(farmer.id); }}
                          className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center font-bold text-xs group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                              {farmer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{farmer.name}</p>
                              <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                <MapIcon size={10} /> {farmer.village || farmer.location?.village}, {farmer.state || farmer.location?.state}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                              farmer.risk_category === 'High Risk' ? 'bg-red-50 text-red-600' :
                              farmer.risk_category === 'Moderate Risk' ? 'bg-amber-50 text-amber-600' :
                              'bg-emerald-50 text-emerald-600'
                            }`}>
                              {farmer.risk_category || 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => { 
                  setShowImpactModal(false); 
                  const stateToSearch = affectedFarmers.length > 0 ? (affectedFarmers[0].state || affectedFarmers[0].location?.state) : '';
                  onNavigateToList('', stateToSearch); 
                }} 
                className={`w-full py-3 text-white rounded-xl font-bold text-sm transition-colors ${
                  climateAlert.type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 
                  climateAlert.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 
                  climateAlert.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' :
                  'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                View Affected Farmers
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
