import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
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
  setDoc,
  getDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import {
  BookOpen, Clock, Upload, Download, FileUp, LogOut, Key,
  FolderKanban, Sparkles, ShieldQuestion, Filter, Layers, RefreshCw, Trash2
} from 'lucide-react';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    qNum: 1,
    subject: "Quantitative Aptitude",
    chapter: "Simple & Compound Interest",
    topic: "Rate of Simple Interest",
    question: "If a sum of ₹12,500 amounts to ₹15,500 in 4 years at the rate of simple interest, what is the rate of interest per annum?",
    options: ["5%", "6%", "6.5%", "7.5%"],
    correctIndex: 1,
    explanation: "Simple Interest (SI) = 15500 - 12500 = ₹3000. Rate = (SI × 100) / (P × T) = (3000 × 100) / (12500 × 4) = 6%."
  },
  {
    id: 2,
    qNum: 2,
    subject: "General Awareness",
    chapter: "Indian Polity",
    topic: "Constitutional Bodies (CAG)",
    question: "Under which Article of the Indian Constitution is the Comptroller and Auditor General (CAG) of India appointed?",
    options: ["Article 148", "Article 149", "Article 150", "Article 151"],
    correctIndex: 0,
    explanation: "Article 148 of the Indian Constitution provides for an independent office of the Comptroller and Auditor General of India (CAG)."
  },
  {
    id: 3,
    qNum: 3,
    subject: "Computer Knowledge",
    chapter: "Networking & Internet",
    topic: "OSI Model Layers",
    question: "In Computer Networking, which layer of the OSI model is responsible for end-to-end error recovery and flow control?",
    options: ["Network Layer", "Data Link Layer", "Transport Layer", "Session Layer"],
    correctIndex: 2,
    explanation: "The Transport Layer (Layer 4) ensures complete data transfer, end-to-end error recovery, and flow control (e.g., TCP)."
  },
  {
    id: 4,
    qNum: 4,
    subject: "English Comprehension",
    chapter: "Vocabulary",
    topic: "Antonyms & Synonyms",
    question: "Choose the word that is opposite in meaning (Antonym) to 'PERSPICACIOUS':",
    options: ["Astute", "Obtuse", "Shrewd", "Discerning"],
    correctIndex: 1,
    explanation: "Perspicacious means having a ready insight into things (sharp/astute). Obtuse means slow to understand or insensitive."
  },
  {
    id: 5,
    qNum: 5,
    subject: "Quantitative Aptitude",
    chapter: "Algebra",
    topic: "Cubic Identities",
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
  const [targetExam, setTargetExam] = useState('SSC CGL Mains (AAO / GST Inspector)');
  const [securityQuestion, setSecurityQuestion] = useState('Mera favourite exam subject ya book kaunsi hai?');
  const [customSecQ, setCustomSecQ] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [recoveredPassBox, setRecoveredPassBox] = useState('');

  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('Checking Cloud Sync...');

  const [activeTab, setActiveTab] = useState('create');
  const [mockTitle, setMockTitle] = useState('Mains Practice Set - 1');
  const [rawText, setRawText] = useState('');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfBuffer, setPdfBuffer] = useState(null);

  const [startQ, setStartQ] = useState(1);
  const [endQ, setEndQ] = useState(25);
  const [durationMins, setDurationMins] = useState(20);
  const [positiveMarks, setPositiveMarks] = useState(3);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testRunning, setTestRunning] = useState(false);

  const [savedAttempts, setSavedAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [noteInput, setNoteInput] = useState({});

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [vaultViewMode, setVaultViewMode] = useState('chapters');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        syncAndLoadUserAttempts(currentUser);
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

  const syncAndLoadUserAttempts = async (currentUser) => {
    const uid = currentUser.uid;
    setCloudSyncStatus('Syncing across devices...');

    try {
      const keyDoc = await getDoc(doc(db, 'userSettings', uid));
      if (keyDoc.exists() && keyDoc.data().geminiKey) {
        const cloudKey = keyDoc.data().geminiKey;
        setGeminiKey(cloudKey);
        localStorage.setItem('gemini_api_key', cloudKey);
      } else if (geminiKey) {
        await setDoc(doc(db, 'userSettings', uid), { geminiKey }, { merge: true });
      }
    } catch (e) {
      // Ignore settings error
    }

    const localRaw = localStorage.getItem(`attempts_${uid}`);
    const localList = localRaw ? JSON.parse(localRaw) : [];

    try {
      const q = query(collection(db, 'mockAttempts'), where('uid', '==', uid));
      const snap = await getDocs(q);
      const cloudList = snap.docs.map(d => ({ docId: d.id, ...d.data() }));

      const cloudTimestamps = new Set(cloudList.map(item => item.timestamp));
      const unsyncedLocal = localList.filter(item => item.timestamp && !cloudTimestamps.has(item.timestamp));

      for (const localItem of unsyncedLocal) {
        try {
          const cleanItem = { ...localItem, uid };
          delete cleanItem.docId;
          const docRef = await addDoc(collection(db, 'mockAttempts'), cleanItem);
          cloudList.push({ ...cleanItem, docId: docRef.id });
        } catch (pushErr) {
          console.error('Auto push error:', pushErr);
        }
      }

      cloudList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setSavedAttempts(cloudList);
      localStorage.setItem(`attempts_${uid}`, JSON.stringify(cloudList));
      setCloudSyncStatus('✓ Cloud Synced (Laptop + Mobile)');
    } catch (err) {
      setSavedAttempts(localList);
      setCloudSyncStatus('⚠️ Local Mode');
    }
  };

  const handleDeleteAttempt = async (att) => {
    if (!window.confirm(`Kya aap "${att.title}" mock test ko delete karna chahte hain?`)) return;
    const updated = savedAttempts.filter(item => item.timestamp !== att.timestamp);
    setSavedAttempts(updated);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updated));
    if (att.docId) {
      try {
        await deleteDoc(doc(db, 'mockAttempts', att.docId));
      } catch (e) {
        console.error('Delete cloud error:', e);
      }
    }
  };

  const formatUserEmail = (input) => {
    const clean = input.trim().toLowerCase();
    return clean.includes('@') ? clean : `${clean}@mockportal.app`;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setRecoveredPassBox('');

    const formattedEmail = formatUserEmail(email);

    try {
      if (authMode === 'signup') {
        const finalSecQuestion = securityQuestion === 'custom' ? customSecQ.trim() : securityQuestion;
        if (!securityAnswer.trim()) {
          setAuthError('Kripya Forgot Password recovery ke liye apna Secret Answer zaroor likhein.');
          return;
        }
        const res = await createUserWithEmailAndPassword(auth, formattedEmail, password);
        if (displayName) {
          await updateProfile(res.user, { displayName });
        }

        const profileData = {
          uid: res.user.uid,
          displayName: displayName || email.trim(),
          email: formattedEmail,
          rawUsername: email.trim().toLowerCase(),
          targetExam,
          securityQuestion: finalSecQuestion || 'Security Question',
          securityAnswer: securityAnswer.trim().toLowerCase(),
          recoveryPin: recoveryPin.trim(),
          savedPassHint: password,
          createdAt: Date.now()
        };

        localStorage.setItem(`recovery_${formattedEmail}`, JSON.stringify(profileData));
        try {
          await setDoc(doc(db, 'userProfiles', formattedEmail), profileData);
        } catch (err) {
          console.log('Profile saved locally');
        }
        setEmail('');
        setPassword('');
      } else if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, formattedEmail, password);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setRecoveredPassBox('');

    if (!email.trim()) {
      setAuthError('Kripya pehle apna Username ya Email dalein.');
      return;
    }

    const formattedEmail = formatUserEmail(email);
    let profile = null;

    try {
      const snap = await getDoc(doc(db, 'userProfiles', formattedEmail));
      if (snap.exists()) profile = snap.data();
    } catch (err) {
      // Fallback to local
    }

    if (!profile) {
      const localProf = localStorage.getItem(`recovery_${formattedEmail}`);
      if (localProf) profile = JSON.parse(localProf);
    }

    if (profile) {
      const ansMatch = securityAnswer.trim().toLowerCase() === (profile.securityAnswer || '').toLowerCase();
      const pinMatch = recoveryPin.trim() && recoveryPin.trim() === profile.recoveryPin;

      if (ansMatch || pinMatch) {
        setRecoveredPassBox(profile.savedPassHint || '');
        setAuthSuccess(`✓ Identity Verified! Hello ${profile.displayName}, aapka password niche dikh raha hai. Ab aap Login kar sakte hain.`);
        return;
      } else {
        setAuthError('Secret Answer ya Recovery PIN match nahi hua! Kripya sahi answer dalein ya niche Email Reset button dabayein.');
        return;
      }
    } else {
      setAuthError('Is username ka Secret Question record nahi mila. Agar aapne asli Gmail ID dali thi, toh niche "Send Reset Link to Email" button dabayein.');
    }
  };

  const handleSendResetEmail = async () => {
    setAuthError('');
    setAuthSuccess('');
    if (!email.trim() || !email.includes('@')) {
      setAuthError('Email par link bhejne ke liye kripya apna pura Gmail address (e.g. name@gmail.com) likhein.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setAuthSuccess(`✓ Password Reset Link aapke email (${email.trim()}) par bhej diya gaya hai! Apna Inbox/Spam folder check karein.`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMockTitle(file.name.replace('.pdf', ''));
    setStatusMsg('PDF load ho raha hai (AI Chapter & Topic Classifier Ready)...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfBuffer(arrayBuffer);
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      setTotalPages(pdf.numPages);
      setStartPage(1);
      setEndPage(Math.min(10, pdf.numPages));

      let extracted = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageStr = content.items.map(it => it.str).join(' ');
        extracted += `\n--- Page ${i} ---\n` + pageStr;
      }
      setRawText(extracted);
      setStatusMsg(`✓ PDF Loaded (${pdf.numPages} Pages)! AI apne aap har question ka Subject, Chapter aur Topic pehchan kar Mock banayega.`);
    } catch (err) {
      setStatusMsg('PDF read error: ' + err.message);
    }
  };

  const renderPdfPagesToImages = async (buffer, fromP, toP) => {
    const pdf = await window.pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
    const imgs = [];
    const safeStart = Math.max(1, fromP);
    const safeEnd = Math.min(pdf.numPages, toP, safeStart + 11);

    for (let p = safeStart; p <= safeEnd; p++) {
      setStatusMsg(`Scanning PDF Page ${p} of ${safeEnd} (AI Vision + Topic Classifier)...`);
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1.4 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
      imgs.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: dataUrl.split(',')[1]
        }
      });
    }
    return imgs;
  };

  const callGeminiWithAnyKey = async (cleanKey, modelName, parts) => {
    const cleanModel = modelName.replace(/^models\//, '');
    const payload = JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const attempts = [
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey
        }
      },
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`
        }
      },
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(cleanKey)}`,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ];

    let lastErr = '';
    for (const att of attempts) {
      try {
        const res = await fetch(att.url, {
          method: 'POST',
          headers: att.headers,
          body: payload
        });
        const data = await res.json();
        if (!data.error && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return { text: data.candidates[0].content.parts[0].text };
        }
        if (data.error) {
          lastErr = data.error.message;
        }
      } catch (e) {
        lastErr = e.message;
      }
    }
    return { error: lastErr };
  };

  // Auto-discover available Gemini models directly from Google API so future model updates never break!
  const fetchAvailableGeminiModels = async (cleanKey) => {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`, {
        headers: { 'x-goog-api-key': cleanKey }
      });
      const data = await res.json();
      if (Array.isArray(data.models)) {
        return data.models
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''))
          .filter(name => name.includes('gemini'));
      }
    } catch (e) {
      // Fallback to static list
    }
    return [];
  };

  const generateMockFromText = async () => {
    const cleanKey = geminiKey.trim();
    if (!cleanKey) {
      setShowKeyModal(true);
      alert("Kripya 'API Key' button me jakar apni Gemini API Key (AQ... ya AIza...) paste karke Save karein.");
      return;
    }

    if (!rawText.trim() && !pdfBuffer) {
      alert("Kripya pehle PDF upload karein ya Question text paste karein.");
      return;
    }

    setIsGenerating(true);

    try {
      let parts = [];

      if (pdfBuffer) {
        const imageParts = await renderPdfPagesToImages(pdfBuffer, startPage, endPage);
        parts.push(...imageParts);
      }

      setStatusMsg(`AI Vision Question ${startQ} se ${endQ} nikal raha hai aur Subject, Chapter & Topic classify kar raha hai...`);

      const prompt = `You are an expert SSC CGL Mains & Competitive Exam AI Professor. Look carefully at the attached PDF page images and/or text.
Ignore coaching watermarks/headers like "Telegram YouTube Instagram App SSC PANACEA".
Extract the multiple-choice questions from Question number ${startQ} to Question number ${endQ} (or all questions visible on these scanned pages).

Automatically analyze each question and classify it into:
1. "subject": Choose one standard exam subject ("Quantitative Aptitude", "Reasoning & General Intelligence", "English Comprehension", "General Awareness", "Computer Knowledge", or "Economics & Finance").
2. "chapter": The exact syllabus chapter name (e.g., "Percentage", "Profit & Loss", "Geometry", "Indian Polity", "Modern History", "Macroeconomics", "Grammar - Error Spotting", "Networking", etc.).
3. "topic": The specific micro-topic or concept tested (e.g., "Successive Discount", "Article 148 CAG", "Five Year Plans", "OSI Model Layer 4", etc.).

Return ONLY a valid JSON array of objects with these exact keys:
- "qNum": number
- "subject": string
- "chapter": string
- "topic": string
- "question": string (the complete question statement without watermarks)
- "options": array of 4 strings (the 4 options A, B, C, D)
- "correctIndex": number (0 for A, 1 for B, 2 for C, 3 for D - solve accurately)
- "explanation": string (detailed step-by-step solution + shortcut trick in Hinglish/English)

Additional Text:
${rawText.slice(0, 15000)}`;

      parts.push({ text: prompt });

      // Priority model list including exact gemini-3.8-flash + live discovered models
      const discovered = await fetchAvailableGeminiModels(cleanKey);
      const priorityModels = [
        'gemini-3.8-flash',
        'gemini-3.8-flash-preview',
        'gemini-3.5-flash',
        'gemini-3.0-flash',
        'gemini-3-flash',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        ...discovered
      ];
      const uniqueModels = [...new Set(priorityModels)];

      let parsedQuestions = null;
      let lastError = '';

      for (let i = 0; i < uniqueModels.length; i++) {
        const modelName = uniqueModels[i];
        setStatusMsg(`Connecting to AI Model (${modelName})...`);
        const result = await callGeminiWithAnyKey(cleanKey, modelName, parts);

        if (result.text) {
          try {
            const cleanJson = result.text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsedQuestions = parsed.map((q, idx) => ({
                ...q,
                qNum: q.qNum || startQ + idx,
                subject: q.subject || 'General Practice',
                chapter: q.chapter || 'Mixed Chapter',
                topic: q.topic || 'Core Concept'
              }));
              break;
            }
          } catch (e) {
            lastError = "JSON parse error: " + e.message;
          }
        } else if (result.error) {
          lastError = result.error;
          // Smart Auto-Read: If server error says "Please update your code to use models/xyz", extract "xyz" and run it immediately!
          const suggestedMatch = result.error.match(/models\/([a-zA-Z0-9.-]+)/);
          if (suggestedMatch && suggestedMatch[1] && !uniqueModels.includes(suggestedMatch[1])) {
            uniqueModels.splice(i + 1, 0, suggestedMatch[1]);
          }
        }
      }

      if (parsedQuestions && parsedQuestions.length > 0) {
        const mainSub = parsedQuestions[0]?.subject || '';
        const mainChap = parsedQuestions[0]?.chapter || '';
        if (mockTitle === 'Mains Practice Set - 1' && mainChap) {
          setMockTitle(`${mainSub}: ${mainChap} (Q.${startQ}-${endQ})`);
        }
        startMockWithQuestions(parsedQuestions);
      } else {
        alert(`Questions extract nahi ho paye.\nServer Message: ${lastError}`);
      }
    } catch (err) {
      alert("Error: " + err.message);
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

    const subjectsSet = new Set();
    const chaptersSet = new Set();
    const topicsSet = new Set();

    activeQuestions.forEach((q, idx) => {
      if (q.subject) subjectsSet.add(q.subject);
      if (q.chapter) chaptersSet.add(q.chapter);
      if (q.topic) topicsSet.add(q.topic);

      const ans = userAnswers[idx];
      if (ans === undefined) unattempted++;
      else if (ans === q.correctIndex) correct++;
      else wrong++;
    });

    const totalScore = (correct * positiveMarks) - (wrong * negativeMarks);
    const maxScore = activeQuestions.length * positiveMarks;

    const primarySubject = [...subjectsSet][0] || 'Mixed Subject';
    const primaryChapter = [...chaptersSet][0] || 'Mixed Chapter';

    const attemptRecord = {
      uid: user?.uid || 'guest',
      userEmail: user?.email || 'guest',
      title: mockTitle || `${primaryChapter} (Q.${startQ}-${endQ})`,
      qRange: `Q.${startQ} - Q.${endQ}`,
      primarySubject,
      primaryChapter,
      subjectsList: [...subjectsSet],
      chaptersList: [...chaptersSet],
      topicsList: [...topicsSet],
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
        setCloudSyncStatus('✓ Cloud Synced (Laptop + Mobile)');
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

  const updateCorrectOptionInReview = async (qIdx, newCorrectIdx) => {
    if (!selectedAttempt) return;
    const updatedQuestions = selectedAttempt.questions.map((q, i) =>
      i === qIdx ? { ...q, correctIndex: newCorrectIdx } : q
    );

    let correct = 0, wrong = 0, unattempted = 0;
    updatedQuestions.forEach((q, idx) => {
      const ans = selectedAttempt.userAnswers?.[idx];
      if (ans === undefined) unattempted++;
      else if (ans === q.correctIndex) correct++;
      else wrong++;
    });

    const totalScore = (correct * selectedAttempt.positiveMarks) - (wrong * selectedAttempt.negativeMarks);
    const updatedAttempt = {
      ...selectedAttempt,
      questions: updatedQuestions,
      correct,
      wrong,
      unattempted,
      totalScore
    };

    setSelectedAttempt(updatedAttempt);
    const updatedList = savedAttempts.map(a => a.timestamp === selectedAttempt.timestamp ? updatedAttempt : a);
    setSavedAttempts(updatedList);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updatedList));

    if (selectedAttempt.docId) {
      try {
        await updateDoc(doc(db, 'mockAttempts', selectedAttempt.docId), {
          questions: updatedQuestions,
          correct,
          wrong,
          unattempted,
          totalScore
        });
      } catch (e) {
        console.error("Answer key cloud update error:", e);
      }
    }
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

  const chapterWiseStats = useMemo(() => {
    const map = {};
    savedAttempts.forEach((att) => {
      (att.questions || []).forEach((q, idx) => {
        const sub = q.subject || att.primarySubject || 'General Studies';
        const chap = q.chapter || att.primaryChapter || 'Mixed Practice';
        const top = q.topic || 'Standard Concept';
        const key = `${sub}___${chap}`;

        if (!map[key]) {
          map[key] = {
            subject: sub,
            chapter: chap,
            totalQs: 0,
            correct: 0,
            wrong: 0,
            skipped: 0,
            topicsMap: {},
            allQuestions: [],
            mistakeQuestions: []
          };
        }

        const uAns = att.userAnswers?.[idx];
        const isCorr = uAns === q.correctIndex;
        const isSkip = uAns === undefined;

        map[key].totalQs += 1;
        if (isCorr) map[key].correct += 1;
        else if (isSkip) map[key].skipped += 1;
        else map[key].wrong += 1;

        map[key].allQuestions.push(q);
        if (!isCorr) map[key].mistakeQuestions.push(q);

        if (!map[key].topicsMap[top]) {
          map[key].topicsMap[top] = { topic: top, total: 0, correct: 0, wrong: 0, questions: [] };
        }
        map[key].topicsMap[top].total += 1;
        if (isCorr) map[key].topicsMap[top].correct += 1;
        else map[key].topicsMap[top].wrong += 1;
        map[key].topicsMap[top].questions.push(q);
      });
    });

    return Object.values(map).sort((a, b) => b.totalQs - a.totalQs);
  }, [savedAttempts]);

  const allSubjectsList = useMemo(() => {
    const s = new Set(['All']);
    chapterWiseStats.forEach(item => s.add(item.subject));
    return [...s];
  }, [chapterWiseStats]);

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
          const existingTimestamps = new Set(savedAttempts.map(a => a.timestamp));
          let addedCount = 0;
          for (const item of imported) {
            if (user && !existingTimestamps.has(item.timestamp)) {
              try {
                const cleanItem = { ...item, uid: user.uid };
                delete cleanItem.docId;
                await addDoc(collection(db, 'mockAttempts'), cleanItem);
                addedCount++;
              } catch (err) {
                console.error('Import cloud sync err:', err);
              }
            }
          }
          if (user) await syncAndLoadUserAttempts(user);
          alert(`Successfully synced ${addedCount} mock tests to Cloud (Laptop + Mobile)!`);
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
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Mains Mock & AI Topic Portal</h1>
              <p className="text-xs text-slate-400">Cloud Login + Smart Password Recovery</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
              className={`py-2 rounded-lg text-xs font-semibold transition ${authMode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
              className={`py-2 rounded-lg text-xs font-semibold transition ${authMode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              New Registration
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthSuccess(''); }}
              className={`py-2 rounded-lg text-xs font-semibold transition ${authMode === 'forgot' ? 'bg-amber-600 text-white' : 'text-amber-400/80'}`}
            >
              Forgot Password?
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
              <p>{authSuccess}</p>
              {recoveredPassBox && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/40 text-center">
                  <span className="text-slate-400 text-[11px] block">Aapka Saved Password:</span>
                  <span className="text-base font-mono font-bold text-amber-300">{recoveredPassBox}</span>
                </div>
              )}
            </div>
          )}

          {authMode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Apna Username ya Email Dalein</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rohit01 or rohit@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <ShieldQuestion className="w-4 h-4" />
                  <span>Option 1: Registration Secret Answer se Turant Dekhein</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Aapka Secret Answer (Jo Registration me dala tha)</label>
                  <input
                    type="text"
                    placeholder="e.g. Maths / Blackbook / Chintu"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Ya 4-Digit Recovery PIN (Agar set kiya tha)</label>
                  <input
                    type="text"
                    placeholder="Optional 4-digit PIN (e.g. 2001)"
                    value={recoveryPin}
                    onChange={(e) => setRecoveryPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition"
                >
                  Recover My Password Instantly
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs transition"
                >
                  Option 2: Send Password Reset Link to Gmail
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-3.5">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rohit Kumar Wasnik"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Exam (Apne According Set Karein)</label>
                    <input
                      type="text"
                      value={targetExam}
                      onChange={(e) => setTargetExam(e.target.value)}
                      placeholder="e.g. SSC CGL AAO / DSSSB ASO"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 text-xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Username or Email *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rohit@gmail.com or rohit01"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">Password (min 6 chars) *</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              {authMode === 'signup' && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2.5">
                  <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <ShieldQuestion className="w-4 h-4" />
                    <span>Password Recovery Setup (Apne According)</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Select or Write Your Security Question</label>
                    <select
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="Mera favourite exam subject ya book kaunsi hai?">Mera favourite exam subject ya book kaunsi hai?</option>
                      <option value="Mera bachpan ka nickname kya hai?">Mera bachpan ka nickname kya hai?</option>
                      <option value="Mera pehla school ya college kaunsa tha?">Mera pehla school ya college kaunsa tha?</option>
                      <option value="Meri dream post kaunsi hai?">Meri dream post kaunsi hai?</option>
                      <option value="custom">+ Main khud apna Security Question likhunga...</option>
                    </select>
                  </div>

                  {securityQuestion === 'custom' && (
                    <input
                      type="text"
                      required
                      placeholder="Apna khud ka Security Question yahan likhein..."
                      value={customSecQ}
                      onChange={(e) => setCustomSecQ(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Secret Answer *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AAO / Blackbook"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Recovery PIN (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 0412"
                        value={recoveryPin}
                        onChange={(e) => setRecoveryPin(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
              >
                {authMode === 'login' ? 'Login to My Workspace' : 'Complete Registration & Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">Mains AI Chapter & Topic Mock Portal</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-emerald-400">Student: {user.displayName || user.email}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-3
