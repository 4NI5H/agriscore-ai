import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Download, MapPin, TrendingUp, AlertTriangle, CheckCircle, Info, Calendar, IndianRupee, Sprout, Droplets, Landmark, ShieldCheck, Zap, BarChart3, PieChart as PieChartIcon, Activity, Satellite, Smartphone, Wifi, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'motion/react';
import html2pdf from 'html2pdf.js';

// Fix Leaflet marker icon issue
import L from 'leaflet';
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface FarmerDetailProps {
  farmerId: number;
  onBack: () => void;
}

export default function FarmerDetail({ farmerId, onBack }: FarmerDetailProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);

  useEffect(() => {
    fetch(`/api/farmers/${farmerId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [farmerId]);

  const handleExportPDF = () => {
    const element = reportRef.current;
    if (!element) return;
    
    const opt = {
      margin:       0.5,
      filename:     `AgriCopilot_Report_${data.farmer.name.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading || !data) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Generating Intelligence...</p>
      </div>
    </div>
  );

  const radarData = [
    { subject: 'Land', A: data.score?.breakdown?.land || 0, fullMark: 20 },
    { subject: 'Weather', A: data.score?.breakdown?.weather || 0, fullMark: 15 },
    { subject: 'Crop', A: data.score?.breakdown?.crop || 0, fullMark: 20 },
    { subject: 'Market', A: data.score?.breakdown?.market || 0, fullMark: 10 },
    { subject: 'Financial', A: data.score?.breakdown?.financial || 0, fullMark: 25 },
    { subject: 'Credit', A: data.score?.breakdown?.credit || 0, fullMark: 10 },
  ];

  const getRiskColor = (cat: string) => {
    if (cat === 'Very Creditworthy') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (cat === 'Low Risk') return 'text-blue-600 bg-blue-50 border-blue-100';
    if (cat === 'Moderate Risk') return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 max-w-7xl mx-auto pb-20"
    >
      <header className="flex justify-between items-center print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold uppercase tracking-widest text-xs transition-all">
          <ChevronLeft size={18} />
          Back to Repository
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-700 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download size={18} />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <ShieldCheck size={18} />
            Approve Loan
          </button>
        </div>
      </header>

      <div ref={reportRef} className="space-y-8 p-4 print:p-10">
        {/* Profile Hero Card */}
        <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between gap-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full -mr-48 -mt-48 opacity-40 blur-3xl" />
          
          <div className="flex flex-col md:flex-row gap-10 relative z-10">
            <div className="w-32 h-32 bg-emerald-600 text-white rounded-[40px] flex items-center justify-center shadow-2xl shadow-emerald-200">
              <span className="text-5xl font-display font-bold">{data.farmer.name.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-5xl font-display font-bold text-gray-900 tracking-tight">{data.farmer.name}</h2>
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-100">
                  <CheckCircle size={14} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-emerald-600" /> {data.farmer.village}, {data.farmer.district}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-emerald-600" /> Joined {new Date(data.farmer.created_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> Aadhaar Verified</span>
              </div>
              <div className="flex gap-3 mt-8">
                <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-2">
                  <Sprout size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-tighter">{data.crop.crop_type}</span>
                </div>
                <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-tighter">{data.land.land_size_acres} Acres</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end justify-center relative z-10">
            <div className="text-center lg:text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Proprietary AgriScore</p>
              <div className="text-9xl font-display font-bold text-emerald-600 tracking-tighter leading-none drop-shadow-sm">
                {data.score?.score || 'N/A'}
              </div>
              <div className={`mt-6 px-6 py-2 rounded-full border-2 text-xs font-bold uppercase tracking-widest inline-block shadow-sm ${getRiskColor(data.score?.risk_category)}`}>
                {data.score?.risk_category || 'Pending'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Deep Analytics */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Radar Score Breakdown */}
              <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-display font-bold text-gray-900 tracking-tight">Risk Fingerprint</h3>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Activity size={20} />
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#F3F4F6" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 800, fill: '#9CA3AF', fontFamily: 'Inter' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 25]} hide />
                      <Radar
                        name="Farmer Score"
                        dataKey="A"
                        stroke="#10B981"
                        strokeWidth={3}
                        fill="#10B981"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase text-center mt-4 tracking-widest">Multidimensional Credit Assessment</p>
              </div>

              {/* Loan Terms */}
              <div className="bg-[#022C22] p-10 rounded-[48px] text-white shadow-2xl shadow-emerald-900/20 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full -mr-24 -mt-24 opacity-20 blur-2xl" />
                <div className="relative z-10">
                  <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-2">
                    <Zap size={20} className="text-yellow-400" />
                    Instant Offer
                  </h3>
                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 mb-2">Limit</p>
                      <p className="text-5xl font-display font-bold flex items-center gap-1 tracking-tighter">
                        <IndianRupee size={32} className="text-emerald-400" />
                        {data.recommendation?.recommended_amount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="flex gap-12">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 mb-2">Rate</p>
                        <p className="text-2xl font-display font-bold text-emerald-400">{data.recommendation?.interest_rate}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 mb-2">Tenure</p>
                        <p className="text-2xl font-display font-bold text-emerald-400">{data.recommendation?.tenure_months} Mo</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all mt-8 relative z-10 shadow-lg shadow-emerald-900/50">
                  Disburse Now
                </button>
              </div>
            </div>

            {/* AI Analysis Report */}
            <div className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Info size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-10 tracking-tight">AI Intelligence Report</h3>
              <div className="prose prose-emerald max-w-none text-gray-600 leading-relaxed font-medium">
                <ReactMarkdown>{data.score?.explanation || 'No explanation available.'}</ReactMarkdown>
              </div>
              <div className="mt-12 pt-8 border-t border-gray-50 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                  ))}
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reviewed by 3 Credit Analysts</p>
              </div>
            </div>
          </div>

          {/* Right Column: Contextual Data */}
          <div className="lg:col-span-4 space-y-8">
            {/* Map Card with Satellite NDVI Simulation */}
            <div className="bg-white p-4 rounded-[48px] border border-gray-100 shadow-sm overflow-hidden group relative">
              <div className="absolute top-8 left-8 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                <Satellite size={14} className="text-emerald-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-700">NDVI Satellite View</span>
              </div>
              <div className="h-[300px] w-full rounded-[40px] overflow-hidden relative">
                <MapContainer 
                  center={[data.land.latitude, data.land.longitude]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri'
                  />
                  {/* Simulate NDVI Overlay */}
                  <Circle 
                    center={[data.land.latitude, data.land.longitude]} 
                    radius={data.land.land_size_acres * 40}
                    pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.4, weight: 2 }}
                  />
                  <Marker position={[data.land.latitude, data.land.longitude]}>
                    <Popup>
                      {data.farmer.name}'s Farm <br /> {data.land.land_size_acres} Acres
                    </Popup>
                  </Marker>
                </MapContainer>
                {/* NDVI Legend */}
                <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-1">
                  <div className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1 text-center">Biomass Health</div>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded bg-red-500/60" />
                    <div className="w-4 h-4 rounded bg-yellow-500/60" />
                    <div className="w-4 h-4 rounded bg-emerald-500/60" />
                    <div className="w-4 h-4 rounded bg-emerald-700/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Data Signals */}
            <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Alternative Data Signals</h4>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Smartphone size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Digital Footprint</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">High Smartphone Usage</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><CreditCard size={16} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">UPI Transactions</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">14/month average</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Metrics */}
            <div className="bg-emerald-50 p-8 rounded-[48px] border border-emerald-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sprout size={64} className="text-emerald-600" />
              </div>
              <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-6 relative z-10">Community Impact</h4>
              <div className="space-y-6 relative z-10">
                <div>
                  <p className="text-3xl font-display font-bold text-emerald-900 mb-1">2.4t</p>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Est. CO₂ Offset Potential</p>
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-emerald-900 mb-1">5</p>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Lives Positively Impacted</p>
                </div>
              </div>
            </div>

            {/* Detailed Metrics Bento */}
            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-10">
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Agronomic Profile</h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Droplets size={16} /></div>
                      <span className="text-sm font-bold text-gray-500">Soil Quality</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{data.land.soil_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Droplets size={16} /></div>
                      <span className="text-sm font-bold text-gray-500">Irrigation</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{data.crop.irrigation_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Sprout size={16} /></div>
                      <span className="text-sm font-bold text-gray-500">Avg Yield</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{data.crop.avg_yield_last_3_seasons} u/a</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Financial Stability</h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Landmark size={16} /></div>
                      <span className="text-sm font-bold text-gray-500">Annual Income</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">₹{data.financial.annual_income.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ShieldCheck size={16} /></div>
                      <span className="text-sm font-bold text-gray-500">CIBIL Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{data.credit.cibil_score}</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 size={18} className="text-emerald-600" />
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Risk Outlook</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${data.score?.score}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-3 uppercase tracking-widest">Portfolio Stability: High</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
