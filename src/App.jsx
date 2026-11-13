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
  RefreshCw, Edit3, Trash2, FileText
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

  // Optional Manual Chapter/Subject Override (If left blank, AI decides automatically)
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [customChapterInput, setCustomChapterInput] = useState('');
  const [customTopicInput, setCustomTopicInput] = useState('');

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

      cloudList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setSavedAttempts(cloudList);
      localStorage.setItem(`attempts_${uid}`, JSON.stringify(cloudList));
      setCloudSyncStatus('✓ Cloud Synced (Laptop + Mobile)');
    } catch (err) {
      setSavedAttempts(localList);
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
      setStatusMsg(`✓ PDF Loaded (${pdf.numPages} Pages)! Ab aap Custom Range ya 'Generate Full PDF Mock (All Questions)' daba sakte hain.`);
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

  // Supports both Range Mock (startQ to endQ) and Full PDF Mock (isFullPdf = true)
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

      // Determine page batches to scan
      const firstPage = isFullPdf ? 1 : startPage;
      const lastPage = isFullPdf ? (totalPages || 1) : endPage;
      const batchSize = 8; // 8 pages per AI batch so even huge PDFs & long Cloze Tests never get cut off!

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
2. "chapter": Exact chapter name (e.g., "Cloze Test", "Reading Comprehension", "Percentage", "Indian Polity", "Macroeconomics", etc.)
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

          // If user asked for a specific range and we already found enough questions, stop early
          if (!isFullPdf && allExtractedQuestions.length >= (endQ - startQ + 1)) {
            break;
          }
        }
      } else {
        // Direct pasted text mode
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
        // Post-process: Carry forward Cloze Test / RC passage if AI put it on the first question of a set, and apply optional user custom Subject/Chapter override
        let lastKnownPassage = '';
        const finalQuestions = allExtractedQuestions.map((q, idx) => {
          const qTextLower = (q.question || '').toLowerCase();
          const chapLower = (q.chapter || '').toLowerCase();
          const isClozeOrRC =
            chapLower.includes('cloze') ||
            chapLower.includes('comprehension') ||
            chapLower.includes('passage') ||
            qTextLower.includes('blank no') ||
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
      setCloudSyncStatus('⚠️ Saved on Device');
    }

    const updated = [attemptRecord, ...savedAttempts];
    setSavedAttempts(updated);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updated));

    setSelectedAttempt(attemptRecord);
    setFilterMode('all');
    setActiveTab('review');
  };

  // Rename Chapter / Subject / Topic anytime according to User Preference
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

  // Edit single question's Chapter/Topic/Passage inside Revision Sheet
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

    const updatedAttempt = { ...selectedAttempt, questions: updatedQuestions };
    setSelectedAttempt(updatedAttempt);

    const updatedList = savedAttempts.map(a => a.timestamp === selectedAttempt.timestamp ? updatedAttempt : a);
    setSavedAttempts(updatedList);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updatedList));

    if (selectedAttempt.docId) {
      try {
        await updateDoc(doc(db, 'mockAttempts', selectedAttempt.docId), { questions: updatedQuestions });
      } catch (e) {
        console.error(e);
      }
    }
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
                      <Sparkles className="w-3 h-3" /> Cloze Test Passage + Auto Chapter AI
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setMockTitle('SSC CGL Mains Demo (Cloze Test + Topic Tagged)');
                    startMockWithQuestions(SAMPLE_QUESTIONS);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  ▶ Run Cloze Test & Topic Demo (5 Qs)
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

              {/* Optional Custom Chapter / Subject Naming Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
                  <span>Custom Chapter Name (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Blank = AI Auto-Divides</span>
                </div>
                <input
                  type="text"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  placeholder="Subject (Optional, e.g. English / Quant)"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  value={customChapterInput}
                  onChange={(e) => setCustomChapterInput(e.target.value)}
                  placeholder="Chapter Name (Optional, e.g. Cloze Test Set-1)"
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

        {activeTab === 'test' && activeQuestions.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-5">
                  <div>
                    <span className="text-xs text-indigo-400 font-semibold">{mockTitle}</span>
                    <h3 className="text-lg font-bold text-white">
                      Question {currentIdx + 1} of {activeQuestions.length} (PDF Q.{activeQuestions[currentIdx].qNum || currentIdx + 1})
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeQuestions[currentIdx].subject && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
                          {activeQuestions[currentIdx].subject}
                        </span>
                      )}
                      {activeQuestions[currentIdx].chapter && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                          Chapter: {activeQuestions[currentIdx].chapter}
                        </span>
                      )}
                      {activeQuestions[currentIdx].topic && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold">
                          Topic: {activeQuestions[currentIdx].topic}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-amber-400 font-mono font-bold">
                    <Clock className="w-4 h-4" />
                    {formatTimer(timeLeft)}
                  </div>
                </div>

                {/* Dedicated Cloze Test / Reading Comprehension Passage Box */}
                {activeQuestions[currentIdx].passage && (
                  <div className="mb-5 p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 max-h-64 overflow-y-auto">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mb-2">
                      <FileText className="w-4 h-4" />
                      <span>📖 Reference Passage / Cloze Test Paragraph:</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                      {activeQuestions[currentIdx].passage}
                    </p>
                  </div>
                )}

                <p className="text-base text-slate-100 leading-relaxed mb-6 whitespace-pre-line font-medium">
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

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-white mb-3">Question Palette</h4>
                <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
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
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>AI Automatic Chapter-Wise & Topic-Wise Manager</span>
                </h2>
                <p className="text-xs text-slate-400">
                  AI khud chapters divide karta hai, aur jab aap chahein "Rename Chapter" daba kar apne hisab se naam badal sakte hain.
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
                                title="Apne hisab se Chapter ya Subject ka naam badlein"
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
                          <span className="text-xs text-indigo-400 font-semibold">{att.qRange}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{att.dateStr}</span>
                            <button
                              onClick={() => handleDeleteAttempt(att)}
                              className="text-slate-500 hover:text-rose-400"
                              title="Delete Mock Test"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">{att.title}</h3>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(att.chaptersList || [att.primaryChapter]).filter(Boolean).slice(0, 4).map((ch, ci) => (
                            <span key={ci} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-emerald-300">
                              #{ch}
                            </span>
                          ))}
                        </div>

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
                <h2 className="text-lg font-bold text-white">{selectedAttempt.title} — AI Topic Revision Sheet</h2>
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400">Question {idx + 1} (PDF Q.{q.qNum || idx + 1})</span>
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
                          <Edit3 className="w-2.5 h-2.5" /> Edit Chapter/Topic
                        </button>
                      </div>
                      {isCorrect && <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">Correct ✓</span>}
                      {isWrong && <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">Wrong ✗</span>}
                      {isSkipped && <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">Skipped</span>}
                    </div>

                    {/* Show Cloze Test / RC Passage in Revision Sheet as well */}
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
        )}
      </main>
    </div>
  );
}
