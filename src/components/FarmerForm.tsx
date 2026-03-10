import { useState, useEffect, useRef } from 'react';
import { User, MapPin, Cloud, Sprout, TrendingUp, CreditCard, CheckCircle, ChevronRight, ChevronLeft, LocateFixed, Loader2, Mic, MicOff, Languages, Volume2 } from 'lucide-react';

const LANGUAGES = [
  { code: 'en-IN', name: 'English', label: 'English', prompt: 'Tell me anything about yourself, your land, crops, or finances (e.g., "I am Rajesh from Patna, I have 5 acres of Wheat, and my annual income is 3 lakhs").' },
  { code: 'hi-IN', name: 'Hindi', label: 'हिन्दी', prompt: 'अपने बारे में, अपनी ज़मीन, फसलों या वित्त के बारे में कुछ भी बताएं (जैसे, "मैं पटना से राजेश हूं, मेरे पास 5 एकड़ गेहूं है, और मेरी वार्षिक आय 3 लाख है")।' },
  { code: 'mr-IN', name: 'Marathi', label: 'मराठी', prompt: 'तुमच्याबद्दल, तुमची जमीन, पिके किंवा आर्थिक परिस्थितीबद्दल काहीही सांगा (उदा. "मी पाटण्यातील राजेश आहे, माझ्याकडे ५ एकर गहू आहे आणि माझे वार्षिक उत्पन्न ३ लाख आहे").' },
  { code: 'te-IN', name: 'Telugu', label: 'తెలుగు', prompt: 'మీ గురించి, మీ భూమి, పంటలు లేదా ఆర్థిక విషయాల గురించి ఏదైనా చెప్పండి (ఉదా., "నేను పాట్నా నుండి రాజేష్‌ను, నాకు 5 ఎకరాల గోధుమలు ఉన్నాయి మరియు నా వార్షిక ఆదాయం 3 లక్షలు").' },
  { code: 'ta-IN', name: 'Tamil', label: 'தமிழ்', prompt: 'உங்களைப் பற்றியோ, உங்கள் நிலம், பயிர்கள் அல்லது நிதி பற்றியோ எதையும் சொல்லுங்கள் (எ.கா., "நான் பாட்னாவைச் சேர்ந்த ராஜேஷ், என்னிடம் 5 ஏக்கர் கோதுமை உள்ளது, எனது ஆண்டு வருமானம் 3 லட்சம்").' },
  { code: 'kn-IN', name: 'Kannada', label: 'ಕನ್ನಡ', prompt: 'ನಿಮ್ಮ ಬಗ್ಗೆ, ನಿಮ್ಮ ಭೂಮಿ, ಬೆಳೆಗಳು ಅಥವಾ ಹಣಕಾಸಿನ ಬಗ್ಗೆ ಏನನ್ನಾದರೂ ತಿಳಿಸಿ (ಉದಾಹರಣೆಗೆ, "ನಾನು ಪಾಟ್ನಾದ ರಾಜೇಶ್, ನನ್ನಲ್ಲಿ 5 ಎಕರೆ ಗೋಧಿ ಇದೆ ಮತ್ತು ನನ್ನ ವಾರ್ಷಿಕ ಆದಾಯ 3 ಲಕ್ಷ").' },
  { code: 'bn-IN', name: 'Bengali', label: 'বাংলা', prompt: 'আপনার সম্পর্কে, আপনার জমি, ফসল বা অর্থ সম্পর্কে কিছু বলুন (যেমন, "আমি পাটনার রাজেশ, আমার ৫ একর গম আছে এবং আমার বার্ষিক আয় ৩ লক্ষ টাকা")।' },
];

