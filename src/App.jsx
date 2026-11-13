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
  FolderKanban, Sparkles, ShieldQuestion, Filter, Layers,
  RefreshCw, Edit3, Trash2, FileText, ArrowUp, ArrowDown,
  ZoomIn, ZoomOut, Pause, Play, Maximize2, Award, BarChart3,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    qNum: 1,
    subject: "English Comprehension",
    chapter: "Cloze Test",
    topic: "Vocabulary & Context in Passage",
    passage: "In the following passage, some words have been deleted. Read the passage carefully and select the most appropriate option to fill in each blank.\n\nEducation is not merely the acquisition of facts, but the (1)______ of the mind to think critically. In a rapidly changing world, students must learn to (2)______ new challenges with confidence and resilience.",
    question: "Select the most appropriate option to fill in blank No. (1).",
    options: ["training", "ignoring", "destruction", "limitation"],
    correctIndex: 0,
    explanation: "Blank (1) requires a positive noun showing development of the mind. 'Training' fits the context: 'training of the mind to think critically'."
  },
  {
    id: 2,
    qNum: 2,
    subject: "English Comprehension",
    chapter: "Cloze Test",
    topic: "Vocabulary & Context in Passage",
    passage: "In the following passage, some words have been deleted. Read the passage carefully and select the most appropriate option to fill in each blank.\n\nEducation is not merely the acquisition of facts, but the (1)______ of the mind to think critically. In a rapidly changing world, students must learn to (2)______ new challenges with confidence and resilience.",
    question: "Select the most appropriate option to fill in blank No. (2).",
    options: ["surrender", "confront", "avoid", "neglect"],
    correctIndex: 1,
    explanation: "'Confront' means to face or deal with challenges boldly, which matches 'with confidence and resilience'."
  },
  {
    id: 3,
    qNum: 3,
    subject: "Quantitative Aptitude",
    chapter: "Simple & Compound Interest",
    topic: "Rate of Simple Interest",
    passage: "",
    question: "If a sum of ₹12,500 amounts to ₹15,500 in 4 years at the rate of simple interest, what is the rate of interest per annum?",
    options: ["5%", "6%", "6.5%", "7.5%"],
    correctIndex: 1,
    explanation: "Simple Interest (SI) = 15500 - 12500 = ₹3000. Rate = (SI × 100) / (P × T) = (3000 × 100) / (12500 × 4) = 6%."
  },
  {
    id: 4,
    qNum: 4,
    subject: "General Awareness",
    chapter: "Indian Polity",
    topic: "Constitutional Bodies (CAG)",
    passage: "",
    question: "Under which Article of the Indian Constitution is the Comptroller and Auditor General (CAG) of India appointed?",
    options: ["Article 148", "Article 149", "Article 150", "Article 151"],
    correctIndex: 0,
    explanation: "Article 148 of the Indian Constitution provides for an independent office of the Comptroller and Auditor General of India (CAG)."
  },
  {
    id: 5,
    qNum: 5,
    subject: "Computer Knowledge",
    chapter: "Networking & Internet",
    topic: "OSI Model Layers",
    passage: "",
    question: "In Computer Networking, which layer of the OSI model is responsible for end-to-end error recovery and flow control?",
    options: ["Network Layer", "Data Link Layer", "Transport Layer", "Session Layer"],
    correctIndex: 2,
    explanation: "The Transport Layer (Layer 4) ensures complete data transfer, end-to-end error recovery, and flow control (e.g., TCP)."
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

  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [customChapterInput, setCustomChapterInput] = useState('');
  const [customTopicInput, setCustomTopicInput] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // CBT Test Interface States
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({ 0: true });
  const [questionTimeSpent, setQuestionTimeSpent] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testRunning, setTestRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [zoomScale, setZoomScale] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Main Countdown + Per-Question Time Tracker
  useEffect(() => {
    if (!testRunning || isPaused || timeLeft <= 0) {
      if (testRunning && timeLeft === 0) {
        handleSubmitTest();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
      setQuestionTimeSpent((prev) => ({
        ...prev,
        [currentIdx]: (prev[currentIdx] || 0) + 1
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [testRunning, isPaused, timeLeft, currentIdx]);

  const sortAttemptsByOrder = (list) => {
    return [...list].sort((a, b) => {
      const orderA = a.customOrder !== undefined ? a.customOrder : (9999999999999 - (a.timestamp || 0));
      const orderB = b.customOrder !== undefined ? b.customOrder : (9999999999999 - (b.timestamp || 0));
      return orderA - orderB;
    });
  };

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
      // Ignore
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

      const sorted = sortAttemptsByOrder(cloudList);
      setSavedAttempts(sorted);
      localStorage.setItem(`attempts_${uid}`, JSON.stringify(sorted));
      setCloudSyncStatus('✓ Cloud Synced (Laptop + Mobile)');
    } catch (err) {
      setSavedAttempts(sortAttemptsByOrder(localList));
      setCloudSyncStatus('⚠️ Local Mode');
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
      // Fallback
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
        setAuthSuccess(`✓ Identity Verified! Hello ${profile.displayName}, aapka password niche dikh raha hai.`);
        return;
      } else {
        setAuthError('Secret Answer ya Recovery PIN match nahi hua!');
        return;
      }
    } else {
      setAuthError('Is username ka Secret Question record nahi mila. Niche Email Reset button try karein.');
    }
  };

  const handleSendResetEmail = async () => {
    setAuthError('');
    setAuthSuccess('');
    if (!email.trim() || !email.includes('@')) {
      setAuthError('Email par link bhejne ke liye apna pura Gmail address (e.g. name@gmail.com) likhein.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setAuthSuccess(`✓ Password Reset Link aapke email (${email.trim()}) par bhej diya gaya hai!`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMockTitle(file.name.replace('.pdf', ''));
    setStatusMsg('PDF load ho raha hai (Cloze Test Passage + AI Topic Scanner Ready)...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      setPdfBuffer(arrayBuffer);
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      setTotalPages(pdf.numPages);
      setStartPage(1);
      setEndPage(pdf.numPages);

      let extracted = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageStr = content.items.map(it => it.str).join(' ');
        extracted += `\n--- Page ${i} ---\n` + pageStr;
      }
      setRawText(extracted);
      setStatusMsg(`✓ PDF Loaded (${pdf.numPages} Pages)! Ab aap Custom Range ya 'Generate Full PDF Mock' daba sakte hain.`);
    } catch (err) {
      setStatusMsg('PDF read error: ' + err.message);
    }
  };

  const renderPdfPagesToImages = async (buffer, fromP, toP) => {
    const pdf = await window.pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
    const imgs = [];
    const safeStart = Math.max(1, fromP);
    const safeEnd = Math.min(pdf.numPages, toP);

    for (let p = safeStart; p <= safeEnd; p++) {
      setStatusMsg(`Scanning PDF Page ${p} of ${safeEnd} (Extracting Questions & Passages)...`);
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
    const payload = JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const attempts = [
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey
        }
      },
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`
        }
      },
      {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(cleanKey)}`,
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

  const generateMockFromText = async (isFullPdf = false) => {
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
      const modelsToTry = [
        'gemini-3.0-flash',
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.0-flash'
      ];

      const firstPage = isFullPdf ? 1 : startPage;
      const lastPage = isFullPdf ? (totalPages || 1) : endPage;
      const batchSize = 8;

      let allExtractedQuestions = [];
      let lastError = '';

      const buildPrompt = (batchRangeStr) => `You are an expert SSC CGL Mains & Competitive Exam AI Professor. Look carefully at the attached PDF page images and/or text (${batchRangeStr}).
Ignore coaching watermarks/headers like "Telegram YouTube Instagram App SSC PANACEA".

${isFullPdf
  ? 'Extract ALL multiple-choice questions present on these pages from start to finish.'
  : `Extract the multiple-choice questions from Question number ${startQ} to Question number ${endQ} (or all questions visible if numbering differs).`}

CRITICAL RULE FOR CLOZE TEST, READING COMPREHENSION (RC), PASSAGE, OR DATA INTERPRETATION (DI):
- Whenever any question is part of a Cloze Test (fill in the blanks in a paragraph like (1), (2), (3), etc.), Reading Comprehension passage, or shared Direction/Table, you MUST include the COMPLETE Passage / Paragraph (with all numbered blanks visible) inside the "passage" field of EVERY question that belongs to that passage!
- NEVER output a Cloze Test or Comprehension question with an empty "passage" field. If a question is a standalone normal question without a passage, set "passage": "".

Automatically classify each question into:
1. "subject": ("Quantitative Aptitude", "Reasoning & General Intelligence", "English Comprehension", "General Awareness", "Computer Knowledge", or "Economics & Finance")
2. "chapter": Exact chapter name (e.g., "Cloze Test", "Reading Comprehension", "Percentage", "Indian Polity", "Analogy", etc.)
3. "topic": Specific micro-topic tested.

Return ONLY a valid JSON array of objects with these exact keys:
- "qNum": number
- "subject": string
- "chapter": string
- "topic": string
- "passage": string (FULL Cloze Test paragraph or RC Passage if applicable, otherwise "")
- "question": string (complete question statement)
- "options": array of 4 strings (the 4 options A, B, C, D)
- "correctIndex": number (0 for A, 1 for B, 2 for C, 3 for D)
- "explanation": string (detailed step-by-step solution in Hinglish/English)`;

      if (pdfBuffer && totalPages > 0) {
        for (let pStart = firstPage; pStart <= lastPage; pStart += batchSize) {
          const pEnd = Math.min(lastPage, pStart + batchSize - 1);
          const imageParts = await renderPdfPagesToImages(pdfBuffer, pStart, pEnd);
          setStatusMsg(`AI extracting questions & Cloze passages from Page ${pStart} to ${pEnd}...`);

          const parts = [
            ...imageParts,
            { text: buildPrompt(`Pages ${pStart} to ${pEnd}`) }
          ];

          let batchParsed = null;
          for (const modelName of modelsToTry) {
            const result = await callGeminiWithAnyKey(cleanKey, modelName, parts);
            if (result.text) {
              try {
                const cleanJson = result.text.replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  batchParsed = parsed;
                  break;
                }
              } catch (e) {
                lastError = e.message;
              }
            } else {
              lastError = result.error;
            }
          }

          if (batchParsed && batchParsed.length > 0) {
            allExtractedQuestions.push(...batchParsed);
          }

          if (!isFullPdf && allExtractedQuestions.length >= (endQ - startQ + 1)) {
            break;
          }
        }
      } else {
        setStatusMsg('AI extracting questions & passages from text...');
        const parts = [{ text: buildPrompt('Pasted Text') + `\n\nText:\n${rawText.slice(0, 35000)}` }];
        for (const modelName of modelsToTry) {
          const result = await callGeminiWithAnyKey(cleanKey, modelName, parts);
          if (result.text) {
            try {
              const cleanJson = result.text.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              if (Array.isArray(parsed) && parsed.length > 0) {
                allExtractedQuestions = parsed;
                break;
              }
            } catch (e) {
              lastError = e.message;
            }
          } else {
            lastError = result.error;
          }
        }
      }

      if (allExtractedQuestions.length > 0) {
        let lastKnownPassage = '';
        const finalQuestions = allExtractedQuestions.map((q, idx) => {
          const qTextLower = (q.question || '').toLowerCase();
          const chapLower = (q.chapter || '').toLowerCase();
          const isClozeOrRC =
            chapLower.includes('cloze') ||
            chapLower.includes('comprehension') ||
            chapLower.includes('passage') ||
            qTextLower.includes('blank no') ||
            qTextLower.includes('blank number') ||
            qTextLower.includes('fill in blank') ||
            qTextLower.includes('according to the passage');

          let finalPassage = (q.passage || '').trim();
          if (finalPassage.length > 20) {
            lastKnownPassage = finalPassage;
          } else if (isClozeOrRC && lastKnownPassage) {
            finalPassage = lastKnownPassage;
          }

          return {
            ...q,
            qNum: q.qNum || idx + 1,
            passage: finalPassage,
            subject: customSubjectInput.trim() || q.subject || 'General Practice',
            chapter: customChapterInput.trim() || q.chapter || 'Mixed Chapter',
            topic: customTopicInput.trim() || q.topic || 'Core Concept'
          };
        });

        const mainSub = finalQuestions[0]?.subject || '';
        const mainChap = finalQuestions[0]?.chapter || '';
        if (isFullPdf) {
          setMockTitle(`${mockTitle.replace(' (Full PDF)', '')} (Full PDF - ${finalQuestions.length} Qs)`);
        } else if (mockTitle === 'Mains Practice Set - 1' && mainChap) {
          setMockTitle(`${mainSub}: ${mainChap} (Q.${startQ}-${endQ})`);
        }

        startMockWithQuestions(finalQuestions);
      } else {
        alert(`Questions extract nahi ho paye.\nReason: ${lastError}`);
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
    setVisitedQuestions({ 0: true });
    setQuestionTimeSpent({});
    setIsPaused(false);
    setZoomScale(100);
    setTimeLeft(durationMins * 60);
    setTestRunning(true);
    setActiveTab('test');
  };

  const navigateToQuestion = (idx) => {
    setCurrentIdx(idx);
    setVisitedQuestions((prev) => ({ ...prev, [idx]: true }));
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleSubmitTest = async () => {
    setTestRunning(false);
    setIsPaused(false);
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

    const totalScore = Number(((correct * positiveMarks) - (wrong * negativeMarks)).toFixed(2));
    const maxScore = activeQuestions.length * positiveMarks;
    const totalTimeSpentSec = Object.values(questionTimeSpent).reduce((a, b) => a + b, 0);

    const primarySubject = customSubjectInput.trim() || [...subjectsSet][0] || 'Mixed Subject';
    const primaryChapter = customChapterInput.trim() || [...chaptersSet][0] || 'Mixed Chapter';

    const attemptRecord = {
      uid: user?.uid || 'guest',
      userEmail: user?.email || 'guest',
      title: mockTitle || `${primaryChapter} (${activeQuestions.length} Qs)`,
      qRange: `Total ${activeQuestions.length} Qs`,
      primarySubject,
      primaryChapter,
      subjectsList: [...subjectsSet],
      chaptersList: [...chaptersSet],
      topicsList: [...topicsSet],
      dateStr: new Date().toLocaleString('en-IN'),
      timestamp: Date.now(),
      customOrder: 0,
      durationMins,
      totalTimeSpentSec,
      questionTimeSpent,
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
      setCloudSyncStatus('⚠️ Saved on Device');
    }

    const updated = [attemptRecord, ...savedAttempts.map((a, i) => ({ ...a, customOrder: i + 1 }))];
    setSavedAttempts(updated);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updated));

    setSelectedAttempt(attemptRecord);
    setFilterMode('all');
    setActiveTab('review');
  };

  // Recalculate attempt stats whenever questions are removed, reordered, or key is changed
  const recalculateAndSaveAttempt = async (baseAttempt, newQuestions, newAnswers, newNotes, newTimeSpent) => {
    let correct = 0, wrong = 0, unattempted = 0;
    const subjectsSet = new Set();
    const chaptersSet = new Set();
    const topicsSet = new Set();

    newQuestions.forEach((q, idx) => {
      if (q.subject) subjectsSet.add(q.subject);
      if (q.chapter) chaptersSet.add(q.chapter);
      if (q.topic) topicsSet.add(q.topic);

      const ans = newAnswers[idx];
      if (ans === undefined) unattempted++;
      else if (ans === q.correctIndex) correct++;
      else wrong++;
    });

    const pos = baseAttempt.positiveMarks || 3;
    const neg = baseAttempt.negativeMarks || 1;
    const totalScore = Number(((correct * pos) - (wrong * neg)).toFixed(2));
    const maxScore = newQuestions.length * pos;

    const updatedAttempt = {
      ...baseAttempt,
      qRange: `Total ${newQuestions.length} Qs`,
      questions: newQuestions,
      userAnswers: newAnswers,
      notes: newNotes,
      questionTimeSpent: newTimeSpent,
      correct,
      wrong,
      unattempted,
      totalScore,
      maxScore,
      subjectsList: [...subjectsSet],
      chaptersList: [...chaptersSet],
      topicsList: [...topicsSet]
    };

    setSelectedAttempt(updatedAttempt);
    const updatedList = savedAttempts.map(a => a.timestamp === baseAttempt.timestamp ? updatedAttempt : a);
    setSavedAttempts(updatedList);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updatedList));

    if (updatedAttempt.docId) {
      try {
        await updateDoc(doc(db, 'mockAttempts', updatedAttempt.docId), {
          qRange: updatedAttempt.qRange,
          questions: newQuestions,
          userAnswers: newAnswers,
          notes: newNotes,
          questionTimeSpent: newTimeSpent,
          correct,
          wrong,
          unattempted,
          totalScore,
          maxScore,
          subjectsList: updatedAttempt.subjectsList,
          chaptersList: updatedAttempt.chaptersList,
          topicsList: updatedAttempt.topicsList
        });
      } catch (e) {
        console.error("Cloud update error:", e);
      }
    }
  };

  // REMOVE ANY QUESTION FROM A SAVED MOCK TEST
  const handleRemoveQuestionFromSavedMock = async (qIdx) => {
    if (!selectedAttempt) return;
    if (selectedAttempt.questions.length <= 1) {
      alert("Mock test me kam se kam 1 question hona zaroori hai.");
      return;
    }
    if (!window.confirm(`Kya aap Question #${qIdx + 1} ko is Saved Mock se hamesha ke liye hatana (Remove) chahte hain?`)) {
      return;
    }

    const newQuestions = [];
    const newAnswers = {};
    const newNotes = {};
    const newTimeSpent = {};

    selectedAttempt.questions.forEach((q, i) => {
      if (i === qIdx) return;
      const newIndex = newQuestions.length;
      newQuestions.push({ ...q, qNum: newIndex + 1 });
      if (selectedAttempt.userAnswers?.[i] !== undefined) {
        newAnswers[newIndex] = selectedAttempt.userAnswers[i];
      }
      if (selectedAttempt.notes?.[i] !== undefined) {
        newNotes[newIndex] = selectedAttempt.notes[i];
      }
      if (selectedAttempt.questionTimeSpent?.[i] !== undefined) {
        newTimeSpent[newIndex] = selectedAttempt.questionTimeSpent[i];
      }
    });

    await recalculateAndSaveAttempt(selectedAttempt, newQuestions, newAnswers, newNotes, newTimeSpent);
  };

  // REORDER QUESTIONS INSIDE A SAVED MOCK TEST (Move Up / Move Down / Move to Position #)
  const handleMoveQuestionInSavedMock = async (fromIdx, toIdx) => {
    if (!selectedAttempt) return;
    const total = selectedAttempt.questions.length;
    if (toIdx < 0 || toIdx >= total || fromIdx === toIdx) return;

    const itemBundle = selectedAttempt.questions.map((q, i) => ({
      q,
      ans: selectedAttempt.userAnswers?.[i],
      note: selectedAttempt.notes?.[i],
      time: selectedAttempt.questionTimeSpent?.[i]
    }));

    const [movedItem] = itemBundle.splice(fromIdx, 1);
    itemBundle.splice(toIdx, 0, movedItem);

    const newQuestions = [];
    const newAnswers = {};
    const newNotes = {};
    const newTimeSpent = {};

    itemBundle.forEach((bundle, newIdx) => {
      newQuestions.push({ ...bundle.q, qNum: newIdx + 1 });
      if (bundle.ans !== undefined) newAnswers[newIdx] = bundle.ans;
      if (bundle.note !== undefined) newNotes[newIdx] = bundle.note;
      if (bundle.time !== undefined) newTimeSpent[newIdx] = bundle.time;
    });

    await recalculateAndSaveAttempt(selectedAttempt, newQuestions, newAnswers, newNotes, newTimeSpent);
  };

  const handleJumpQuestionPosition = async (fromIdx) => {
    if (!selectedAttempt) return;
    const total = selectedAttempt.questions.length;
    const input = window.prompt(`Question #${fromIdx + 1} ko kis number (1 se ${total}) par set karna hai?`, String(fromIdx + 1));
    if (!input) return;
    const targetNum = parseInt(input, 10);
    if (isNaN(targetNum) || targetNum < 1 || targetNum > total) {
      alert(`Kripya 1 se ${total} ke beech ka number dalein.`);
      return;
    }
    await handleMoveQuestionInSavedMock(fromIdx, targetNum - 1);
  };

  // REORDER SAVED MOCK TESTS IN VAULT
  const handleMoveAttemptInVault = async (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= savedAttempts.length || fromIdx === toIdx) return;
    const copy = [...savedAttempts];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);

    const reindexed = copy.map((att, idx) => ({ ...att, customOrder: idx }));
    setSavedAttempts(reindexed);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(reindexed));

    for (const att of reindexed) {
      if (att.docId) {
        try {
          await updateDoc(doc(db, 'mockAttempts', att.docId), { customOrder: att.customOrder });
        } catch (e) {
          // Ignore
        }
      }
    }
  };

  const handleRenameChapterGroup = async (oldSubject, oldChapter) => {
    const newChapter = window.prompt(`"${oldChapter}" chapter ka naya naam apne hisab se likhein:`, oldChapter);
    if (!newChapter || !newChapter.trim()) return;
    const newSubject = window.prompt(`Subject ka naam (Chahein to wahi rehne dein):`, oldSubject) || oldSubject;

    const updatedAttempts = [];
    for (const att of savedAttempts) {
      let modified = false;
      const newQs = (att.questions || []).map(q => {
        const qSub = q.subject || att.primarySubject || 'General Studies';
        const qChap = q.chapter || att.primaryChapter || 'Mixed Practice';
        if (qSub === oldSubject && qChap === oldChapter) {
          modified = true;
          return { ...q, subject: newSubject.trim(), chapter: newChapter.trim() };
        }
        return q;
      });

      if (modified) {
        const chaptersSet = new Set(newQs.map(q => q.chapter).filter(Boolean));
        const subjectsSet = new Set(newQs.map(q => q.subject).filter(Boolean));
        const updatedAtt = {
          ...att,
          questions: newQs,
          primarySubject: [...subjectsSet][0] || newSubject.trim(),
          primaryChapter: [...chaptersSet][0] || newChapter.trim(),
          subjectsList: [...subjectsSet],
          chaptersList: [...chaptersSet]
        };
        updatedAttempts.push(updatedAtt);
        if (updatedAtt.docId) {
          try {
            await updateDoc(doc(db, 'mockAttempts', updatedAtt.docId), {
              questions: newQs,
              primarySubject: updatedAtt.primarySubject,
              primaryChapter: updatedAtt.primaryChapter,
              subjectsList: updatedAtt.subjectsList,
              chaptersList: updatedAtt.chaptersList
            });
          } catch (e) {
            console.error('Cloud rename err:', e);
          }
        }
      } else {
        updatedAttempts.push(att);
      }
    }

    setSavedAttempts(updatedAttempts);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updatedAttempts));
  };

  const handleEditSingleQuestionMeta = async (qIdx) => {
    if (!selectedAttempt) return;
    const currentQ = selectedAttempt.questions[qIdx];
    const newChap = window.prompt('Is Question ka Chapter Name badlein:', currentQ.chapter || '');
    if (newChap === null) return;
    const newTop = window.prompt('Is Question ka Topic Name badlein:', currentQ.topic || '');
    if (newTop === null) return;

    const updatedQuestions = selectedAttempt.questions.map((q, i) =>
      i === qIdx
        ? {
            ...q,
            chapter: newChap.trim() || q.chapter,
            topic: newTop.trim() || q.topic
          }
        : q
    );

    await recalculateAndSaveAttempt(
      selectedAttempt,
      updatedQuestions,
      selectedAttempt.userAnswers || {},
      selectedAttempt.notes || {},
      selectedAttempt.questionTimeSpent || {}
    );
  };

  const handleDeleteAttempt = async (attToDelete) => {
    if (!window.confirm(`Kya aap "${attToDelete.title}" mock test ko delete karna chahte hain?`)) return;
    const filtered = savedAttempts.filter(a => a.timestamp !== attToDelete.timestamp);
    setSavedAttempts(filtered);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(filtered));
    if (attToDelete.docId) {
      try {
        await deleteDoc(doc(db, 'mockAttempts', attToDelete.docId));
      } catch (e) {
        console.error('Delete cloud err:', e);
      }
    }
  };

  const updateCorrectOptionInReview = async (qIdx, newCorrectIdx) => {
    if (!selectedAttempt) return;
    const updatedQuestions = selectedAttempt.questions.map((q, i) =>
      i === qIdx ? { ...q, correctIndex: newCorrectIdx } : q
    );
    await recalculateAndSaveAttempt(
      selectedAttempt,
      updatedQuestions,
      selectedAttempt.userAnswers || {},
      selectedAttempt.notes || {},
      selectedAttempt.questionTimeSpent || {}
    );
  };

  const saveMistakeNote = async (qIdx, noteText) => {
    if (!selectedAttempt) return;
    const updatedNotes = { ...(selectedAttempt.notes || {}), [qIdx]: noteText };
    await recalculateAndSaveAttempt(
      selectedAttempt,
      selectedAttempt.questions,
      selectedAttempt.userAnswers || {},
      updatedNotes,
      selectedAttempt.questionTimeSpent || {}
    );
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

  // Topic-wise breakdown for the currently selected attempt in Detailed Result View
  const selectedAttemptTopicBreakdown = useMemo(() => {
    if (!selectedAttempt) return [];
    const map = {};
    const pos = selectedAttempt.positiveMarks || 3;
    const neg = selectedAttempt.negativeMarks || 1;

    (selectedAttempt.questions || []).forEach((q, idx) => {
      const chap = q.chapter || 'General';
      const top = q.topic || 'Core Concept';
      const key = `${chap} — ${top}`;
      if (!map[key]) {
        map[key] = {
          chapter: chap,
          topic: top,
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          marks: 0,
          timeSec: 0
        };
      }
      const ans = selectedAttempt.userAnswers?.[idx];
      const qTime = selectedAttempt.questionTimeSpent?.[idx] || 0;
      map[key].total += 1;
      map[key].timeSec += qTime;

      if (ans === undefined) {
        map[key].skipped += 1;
      } else if (ans === q.correctIndex) {
        map[key].correct += 1;
        map[key].marks += pos;
      } else {
        map[key].wrong += 1;
        map[key].marks -= neg;
      }
    });

    return Object.values(map);
  }, [selectedAttempt]);

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
          for (const item of imported) {
            if (user) {
              try {
                const cleanItem = { ...item, uid: user.uid };
                delete cleanItem.docId;
                await addDoc(collection(db, 'mockAttempts'), cleanItem);
              } catch (err) {
                console.error('Import cloud sync err:', err);
              }
            }
          }
          if (user) await syncAndLoadUserAttempts(user);
          alert(`Successfully restored & synced ${imported.length} mock tests to Cloud!`);
        }
      } catch (err) {
        alert("Invalid backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const getTimerParts = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return {
      h: String(hrs).padStart(2, '0'),
      m: String(mins).padStart(2, '0'),
      s: String(secs).padStart(2, '0')
    };
  };

  const formatShortTime = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Live CBT Palette Counts (Answered, Not Answered, Marked, Marked & Answered)
  const cbtPaletteCounts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let markedOnly = 0;
    let markedAndAnswered = 0;

    activeQuestions.forEach((_, i) => {
      const hasAns = userAnswers[i] !== undefined;
      const isMark = !!markedForReview[i];

      if (hasAns && isMark) markedAndAnswered++;
      else if (isMark && !hasAns) markedOnly++;
      else if (hasAns) answered++;
      else notAnswered++;
    });

    return { answered, notAnswered, markedOnly, markedAndAnswered };
  }, [activeQuestions, userAnswers, markedForReview]);

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
                  <label className="block text-[11px] text-slate-400 mb-1">Aapka Secret Answer</label>
                  <input
                    type="text"
                    placeholder="e.g. Maths / Blackbook / Chintu"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Ya 4-Digit Recovery PIN</label>
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
                    <label className="block text-xs text-slate-400 mb-1">Target Exam</label>
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
                    <span>Password Recovery Setup</span>
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

  // ============================================================================
  // REAL-EXAM CBT INTERFACE WHEN TEST IS RUNNING (Matches Screenshot 2)
  // ============================================================================
  if (activeTab === 'test' && activeQuestions.length > 0) {
    const tParts = getTimerParts(timeLeft);
    const currQ = activeQuestions[currentIdx];
    const currSpentSec = questionTimeSpent[currentIdx] || 0;

    return (
      <div className="min-h-screen bg-[#f4f5f9] text-slate-900 flex flex-col select-none">
        {/* 1. Top White Exam Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomScale((z) => Math.min(135, z + 10))}
              className="px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-[#2e2a85] text-xs font-bold flex items-center gap-1 transition"
            >
              <ZoomIn className="w-3.5 h-3.5" /> Zoom (+)
            </button>
            <button
              onClick={() => setZoomScale((z) => Math.max(80, z - 10))}
              className="px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-[#2e2a85] text-xs font-bold flex items-center gap-1 transition"
            >
              <ZoomOut className="w-3.5 h-3.5" /> Zoom (-)
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-base md:text-lg font-extrabold text-slate-900">{mockTitle}</h1>
            <p className="text-xs font-semibold text-slate-600">
              Candidate : [{user.displayName || user.email?.split('@')[0] || 'Rohit'}]
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-center mr-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Time Left</span>
              <div className="flex items-center gap-1 mt-0.5 font-mono font-extrabold text-sm md:text-base text-[#1e1b4b]">
                <span className="px-2 py-1 rounded-md bg-indigo-100/80">{tParts.h}</span>
                <span>:</span>
                <span className="px-2 py-1 rounded-md bg-indigo-100/80">{tParts.m}</span>
                <span>:</span>
                <span className="px-2 py-1 rounded-md bg-indigo-100/80">{tParts.s}</span>
              </div>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition ${
                isPaused
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white hover:bg-slate-50 text-[#2e2a85] border-[#2e2a85]/40'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <button
              onClick={toggleFullScreen}
              className="px-3.5 py-2 rounded-lg border border-[#2e2a85]/40 bg-white hover:bg-slate-50 text-[#2e2a85] text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Show Full Screen
            </button>
          </div>
        </header>

        {/* 2. Sub-Header Action Bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-4 py-1.5 rounded-md bg-[#0a7c2f] text-white text-xs font-bold shadow-sm">
              Part A
            </span>
            {currQ.subject && (
              <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                {currQ.subject} • {currQ.chapter}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setMarkedForReview({ ...markedForReview, [currentIdx]: !markedForReview[currentIdx] });
                if (currentIdx < activeQuestions.length - 1) {
                  navigateToQuestion(currentIdx + 1);
                }
              }}
              className="px-5 py-2 rounded-md bg-[#2e2a85] hover:bg-[#231f6b] text-white text-xs font-bold shadow-sm transition"
            >
              {markedForReview[currentIdx] ? 'Unmark Review' : 'Mark For Review'}
            </button>

            <button
              onClick={() => {
                if (currentIdx < activeQuestions.length - 1) {
                  navigateToQuestion(currentIdx + 1);
                }
              }}
              className="px-5 py-2 rounded-md bg-[#2e2a85] hover:bg-[#231f6b] text-white text-xs font-bold shadow-sm transition"
            >
              Save & Next
            </button>

            <button
              onClick={handleSubmitTest}
              className="px-5 py-2 rounded-md bg-[#2e2a85] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              Submit Test
            </button>
          </div>

          <div>
            <button
              onClick={() => {
                if (window.confirm('Test chhod kar wapas Create Mock par jana chahte hain?')) {
                  setTestRunning(false);
                  setActiveTab('create');
                }
              }}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Exit Test
            </button>
          </div>
        </div>

        {/* 3. Main CBT Split Area: Left Question Paper + Right Question Palette */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Question Panel */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto relative">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-slate-900">{mockTitle}</h2>
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Total Answered :</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold">
                  {cbtPaletteCounts.answered + cbtPaletteCounts.markedAndAnswered}
                </span>
              </div>
            </div>

            <div
              className="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 shadow-sm transition-all"
              style={{ fontSize: `${zoomScale}%` }}
            >
              {/* Question Top Metadata Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    Question No. {currentIdx + 1}
                  </span>
                  {currQ.topic && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#2e2a85] text-[11px] font-semibold">
                      {currQ.topic}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-700 text-xs font-mono font-bold">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatShortTime(currSpentSec)}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    +{positiveMarks} / -{negativeMarks}
                  </span>
                </div>
              </div>

              {/* Dedicated Cloze Test / RC Passage Box inside CBT */}
              {currQ.passage && (
                <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-indigo-200 max-h-60 overflow-y-auto">
                  <div className="text-xs font-extrabold text-[#2e2a85] mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Reference Passage / Cloze Test Paragraph:</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-line text-sm">
                    {currQ.passage}
                  </p>
                </div>
              )}

              {/* Question Statement */}
              <div className="text-slate-900 font-medium leading-relaxed mb-6 whitespace-pre-line">
                {currQ.question}
              </div>

              {/* Radio Options List */}
              <div className="space-y-2.5">
                {currQ.options.map((opt, oIdx) => {
                  const selected = userAnswers[currentIdx] === oIdx;
                  return (
                    <div
                      key={oIdx}
                      onClick={() => setUserAnswers({ ...userAnswers, [currentIdx]: oIdx })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3.5 ${
                        selected
                          ? 'bg-indigo-50/80 border-[#2e2a85] text-slate-950 font-semibold shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? 'border-[#2e2a85]' : 'border-slate-500'
                        }`}
                      >
                        {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#2e2a85]" />}
                      </span>
                      <span className="text-xs font-bold text-[#2e2a85] w-4">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span className="flex-1">{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Navigation & Clear inside Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => {
                    const copy = { ...userAnswers };
                    delete copy[currentIdx];
                    setUserAnswers(copy);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Clear Response
                </button>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => navigateToQuestion(currentIdx - 1)}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-800 text-xs font-bold"
                  >
                    ← Previous
                  </button>
                  {currentIdx < activeQuestions.length - 1 ? (
                    <button
                      onClick={() => navigateToQuestion(currentIdx + 1)}
                      className="px-5 py-2 rounded-lg bg-[#2e2a85] hover:bg-[#231f6b] text-white text-xs font-bold"
                    >
                      Save & Next →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitTest}
                      className="px-6 py-2 rounded-lg bg-[#0a7c2f] hover:bg-emerald-800 text-white text-xs font-bold"
                    >
                      Submit Test ✓
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Question Palette + Analysis Counts */}
          {sidebarOpen && (
            <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between shrink-0">
              <div>
                <div className="px-4 py-2.5 border-b border-slate-200 flex items-center gap-4 text-xs font-bold text-orange-500">
                  <span>Symbols</span>
                  <span>Instructions</span>
                </div>

                <div className="p-4">
                  <h3 className="text-center font-extrabold text-sm text-slate-900 mb-4">
                    Part - A : {mockTitle}
                  </h3>

                  <div className="grid grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {activeQuestions.map((_, i) => {
                      const hasAns = userAnswers[i] !== undefined;
                      const isMark = !!markedForReview[i];
                      const isCurr = currentIdx === i;

                      let pillStyle = 'bg-[#2e2a85] text-white'; // Not Answered (Default Blue/Indigo)
                      if (hasAns && isMark) {
                        pillStyle = 'bg-yellow-400 text-slate-950'; // Marked & Answered
                      } else if (isMark) {
                        pillStyle = 'bg-red-600 text-white'; // Marked
                      } else if (hasAns) {
                        pillStyle = 'bg-[#0a7c2f] text-white'; // Answered (Green)
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => navigateToQuestion(i)}
                          className={`h-8 rounded-full text-xs font-bold transition flex items-center justify-center ${pillStyle} ${
                            isCurr ? 'ring-2 ring-offset-2 ring-[#2e2a85]' : ''
                          }`}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Analysis Section (Matches Screenshot 2) */}
              <div className="border-t border-slate-200">
                <div className="bg-indigo-50/70 py-2 text-center font-extrabold text-sm text-slate-900 border-b border-slate-200">
                  Analysis
                </div>
                <div className="p-4 space-y-2.5 text-xs font-semibold text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Answered</span>
                    <span className="px-3 py-1 rounded-full bg-[#0a7c2f] text-white font-bold">
                      {String(cbtPaletteCounts.answered).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Not Answered</span>
                    <span className="px-3 py-1 rounded-full bg-[#2e2a85] text-white font-bold">
                      {String(cbtPaletteCounts.notAnswered).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Marked</span>
                    <span className="px-3 py-1 rounded-full bg-red-600 text-white font-bold">
                      {String(cbtPaletteCounts.markedOnly).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Marked & Answered</span>
                    <span className="px-3 py-1 rounded-full bg-yellow-400 text-slate-950 font-bold">
                      {String(cbtPaletteCounts.markedAndAnswered).padStart(2, '0')}
                    </span>
                  </div>

                  <button
                    onClick={handleSubmitTest}
                    className="w-full py-2.5 mt-3 rounded-lg bg-[#0a7c2f] hover:bg-emerald-800 text-white font-bold text-xs shadow"
                  >
                    Submit Test & View Detailed Result
                  </button>
                </div>
              </div>
            </aside>
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
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                  {cloudSyncStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${activeTab === 'create' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              + Create Mock
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'vault' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              AI Chapter & Topic Vault ({savedAttempts.length})
            </button>
            <button
              onClick={() => user && syncAndLoadUserAttempts(user)}
              title="Sync Laptop & Mobile Data"
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync
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

      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5">
            <h3 className="font-bold text-white mb-2">Google AI Studio Key (`AQ.Ab8...` or `AIza...`)</h3>
            <p className="text-xs text-slate-400 mb-3">
              Apni key yahan Save karne par yeh aapke Cloud Account me sync ho jayegi:
            </p>
            <input
              type="text"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Paste AQ.Ab8... or AIzaSy... key here"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  const clean = geminiKey.trim();
                  localStorage.setItem('gemini_api_key', clean);
                  if (user) {
                    try {
                      await setDoc(doc(db, 'userSettings', user.uid), { geminiKey: clean }, { merge: true });
                    } catch (e) {
                      console.log('Key saved locally');
                    }
                  }
                  setShowKeyModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Save & Sync Key
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4">
        {activeTab === 'create' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>1. Upload Mains PDF</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Real CBT Interface + Cloze Passage AI
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setMockTitle('Analogy & Cloze Test CBT Demo');
                    startMockWithQuestions(SAMPLE_QUESTIONS);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  ▶ Run Real CBT Demo Mock (5 Qs)
                </button>
              </div>

              <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 transition">
                <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="text-sm font-medium text-slate-200">Click to Upload Question Bank PDF</span>
                <span className="text-xs text-emerald-400 mt-1">✓ Automatically extracts Cloze Test Passages, RC Paragraphs & Chapter Names</span>
                <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
              </label>

              {totalPages > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-indigo-400 font-semibold mb-1">
                      Scan From PDF Page # (Total {totalPages} pages)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={startPage}
                      onChange={(e) => setStartPage(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-indigo-400 font-semibold mb-1">
                      Scan To PDF Page #
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={endPage}
                      onChange={(e) => setEndPage(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                    />
                  </div>
                </div>
              )}

              {statusMsg && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                  {statusMsg}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Or Paste Questions / Cloze Passage Directly Below:</label>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Agar bina PDF ke seedha Cloze Test ya Questions copy-paste karna ho to yahan dalein..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
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

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
                  <span>Custom Chapter Name (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Blank = AI Auto-Divides</span>
                </div>
                <input
                  type="text"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  placeholder="Subject (Optional, e.g. English / Reasoning)"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  value={customChapterInput}
                  onChange={(e) => setCustomChapterInput(e.target.value)}
                  placeholder="Chapter Name (Optional, e.g. Analogy - 1)"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Timer (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={durationMins}
                    onChange={(e) => setDurationMins(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Correct (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={positiveMarks}
                    onChange={(e) => setPositiveMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Wrong (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-rose-400"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  disabled={isGenerating}
                  onClick={() => generateMockFromText(false)}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition"
                >
                  {isGenerating ? 'AI Scanning PDF...' : `Generate Range Mock (Q.${startQ} to Q.${endQ})`}
                </button>

                <button
                  disabled={isGenerating}
                  onClick={() => generateMockFromText(true)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? 'Scanning Entire PDF...' : '⚡ Generate Full PDF Mock (All Questions in PDF)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>AI Automatic Chapter-Wise & Topic-Wise Manager</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Har saved mock test ke andar aap questions Remove kar sakte hain aur unka Order (`↑` `↓`) apne hisab se set rakh sakte hain.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setVaultViewMode('chapters')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    vaultViewMode === 'chapters' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  📚 Chapter & Topic Wise View
                </button>
                <button
                  onClick={() => setVaultViewMode('tests')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    vaultViewMode === 'tests' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  📝 All Mock Tests ({savedAttempts.length})
                </button>
                <button
                  onClick={exportBackupJSON}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
                <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <FileUp className="w-4 h-4" /> Restore
                  <input type="file" accept=".json" onChange={importBackupJSON} className="hidden" />
                </label>
              </div>
            </div>

            {allSubjectsList.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filter Subject:
                </span>
                {allSubjectsList.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubjectFilter(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedSubjectFilter === sub
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {savedAttempts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
                Abhi tak koi mock test save nahi hua hai. "+ Create Mock" me jakar apna pehla test dein!
              </div>
            ) : vaultViewMode === 'chapters' ? (
              <div className="grid md:grid-cols-2 gap-4">
                {chapterWiseStats
                  .filter(item => selectedSubjectFilter === 'All' || item.subject === selectedSubjectFilter)
                  .map((chapItem, cIdx) => {
                    const accuracy = chapItem.totalQs > 0
                      ? Math.round((chapItem.correct / chapItem.totalQs) * 100)
                      : 0;
                    const topicsArr = Object.values(chapItem.topicsMap);

                    return (
                      <div key={cIdx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
                              {chapItem.subject}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRenameChapterGroup(chapItem.subject, chapItem.chapter)}
                                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" /> Rename Chapter
                              </button>
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                accuracy >= 75 ? 'bg-emerald-500/20 text-emerald-300' : accuracy >= 50 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                Accuracy: {accuracy}%
                              </span>
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-white mt-2">
                            Chapter: {chapItem.chapter}
                          </h3>

                          <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                              <div className="text-[11px] text-slate-400">Total Qs</div>
                              <div className="text-sm font-bold text-white">{chapItem.totalQs}</div>
                            </div>
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                              <div className="text-[11px] text-emerald-400">Correct</div>
                              <div className="text-sm font-bold text-emerald-300">{chapItem.correct}</div>
                            </div>
                            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                              <div className="text-[11px] text-rose-400">Wrong</div>
                              <div className="text-sm font-bold text-rose-300">{chapItem.wrong}</div>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                              <div className="text-[11px] text-slate-400">Skipped</div>
                              <div className="text-sm font-bold text-slate-300">{chapItem.skipped}</div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="text-xs font-semibold text-slate-400 mb-2">
                              📌 AI Topic-Wise Breakdown ({topicsArr.length} Topics):
                            </div>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {topicsArr.map((tObj, tIdx) => (
                                <div
                                  key={tIdx}
                                  className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                                >
                                  <span className="text-slate-200 font-medium truncate pr-2">
                                    • {tObj.topic}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-emerald-400">{tObj.correct}✓</span>
                                    <span className="text-rose-400">{tObj.wrong}✗</span>
                                    <button
                                      onClick={() => {
                                        setMockTitle(`${chapItem.chapter} - ${tObj.topic}`);
                                        startMockWithQuestions(tObj.questions);
                                      }}
                                      className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-[10px] font-semibold"
                                    >
                                      Practice Topic
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setMockTitle(`${chapItem.subject}: ${chapItem.chapter} (Full Chapter Practice)`);
                              startMockWithQuestions(chapItem.allQuestions);
                            }}
                            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                          >
                            Practice Full Chapter ({chapItem.totalQs} Qs)
                          </button>
                          {chapItem.mistakeQuestions.length > 0 && (
                            <button
                              onClick={() => {
                                setMockTitle(`${chapItem.chapter} (Mistakes Retry)`);
                                startMockWithQuestions(chapItem.mistakeQuestions);
                              }}
                              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold"
                            >
                              Retry Mistakes ({chapItem.mistakeQuestions.length})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {savedAttempts
                  .filter(att => selectedSubjectFilter === 'All' || (att.subjectsList || [att.primarySubject]).includes(selectedSubjectFilter))
                  .map((att, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-indigo-400 font-semibold">
                            Set #{idx + 1} • {att.qRange}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveAttemptInVault(idx, idx - 1)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                              title="Move Mock Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === savedAttempts.length - 1}
                              onClick={() => handleMoveAttemptInVault(idx, idx + 1)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
                              title="Move Mock Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttempt(att)}
                              className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                              title="Delete Mock Test"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">{att.title}</h3>
                        <p className="text-[11px] text-slate-500">{att.dateStr}</p>

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

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedAttempt(att);
                            setFilterMode('all');
                            setActiveTab('review');
                          }}
                          className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Detailed Result & Edit Questions
                        </button>
                        <button
                          onClick={() => {
                            setMockTitle(att.title);
                            startMockWithQuestions(att.questions);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold"
                        >
                          Re-Attempt Full Mock
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

        {/* ==================================================================== */}
        {/* DETAILED RESULT SCORECARD + QUESTION REMOVER & ORDER MANAGER         */}
        {/* ==================================================================== */}
        {activeTab === 'review' && selectedAttempt && (() => {
          const totalQs = selectedAttempt.questions?.length || 1;
          const attemptedQs = (selectedAttempt.correct || 0) + (selectedAttempt.wrong || 0);
          const accuracyPct = attemptedQs > 0 ? Math.round((selectedAttempt.correct / attemptedQs) * 100) : 0;
          const scorePct = selectedAttempt.maxScore > 0
            ? Math.max(0, Math.round((selectedAttempt.totalScore / selectedAttempt.maxScore) * 100))
            : 0;
          const posMarksEarned = Number(((selectedAttempt.correct || 0) * (selectedAttempt.positiveMarks || 3)).toFixed(2));
          const negMarksLost = Number(((selectedAttempt.wrong || 0) * (selectedAttempt.negativeMarks || 1)).toFixed(2));
          const totalSpentSec = selectedAttempt.totalTimeSpentSec || 0;
          const avgTimePerQ = totalQs > 0 ? Math.round(totalSpentSec / totalQs) : 0;

          return (
            <div className="space-y-6">
              {/* 1. Executive Result & Analytics Scorecard */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                      Official Detailed Result & Performance Report
                    </span>
                    <h2 className="text-xl font-extrabold text-white mt-1.5">
                      {selectedAttempt.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Attempted on: {selectedAttempt.dateStr} • Total Questions: {totalQs}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setMockTitle(selectedAttempt.title);
                        startMockWithQuestions(selectedAttempt.questions);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      ▶ Re-Attempt This Mock (In Current Order)
                    </button>
                    <button
                      onClick={() => setActiveTab('vault')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      ← Back to Vault
                    </button>
                  </div>
                </div>

                {/* 4 Pillar Analytics Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Final Score & Percentage */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Final Net Score</span>
                      <Award className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="my-2">
                      <span className="text-3xl font-extrabold text-white">{selectedAttempt.totalScore}</span>
                      <span className="text-sm text-slate-400"> / {selectedAttempt.maxScore}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Score Percentage</span>
                        <span className="font-bold text-indigo-300">{scorePct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, scorePct)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Accuracy & Attempt Ratio */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Accuracy & Attempts</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="my-2">
                      <span className="text-3xl font-extrabold text-emerald-400">{accuracyPct}%</span>
                      <span className="text-xs text-slate-400 ml-2">({attemptedQs}/{totalQs} Attempted)</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Correct: {selectedAttempt.correct}</span>
                        <span className="text-rose-400">Wrong: {selectedAttempt.wrong}</span>
                        <span className="text-slate-400">Skipped: {selectedAttempt.unattempted}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(selectedAttempt.correct / totalQs) * 100}%` }}
                        />
                        <div
                          className="h-full bg-rose-500"
                          style={{ width: `${(selectedAttempt.wrong / totalQs) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Positive vs Negative Marks Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Marks Breakdown</span>
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="space-y-1.5 my-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-emerald-400">Positive Marks ({selectedAttempt.correct} × +{selectedAttempt.positiveMarks}):</span>
                        <span className="font-bold text-emerald-300">+{posMarksEarned}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-400">Negative Penalty ({selectedAttempt.wrong} × -{selectedAttempt.negativeMarks}):</span>
                        <span className="font-bold text-rose-300">-{negMarksLost}</span>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800 flex justify-between text-xs font-bold">
                      <span className="text-slate-300">Net Total Marks:</span>
                      <span className="text-white">{selectedAttempt.totalScore}</span>
                    </div>
                  </div>

                  {/* Card 4: Time & Speed Analysis */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Time & Speed Analysis</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="my-2">
                      <span className="text-2xl font-extrabold text-amber-300">{formatShortTime(totalSpentSec)}</span>
                      <span className="text-xs text-slate-400 ml-1.5">Total Time</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between pt-1.5 border-t border-slate-800">
                      <span>Avg Time / Question:</span>
                      <span className="text-white font-bold">{avgTimePerQ} sec</span>
                    </div>
                  </div>
                </div>

                {/* Chapter & Topic Breakdown Table inside Detailed Result */}
                {selectedAttemptTopicBreakdown.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2.5">
                      📊 Topic-Wise Performance Breakdown in This Mock
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Chapter & Topic</th>
                            <th className="py-2.5 px-3 text-center">Total Qs</th>
                            <th className="py-2.5 px-3 text-center text-emerald-400">Correct</th>
                            <th className="py-2.5 px-3 text-center text-rose-400">Wrong</th>
                            <th className="py-2.5 px-3 text-center">Skipped</th>
                            <th className="py-2.5 px-3 text-center">Accuracy</th>
                            <th className="py-2.5 px-3 text-right">Net Marks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 bg-slate-900/50">
                          {selectedAttemptTopicBreakdown.map((row, rIdx) => {
                            const rowAtt = row.correct + row.wrong;
                            const rowAcc = rowAtt > 0 ? Math.round((row.correct / rowAtt) * 100) : 0;
                            return (
                              <tr key={rIdx}>
                                <td className="py-2 px-3 font-medium text-white">
                                  <span className="text-emerald-300">{row.chapter}</span> — {row.topic}
                                </td>
                                <td className="py-2 px-3 text-center">{row.total}</td>
                                <td className="py-2 px-3 text-center text-emerald-300 font-bold">{row.correct}</td>
                                <td className="py-2 px-3 text-center text-rose-300 font-bold">{row.wrong}</td>
                                <td className="py-2 px-3 text-center text-slate-400">{row.skipped}</td>
                                <td className="py-2 px-3 text-center font-bold">{rowAcc}%</td>
                                <td className="py-2 px-3 text-right font-bold text-indigo-300">
                                  {Number(row.marks.toFixed(2))}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Filter & Question Order / Removal Controls Header */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Questions Review, Order Manager (`↑` `↓`) & Question Remover (`🗑️`)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kisi bhi question ko upar-niche (`↑` `↓`) set karein, position number badlein (`Move to #`), ya `Remove Q` daba kar mock se hata dein.
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

              {/* 3. Question-by-Question Revision Cards with Order & Remove Buttons */}
              <div className="space-y-4">
                {selectedAttempt.questions.map((q, idx) => {
                  const uAns = selectedAttempt.userAnswers?.[idx];
                  const isCorrect = uAns === q.correctIndex;
                  const isSkipped = uAns === undefined;
                  const isWrong = !isSkipped && !isCorrect;
                  const qSpent = selectedAttempt.questionTimeSpent?.[idx] || 0;

                  if (filterMode === 'wrong' && !isWrong) return null;
                  if (filterMode === 'unattempted' && !isSkipped) return null;
                  if (filterMode === 'correct' && !isCorrect) return null;

                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-extrabold">
                            Q.{idx + 1}
                          </span>
                          {q.subject && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 text-[11px]">
                              {q.subject}
                            </span>
                          )}
                          {q.chapter && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[11px]">
                              Chapter: {q.chapter}
                            </span>
                          )}
                          {q.topic && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-[11px]">
                              Topic: {q.topic}
                            </span>
                          )}
                          <button
                            onClick={() => handleEditSingleQuestionMeta(idx)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] flex items-center gap-1"
                          >
                            <Edit3 className="w-2.5 h-2.5" /> Edit Topic
                          </button>
                        </div>

                        {/* Question Reorder & Remove Toolbar */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 mr-1 font-mono">
                            ⏱ {formatShortTime(qSpent)}
                          </span>

                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveQuestionInSavedMock(idx, idx - 1)}
                            title="Is Question ko Upar (Up) karein"
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs flex items-center gap-0.5"
                          >
                            <ArrowUp className="w-3.5 h-3.5" /> Up
                          </button>

                          <button
                            disabled={idx === selectedAttempt.questions.length - 1}
                            onClick={() => handleMoveQuestionInSavedMock(idx, idx + 1)}
                            title="Is Question ko Niche (Down) karein"
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs flex items-center gap-0.5"
                          >
                            <ArrowDown className="w-3.5 h-3.5" /> Down
                          </button>

                          <button
                            onClick={() => handleJumpQuestionPosition(idx)}
                            title="Kisi bhi question number par set karein"
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold"
                          >
                            Move to #
                          </button>

                          <button
                            onClick={() => handleRemoveQuestionFromSavedMock(idx)}
                            title="Is Question ko Saved Mock se Remove karein"
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Q
                          </button>

                          {isCorrect && <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">Correct ✓</span>}
                          {isWrong && <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">Wrong ✗</span>}
                          {isSkipped && <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">Skipped</span>}
                        </div>
                      </div>

                      {q.passage && (
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                          <strong className="text-indigo-400 block mb-1">📖 Passage / Cloze Paragraph:</strong>
                          {q.passage}
                        </div>
                      )}

                      <p className="text-sm text-white leading-relaxed whitespace-pre-line">{q.question}</p>

                      <div className="grid sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const isRightOpt = oIdx === q.correctIndex;
                          const isUserOpt = oIdx === uAns;
                          let style = 'bg-slate-950 border-slate-800 text-slate-300';
                          if (isRightOpt) style = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
                          else if (isUserOpt && !isRightOpt) style = 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold';

                          return (
                            <div
                              key={oIdx}
                              onClick={() => updateCorrectOptionInReview(idx, oIdx)}
                              title="Click to set this option as the official Answer Key"
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer hover:border-indigo-400 transition ${style}`}
                            >
                              <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                              {isRightOpt && <span>✓ Correct Key</span>}
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
          );
        })()}
      </main>
    </div>
  );
}
