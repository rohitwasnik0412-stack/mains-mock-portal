import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import {
  BookOpen, Clock, Upload, CheckCircle2, XCircle, AlertCircle,
  Play, RotateCcw, Download, FileUp, LogOut, User, Key, Trash2, Edit3, Save
} from 'lucide-react';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    qNum: 1,
    question: "If a sum of ₹12,500 amounts to ₹15,500 in 4 years at the rate of simple interest, what is the rate of interest per annum?",
    options: ["5%", "6%", "6.5%", "7.5%"],
    correctIndex: 1,
    explanation: "Simple Interest (SI) = 15500 - 12500 = ₹3000. Rate = (SI × 100) / (P × T) = (3000 × 100) / (12500 × 4) = 6%."
  },
  {
    id: 2,
    qNum: 2,
    question: "Under which Article of the Indian Constitution is the Comptroller and Auditor General (CAG) of India appointed?",
    options: ["Article 148", "Article 149", "Article 150", "Article 151"],
    correctIndex: 0,
    explanation: "Article 148 of the Indian Constitution provides for an independent office of the Comptroller and Auditor General of India (CAG)."
  },
  {
    id: 3,
    qNum: 3,
    question: "In Computer Networking, which layer of the OSI model is responsible for end-to-end error recovery and flow control?",
    options: ["Network Layer", "Data Link Layer", "Transport Layer", "Session Layer"],
    correctIndex: 2,
    explanation: "The Transport Layer (Layer 4) ensures complete data transfer, end-to-end error recovery, and flow control (e.g., TCP)."
  },
  {
    id: 4,
    qNum: 4,
    question: "Choose the word that is opposite in meaning (Antonym) to 'PERSPICACIOUS':",
    options: ["Astute", "Obtuse", "Shrewd", "Discerning"],
    correctIndex: 1,
    explanation: "Perspicacious means having a ready insight into things (sharp/astute). Obtuse means slow to understand or insensitive."
  },
  {
    id: 5,
    qNum: 5,
    question: "If x + (1/x) = 4, find the value of x³ + (1/x³).",
    options: ["52", "64", "48", "56"],
    correctIndex: 0,
    explanation: "Formula: x³ + 1/x³ = k³ - 3k = 4³ - 3(4) = 64 - 12 = 52."
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');

  // Gemini API Key
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || 'AQ.Ab8RN6KvqJvX6nrIUlKH7sz0I5Md1bQpFoXKKm-Q6r3y-CdLLQ');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Navigation & Views
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'test' | 'vault' | 'review'
  
  // PDF & Quiz Builder State
  const [mockTitle, setMockTitle] = useState('Mains Practice Set - 1');
  const [rawText, setRawText] = useState('');
  const [startQ, setStartQ] = useState(1);
  const [endQ, setEndQ] = useState(25);
  const [durationMins, setDurationMins] = useState(20);
  const [positiveMarks, setPositiveMarks] = useState(3);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Active Test State
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testRunning, setTestRunning] = useState(false);

  // Revision Vault State
  const [savedAttempts, setSavedAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'wrong' | 'unattempted' | 'correct'
  const [noteInput, setNoteInput] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        loadUserAttempts(currentUser.uid);
      } else {
        setSavedAttempts([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!testRunning || timeLeft <= 0) {
      if (testRunning && timeLeft === 0) {
        handleSubmitTest();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [testRunning, timeLeft]);

  const loadUserAttempts = async (uid) => {
    try {
      const q = query(collection(db, 'mockAttempts'), where('uid', '==', uid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setSavedAttempts(list);
    } catch (err) {
      console.error("Firestore read fallback to localStorage:", err);
      const localData = localStorage.getItem(`attempts_${uid}`);
      if (localData) setSavedAttempts(JSON.parse(localData));
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const formattedEmail = email.includes('@') ? email.trim() : `${email.trim().toLowerCase()}@mockportal.app`;
      if (authMode === 'signup') {
        const res = await createUserWithEmailAndPassword(auth, formattedEmail, password);
        if (displayName) {
          await updateProfile(res.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, formattedEmail, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMockTitle(file.name.replace('.pdf', ''));
    setStatusMsg('PDF padha ja raha hai...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let extracted = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        extracted += `\n--- Page ${i} ---\n` + strings.join(' ');
      }
      setRawText(extracted);
      setStatusMsg(`PDF loaded! Total ${pdf.numPages} pages extracted.`);
    } catch (err) {
      setStatusMsg('PDF read error: ' + err.message);
    }
  };

  const generateMockFromText = async () => {
    if (!rawText.trim()) {
      alert("Kripya pehle PDF upload karein ya Question text paste karein, ya 'Load Sample Questions' dabayein.");
      return;
    }
    setIsGenerating(true);
    setStatusMsg(`Question ${startQ} se ${endQ} tak AI se extract ho rahe hain...`);

    try {
      const prompt = `Extract multiple-choice questions from the following text strictly from Question number ${startQ} to Question number ${endQ}.
Return ONLY a valid JSON array of objects with keys:
"qNum": number,
"question": string,
"options": array of 4 strings,
"correctIndex": number (0 to 3),
"explanation": string (detailed step-by-step solution in Hinglish/English).

Text:
${rawText.slice(0, 28000)}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const parsed = JSON.parse(outputText);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Questions parse nahi ho paye. Kripya text check karein.");
      }
      startMockWithQuestions(parsed);
    } catch (err) {
      alert("AI Extraction Note: " + err.message + "\nAgar aapki Gemini API key 'AIzaSy...' se shuru nahi hoti, to upar 'API Key' button me jakar aistudio.google.com wali key dalein.");
    } finally {
      setIsGenerating(false);
      setStatusMsg('');
    }
  };

  const startMockWithQuestions = (qList) => {
    setActiveQuestions(qList);
    setCurrentIdx(0);
    setUserAnswers({});
    setMarkedForReview({});
    setTimeLeft(durationMins * 60);
    setTestRunning(true);
    setActiveTab('test');
  };

  const handleSubmitTest = async () => {
    setTestRunning(false);
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    activeQuestions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      if (ans === undefined) unattempted++;
      else if (ans === q.correctIndex) correct++;
      else wrong++;
    });

    const totalScore = (correct * positiveMarks) - (wrong * negativeMarks);
    const maxScore = activeQuestions.length * positiveMarks;

    const attemptRecord = {
      uid: user?.uid || 'guest',
      userEmail: user?.email || 'guest',
      title: mockTitle || `Mock (${startQ}-${endQ})`,
      qRange: `Q.${startQ} - Q.${endQ}`,
      dateStr: new Date().toLocaleString('en-IN'),
      timestamp: Date.now(),
      durationMins,
      positiveMarks,
      negativeMarks,
      totalScore,
      maxScore,
      correct,
      wrong,
      unattempted,
      questions: activeQuestions,
      userAnswers,
      notes: {}
    };

    try {
      if (user) {
        const docRef = await addDoc(collection(db, 'mockAttempts'), attemptRecord);
        attemptRecord.docId = docRef.id;
      }
    } catch (e) {
      console.error("Cloud save fallback to local:", e);
    }

    const updated = [attemptRecord, ...savedAttempts];
    setSavedAttempts(updated);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updated));

    setSelectedAttempt(attemptRecord);
    setFilterMode('all');
    setActiveTab('review');
  };

  const saveMistakeNote = async (qIdx, noteText) => {
    if (!selectedAttempt) return;
    const updatedNotes = { ...(selectedAttempt.notes || {}), [qIdx]: noteText };
    const updatedAttempt = { ...selectedAttempt, notes: updatedNotes };
    setSelectedAttempt(updatedAttempt);

    const updatedList = savedAttempts.map(a => a.timestamp === selectedAttempt.timestamp ? updatedAttempt : a);
    setSavedAttempts(updatedList);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updatedList));

    if (selectedAttempt.docId) {
      try {
        await updateDoc(doc(db, 'mockAttempts', selectedAttempt.docId), { notes: updatedNotes });
      } catch (e) {
        console.error("Note cloud update error:", e);
      }
    }
  };

  const exportBackupJSON = () => {
    const blob = new Blob([JSON.stringify(savedAttempts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importBackupJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported)) {
          const merged = [...imported, ...savedAttempts];
          setSavedAttempts(merged);
          if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(merged));
          alert(`Successfully restored ${imported.length} mock tests!`);
        }
      } catch (err) {
        alert("Invalid backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading Portal...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Mains Mock & Revision Portal</h1>
              <p className="text-xs text-slate-400">Multi-User Cloud Login (Firebase Connected)</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${authMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${authMode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              New Student Sign Up
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohit Kumar"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Username or Email</label>
              <input
                type="text"
                required
                placeholder="e.g. rohit@gmail.com or rohit01"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Password (min 6 characters)</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              {authMode === 'login' ? 'Login to My Workspace' : 'Create My Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Mains PDF to Mock Portal</h1>
              <p className="text-xs text-emerald-400">Logged in: {user.displayName || user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${activeTab === 'create' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              + Create Mock
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${activeTab === 'vault' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              Revision Vault ({savedAttempts.length})
            </button>
            <button
              onClick={() => setShowKeyModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center gap-1"
            >
              <Key className="w-3.5 h-3.5" /> API Key
            </button>
            <button
              onClick={() => signOut(auth)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5">
            <h3 className="font-bold text-white mb-2">Gemini AI Key Configuration</h3>
            <p className="text-xs text-slate-400 mb-3">
              PDF se automatically questions nikalne ke liye apni Google AI Studio Key (`AIzaSy...`) yahan dalein:
            </p>
            <input
              type="text"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  localStorage.setItem('gemini_api_key', geminiKey);
                  setShowKeyModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        {activeTab === 'create' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">1. Upload Mains PDF or Paste Questions</h2>
                <button
                  onClick={() => {
                    setMockTitle('SSC CGL Mains Demo Test (Q.1 - Q.5)');
                    startMockWithQuestions(SAMPLE_QUESTIONS);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  ▶ Run Instant Demo Mock (5 Qs)
                </button>
              </div>

              <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 transition">
                <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="text-sm font-medium text-slate-200">Click to Upload Question Bank PDF</span>
                <span className="text-xs text-slate-500 mt-1">Supports any Mains / Practice PDF</span>
                <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
              </label>

              {statusMsg && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                  {statusMsg}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Extracted PDF Text / Direct Paste Box:</label>
                <textarea
                  rows={7}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="PDF upload karne par text yahan aa jayega, ya aap seedha questions copy-paste bhi kar sakte hain..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-white">2. Custom Mock Settings</h2>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mock Test Name</label>
                <input
                  type="text"
                  value={mockTitle}
                  onChange={(e) => setMockTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">From Question #</label>
                  <input
                    type="number"
                    min={1}
                    value={startQ}
                    onChange={(e) => setStartQ(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">To Question #</label>
                  <input
                    type="number"
                    min={1}
                    value={endQ}
                    onChange={(e) => setEndQ(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Timer (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Correct Marks (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={positiveMarks}
                    onChange={(e) => setPositiveMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Negative Marks (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-rose-400"
                  />
                </div>
              </div>

              <button
                disabled={isGenerating}
                onClick={generateMockFromText}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition"
              >
                {isGenerating ? 'Generating Mock Test...' : `Generate Mock (Q.${startQ} to Q.${endQ})`}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'test' && activeQuestions.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                  <div>
                    <span className="text-xs text-indigo-400 font-semibold">{mockTitle}</span>
                    <h3 className="text-lg font-bold text-white">
                      Question {currentIdx + 1} of {activeQuestions.length} (PDF Q.{activeQuestions[currentIdx].qNum || currentIdx + 1})
                    </h3>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-amber-400 font-mono font-bold">
                    <Clock className="w-4 h-4" />
                    {formatTimer(timeLeft)}
                  </div>
                </div>

                <p className="text-base text-slate-100 leading-relaxed mb-6 whitespace-pre-line">
                  {activeQuestions[currentIdx].question}
                </p>

                <div className="space-y-3">
                  {activeQuestions[currentIdx].options.map((opt, oIdx) => {
                    const selected = userAnswers[currentIdx] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => setUserAnswers({ ...userAnswers, [currentIdx]: oIdx })}
                        className={`w-full text-left p-4 rounded-xl border text-sm transition flex items-center gap-3 ${
                          selected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-8 border-t border-slate-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const copy = { ...userAnswers };
                      delete copy[currentIdx];
                      setUserAnswers(copy);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                  >
                    Clear Response
                  </button>
                  <button
                    onClick={() => setMarkedForReview({ ...markedForReview, [currentIdx]: !markedForReview[currentIdx] })}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs"
                  >
                    {markedForReview[currentIdx] ? 'Unmark Review' : 'Mark for Review'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((c) => c - 1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-xs font-semibold"
                  >
                    Previous
                  </button>
                  {currentIdx < activeQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx((c) => c + 1)}
                      className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                    >
                      Save & Next
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitTest}
                      className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Submit Mock Test
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Question Palette */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-white mb-3">Question Palette</h4>
                <div className="grid grid-cols-5 gap-2">
                  {activeQuestions.map((_, i) => {
                    const answered = userAnswers[i] !== undefined;
                    const marked = markedForReview[i];
                    let bg = 'bg-slate-950 border-slate-800 text-slate-400';
                    if (answered) bg = 'bg-emerald-600 text-white border-emerald-500';
                    if (marked) bg = 'bg-amber-500 text-slate-950 border-amber-400';
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentIdx(i)}
                        className={`h-9 rounded-lg border text-xs font-bold ${bg} ${currentIdx === i ? 'ring-2 ring-indigo-400' : ''}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSubmitTest}
                className="w-full py-3 mt-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
              >
                Submit & Save to Vault
              </button>
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-lg font-bold text-white">Permanent Cloud Revision Vault</h2>
                <p className="text-xs text-slate-400">Har mock test aapke personal account me hamesha ke liye save rehta hai.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportBackupJSON}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Export Backup
                </button>
                <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <FileUp className="w-4 h-4" /> Restore Backup
                  <input type="file" accept=".json" onChange={importBackupJSON} className="hidden" />
                </label>
              </div>
            </div>

            {savedAttempts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
                Abhi tak koi mock test save nahi hua hai. "+ Create Mock" me jakar apna pehla test dein!
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {savedAttempts.map((att, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-indigo-400 font-semibold">{att.qRange}</span>
                        <span className="text-xs text-slate-500">{att.dateStr}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{att.title}</h3>
                      <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-xs text-slate-400">Score</div>
                          <div className="text-sm font-bold text-white">{att.totalScore}/{att.maxScore}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="text-xs text-emerald-400">Correct</div>
                          <div className="text-sm font-bold text-emerald-300">{att.correct}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <div className="text-xs text-rose-400">Wrong</div>
                          <div className="text-sm font-bold text-rose-300">{att.wrong}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-xs text-slate-400">Skipped</div>
                          <div className="text-sm font-bold text-slate-300">{att.unattempted}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAttempt(att);
                          setFilterMode('all');
                          setActiveTab('review');
                        }}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Revise & See Mistakes
                      </button>
                      <button
                        onClick={() => {
                          const wrongQs = att.questions.filter((q, i) => att.userAnswers?.[i] !== q.correctIndex);
                          if (wrongQs.length === 0) {
                            alert("Sabhi answers sahi the!");
                            return;
                          }
                          setMockTitle(`${att.title} (Mistakes Retry)`);
                          startMockWithQuestions(wrongQs);
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-semibold"
                      >
                        Retry Mistakes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && selectedAttempt && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedAttempt.title} — Revision Sheet</h2>
                <p className="text-xs text-slate-400">
                  Score: <b className="text-white">{selectedAttempt.totalScore}/{selectedAttempt.maxScore}</b> | Correct: {selectedAttempt.correct} | Wrong: {selectedAttempt.wrong} | Skipped: {selectedAttempt.unattempted}
                </p>
              </div>
              <div className="flex gap-2">
                {['all', 'wrong', 'unattempted', 'correct'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterMode(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                      filterMode === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {selectedAttempt.questions.map((q, idx) => {
                const uAns = selectedAttempt.userAnswers?.[idx];
                const isCorrect = uAns === q.correctIndex;
                const isSkipped = uAns === undefined;
                const isWrong = !isSkipped && !isCorrect;

                if (filterMode === 'wrong' && !isWrong) return null;
                if (filterMode === 'unattempted' && !isSkipped) return null;
                if (filterMode === 'correct' && !isCorrect) return null;

                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">Question {idx + 1} (PDF Q.{q.qNum || idx + 1})</span>
                      {isCorrect && <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">Correct ✓</span>}
                      {isWrong && <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">Wrong ✗</span>}
                      {isSkipped && <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">Skipped</span>}
                    </div>

                    <p className="text-sm text-white leading-relaxed">{q.question}</p>

                    <div className="grid sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isRightOpt = oIdx === q.correctIndex;
                        const isUserOpt = oIdx === uAns;
                        let style = 'bg-slate-950 border-slate-800 text-slate-300';
                        if (isRightOpt) style = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
                        else if (isUserOpt && !isRightOpt) style = 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold';

                        return (
                          <div key={oIdx} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}>
                            <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                            {isRightOpt && <span>✓ Correct Answer</span>}
                            {isUserOpt && !isRightOpt && <span>✗ Your Answer</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <strong className="text-indigo-400">Solution: </strong> {q.explanation}
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs text-amber-400 font-semibold mb-1">Meri Galti Kya Thi? (Personal Revision Note):</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={selectedAttempt.notes?.[idx] || ''}
                          onChange={(e) => setNoteInput({ ...noteInput, [idx]: e.target.value })}
                          placeholder="Apni galti ya formula yahan likhein taaki exam se pehle revise kar sakein..."
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                        <button
                          onClick={() => saveMistakeNote(idx, noteInput[idx] ?? selectedAttempt.notes?.[idx] ?? '')}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