export default function FarmerForm({ onComplete }: { onComplete: (id: number) => void }) {
  const [step, setStep] = useState(0); // 0 is language selection
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isVoiceInterview, setIsVoiceInterview] = useState(false);
  const [interviewQuestionIndex, setInterviewQuestionIndex] = useState(-1);
  
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmer: { name: '', aadhaar_number: '', phone: '', village: '', district: '', state: '' },
    land: { latitude: 0, longitude: 0, land_size_acres: 0, soil_type: 'Alluvial', ownership_status: 'Owned' },
    weather: { historical_rainfall: 0, drought_probability: 0.0, flood_risk: 0.00, seasonal_rainfall_pattern: 'Stable' },
    crop: { crop_type: 'Wheat', farming_season: 'Kharif', irrigation_type: 'Borewell', avg_yield_last_3_seasons: 0 },
    market: { avg_crop_price: 0, price_volatility: 0 },
    financial: { annual_income: 0, existing_loans: 0, repayment_history: 'Good', assets_owned: '' },
    credit: { cibil_score: 0, cooperative_bank_loans: 0, microfinance_loans: 0 }
  });

  // Speech Recognition Setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      console.warn("Speech recognition not supported");
      return;
    }
  }, []);

  const speak = async (text: string) => {
    setIsSpeaking(true);
    try {
      const { GoogleGenAI, Modality } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in ${selectedLang.name}: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        await audio.play();
        return new Promise((resolve) => {
          audio.onended = () => {
            setIsSpeaking(false);
            resolve(true);
          };
        });
      }
    } catch (error) {
      console.error("TTS Error:", error);
      // Fallback to browser TTS if Gemini fails
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLang.code;
      window.speechSynthesis.speak(utterance);
      return new Promise((resolve) => {
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve(true);
        };
      });
    }
    setIsSpeaking(false);
  };

  const startLanguageSelectionVoice = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Start with English to detect language name
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript.toLowerCase();
      console.log("Language selection transcript:", text);
      const lang = LANGUAGES.find(l => 
        text.includes(l.name.toLowerCase()) || 
        text.includes(l.label.toLowerCase()) ||
        (l.name === 'Hindi' && text.includes('हिंदी')) ||
        (l.name === 'Marathi' && text.includes('मराठी'))
      );
      if (lang) {
        setSelectedLang(lang);
        setStep(1);
        speak(`Great, we will continue in ${lang.name}. Let's start the assessment.`);
      } else {
        alert("Sorry, I didn't recognize that language. Please try saying English, Hindi, Marathi, etc.");
      }
    };
    recognition.start();
  };

  const INTERVIEW_QUESTIONS = [
    { field: 'name', question: "What is your full name?", section: 'farmer' },
    { field: 'village', question: "Which village are you from?", section: 'farmer' },
    { field: 'land_size_acres', question: "How many acres of land do you have?", section: 'land' },
    { field: 'crop_type', question: "What is your primary crop?", section: 'crop' },
    { field: 'annual_income', question: "What is your annual income?", section: 'financial' }
  ];

  const startVoiceInterview = async () => {
    setIsVoiceInterview(true);
    setStep(1);
    setInterviewQuestionIndex(0);
    await speak("Welcome to AgriScore voice assessment. I will ask you a few questions. Let's start.");
    askNextQuestion(0);
  };

  const askNextQuestion = async (index: number) => {
    if (index >= INTERVIEW_QUESTIONS.length) {
      await speak("Thank you! I have collected your basic information. You can now review the form or continue to the next steps.");
      setIsVoiceInterview(false);
      setInterviewQuestionIndex(-1);
      return;
    }

    setInterviewQuestionIndex(index);
    const question = INTERVIEW_QUESTIONS[index];
    await speak(question.question);
    
    // Start listening for answer
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.code;
    
    recognition.onresult = async (event: any) => {
      const answer = event.results[0][0].transcript;
      setTranscript(answer);
      
      // Parse answer with Gemini
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Extract the ${question.field} from this answer: "${answer}". Return ONLY the value.`,
        });
        
        const value = response.text?.trim();
        if (value) {
          handleChange(question.section, question.field, question.field.includes('income') || question.field.includes('size') ? parseFloat(value) : value);
        }
        
        // Move to next question
        askNextQuestion(index + 1);
      } catch (e) {
        askNextQuestion(index + 1);
      }
    };

    recognition.onerror = () => askNextQuestion(index + 1);
    recognition.start();
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.code;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log("Speech recognition started");
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log("Speech recognition ended");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please ensure you have allowed microphone access in your browser settings. \n\nNote: If you are in a preview window, you may need to click the 'Open in new tab' button at the top right to grant permissions.");
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      
      setLoading(true);
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Parse this farmer information from the following text (Language: ${selectedLang.name}): "${text}". 
          Return a JSON object with the following structure. Only include fields that are mentioned:
          {
            "farmer": { "name": string, "aadhaar_number": string, "phone": string, "village": string, "district": string, "state": string },
            "land": { "land_size_acres": number, "soil_type": string, "ownership_status": string },
            "crop": { "crop_type": string, "farming_season": string, "irrigation_type": string, "avg_yield_last_3_seasons": number },
            "financial": { "annual_income": number, "existing_loans": number, "repayment_history": string, "assets_owned": string },
            "credit": { "cibil_score": number }
          }
          If a field is not found, omit it from the JSON.`,
          config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text || '{}');
        
        setFormData(prev => {
          const newData = { ...prev };
          
          if (result.farmer) {
            newData.farmer = { ...newData.farmer, ...result.farmer };
          }
          if (result.land) {
            newData.land = { ...newData.land, ...result.land };
          }
          if (result.crop) {
            newData.crop = { ...newData.crop, ...result.crop };
          }
          if (result.financial) {
            newData.financial = { ...newData.financial, ...result.financial };
          }
          if (result.credit) {
            newData.credit = { ...newData.credit, ...result.credit };
          }
          
          return newData;
        });
        
        alert(`I've updated the form based on what you said: "${text}"`);
      } catch (error) {
        console.error("Gemini parsing error:", error);
        alert(`I heard: "${text}". Please check the fields or try again.`);
      } finally {
        setLoading(false);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsListening(false);
    }
  };

  const [citySearch, setCitySearch] = useState('');
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Default to Patna on mount
    const latitude = 0;
    const longitude = 0;
    setFormData(prev => ({
      ...prev,
      land: { ...prev.land, latitude, longitude }
    }));
    handleChange('farmer', 'village', '');
    handleChange('farmer', 'district', '');
    handleChange('farmer', 'state', '');
    fetchWeatherAndYield(latitude, longitude);
  }, []);

  const handleCitySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCitySearch(val);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.length > 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=5&format=json`);
          const data = await res.json();
          if (data.results) {
            setCitySuggestions(data.results);
            setShowSuggestions(true);
          } else {
            setCitySuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error("City search error:", error);
        }
      }, 300);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectCity = (suggestion: any) => {
    const latitude = suggestion.latitude;
    const longitude = suggestion.longitude;
    
    const displayName = `${suggestion.name}${suggestion.admin1 ? `, ${suggestion.admin1}` : ''}${suggestion.country ? `, ${suggestion.country}` : ''}`;
    setCitySearch(displayName);
    setShowSuggestions(false);
    
    setFormData(prev => ({
      ...prev,
      land: { ...prev.land, latitude, longitude }
    }));
    
    handleChange('farmer', 'village', suggestion.name);
    if (suggestion.admin2) handleChange('farmer', 'district', suggestion.admin2);
    if (suggestion.admin1) handleChange('farmer', 'state', suggestion.admin1);

    fetchWeatherAndYield(latitude, longitude);
  };

  const handleChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev], [field]: value }
    }));
  };

  const fetchWeatherAndYield = async (latitude: number, longitude: number) => {
    setWeatherLoading(true);
    try {
      // Fetch historical weather data for the last year to estimate rainfall
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
      
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum&timezone=auto`
      );
      const data = await response.json();

      if (data.daily && data.daily.precipitation_sum) {
        const totalRainfall = data.daily.precipitation_sum.reduce((a: number, b: number) => a + (b || 0), 0);
        const avgRainfall = totalRainfall; // Annual total
        
        // Calculate mock risks based on rainfall patterns
        const daysWithRain = data.daily.precipitation_sum.filter((p: number) => p > 0).length;
        const droughtProb = daysWithRain < 60 ? 0.4 : daysWithRain < 100 ? 0.2 : 0.05;
        const floodRisk = totalRainfall > 1500 ? 0.3 : totalRainfall > 1000 ? 0.15 : 0.05;

        // Mock average yield based on location (latitude/longitude hash)
        const mockYield = 15 + (Math.abs(latitude + longitude) % 10);

        setFormData(prev => ({
          ...prev,
          weather: {
            ...prev.weather,
            historical_rainfall: Math.round(avgRainfall),
            drought_probability: droughtProb,
            flood_risk: floodRisk,
            seasonal_rainfall_pattern: totalRainfall > 1200 ? 'High' : totalRainfall > 600 ? 'Stable' : 'Low'
          },
          crop: {
            ...prev.crop,
            avg_yield_last_3_seasons: Math.round(mockYield * 10) / 10
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;
    setIsSearchingCity(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(citySearch)}&count=1&format=json`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const suggestion = data.results[0];
        const latitude = suggestion.latitude;
        const longitude = suggestion.longitude;
        
        setFormData(prev => ({
          ...prev,
          land: { ...prev.land, latitude, longitude }
        }));
        
        handleChange('farmer', 'village', suggestion.name);
        if (suggestion.admin2) handleChange('farmer', 'district', suggestion.admin2);
        if (suggestion.admin1) handleChange('farmer', 'state', suggestion.admin1);

        await fetchWeatherAndYield(latitude, longitude);
      } else {
        alert("Location not found. Please try a different name or enter coordinates manually.");
      }
    } catch (error) {
      console.error("City search error:", error);
    } finally {
      setIsSearchingCity(false);
    }
  };

  const fetchWeatherByGPS = async () => {
    setWeatherLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setWeatherLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setFormData(prev => ({
        ...prev,
        land: { ...prev.land, latitude, longitude }
      }));
      setCitySearch('gps');
      await fetchWeatherAndYield(latitude, longitude);
    }, (error) => {
      console.error("Geolocation error:", error);
      setWeatherLoading(false);
      alert("Unable to retrieve your location. Please enter manually.");
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const { id } = await res.json();
      
      // Trigger scoring
      await fetch(`/api/farmers/${id}/score`, { method: 'POST' });
      
      onComplete(id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Identity', icon: User },
    { id: 2, title: 'Land', icon: MapPin },
    { id: 3, title: 'Weather', icon: Cloud },
    { id: 4, title: 'Crop', icon: Sprout },
    { id: 5, title: 'Financial', icon: TrendingUp },
    { id: 6, title: 'Credit', icon: CreditCard }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">New Credit Assessment</h2>
        <p className="text-gray-500 mt-1 font-medium">Complete the farmer profile to generate an AgriScore.</p>
      </header>

      {/* Progress Bar */}
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-10" />
        {step > 0 && steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              step >= s.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border border-gray-200 text-gray-400'
            }`}>
              <s.icon size={20} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              step >= s.id ? 'text-emerald-700' : 'text-gray-400'
            }`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {isVoiceInterview && (
        <div className="mb-8 bg-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-emerald-100 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Mic size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg">Voice Interview Active</h4>
              <p className="text-emerald-100 text-sm">Question {interviewQuestionIndex + 1} of {INTERVIEW_QUESTIONS.length}: {INTERVIEW_QUESTIONS[interviewQuestionIndex]?.question}</p>
            </div>
          </div>
          <button 
            onClick={() => { setIsVoiceInterview(false); setInterviewQuestionIndex(-1); }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            Exit Voice Mode
          </button>
        </div>
      )}

      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
        {step === 0 && (
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Languages size={32} />
              </div>
              <h3 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Select Language</h3>
              <p className="text-gray-500 font-medium leading-relaxed max-w-md">
                Choose your preferred language for the assessment. You can complete the form manually or use our AI-powered voice interview.
              </p>
              
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  Continue Manually
                  <ChevronRight size={16} />
                </button>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={startVoiceInterview}
                    className="flex-1 px-6 py-4 bg-white border-2 border-emerald-100 text-emerald-700 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Mic size={16} />
                    Voice Interview
                  </button>

                  <button
                    onClick={startLanguageSelectionVoice}
                    disabled={isListening}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border-2 ${
                      isListening ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    {isListening ? 'Listening...' : 'Speak Language'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang)}
                    className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between h-28 ${
                      selectedLang.code === lang.code 
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-4 ring-emerald-50' 
                        : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <div className={`text-2xl font-medium ${selectedLang.code === lang.code ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {lang.label}
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${selectedLang.code === lang.code ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {lang.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Farmer Identity</h3>
              <button
                onClick={startListening}
                disabled={isListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? 'Listening...' : 'Speak to Fill'}
              </button>
            </div>

            {/* Voice Guide */}
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl mb-8 flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <Volume2 size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Voice Guide ({selectedLang.name})</div>
                <p className="text-emerald-700 font-medium">{selectedLang.prompt}</p>
                <p className="text-[10px] text-emerald-600 mt-2 italic">* Click "Speak to Fill" and say the details clearly.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.farmer.name}
                  onChange={(e) => handleChange('farmer', 'name', e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Aadhaar Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.farmer.aadhaar_number}
                  onChange={(e) => handleChange('farmer', 'aadhaar_number', e.target.value)}
                  placeholder="12-digit UID"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Phone Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.farmer.phone}
                  onChange={(e) => handleChange('farmer', 'phone', e.target.value)}
                  placeholder="10-digit mobile"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Land Details</h3>
              <div className="flex gap-2">
                <button
                  onClick={startListening}
                  disabled={isListening}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  {isListening ? 'Listening...' : 'Speak to Fill'}
                </button>
                <button
                  onClick={fetchWeatherByGPS}
                  disabled={weatherLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-100 transition-all disabled:opacity-50"
                >
                  {weatherLoading ? <Loader2 className="animate-spin" size={14} /> : <LocateFixed size={14} />}
                  {weatherLoading ? 'Detecting...' : 'Use Current GPS'}
                </button>
              </div>
            </div>

            {/* City Search */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 relative">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Search City/Village</label>
              <input
                type="text"
                placeholder="e.g. Patna, Bihar"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={citySearch}
                onChange={handleCitySearchChange}
                onFocus={() => {
                  if (citySuggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay hiding to allow clicking on suggestion
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />
              {showSuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-10 w-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {citySuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 text-sm"
                      onClick={() => selectCity(suggestion)}
                    >
                      {suggestion.name}{suggestion.admin1 ? `, ${suggestion.admin1}` : ''}{suggestion.country ? `, ${suggestion.country}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.land.latitude}
                  onChange={(e) => handleChange('land', 'latitude', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.land.longitude}
                  onChange={(e) => handleChange('land', 'longitude', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Land Size (Acres)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.land.land_size_acres}
                  onChange={(e) => handleChange('land', 'land_size_acres', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Ownership Status</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.land.ownership_status}
                  onChange={(e) => handleChange('land', 'ownership_status', e.target.value)}
                >
                  <option value="Owned">Owned</option>
                  <option value="Leased">Leased</option>
                  <option value="Sharecropped">Sharecropped</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Weather Risk</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={startListening}
                  disabled={isListening}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  {isListening ? 'Listening...' : 'Speak to Fill'}
                </button>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                  <Cloud size={12} />
                  Auto-calculated
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Historical Annual Rainfall (mm)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.weather.historical_rainfall}
                  onChange={(e) => handleChange('weather', 'historical_rainfall', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Rainfall Pattern</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.weather.seasonal_rainfall_pattern}
                  onChange={(e) => handleChange('weather', 'seasonal_rainfall_pattern', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Drought Probability (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.weather.drought_probability}
                  onChange={(e) => handleChange('weather', 'drought_probability', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Flood Risk (0-1)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.weather.flood_risk}
                  onChange={(e) => handleChange('weather', 'flood_risk', parseFloat(e.target.value))}
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-400 italic mt-4">
              * Data fetched from Open-Meteo Archive API based on farm coordinates.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Cultivation Data</h3>
              <button
                onClick={startListening}
                disabled={isListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? 'Listening...' : 'Speak to Fill'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Irrigation Type</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.crop.irrigation_type}
                  onChange={(e) => handleChange('crop', 'irrigation_type', e.target.value)}
                >
                  <option value="Borewell">Borewell</option>
                  <option value="Canal">Canal</option>
                  <option value="Rainfed">Rainfed</option>
                  <option value="Drip">Drip</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Avg Yield (Last 3 Seasons)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.crop.avg_yield_last_3_seasons}
                  onChange={(e) => handleChange('crop', 'avg_yield_last_3_seasons', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Financial Health</h3>
              <button
                onClick={startListening}
                disabled={isListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? 'Listening...' : 'Speak to Fill'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Annual Income (₹)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.financial.annual_income}
                  onChange={(e) => handleChange('financial', 'annual_income', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Existing Loans (₹)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.financial.existing_loans}
                  onChange={(e) => handleChange('financial', 'existing_loans', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Repayment History</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.financial.repayment_history}
                  onChange={(e) => handleChange('financial', 'repayment_history', e.target.value)}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Credit History</h3>
              <button
                onClick={startListening}
                disabled={isListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? 'Listening...' : 'Speak to Fill'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">CIBIL Score</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.credit.cibil_score}
                  onChange={(e) => handleChange('credit', 'cibil_score', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-12 pt-8 border-t border-gray-50">
          <button
            disabled={step === 1}
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-6 py-3 text-gray-500 font-bold uppercase tracking-widest text-xs disabled:opacity-30"
          >
            <ChevronLeft size={18} />
            Back
          </button>
          
          {step < 6 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Generate AgriScore'}
              <CheckCircle size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
