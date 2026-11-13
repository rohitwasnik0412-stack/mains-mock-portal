import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  CheckCircle2, Home, ArrowLeft, Globe, Hash, Lock, Unlock,
  Video, ShieldCheck, PlusCircle, ExternalLink
} from 'lucide-react';

// Fixed: Added space after const
const COMPUTER_COURSE_QUESTIONS = [
  {
    id: 101,
    qNum: 1,
    customLabel: "Q.1",
    subject: "Computer Knowledge",
    chapter: "Computer Hardware & Ports",
    topic: "VGA Connector Pins",
    passage: "",
    passageHi: "",
    question: "VGA (Video Graphics Array) connectors are those connectors which connect the monitor to a computer's video card and have ______ holes/pins.",
    questionHi: "VGA (वीडियो ग्राफिक्स ऐरे) कनेक्टर वे कनेक्टर होते हैं जो मॉनिटर को कंप्यूटर के वीडियो कार्ड से जोड़ते हैं और इसमें कुल ______ छेद (पिन) होते हैं।",
    options: ["10 holes", "12 holes", "15 holes", "18 holes"],
    optionsHi: ["10 छेद", "12 छेद", "15 छेद", "18 छेद"],
    correctIndex: 2,
    explanation: "A standard VGA (Video Graphics Array) connector has 15 pins/holes arranged in 3 rows of 5 pins each.",
    explanationHi: "VGA (Video Graphics Array) पोर्ट में कुल 15 छेद (pins) होते हैं। अब इसकी जगह आधुनिक कंप्यूटरों में HDMI और DVI ने ले ली है।"
  },
  {
    id: 102,
    qNum: 2,
    customLabel: "Q.2",
    subject: "Computer Knowledge",
    chapter: "Output Devices",
    topic: "Impact Printers",
    passage: "",
    passageHi: "",
    question: "The speed of ______ printer is measured in Characters Per Second (CPS).",
    questionHi: "______ प्रिंटर की गति को 'कैरेक्टर्स प्रति सेकंड' (CPS) में मापा जाता है।",
    options: ["Laser Printer", "Inkjet Printer", "Dot Matrix Printer", "Line Printer"],
    optionsHi: ["लेजर प्रिंटर", "इंकजेट प्रिंटर", "डॉट मैट्रिक्स प्रिंटर", "लाइन प्रिंटर"],
    correctIndex: 2,
    explanation: "Dot Matrix Printer is an impact printer that prints one character at a time by striking an ink ribbon, so its speed is measured in Characters Per Second (CPS).",
    explanationHi: "डॉट मैट्रिक्स प्रिंटर एक इम्पैक्ट प्रिंटर है जो एक बार में एक कैरेक्टर प्रिंट करता है (जैसे रेलवे टिकट काउंटर पर), इसलिए इसकी गति CPS (Characters Per Second) में मापी जाती है।"
  },
  {
    id: 103,
    qNum: 3,
    customLabel: "Q.3",
    subject: "Computer Knowledge",
    chapter: "Computer Memory",
    topic: "CPU Working Memory & SSD",
    passage: "",
    passageHi: "",
    question: "______ is a high-speed device used in the CPU that is utilized to store data temporarily during processing, while Solid State Drives (SSD) are based on ______ memory technology.",
    questionHi: "______ सीपीयू (CPU) के अंदर प्रयुक्त होने वाला एक हाई-स्पीड डिवाइस है जो प्रोसेसिंग के दौरान डेटा को अस्थायी रूप से स्टोर करता है, जबकि SSD ______ मेमोरी तकनीक पर आधारित होती है।",
    options: ["Cache, Magnetic Disk", "Registers, NAND Flash", "ALU, Optical Laser", "ROM, SRAM"],
    optionsHi: ["कैश, मैग्नेटिक डिस्क", "रजिस्टर (Registers), NAND फ्लैश", "ALU, ऑप्टिकल लेजर", "ROM, SRAM"],
    correctIndex: 1,
    explanation: "Registers are the fastest working storage embedded inside the CPU itself. Solid State Drives (SSDs) use non-volatile NAND Flash memory technology with no moving parts.",
    explanationHi: "रजिस्टर (Registers) सीपीयू के अंदर सबसे तेज वर्किंग मेमोरी होती है, और आधुनिक SSD (Solid State Drive) बिना किसी घूमने वाले पार्ट के NAND Flash मेमोरी तकनीक पर काम करती है।"
  },
  {
    id: 104,
    qNum: 4,
    customLabel: "Q.4",
    subject: "Computer Knowledge",
    chapter: "MS Office (Excel & PowerPoint)",
    topic: "Worksheet Limits & Shortcuts",
    passage: "",
    passageHi: "",
    question: "In MS Excel (2010 and later), what is the maximum number of rows and the letter address of the last (16,384th) column?",
    questionHi: "MS Excel (2010 और उसके बाद के वर्जन) में अधिकतम कितनी पंक्तियाँ (Rows) होती हैं और अंतिम (16,384वें) कॉलम का नाम क्या होता है?",
    options: ["65,536 rows & IV", "10,48,576 rows & XFD", "10,48,576 rows & ZZZ", "1,00,000 rows & XFA"],
    optionsHi: ["65,536 रो और IV", "10,48,576 रो और XFD", "10,48,576 रो और ZZZ", "1,00,000 रो और XFA"],
    correctIndex: 1,
    explanation: "Modern MS Excel worksheets have 1,048,576 rows and 16,384 columns, where the last column is represented as XFD.",
    explanationHi: "आधुनिक MS Excel वर्कशीट में कुल 10,48,576 रो (Rows) और 16,384 कॉलम होते हैं, तथा अंतिम कॉलम का पता 'XFD' होता है।"
  },
  {
    id: 105,
    qNum: 5,
    customLabel: "Q.5",
    subject: "Computer Knowledge",
    chapter: "Networking & Cyber Security",
    topic: "OSI Model & Malware",
    passage: "",
    passageHi: "",
    question: "Which networking device operates at Layer 2 (Data Link Layer) of the OSI model to forward data based on MAC addresses, and which non-replicating malware disguises itself as legitimate software?",
    questionHi: "कौन सा नेटवर्किंग डिवाइस OSI मॉडल के लेयर-2 (डेटा लिंक लेयर) पर MAC एड्रेस के आधार पर डेटा फॉरवर्ड करता है, और कौन सा नॉन-रेप्लिकेटिंग मैलवेयर असली सॉफ्टवेयर का भेष बदलकर सिस्टम में घुसता है?",
    options: ["Hub & Worm", "Switch & Trojan Horse", "Router & Virus", "Repeater & Spyware"],
    optionsHi: ["हब और वर्म", "स्विच (Switch) और ट्रोजन हॉर्स (Trojan)", "राउटर और वायरस", "रिपीटर और स्पाइवेयर"],
    correctIndex: 1,
    explanation: "A Switch operates at Layer 2 (Data Link Layer) using MAC addresses to filter traffic. A Trojan Horse is non-replicating malware that disguises itself as legitimate software to create a backdoor.",
    explanationHi: "Switch लेयर-2 (Data Link Layer) पर MAC एड्रेस के आधार पर काम करता है, जबकि Trojan Horse अपनी कॉपी नहीं बनाता (non-replicating) बल्कि असली सॉफ्टवेयर का भेष बदलकर बैकडोर एंट्री देता है।"
  }
];

const DEFAULT_COURSES = [
  {
    id: "course_comp_ssc_2026",
    title: "SSC CGL Tier-2 & Railway Computer Special Batch (Complete Basics to Advanced)",
    instructor: "Simplicrack • Curated by Rohit Kumar Wasnik",
    price: 99,
    originalPrice: 499,
    badge: "🔥 Bestseller Mains Batch",
    youtubeId: "6fBWo9XKApY",
    youtubeUrl: "http://www.youtube.com/watch?v=6fBWo9XKApY",
    description: "SSC CGL Mains (60 Marks) aur CHSL/Railway ke liye Complete One-Shot Computer Batch. Isme 5 Modules ke Video Lectures, Exact Topic Timestamps, AI Revision Notes aur Bilingual PYQ CBT Mock Test shamil hai.",
    lectures: [
      {
        id: "lec_1",
        title: "Class 1: Computer Basics, CPU, Memory (RAM/ROM/SSD) & Ports + PYQs",
        duration: "1 Hr 34 Mins",
        startSec: 0,
        isFreeDemo: true,
        topics: [
          { label: "Exam Pattern (20 Qs = 60 Marks)", sec: 21 },
          { label: "4 Core Syllabus Modules", sec: 90 },
          { label: "Hardware, Software, Firmware & BIOS", sec: 347 },
          { label: "Classification: Micro, Mini, Mainframe, Super", sec: 649 },
          { label: "CPU, ALU, CU, Registers & Cache", sec: 958 },
          { label: "Input & Output Devices (OCR, MICR, Printers)", sec: 1157 },
          { label: "Memory: RAM, ROM, SSD & NVMe", sec: 2883 },
          { label: "Computer Ports (USB, RJ45, VGA, HDMI)", sec: 4591 },
          { label: "Computer Basics PYQs Practice", sec: 5052 }
        ]
      },
      {
        id: "lec_2",
        title: "Class 2: System vs Application Software, OS, Linux & Windows File Explorer",
        duration: "57 Mins",
        startSec: 5679,
        isFreeDemo: false,
        topics: [
          { label: "System vs Application Software Hierarchy", sec: 5679 },
          { label: "Operating Systems & Device Drivers", sec: 5981 },
          { label: "System Utilities & Programming Languages", sec: 6281 },
          { label: "Windows Keyboard Shortcuts & File Explorer", sec: 8042 }
        ]
      },
      {
        id: "lec_3",
        title: "Class 3: MS Office Practical — MS Word, MS Excel (VLOOKUP/Pivot) & PowerPoint",
        duration: "1 Hr 31 Mins",
        startSec: 9138,
        isFreeDemo: false,
        topics: [
          { label: "MS Word Tabs, Format Painter & Shortcuts", sec: 9138 },
          { label: "MS Excel Rows/Cols (1048576 & XFD), Formulas, VLOOKUP", sec: 10968 },
          { label: "MS PowerPoint & Slide Master", sec: 12892 },
          { label: "Software & MS Office PYQs", sec: 13527 }
        ]
      },
      {
        id: "lec_4",
        title: "Class 4: Working with Internet, Web Browsers, Email (SMTP/IMAP/POP3) & E-Banking",
        duration: "33 Mins",
        startSec: 14598,
        isFreeDemo: false,
        topics: [
          { label: "Web Browsers, HTTP/HTTPS, Cookies & Phishing", sec: 14598 },
          { label: "Downloading/Uploading & Email (SMTP, IMAP, POP3)", sec: 15729 },
          { label: "E-Banking (NEFT, RTGS, IMPS) & PYQs", sec: 16379 }
        ]
      },
      {
        id: "lec_5",
        title: "Class 5: Networking Devices, 7-Layer OSI Model & Cyber Security (Virus/Trojan)",
        duration: "1 Hr 06 Mins",
        startSec: 16573,
        isFreeDemo: false,
        topics: [
          { label: "Simplex/Duplex, Optical Fiber & Network Devices", sec: 16573 },
          { label: "7-Layer OSI Model Complete Breakdown", sec: 17754 },
          { label: "Cyber Security: Virus, Worm, Trojan, Ransomware", sec: 18915 },
          { label: "Networking & Cyber Security PYQs", sec: 19878 }
        ]
      }
    ]
  }
];

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    qNum: 1,
    customLabel: "Q.1",
    subject: "English Comprehension",
    chapter: "Cloze Test",
    topic: "Vocabulary & Context in Passage",
    passage: "In the following passage, some words have been deleted. Read the passage carefully and select the most appropriate option to fill in each blank.\n\nEducation is not merely the acquisition of facts, but the (1)______ of the mind to think critically. In a rapidly changing world, students must learn to (2)______ new challenges with confidence and resilience.",
    passageHi: "निम्नलिखित गद्यांश में कुछ शब्द हटा दिए गए हैं। गद्यांश को ध्यानपूर्वक पढ़ें और प्रत्येक रिक्त स्थान को भरने के लिए सबसे उपयुक्त विकल्प चुनें।\n\nशिक्षा केवल तथ्यों का संग्रह नहीं है, बल्कि गंभीर रूप से सोचने के लिए मस्तिष्क का (1)______ है। तेजी से बदलती दुनिया में, छात्रों को आत्मविश्वास और लचीलेपन के साथ नई चुनौतियों का (2)______ करना सीखना चाहिए।",
    question: "Select the most appropriate option to fill in blank No. (1).",
    questionHi: "रिक्त स्थान संख्या (1) को भरने के लिए सबसे उपयुक्त विकल्प का चयन करें।",
    options: ["training", "ignoring", "destruction", "limitation"],
    optionsHi: ["प्रशिक्षण (training)", "अनदेखी (ignoring)", "विनाश (destruction)", "सीमा (limitation)"],
    correctIndex: 0,
    explanation: "Blank (1) requires a positive noun showing development of the mind. 'Training' fits the context: 'training of the mind to think critically'.",
    explanationHi: "रिक्त स्थान (1) में मस्तिष्क के विकास को दर्शाने वाले शब्द की आवश्यकता है। 'Training (प्रशिक्षण)' यहाँ बिल्कुल सही बैठता है।"
  },
  ...COMPUTER_COURSE_QUESTIONS.slice(0, 4)
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

  // Navigation & True Back Stack States
  const [activeTab, setActiveTab] = useState('home');
  const [vaultViewMode, setVaultViewMode] = useState('chapters');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [navStack, setNavStack] = useState([]);
  const isPoppingRef = useRef(false);

  // Course & Option 1 Subscription States
  const [coursesList, setCoursesList] = useState(() => {
    try {
      const saved = localStorage.getItem('portal_courses_list');
      return saved ? JSON.parse(saved) : DEFAULT_COURSES;
    } catch {
      return DEFAULT_COURSES;
    }
  });
  const [activeCourseIdx, setActiveCourseIdx] = useState(0);
  const [activeLectureIdx, setActiveLectureIdx] = useState(0);
  const [videoStartSec, setVideoStartSec] = useState(0);
  const [unlockedCoursesMap, setUnlockedCoursesMap] = useState(() => {
    try {
      const saved = localStorage.getItem('unlocked_courses_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [unlockCodeInput, setUnlockCodeInput] = useState('');
  const [paymentSettings, setPaymentSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_payment_settings');
      return saved
        ? JSON.parse(saved)
        : {
            upiId: 'rohitwasnik@ybl',
            whatsappNumber: '917440000000',
            masterUnlockCode: 'ROHITPRO'
          };
    } catch {
      return {
        upiId: 'rohitwasnik@ybl',
        whatsappNumber: '917440000000',
        masterUnlockCode: 'ROHITPRO'
      };
    }
  });

  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState(99);
  const [newCourseYoutubeUrl, setNewCourseYoutubeUrl] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  const [testLang, setTestLang] = useState('hi');
  const [allowOptionElimination, setAllowOptionElimination] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState({});
  const [pendingQuestionsForLaunch, setPendingQuestionsForLaunch] = useState([]);

  const [mockTitle, setMockTitle] = useState('Mains Practice Set - 1');
  const [rawText, setRawText] = useState('');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfBuffer, setPdfBuffer] = useState(null);

  const [startQ, setStartQ] = useState(1);
  const [endQ, setEndQ] = useState(25);
  const [durationMins, setDurationMins] = useState(15);
  const [positiveMarks, setPositiveMarks] = useState(3);
  const [negativeMarks, setNegativeMarks] = useState(1);

  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [customChapterInput, setCustomChapterInput] = useState('');
  const [customTopicInput, setCustomTopicInput] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

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
  const [noteInput, setNoteInput] = useState({});

  const [aiLoadingMap, setAiLoadingMap] = useState({});
  const [customDoubtInput, setCustomDoubtInput] = useState({});
  const [topicRevisionModalData, setTopicRevisionModalData] = useState(null);
  const [topicRevisionLoading, setTopicRevisionLoading] = useState(false);
  const [savedTopicCapsules, setSavedTopicCapsules] = useState(() => {
    try {
      const raw = localStorage.getItem('saved_topic_capsules');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const navigateScreen = (nextTab, options = {}) => {
    const nextVaultMode = options.vaultViewMode !== undefined ? options.vaultViewMode : vaultViewMode;
    const nextSelectedAtt = options.selectedAttempt !== undefined ? options.selectedAttempt : selectedAttempt;
    const nextSubFilter = options.selectedSubjectFilter !== undefined ? options.selectedSubjectFilter : selectedSubjectFilter;

    if (
      nextTab === activeTab &&
      nextVaultMode === vaultViewMode &&
      nextSelectedAtt?.timestamp === selectedAttempt?.timestamp &&
      nextSubFilter === selectedSubjectFilter
    ) {
      return;
    }

    const currentSnapshot = {
      activeTab,
      vaultViewMode,
      selectedAttempt,
      selectedSubjectFilter,
      filterMode
    };

    setNavStack((prev) => [...prev, currentSnapshot]);

    if (!isPoppingRef.current) {
      window.history.pushState({ step: navStack.length + 1 }, '');
    }

    setActiveTab(nextTab);
    if (options.vaultViewMode !== undefined) setVaultViewMode(options.vaultViewMode);
    if (options.selectedAttempt !== undefined) setSelectedAttempt(options.selectedAttempt);
    if (options.selectedSubjectFilter !== undefined) setSelectedSubjectFilter(options.selectedSubjectFilter);
    if (options.filterMode !== undefined) setFilterMode(options.filterMode);
  };

  const handleGoBack = () => {
    if (activeTab === 'test' && testRunning) {
      if (!window.confirm('Test abhi chal raha hai! Kya aap test se bahar pichle page par jana chahte hain?')) {
        return;
      }
      setTestRunning(false);
    }

    if (navStack.length > 0) {
      const prev = navStack[navStack.length - 1];
      setNavStack((stack) => stack.slice(0, -1));
      setActiveTab(prev.activeTab || 'home');
      setVaultViewMode(prev.vaultViewMode || 'chapters');
      setSelectedAttempt(prev.selectedAttempt || null);
      setSelectedSubjectFilter(prev.selectedSubjectFilter || 'All');
      setFilterMode(prev.filterMode || 'all');
    } else if (activeTab !== 'home') {
      setActiveTab('home');
    }
  };

  const handleGoBackRef = useRef(handleGoBack);
  handleGoBackRef.current = handleGoBack;

  useEffect(() => {
    window.history.replaceState({ step: 0 }, '');
    const onPopState = () => {
      isPoppingRef.current = true;
      handleGoBackRef.current();
      setTimeout(() => {
        isPoppingRef.current = false;
      }, 50);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (activeTab !== 'test' || !testRunning || isPaused) return;
    const handleKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const optIdx = parseInt(e.key, 10) - 1;
        setUserAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
      } else if (e.key === 'ArrowRight') {
        if (currentIdx < activeQuestions.length - 1) {
          navigateToQuestion(currentIdx + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIdx > 0) {
          navigateToQuestion(currentIdx - 1);
        }
      } else if (e.key.toLowerCase() === 'm') {
        setMarkedForReview((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
      } else if (e.key.toLowerCase() === 'c') {
        setUserAnswers((prev) => {
          const copy = { ...prev };
          delete copy[currentIdx];
          return copy;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, testRunning, isPaused, currentIdx, activeQuestions.length]);

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
      const orderA = a.customOrder !== undefined ? Number(a.customOrder) : (9999999999999 - (a.timestamp || 0));
      const orderB = b.customOrder !== undefined ? Number(b.customOrder) : (9999999999999 - (b.timestamp || 0));
      return orderA - orderB;
    });
  };

  const syncAndLoadUserAttempts = async (currentUser) => {
    const uid = currentUser.uid;
    setCloudSyncStatus('Syncing across devices...');

    try {
      const keyDoc = await getDoc(doc(db, 'userSettings', uid));
      if (keyDoc.exists()) {
        if (keyDoc.data().geminiKey) {
          const cloudKey = keyDoc.data().geminiKey;
          setGeminiKey(cloudKey);
          localStorage.setItem('gemini_api_key', cloudKey);
        }
        if (keyDoc.data().topicCapsules) {
          setSavedTopicCapsules((prev) => {
            const merged = { ...prev, ...keyDoc.data().topicCapsules };
            localStorage.setItem('saved_topic_capsules', JSON.stringify(merged));
            return merged;
          });
        }
        if (keyDoc.data().unlockedCourses) {
          setUnlockedCoursesMap((prev) => {
            const merged = { ...prev, ...keyDoc.data().unlockedCourses };
            localStorage.setItem('unlocked_courses_map', JSON.stringify(merged));
            return merged;
          });
        }
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

  const handleUnlockCourseWithCode = async (courseId, directBypass = false) => {
    const cleanInput = unlockCodeInput.trim().toUpperCase();
    const masterCode = (paymentSettings.masterUnlockCode || 'ROHITPRO').toUpperCase();

    if (directBypass || cleanInput === masterCode || cleanInput === 'MAINS2026' || cleanInput === 'COMP2026') {
      const updated = { ...unlockedCoursesMap, [courseId]: true };
      setUnlockedCoursesMap(updated);
      localStorage.setItem('unlocked_courses_map', JSON.stringify(updated));
      if (user) {
        try {
          await setDoc(doc(db, 'userSettings', user.uid), { unlockedCourses: updated }, { merge: true });
        } catch (e) {
          // Ignore
        }
      }
      setShowPaymentModal(false);
      setUnlockCodeInput('');
      alert('🎉 Congratulations! Course Unlocked Successfully! Ab aap saare Locked Lectures aur CBT Tests dekh sakte hain.');
    } else {
      alert('Invalid Unlock Code! Demo test karne ke liye "ROHITPRO" dalein ya niche "1-Click Demo Unlock" button dabayein.');
    }
  };

  const handleLockCourseAgainForDemo = async (courseId) => {
    const updated = { ...unlockedCoursesMap, [courseId]: false };
    setUnlockedCoursesMap(updated);
    localStorage.setItem('unlocked_courses_map', JSON.stringify(updated));
  };

  const extractYouTubeId = (urlStr) => {
    if (!urlStr) return '6fBWo9XKApY';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlStr.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '6fBWo9XKApY';
  };

  const handleAddNewCourseFromAdmin = (e) => {
    e.preventDefault();
    if (!newCourseTitle.trim() || !newCourseYoutubeUrl.trim()) {
      alert('Kripya Course Title aur YouTube Video Link dalein.');
      return;
    }
    const ytId = extractYouTubeId(newCourseYoutubeUrl.trim());
    const newCourseObj = {
      id: `course_${Date.now()}`,
      title: newCourseTitle.trim(),
      instructor: user?.displayName || 'Rohit Kumar Wasnik',
      price: Number(newCoursePrice) || 99,
      originalPrice: (Number(newCoursePrice) || 99) * 3,
      badge: '🆕 New Batch',
      youtubeId: ytId,
      youtubeUrl: newCourseYoutubeUrl.trim(),
      description: newCourseDesc.trim() || 'Complete Video Lecture + Bilingual CBT Practice Mock.',
      lectures: [
        {
          id: `lec_${Date.now()}_1`,
          title: 'Class 1: Demo Intro & Part-1 (Free Demo)',
          duration: '45 Mins',
          startSec: 0,
          isFreeDemo: true,
          topics: [{ label: 'Start Lecture from Beginning', sec: 0 }]
        },
        {
          id: `lec_${Date.now()}_2`,
          title: 'Class 2: Complete Advanced Concepts & PYQs (Pro)',
          duration: '1 Hr 15 Mins',
          startSec: 1800,
          isFreeDemo: false,
          topics: [{ label: 'Jump to Advanced Part', sec: 1800 }]
        }
      ]
    };

    const updated = [newCourseObj, ...coursesList];
    setCoursesList(updated);
    localStorage.setItem('portal_courses_list', JSON.stringify(updated));
    setNewCourseTitle('');
    setNewCourseYoutubeUrl('');
    setNewCourseDesc('');
    setActiveCourseIdx(0);
    setActiveLectureIdx(0);
    navigateScreen('courses');
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
    setStatusMsg('PDF load ho raha hai (Bilingual Hindi/English + Cloze Passage Scanner Ready)...');
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
      setStatusMsg(`✓ PDF Loaded (${pdf.numPages} Pages)! Ab aap Hindi/English Language chun kar Mock generate kar sakte hain.`);
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
      setStatusMsg(`Scanning PDF Page ${p} of ${safeEnd} (Extracting Hindi & English Questions)...`);
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

  const callGeminiWithAnyKey = async (cleanKey, modelName, parts, jsonMode = true) => {
    const bodyObj = {
      contents: [{ parts }]
    };
    if (jsonMode) {
      bodyObj.generationConfig = { responseMimeType: "application/json" };
    }
    const payload = JSON.stringify(bodyObj);

    const keyList = cleanKey.split(',').map(k => k.trim()).filter(Boolean);
    let lastErr = '';

    for (const singleKey of keyList) {
      const attempts = [
        {
          url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': singleKey
          }
        },
        {
          url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${singleKey}`
          }
        },
        {
          url: `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(singleKey)}`,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ];

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

      const buildPrompt = (batchRangeStr) => `You are an expert SSC CGL Mains & Competitive Exam Bilingual AI Professor. Look carefully at the attached PDF page images and/or text (${batchRangeStr}).
Ignore coaching watermarks/headers like "Telegram YouTube Instagram App SSC PANACEA".

${isFullPdf
  ? 'Extract ALL multiple-choice questions present on these pages from start to finish.'
  : `Extract the multiple-choice questions from Question number ${startQ} to Question number ${endQ} (or all questions visible if numbering differs).`}

BILINGUAL (HINDI + ENGLISH) RULE:
- For Non-English subjects (Quant, Reasoning, GK, Computer, Economics), provide BOTH English ("question", "options", "explanation") AND Devanagari Hindi ("questionHi", "optionsHi", "explanationHi").
- For English Comprehension / Grammar questions, keep the main English question/options in both, and provide Hindi meaning/explanation in "explanationHi".

CRITICAL RULE FOR CLOZE TEST, READING COMPREHENSION (RC), OR DATA INTERPRETATION (DI):
- Whenever any question is part of a Cloze Test (numbered blanks like (1), (2)...) or Passage, include the COMPLETE Passage inside "passage" for EVERY question of that set.

Return ONLY a valid JSON array of objects with these exact keys:
- "qNum": number
- "subject": string
- "chapter": string
- "topic": string
- "passage": string
- "passageHi": string
- "question": string
- "questionHi": string
- "options": array of 4 strings
- "optionsHi": array of 4 strings
- "correctIndex": number (0 to 3)
- "explanation": string
- "explanationHi": string`;

      if (pdfBuffer && totalPages > 0) {
        for (let pStart = firstPage; pStart <= lastPage; pStart += batchSize) {
          const pEnd = Math.min(lastPage, pStart + batchSize - 1);
          const imageParts = await renderPdfPagesToImages(pdfBuffer, pStart, pEnd);
          setStatusMsg(`AI extracting Bilingual (Hindi/English) questions from Page ${pStart} to ${pEnd}...`);

          const parts = [
            ...imageParts,
            { text: buildPrompt(`Pages ${pStart} to ${pEnd}`) }
          ];

          let batchParsed = null;
          for (const modelName of modelsToTry) {
            const result = await callGeminiWithAnyKey(cleanKey, modelName, parts, true);
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
        setStatusMsg('AI extracting Bilingual questions & passages from text...');
        const parts = [{ text: buildPrompt('Pasted Text') + `\n\nText:\n${rawText.slice(0, 35000)}` }];
        for (const modelName of modelsToTry) {
          const result = await callGeminiWithAnyKey(cleanKey, modelName, parts, true);
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
        let lastKnownPassageHi = '';

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
          let finalPassageHi = (q.passageHi || '').trim();

          if (finalPassage.length > 20) {
            lastKnownPassage = finalPassage;
            lastKnownPassageHi = finalPassageHi || finalPassage;
          } else if (isClozeOrRC && lastKnownPassage) {
            finalPassage = lastKnownPassage;
            finalPassageHi = lastKnownPassageHi;
          }

          return {
            ...q,
            qNum: q.qNum || idx + 1,
            customLabel: q.customLabel || `Q.${idx + 1}`,
            starred: !!q.starred,
            passage: finalPassage,
            passageHi: finalPassageHi || finalPassage,
            question: q.question || q.questionHi || '',
            questionHi: q.questionHi || q.question || '',
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
            optionsHi: Array.isArray(q.optionsHi) && q.optionsHi.length === 4 ? q.optionsHi : (q.options || ["Option A", "Option B", "Option C", "Option D"]),
            explanation: q.explanation || q.explanationHi || '',
            explanationHi: q.explanationHi || q.explanation || '',
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
    setPendingQuestionsForLaunch(qList);
    navigateScreen('pretest');
  };

  const confirmAndLaunchCbtExam = () => {
    const qList = pendingQuestionsForLaunch.length > 0 ? pendingQuestionsForLaunch : SAMPLE_QUESTIONS;
    setActiveQuestions(qList);
    setCurrentIdx(0);
    setUserAnswers({});
    setMarkedForReview({});
    setEliminatedOptions({});
    setVisitedQuestions({ 0: true });
    setQuestionTimeSpent({});
    setIsPaused(false);
    setZoomScale(100);
    setTimeLeft(durationMins * 60);
    setTestRunning(true);
    navigateScreen('test');
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

  const toggleStarInActiveTest = (idx) => {
    setActiveQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, starred: !q.starred } : q))
    );
  };

  const toggleOptionStrikeOut = (qIdx, oIdx, e) => {
    e.stopPropagation();
    setEliminatedOptions((prev) => {
      const qMap = prev[qIdx] || {};
      return {
        ...prev,
        [qIdx]: {
          ...qMap,
          [oIdx]: !qMap[oIdx]
        }
      };
    });
  };

  const getLocalizedQuestionText = (q, lang = testLang) => {
    const en = q.question || '';
    const hi = q.questionHi || en;
    if (lang === 'en') return en;
    if (lang === 'hi') return hi;
    return en === hi ? en : `${en}\n\n${hi}`;
  };

  const getLocalizedPassageText = (q, lang = testLang) => {
    const en = q.passage || '';
    const hi = q.passageHi || en;
    if (!en && !hi) return '';
    if (lang === 'en') return en;
    if (lang === 'hi') return hi;
    return en === hi ? en : `${en}\n\n${hi}`;
  };

  const getLocalizedOptionText = (q, oIdx, lang = testLang) => {
    const en = q.options?.[oIdx] || '';
    const hi = q.optionsHi?.[oIdx] || en;
    if (lang === 'en') return en;
    if (lang === 'hi') return hi;
    return en === hi ? en : `${en} / ${hi}`;
  };

  const getLocalizedExplanationText = (q, lang = testLang) => {
    const en = q.explanation || '';
    const hi = q.explanationHi || en;
    if (lang === 'en') return en;
    if (lang === 'hi') return hi;
    return en === hi ? en : `${en}\n\nहिन्दी व्याख्या: ${hi}`;
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
      customOrder: 1,
      customOrderLabel: `Order #1`,
      qRange: `Total ${activeQuestions.length} Qs`,
      primarySubject,
      primaryChapter,
      subjectsList: [...subjectsSet],
      chaptersList: [...chaptersSet],
      topicsList: [...topicsSet],
      dateStr: new Date().toLocaleString('en-IN'),
      timestamp: Date.now(),
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
      notes: {},
      aiAnalysis: {}
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

    const updated = [
      attemptRecord,
      ...savedAttempts.map((a, i) => ({
        ...a,
        customOrder: i + 2,
        customOrderLabel: a.customOrderLabel || `Order #${i + 2}`
      }))
    ];
    setSavedAttempts(updated);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(updated));

    navigateScreen('review', { selectedAttempt: attemptRecord, filterMode: 'all' });
  };

  const recalculateAndSaveAttempt = async (baseAttempt, newQuestions, newAnswers, newNotes, newTimeSpent, newAiAnalysis = null) => {
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
      aiAnalysis: newAiAnalysis !== null ? newAiAnalysis : (baseAttempt.aiAnalysis || {}),
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
          aiAnalysis: updatedAttempt.aiAnalysis,
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

  const toggleStarInReview = async (qIdx) => {
    if (!selectedAttempt) return;
    const updatedQuestions = selectedAttempt.questions.map((q, i) =>
      i === qIdx ? { ...q, starred: !q.starred } : q
    );
    await recalculateAndSaveAttempt(
      selectedAttempt,
      updatedQuestions,
      selectedAttempt.userAnswers || {},
      selectedAttempt.notes || {},
      selectedAttempt.questionTimeSpent || {}
    );
  };

  const handleAskAiWhyWrong = async (qIdx, customDoubtText = '') => {
    if (!selectedAttempt) return;
    const cleanKey = geminiKey.trim();
    if (!cleanKey) {
      setShowKeyModal(true);
      alert("Ask AI use karne ke liye kripya upar 'API Key' button me apni Gemini API key check karein.");
      return;
    }

    const q = selectedAttempt.questions[qIdx];
    const uAns = selectedAttempt.userAnswers?.[qIdx];
    const userChosenStr = uAns !== undefined
      ? `Option ${String.fromCharCode(65 + uAns)}: "${q.options?.[uAns]}"`
      : 'Skipped (Unattempted)';
    const correctOptStr = `Option ${String.fromCharCode(65 + (q.correctIndex || 0))}: "${q.options?.[q.correctIndex || 0]}"`;

    setAiLoadingMap((prev) => ({ ...prev, [qIdx]: true }));

    try {
      const prompt = `You are a personal SSC CGL Mains Topper Coach guiding Rohit.
Analyze this exam question and explain clearly in Hinglish / Devanagari Hindi why the student made a mistake (or how to master it) so they never repeat this error.

Subject: ${q.subject || 'General'} | Chapter: ${q.chapter || 'General'} | Topic: ${q.topic || 'Core Concept'}
${q.passage ? `Passage: ${q.passage}\n` : ''}
Question: ${q.question}
Hindi Question: ${q.questionHi || ''}
Options:
A) ${q.options?.[0]}
B) ${q.options?.[1]}
C) ${q.options?.[2]}
D) ${q.options?.[3]}

Student's Response: ${userChosenStr}
Official Correct Answer: ${correctOptStr}
${customDoubtText ? `\nStudent's Specific Doubt: "${customDoubtText}" (Answer this doubt directly as well!)` : ''}

Give a structured, high-impact response in Hinglish/Hindi with these exact 4 sections:
1. 🎯 **Question Kyun Galat Hua (Examiner Trap Analysis)**
2. ⚡ **10-Second Exam Short Trick / Elimination Method**
3. 🧠 **Core Concept & Golden Rule**
4. ✅ **Memory Hook (Taaki Dubara Galti Na Ho)**`;

      const modelsToTry = ['gemini-3.0-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'];
      let replyText = '';
      let lastErr = '';

      for (const modelName of modelsToTry) {
        const res = await callGeminiWithAnyKey(cleanKey, modelName, [{ text: prompt }], false);
        if (res.text) {
          replyText = res.text.trim();
          break;
        } else {
          lastErr = res.error;
        }
      }

      if (replyText) {
        const updatedAiMap = {
          ...(selectedAttempt.aiAnalysis || {}),
          [qIdx]: replyText
        };
        await recalculateAndSaveAttempt(
          selectedAttempt,
          selectedAttempt.questions,
          selectedAttempt.userAnswers || {},
          selectedAttempt.notes || {},
          selectedAttempt.questionTimeSpent || {},
          updatedAiMap
        );
      } else {
        alert("AI Coach Error: " + lastErr);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setAiLoadingMap((prev) => ({ ...prev, [qIdx]: false }));
    }
  };

  const handleReviseChapterTopicWithAI = async (subject, chapter, topic = 'Complete Chapter', sampleQ = null, forceRegenerate = false) => {
    const capsuleKey = `${subject}__${chapter}__${topic}`;
    if (!forceRegenerate && savedTopicCapsules[capsuleKey]) {
      setTopicRevisionModalData({
        key: capsuleKey,
        subject,
        chapter,
        topic,
        content: savedTopicCapsules[capsuleKey]
      });
      return;
    }

    const cleanKey = geminiKey.trim();
    if (!cleanKey) {
      setShowKeyModal(true);
      alert("Topic Revision Notes generate karne ke liye kripya 'API Key' check karein.");
      return;
    }

    setTopicRevisionModalData({
      key: capsuleKey,
      subject,
      chapter,
      topic,
      content: ''
    });
    setTopicRevisionLoading(true);

    try {
      const prompt = `You are an expert SSC CGL Mains (AAO / GST Inspector) & DSSSB ASO Professor.
Create a complete, high-scoring **"Master Topic Revision Capsule"** in Hinglish + Devanagari Hindi so the student never makes any mistake from this chapter/topic again!

Subject: ${subject}
Chapter: ${chapter}
Topic Focus: ${topic}
${sampleQ ? `Reference Question from this Topic: ${sampleQ.question}` : ''}

Include these exact 5 sections clearly formatted:
1. 📌 **Complete Concept & Theory Summary (Easy Hinglish/Hindi me)**
2. 📐 **All Important Formulas / Grammar Rules / Articles / Facts Sheet**
3. ⚠️ **Top 5 Examiner Traps (Jahan Students Galti Karte Hain)**
4. ⚡ **Mains Exam Shortcut Tricks**
5. 📝 **3 High-Level Solved Practice Examples**`;

      const modelsToTry = ['gemini-3.0-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'];
      let capsuleText = '';
      let lastErr = '';

      for (const modelName of modelsToTry) {
        const res = await callGeminiWithAnyKey(cleanKey, modelName, [{ text: prompt }], false);
        if (res.text) {
          capsuleText = res.text.trim();
          break;
        } else {
          lastErr = res.error;
        }
      }

      if (capsuleText) {
        const updatedCapsules = {
          ...savedTopicCapsules,
          [capsuleKey]: capsuleText
        };
        setSavedTopicCapsules(updatedCapsules);
        localStorage.setItem('saved_topic_capsules', JSON.stringify(updatedCapsules));
        setTopicRevisionModalData({
          key: capsuleKey,
          subject,
          chapter,
          topic,
          content: capsuleText
        });

        if (user) {
          try {
            await setDoc(doc(db, 'userSettings', user.uid), { topicCapsules: updatedCapsules }, { merge: true });
          } catch (e) {
            // Ignore
          }
        }
      } else {
        setTopicRevisionModalData(null);
        alert("Revision Notes generate nahi ho paye: " + lastErr);
      }
    } catch (err) {
      setTopicRevisionModalData(null);
      alert("Error: " + err.message);
    } finally {
      setTopicRevisionLoading(false);
    }
  };

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
    const newAiAnalysis = {};

    selectedAttempt.questions.forEach((q, i) => {
      if (i === qIdx) return;
      const newIndex = newQuestions.length;
      newQuestions.push({
        ...q,
        qNum: newIndex + 1,
        customLabel: q.customLabel || `Q.${newIndex + 1}`
      });
      if (selectedAttempt.userAnswers?.[i] !== undefined) {
        newAnswers[newIndex] = selectedAttempt.userAnswers[i];
      }
      if (selectedAttempt.notes?.[i] !== undefined) {
        newNotes[newIndex] = selectedAttempt.notes[i];
      }
      if (selectedAttempt.questionTimeSpent?.[i] !== undefined) {
        newTimeSpent[newIndex] = selectedAttempt.questionTimeSpent[i];
      }
      if (selectedAttempt.aiAnalysis?.[i] !== undefined) {
        newAiAnalysis[newIndex] = selectedAttempt.aiAnalysis[i];
      }
    });

    await recalculateAndSaveAttempt(selectedAttempt, newQuestions, newAnswers, newNotes, newTimeSpent, newAiAnalysis);
  };

  const handleMoveQuestionInSavedMock = async (fromIdx, toIdx, customOrderTitle = null) => {
    if (!selectedAttempt) return;
    const total = selectedAttempt.questions.length;
    if (toIdx < 0 || toIdx >= total) return;

    const itemBundle = selectedAttempt.questions.map((q, i) => ({
      q: i === fromIdx && customOrderTitle ? { ...q, customLabel: customOrderTitle } : q,
      ans: selectedAttempt.userAnswers?.[i],
      note: selectedAttempt.notes?.[i],
      time: selectedAttempt.questionTimeSpent?.[i],
      ai: selectedAttempt.aiAnalysis?.[i]
    }));

    if (fromIdx !== toIdx) {
      const [movedItem] = itemBundle.splice(fromIdx, 1);
      itemBundle.splice(toIdx, 0, movedItem);
    }

    const newQuestions = [];
    const newAnswers = {};
    const newNotes = {};
    const newTimeSpent = {};
    const newAiAnalysis = {};

    itemBundle.forEach((bundle, newIdx) => {
      newQuestions.push({
        ...bundle.q,
        qNum: newIdx + 1
      });
      if (bundle.ans !== undefined) newAnswers[newIdx] = bundle.ans;
      if (bundle.note !== undefined) newNotes[newIdx] = bundle.note;
      if (bundle.time !== undefined) newTimeSpent[newIdx] = bundle.time;
      if (bundle.ai !== undefined) newAiAnalysis[newIdx] = bundle.ai;
    });

    await recalculateAndSaveAttempt(selectedAttempt, newQuestions, newAnswers, newNotes, newTimeSpent, newAiAnalysis);
  };

  const handleCustomOrderAndRenameQuestion = async (fromIdx) => {
    if (!selectedAttempt) return;
    const total = selectedAttempt.questions.length;
    const currQ = selectedAttempt.questions[fromIdx];

    const posInput = window.prompt(
      `Step 1: Is Question ko kis Order Number (1 se ${total}) par rakhna hai?`,
      String(fromIdx + 1)
    );
    if (posInput === null) return;
    const targetNum = parseInt(posInput, 10);
    const validTargetIdx = (!isNaN(targetNum) && targetNum >= 1 && targetNum <= total) ? targetNum - 1 : fromIdx;

    const labelInput = window.prompt(
      `Step 2: Is Question ka Custom Order Label / Naam kya rakhna hai?`,
      currQ.customLabel || `Q.${validTargetIdx + 1}`
    );
    const finalLabel = labelInput !== null && labelInput.trim() ? labelInput.trim() : `Q.${validTargetIdx + 1}`;

    await handleMoveQuestionInSavedMock(fromIdx, validTargetIdx, finalLabel);
  };

  const handleMoveAttemptInVault = async (fromIdx, toIdx, updatedTitle = null, updatedOrderLabel = null) => {
    const total = savedAttempts.length;
    if (toIdx < 0 || toIdx >= total) return;
    const copy = [...savedAttempts];

    if (updatedTitle !== null) copy[fromIdx] = { ...copy[fromIdx], title: updatedTitle };
    if (updatedOrderLabel !== null) copy[fromIdx] = { ...copy[fromIdx], customOrderLabel: updatedOrderLabel };

    if (fromIdx !== toIdx) {
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
    }

    const reindexed = copy.map((att, idx) => ({
      ...att,
      customOrder: idx + 1,
      customOrderLabel: att.customOrderLabel || `Order #${idx + 1}`
    }));

    setSavedAttempts(reindexed);
    if (user) localStorage.setItem(`attempts_${user.uid}`, JSON.stringify(reindexed));

    for (const att of reindexed) {
      if (att.docId) {
        try {
          await updateDoc(doc(db, 'mockAttempts', att.docId), {
            title: att.title,
            customOrder: att.customOrder,
            customOrderLabel: att.customOrderLabel
          });
        } catch (e) {
          // Ignore
        }
      }
    }
  };

  const handleCustomRenameAndOrderMockSet = async (idx) => {
    const att = savedAttempts[idx];
    const total = savedAttempts.length;

    const orderNumStr = window.prompt(
      `Step 1: Is Mock Test ko kis Order Number (1 se ${total}) par set karna hai?`,
      String(idx + 1)
    );
    if (orderNumStr === null) return;
    const parsedNum = parseInt(orderNumStr, 10);
    const targetIdx = (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= total) ? parsedNum - 1 : idx;

    const orderTagStr = window.prompt(
      `Step 2: Is Order ka Custom Tag / Label kya rakhna hai?`,
      att.customOrderLabel || `Order #${targetIdx + 1}`
    );
    const finalOrderTag = orderTagStr !== null && orderTagStr.trim() ? orderTagStr.trim() : `Order #${targetIdx + 1}`;

    const newMockTitle = window.prompt(
      `Step 3: Mock Test ka Naam (Chahein to badlein ya wahi rehne dein):`,
      att.title
    );
    const finalTitle = newMockTitle !== null && newMockTitle.trim() ? newMockTitle.trim() : att.title;

    await handleMoveAttemptInVault(idx, targetIdx, finalTitle, finalOrderTag);
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

  const allStarredQuestions = useMemo(() => {
    const list = [];
    savedAttempts.forEach((att) => {
      (att.questions || []).forEach((q, idx) => {
        if (q.starred) {
          list.push({
            ...q,
            sourceMockTitle: att.title,
            userNote: att.notes?.[idx] || '',
            aiExplanationNote: att.aiAnalysis?.[idx] || ''
          });
        }
      });
    });
    return list;
  }, [savedAttempts]);

  const allSubjectsList = useMemo(() => {
    const s = new Set(['All']);
    chapterWiseStats.forEach(item => s.add(item.subject));
    return [...s];
  }, [chapterWiseStats]);

  const selectedAttemptTopicBreakdown = useMemo(() => {
    if (!selectedAttempt) return [];
    const map = {};
    const pos = selectedAttempt.positiveMarks || 3;
    const neg = selectedAttempt.negativeMarks || 1;

    (selectedAttempt.questions || []).forEach((q, idx) => {
      const sub = q.subject || selectedAttempt.primarySubject || 'General';
      const chap = q.chapter || 'General';
      const top = q.topic || 'Core Concept';
      const key = `${chap} — ${top}`;
      if (!map[key]) {
        map[key] = {
          subject: sub,
          chapter: chap,
          topic: top,
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          marks: 0,
          timeSec: 0,
          sampleQ: q
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

  const storageStats = useMemo(() => {
    const jsonStr = JSON.stringify(savedAttempts) + JSON.stringify(savedTopicCapsules);
    const bytes = new Blob([jsonStr]).size;
    const kb = (bytes / 1024).toFixed(1);
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return { kb, mb };
  }, [savedAttempts, savedTopicCapsules]);

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

  const formatHhMmSs = (sec = 0) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
              <h1 className="text-xl font-bold text-white">Mains Mock & AI Course Portal</h1>
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
  // PRE-TEST LAUNCH & INSTRUCTIONS SCREEN
  // ============================================================================
  if (activeTab === 'pretest') {
    const qCount = pendingQuestionsForLaunch.length || SAMPLE_QUESTIONS.length;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                Pre-Exam Instructions & Mode Setup
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1.5">{mockTitle}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Questions: <b>{qCount} Qs</b> • Marking: <b className="text-emerald-400">+{positiveMarks}</b> / <b className="text-rose-400">-{negativeMarks}</b>
              </p>
            </div>
            <button
              onClick={handleGoBack}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
              1. Exam Interface Mode Chunein (Test Start Hone Se Pehle):
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <div
                onClick={() => setAllowOptionElimination(false)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  !allowOptionElimination
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-extrabold text-white">🏛️ Real Exam Mode (Default)</span>
                  {!allowOptionElimination && <span className="text-xs px-2 py-0.5 rounded bg-indigo-600 text-white font-bold">Selected ✓</span>}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bilkul asli SSC/TCS CBT exam jaisa interface (Bina Option Cut/Strike-out button ke).
                </p>
              </div>

              <div
                onClick={() => setAllowOptionElimination(true)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  allowOptionElimination
                    ? 'bg-emerald-600/20 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-extrabold text-white">✂️ Option Elimination Mode</span>
                  {allowOptionElimination && <span className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">Selected ✓</span>}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Practice ke waqt galat options ko 50-50 Strike-Out (`A̶.̶ ̶O̶p̶t̶i̶o̶n̶`) karne ke button ke sath.
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <label className="block text-xs font-bold text-indigo-300 mb-2">
                2. Default Test Language:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'hi', label: 'हिन्दी' },
                  { id: 'en', label: 'English' },
                  { id: 'bi', label: 'Both' }
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setTestLang(l.id)}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      testLang === l.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <label className="block text-xs font-bold text-indigo-300 mb-2">
                3. Test Duration (Minutes):
              </label>
              <input
                type="number"
                min={1}
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold text-white"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-amber-400">⌨️ Laptop Keyboard Shortcuts (Active During Test):</div>
            <p>
              Press <b>1, 2, 3, 4</b> to select Option A, B, C, D • Press <b>→ (Right Arrow)</b> for Save & Next • Press <b>← (Left Arrow)</b> for Previous • Press <b>M</b> to Mark for Review • Press <b>C</b> to Clear Response.
            </p>
          </div>

          <button
            onClick={confirmAndLaunchCbtExam}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/60 transition"
          >
            ▶ I am Ready to Begin — Start CBT Mock Test Now
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // REAL-EXAM CBT INTERFACE WHEN TEST IS RUNNING
  // ============================================================================
  if (activeTab === 'test' && activeQuestions.length > 0) {
    const tParts = getTimerParts(timeLeft);
    const currQ = activeQuestions[currentIdx];
    const currSpentSec = questionTimeSpent[currentIdx] || 0;
    const localizedPassage = getLocalizedPassageText(currQ, testLang);
    const localizedQuestion = getLocalizedQuestionText(currQ, testLang);

    return (
      <div className="min-h-screen bg-[#f4f5f9] text-slate-900 flex flex-col select-none">
        <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoBack}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
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

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#2e2a85]" /> Language:
            </span>
            <select
              value={testLang}
              onChange={(e) => setTestLang(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#2e2a85]/40 bg-indigo-50/70 text-[#2e2a85] text-xs font-extrabold cursor-pointer"
            >
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="en">English</option>
              <option value="bi">Both (हिन्दी + EN)</option>
            </select>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
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

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 text-slate-700 text-xs font-mono font-bold">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatShortTime(currSpentSec)}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    +{positiveMarks} / -{negativeMarks}
                  </span>

                  <select
                    value={testLang}
                    onChange={(e) => setTestLang(e.target.value)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-extrabold cursor-pointer"
                  >
                    <option value="hi">हि ⌄</option>
                    <option value="en">EN ⌄</option>
                    <option value="bi">हि+EN</option>
                  </select>

                  <button
                    onClick={() => toggleStarInActiveTest(currentIdx)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                      currQ.starred
                        ? 'bg-amber-400 text-slate-950 border-amber-500'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {currQ.starred ? '★ Starred' : '☆ Star'}
                  </button>
                </div>
              </div>

              {localizedPassage && (
                <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-indigo-200 max-h-60 overflow-y-auto">
                  <div className="text-xs font-extrabold text-[#2e2a85] mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Reference Passage / Cloze Test Paragraph:</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-line text-sm">
                    {localizedPassage}
                  </p>
                </div>
              )}

              <div className="text-slate-900 font-medium leading-relaxed mb-6 whitespace-pre-line">
                {localizedQuestion}
              </div>

              <div className="space-y-2.5">
                {currQ.options.map((_, oIdx) => {
                  const selected = userAnswers[currentIdx] === oIdx;
                  const isStruck = !!eliminatedOptions[currentIdx]?.[oIdx];
                  const optText = getLocalizedOptionText(currQ, oIdx, testLang);
                  return (
                    <div
                      key={oIdx}
                      onClick={() => {
                        if (!isStruck) {
                          setUserAnswers({ ...userAnswers, [currentIdx]: oIdx });
                        }
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        selected
                          ? 'bg-indigo-50/80 border-[#2e2a85] text-slate-950 font-semibold shadow-sm'
                          : isStruck
                          ? 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1">
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
                        <span className="flex-1">{optText}</span>
                      </div>

                      {allowOptionElimination && (
                        <button
                          type="button"
                          onClick={(e) => toggleOptionStrikeOut(currentIdx, oIdx, e)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition shrink-0 ${
                            isStruck
                              ? 'bg-slate-700 text-white border-slate-800'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {isStruck ? 'Undo' : '✂️ Cut'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

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

          {sidebarOpen && (
            <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between shrink-0">
              <div>
                <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-orange-500">
                  <span>Symbols & Palette</span>
                  <span className="text-[11px] text-slate-500">Keys: 1-4, ←/→, M</span>
                </div>

                <div className="p-4">
                  <h3 className="text-center font-extrabold text-sm text-slate-900 mb-4">
                    Part - A : {mockTitle}
                  </h3>

                  <div className="grid grid-cols-5 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {activeQuestions.map((qItem, i) => {
                      const hasAns = userAnswers[i] !== undefined;
                      const isMark = !!markedForReview[i];
                      const isCurr = currentIdx === i;

                      let pillStyle = 'bg-[#2e2a85] text-white';
                      if (hasAns && isMark) {
                        pillStyle = 'bg-yellow-400 text-slate-950';
                      } else if (isMark) {
                        pillStyle = 'bg-red-600 text-white';
                      } else if (hasAns) {
                        pillStyle = 'bg-[#0a7c2f] text-white';
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => navigateToQuestion(i)}
                          className={`h-8 rounded-full text-xs font-bold transition flex items-center justify-center relative ${pillStyle} ${
                            isCurr ? 'ring-2 ring-offset-2 ring-[#2e2a85]' : ''
                          }`}
                        >
                          {String(i + 1).padStart(2, '0')}
                          {qItem.starred && (
                            <span className="absolute -top-1 -right-1 text-[10px] text-amber-300">★</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

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

  const totalSavedQs = savedAttempts.reduce((acc, a) => acc + (a.questions?.length || 0), 0);
  const totalCorrectAll = savedAttempts.reduce((acc, a) => acc + (a.correct || 0), 0);
  const totalAttemptedAll = savedAttempts.reduce((acc, a) => acc + (a.correct || 0) + (a.wrong || 0), 0);
  const overallAccuracy = totalAttemptedAll > 0 ? Math.round((totalCorrectAll / totalAttemptedAll) * 100) : 0;

  const currentCourse = coursesList[activeCourseIdx] || coursesList[0];
  const isCurrentCourseUnlocked = !!unlockedCoursesMap[currentCourse?.id];
  const currentLecture = currentCourse?.lectures?.[activeLectureIdx] || currentCourse?.lectures?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {(navStack.length > 0 || activeTab !== 'home') && (
              <button
                onClick={handleGoBack}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            <div
              onClick={() => navigateScreen('home')}
              className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 cursor-pointer"
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1
                onClick={() => navigateScreen('home')}
                className="font-bold text-white text-base cursor-pointer hover:text-indigo-300 transition"
              >
                Mains AI Mock & Course Portal
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-emerald-400">Student: {user.displayName || user.email}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                  {cloudSyncStatus}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300">
                  📊 Storage: {storageStats.kb} KB / 1 GB
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigateScreen('home')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'home' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Home
            </button>

            <button
              onClick={() => navigateScreen('courses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'courses'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> 🎓 Courses (Demo)
            </button>

            <button
              onClick={() => navigateScreen('create')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'create' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              + Create Mock
            </button>

            <button
              onClick={() => navigateScreen('vault')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'vault' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Vault ({savedAttempts.length})
            </button>

            <button
              onClick={() => navigateScreen('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                activeTab === 'admin' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
              }`}
            >
              👑 Admin
            </button>

            <div className="flex items-center bg-slate-800 rounded-xl px-2 py-1 border border-slate-700">
              <Globe className="w-3.5 h-3.5 text-indigo-400 mr-1" />
              <select
                value={testLang}
                onChange={(e) => setTestLang(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="hi" className="bg-slate-900">हिन्दी (HI)</option>
                <option value="en" className="bg-slate-900">English (EN)</option>
                <option value="bi" className="bg-slate-900">Both (हि+EN)</option>
              </select>
            </div>

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

      {/* OPTION 1: UPI QR + WHATSAPP + SECRET UNLOCK CODE MODAL */}
      {showPaymentModal && currentCourse && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                  Option 1: Direct UPI Course Enrollment
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">{currentCourse.title}</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <div className="text-xs text-slate-400">Course Fee (One-Time Full Access):</div>
              <div className="text-2xl font-extrabold text-emerald-400">
                ₹{currentCourse.price}{' '}
                <span className="text-xs text-slate-500 line-through font-normal">₹{currentCourse.originalPrice}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-indigo-500/30 text-xs">
                <span className="text-slate-400 block text-[11px]">Pay via GPay / PhonePe / Paytm to UPI ID:</span>
                <span className="font-mono font-bold text-amber-300 text-sm select-all">{paymentSettings.upiId}</span>
              </div>
              <a
                href={`https://wa.me/${paymentSettings.whatsappNumber}?text=${encodeURIComponent(
                  `Hello Rohit Sir! Maine "${currentCourse.title}" (₹${currentCourse.price}) ka UPI payment kar diya hai. Mera Account Email/Username: ${user.email} hai. Kripya mera Unlock Code bhej dein!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow"
              >
                💬 Send Payment Screenshot on WhatsApp to Get Code
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2.5">
              <label className="block text-xs font-bold text-amber-300">
                🔑 Enter Course Unlock Code (Demo Code: <span className="underline">ROHITPRO</span>):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={unlockCodeInput}
                  onChange={(e) => setUnlockCodeInput(e.target.value)}
                  placeholder="Type ROHITPRO here..."
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono uppercase"
                />
                <button
                  onClick={() => handleUnlockCourseWithCode(currentCourse.id, false)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Unlock Now
                </button>
              </div>

              <button
                onClick={() => handleUnlockCourseWithCode(currentCourse.id, true)}
                className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-extrabold transition"
              >
                ⚡ 1-Click Demo Instant Unlock (Test Unlocked View)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Topic Master Revision Modal */}
      {topicRevisionModalData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold">
                  📖 AI Topic Master Revision Capsule
                </span>
                <h3 className="text-base font-extrabold text-white mt-1">
                  {topicRevisionModalData.subject} → {topicRevisionModalData.chapter} ({topicRevisionModalData.topic})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {!topicRevisionLoading && (
                  <button
                    onClick={() =>
                      handleReviseChapterTopicWithAI(
                        topicRevisionModalData.subject,
                        topicRevisionModalData.chapter,
                        topicRevisionModalData.topic,
                        null,
                        true
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold"
                  >
                    ↻ Regenerate Notes
                  </button>
                )}
                <button
                  onClick={() => setTopicRevisionModalData(null)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {topicRevisionLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm font-bold text-white">
                    AI Professor "{topicRevisionModalData.chapter} ({topicRevisionModalData.topic})" ke Complete Revision Notes, Formulas aur Exam Traps taiyar kar raha hai...
                  </p>
                </div>
              ) : (
                <div className="text-xs md:text-sm text-slate-200 whitespace-pre-line leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {topicRevisionModalData.content}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5">
            <h3 className="font-bold text-white mb-2">Google AI Studio Key (Supports Multi-Key Backup)</h3>
            <p className="text-xs text-slate-400 mb-3">
              Apni key yahan paste karein. Agar 2-3 backup keys lagani hon, toh comma (`,`) laga kar paste kar dein:
            </p>
            <input
              type="text"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Paste AQ.Ab8... or AIzaSy... key(s) here"
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
        {/* ==================================================================== */}
        {/* 🎓 PAID COURSES / BATCHES DEMO TAB                                   */}
        {/* ==================================================================== */}
        {activeTab === 'courses' && currentCourse && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-3xl space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    {currentCourse.badge}
                  </span>
                  <span className="text-xs text-slate-400">{currentCourse.instructor}</span>
                  {isCurrentCourseUnlocked ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> PRO UNLOCKED ✓
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Class 1 Free Demo • Full Batch ₹{currentCourse.price}
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-white">{currentCourse.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed">{currentCourse.description}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  onClick={() => {
                    setMockTitle('SSC CGL Tier-2 Computer Course CBT Mock (5 PYQs)');
                    setDurationMins(10);
                    startMockWithQuestions(COMPUTER_COURSE_QUESTIONS);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg"
                >
                  📝 Attempt Course CBT Mock (5 PYQs)
                </button>

                {!isCurrentCourseUnlocked ? (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-4 h-4" /> Buy Full Course (₹{currentCourse.price})
                  </button>
                ) : (
                  <button
                    onClick={() => handleLockCourseAgainForDemo(currentCourse.id)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                  >
                    🔒 Reset to Locked Demo View
                  </button>
                )}
              </div>
            </div>

            {coursesList.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {coursesList.map((cItem, cIdx) => (
                  <button
                    key={cItem.id}
                    onClick={() => {
                      setActiveCourseIdx(cIdx);
                      setActiveLectureIdx(0);
                      setVideoStartSec(0);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeCourseIdx === cIdx ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-300'
                    }`}
                  >
                    {cItem.title} (₹{cItem.price})
                  </button>
                ))}
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="aspect-video w-full bg-black relative">
                    <iframe
                      key={`${currentCourse.youtubeId}_${videoStartSec}`}
                      src={`https://www.youtube.com/embed/${currentCourse.youtubeId}?start=${videoStartSec}&autoplay=1&rel=0`}
                      title={currentLecture?.title || currentCourse.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-400">
                          Now Playing: {currentLecture?.isFreeDemo ? '🆓 Free Demo Lecture' : '👑 Pro Unlocked Lecture'}
                        </span>
                        <h3 className="text-base font-extrabold text-white mt-0.5">
                          {currentLecture?.title}
                        </h3>
                      </div>
                      <a
                        href={currentCourse.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> YouTube Link
                      </a>
                    </div>

                    {currentLecture?.topics && currentLecture.topics.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-amber-400 mb-2">
                          ⏱ Click Any Topic Below to Jump Directly in Video:
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {currentLecture.topics.map((topObj, tIdx) => (
                            <button
                              key={tIdx}
                              onClick={() => setVideoStartSec(topObj.sec)}
                              className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition ${
                                videoStartSec === topObj.sec
                                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <span className="truncate pr-2">▶ {topObj.label}</span>
                              <span className="px-2 py-0.5 rounded bg-slate-900 text-indigo-300 font-mono text-[11px] shrink-0">
                                [{formatHhMmSs(topObj.sec)}]
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          handleReviseChapterTopicWithAI(
                            'Computer Knowledge',
                            currentLecture?.title || 'Computer Full Course',
                            'Complete Lecture Formula & Revision Sheet'
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> 📖 Generate AI Notes for This Class
                      </button>

                      <button
                        onClick={() => {
                          setMockTitle(`Computer CBT Mock: ${currentLecture?.title}`);
                          setDurationMins(10);
                          startMockWithQuestions(COMPUTER_COURSE_QUESTIONS);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                      >
                        📝 Take Class PYQ Mock Test (5 Qs)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-extrabold text-white">
                      📚 Course Curriculum ({currentCourse.lectures.length} Classes)
                    </h3>
                    <span className="text-[11px] text-emerald-400 font-bold">5h 42m Total</span>
                  </div>

                  <div className="space-y-2.5">
                    {currentCourse.lectures.map((lec, lIdx) => {
                      const canWatch = lec.isFreeDemo || isCurrentCourseUnlocked;
                      const isPlaying = activeLectureIdx === lIdx;

                      return (
                        <div
                          key={lec.id}
                          onClick={() => {
                            if (canWatch) {
                              setActiveLectureIdx(lIdx);
                              setVideoStartSec(lec.startSec || 0);
                            } else {
                              setShowPaymentModal(true);
                            }
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition space-y-1.5 ${
                            isPlaying
                              ? 'bg-indigo-600/20 border-indigo-500'
                              : canWatch
                              ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-rose-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                lec.isFreeDemo
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : canWatch
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {lec.isFreeDemo ? '🆓 FREE DEMO' : canWatch ? '🔓 UNLOCKED' : '🔒 PRO LOCKED'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ⏱ {lec.duration}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-white leading-snug">
                            {lec.title}
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                            <span>Starts at [{formatHhMmSs(lec.startSec)}]</span>
                            <span className="text-indigo-400 font-semibold">
                              {canWatch ? (isPlaying ? '▶ Playing' : '▶ Watch Now') : '🔑 Click to Unlock'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!isCurrentCourseUnlocked && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-rose-500/10 border border-amber-500/30 space-y-2.5">
                    <div className="text-xs font-extrabold text-amber-300">
                      🔓 Unlock All 5 Classes + AI Notes + PYQ CBT Mocks
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Demo test karne ke liye niche button dabayein aur Code <b>ROHITPRO</b> use karein:
                    </p>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow"
                    >
                      Unlock Full Course @ ₹{currentCourse.price}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 👑 ADMIN PANEL TAB                                                   */}
        {/* ==================================================================== */}
        {activeTab === 'admin' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>1. Option 1 Payment & Unlock Code Settings</span>
              </div>
              <p className="text-xs text-slate-400">
                Yahan aap apni asli UPI ID, WhatsApp Number aur Master Unlock Code set kar sakte hain.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Your UPI ID (For Receiving Course Fees)</label>
                  <input
                    type="text"
                    value={paymentSettings.upiId}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Your WhatsApp Number (With 91 Country Code)</label>
                  <input
                    type="text"
                    value={paymentSettings.whatsappNumber}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Master Course Unlock Code (Secret Coupon)</label>
                  <input
                    type="text"
                    value={paymentSettings.masterUnlockCode}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, masterUnlockCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono font-bold"
                  />
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem('admin_payment_settings', JSON.stringify(paymentSettings));
                    alert('✓ Admin Payment & Unlock Settings Saved!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs"
                >
                  Save Payment & Unlock Code Settings
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-base">
                <PlusCircle className="w-5 h-5" />
                <span>2. Publish a New YouTube Course / Batch</span>
              </div>
              <p className="text-xs text-slate-400">
                Apna koi bhi Unlisted ya Public YouTube video link yahan dalein—website uska Course Card, Free Demo aur Paid Lock apne aap bana degi!
              </p>

              <form onSubmit={handleAddNewCourseFromAdmin} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Course / Batch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SSC CGL Mains AAO Economics & Governance Batch"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">YouTube Video URL *</label>
                    <input
                      type="text"
                      required
                      placeholder="https://youtu.be/..."
                      value={newCourseYoutubeUrl}
                      onChange={(e) => setNewCourseYoutubeUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Course Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={newCoursePrice}
                      onChange={(e) => setNewCoursePrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Course Description</label>
                  <textarea
                    rows={2}
                    placeholder="Complete syllabus coverage with AI notes and CBT practice tests..."
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs"
                >
                  + Publish Course to Student Portal
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 🏠 HOME TAB DASHBOARD                                                */}
        {/* ==================================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  SSC CGL Mains & EdTech Command Center
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-2">
                  Welcome back, {user.displayName || 'Rohit'}!
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Aapka Computer Demo Course live ho chuka hai! Niche "🎓 Open Computer Demo Course" par click karke Video Player aur Unlock System check karein.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => navigateScreen('courses')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5"
                >
                  <Video className="w-4 h-4" /> 🎓 Open Computer Demo Course
                </button>
                <button
                  onClick={() => navigateScreen('create')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
                >
                  + Upload PDF & Create Mock
                </button>
                {allStarredQuestions.length > 0 && (
                  <button
                    onClick={() => {
                      setMockTitle(`★ Starred Tough Questions Mock (${allStarredQuestions.length} Qs)`);
                      startMockWithQuestions(allStarredQuestions);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg"
                  >
                    ★ Practice Starred Qs ({allStarredQuestions.length})
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs text-slate-400">Total Saved Mocks</div>
                <div className="text-2xl font-extrabold text-white mt-1">{savedAttempts.length}</div>
                <div className="text-[11px] text-indigo-400 mt-1">Used: {storageStats.kb} KB / 1 GB</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs text-slate-400">Questions in Vault</div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">{totalSavedQs}</div>
                <div className="text-[11px] text-slate-400 mt-1">Across {chapterWiseStats.length} Chapters</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-xs text-slate-400">Overall Accuracy</div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">{overallAccuracy}%</div>
                <div className="text-[11px] text-slate-400 mt-1">{totalCorrectAll} Correct Answers</div>
              </div>
              <div
                onClick={() => navigateScreen('courses')}
                className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 cursor-pointer hover:border-emerald-400 transition"
              >
                <div className="text-xs text-emerald-300 font-semibold">🎓 Active Video Batch</div>
                <div className="text-base font-extrabold text-white mt-1 truncate">Computer Tier-2 Batch</div>
                <div className="text-[11px] text-emerald-400 mt-1">Click to Watch & Test →</div>
              </div>
            </div>

            {savedAttempts.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>📈 Recent Mock Score % Trend</span>
                  </h3>
                  <span className="text-xs text-slate-400">Last {Math.min(8, savedAttempts.length)} Mocks</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 pt-1">
                  {savedAttempts.slice(0, 8).map((att, i) => {
                    const pct = att.maxScore > 0 ? Math.max(0, Math.round((att.totalScore / att.maxScore) * 100)) : 0;
                    return (
                      <div
                        key={i}
                        onClick={() => navigateScreen('review', { selectedAttempt: att, filterMode: 'all' })}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 cursor-pointer flex flex-col justify-between"
                      >
                        <div className="text-[10px] text-slate-400 truncate">{att.title}</div>
                        <div className="my-2 h-16 bg-slate-900 rounded-lg flex items-end p-1 overflow-hidden">
                          <div
                            className={`w-full rounded ${
                              pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ height: `${Math.max(12, pct)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-white">{att.totalScore}/{att.maxScore}</span>
                          <span className="text-indigo-400">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* + CREATE MOCK TAB                                                    */}
        {/* ==================================================================== */}
        {activeTab === 'create' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>1. Upload Mains PDF</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Hindi + English Bilingual AI
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setMockTitle('Computer & Cloze Test CBT Demo (Hindi + English)');
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
                <span className="text-xs text-emerald-400 mt-1">✓ Automatically prepares both Hindi (हिन्दी) & English versions + Cloze Passages</span>
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
              <h2 className="text-lg font-bold text-white">2. Custom Mock & Pre-Test Settings</h2>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mock Test Name</label>
                <input
                  type="text"
                  value={mockTitle}
                  onChange={(e) => setMockTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1.5">
                <label className="block text-xs font-bold text-amber-300">
                  ✂️ Option 2: 50-50 Option Elimination (Before Test):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAllowOptionElimination(false)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      !allowOptionElimination ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    OFF (Real Exam)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllowOptionElimination(true)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      allowOptionElimination ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    ON (With Strike-Out)
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                <label className="block text-xs font-bold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Test Language (Medium Chunein):</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'hi', label: 'हिन्दी (Hindi)' },
                    { id: 'en', label: 'English' },
                    { id: 'bi', label: 'Both (हि+EN)' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setTestLang(l.id)}
                      className={`py-2 rounded-lg text-xs font-bold transition ${
                        testLang === l.id
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
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

        {/* ==================================================================== */}
        {/* AI CHAPTER, TOPIC & STARRED VAULT TAB                                */}
        {/* ==================================================================== */}
        {activeTab === 'vault' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>AI Automatic Chapter-Wise, Topic Revision & Order Vault</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Cloud Storage Used: <b>{storageStats.kb} KB</b> ({storageStats.mb} MB out of 1,024 MB Free Tier)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigateScreen('vault', { vaultViewMode: 'chapters' })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    vaultViewMode === 'chapters' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  📚 Chapter & Topic View
                </button>
                <button
                  onClick={() => navigateScreen('vault', { vaultViewMode: 'tests' })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    vaultViewMode === 'tests' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  📝 All Mock Tests ({savedAttempts.length})
                </button>
                <button
                  onClick={() => navigateScreen('vault', { vaultViewMode: 'starred' })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    vaultViewMode === 'starred' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-300'
                  }`}
                >
                  ★ Starred Qs ({allStarredQuestions.length})
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

            {savedAttempts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
                Abhi tak koi mock test save nahi hua hai. "🎓 Courses (Demo)" ya "+ Create Mock" me jakar apna pehla test dein!
              </div>
            ) : vaultViewMode === 'starred' ? (
              <div className="space-y-4">
                {allStarredQuestions.map((sq, sIdx) => (
                  <div key={sIdx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 text-xs font-extrabold">
                        ★ Starred #{sIdx + 1} • {sq.subject} ({sq.chapter})
                      </span>
                      <button
                        onClick={() => handleReviseChapterTopicWithAI(sq.subject || 'General', sq.chapter || 'General', sq.topic || 'Concept', sq)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                      >
                        📖 Revise Topic with AI
                      </button>
                    </div>
                    <p className="text-sm text-white whitespace-pre-line">{getLocalizedQuestionText(sq, testLang)}</p>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300">
                      <b>Correct Answer:</b> {String.fromCharCode(65 + (sq.correctIndex || 0))}. {getLocalizedOptionText(sq, sq.correctIndex || 0, testLang)}
                    </div>
                  </div>
                ))}
              </div>
            ) : vaultViewMode === 'chapters' ? (
              <div className="grid md:grid-cols-2 gap-4">
                {chapterWiseStats.map((chapItem, cIdx) => {
                  const accuracy = chapItem.totalQs > 0 ? Math.round((chapItem.correct / chapItem.totalQs) * 100) : 0;
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
                              <Edit3 className="w-3 h-3" /> Rename
                            </button>
                            <span className="text-xs font-bold text-emerald-300">Accuracy: {accuracy}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <h3 className="text-base font-bold text-white">Chapter: {chapItem.chapter}</h3>
                          <button
                            onClick={() => handleReviseChapterTopicWithAI(chapItem.subject, chapItem.chapter, 'Complete Chapter Concept & Formulas')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-bold transition"
                          >
                            📖 Revise Chapter
                          </button>
                        </div>

                        <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {topicsArr.map((tObj, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                              <span className="text-slate-200 truncate pr-2">• {tObj.topic}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleReviseChapterTopicWithAI(chapItem.subject, chapItem.chapter, tObj.topic, tObj.questions?.[0])}
                                  className="px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 text-[10px] font-semibold"
                                >
                                  📖 Revise
                                </button>
                                <button
                                  onClick={() => {
                                    setMockTitle(`${chapItem.chapter} - ${tObj.topic}`);
                                    startMockWithQuestions(tObj.questions);
                                  }}
                                  className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-[10px] font-semibold"
                                >
                                  Practice
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setMockTitle(`${chapItem.subject}: ${chapItem.chapter}`);
                            startMockWithQuestions(chapItem.allQuestions);
                          }}
                          className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                        >
                          Practice Chapter ({chapItem.totalQs} Qs)
                        </button>
                        {chapItem.mistakeQuestions.length > 0 && (
                          <button
                            onClick={() => {
                              setMockTitle(`${chapItem.chapter} (Mistakes Retry)`);
                              startMockWithQuestions(chapItem.mistakeQuestions);
                            }}
                            className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-semibold"
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
                {savedAttempts.map((att, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-extrabold">
                          {att.customOrderLabel || `Order #${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCustomRenameAndOrderMockSet(idx)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold"
                          >
                            🔢 Set Order / Rename
                          </button>
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveAttemptInVault(idx, idx - 1)}
                            className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === savedAttempts.length - 1}
                            onClick={() => handleMoveAttemptInVault(idx, idx + 1)}
                            className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttempt(att)}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white mt-2">{att.title}</h3>
                      <p className="text-xs text-emerald-400 mt-1">
                        Score: {att.totalScore}/{att.maxScore} • Correct: {att.correct} • Wrong: {att.wrong}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigateScreen('review', { selectedAttempt: att, filterMode: 'all' })}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Detailed Result & Ask AI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* DETAILED RESULT SCORECARD + ASK AI WHY WRONG + REVISE CHAPTER/TOPIC  */}
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGoBack}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1 print:hidden"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                        Official Detailed Result & AI Coach Report
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-white mt-2">{selectedAttempt.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Attempted on: {selectedAttempt.dateStr} • Total Questions: {totalQs}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 print:hidden">
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold"
                    >
                      🖨️ Print Result / Notes
                    </button>
                    <button
                      onClick={() => {
                        setMockTitle(selectedAttempt.title);
                        startMockWithQuestions(selectedAttempt.questions);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      ▶ Re-Attempt Mock
                    </button>
                  </div>
                </div>

                {/* 4 Pillar Analytics Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Final Net Score</span>
                      <Award className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="my-2">
                      <span className="text-3xl font-extrabold text-white">{selectedAttempt.totalScore}</span>
                      <span className="text-sm text-slate-400"> / {selectedAttempt.maxScore}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Score Percentage</span>
                      <span className="font-bold text-indigo-300">{scorePct}%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Accuracy & Attempts</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="my-2">
                      <span className="text-3xl font-extrabold text-emerald-400">{accuracyPct}%</span>
                      <span className="text-xs text-slate-400 ml-2">({attemptedQs}/{totalQs})</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-emerald-400">✓ {selectedAttempt.correct}</span>
                      <span className="text-rose-400">✗ {selectedAttempt.wrong}</span>
                      <span className="text-slate-400">Skip: {selectedAttempt.unattempted}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Marks Breakdown</span>
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="space-y-1 my-2 text-xs">
                      <div className="flex justify-between text-emerald-300">
                        <span>Positive:</span>
                        <b>+{posMarksEarned}</b>
                      </div>
                      <div className="flex justify-between text-rose-300">
                        <span>Negative:</span>
                        <b>-{negMarksLost}</b>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-white border-t border-slate-800 pt-1">
                      <span>Net Score:</span>
                      <span>{selectedAttempt.totalScore}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Time & Speed</span>
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="my-2">
                      <span className="text-2xl font-extrabold text-amber-300">{formatShortTime(totalSpentSec)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-1">
                      <span>Avg Time / Q:</span>
                      <span className="text-white font-bold">{avgTimePerQ} sec</span>
                    </div>
                  </div>
                </div>

                {selectedAttemptTopicBreakdown.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                      📊 Topic-Wise Performance & Instant AI Topic Revision
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-3">Chapter & Topic</th>
                            <th className="py-2 px-3 text-center">Qs</th>
                            <th className="py-2 px-3 text-center text-emerald-400">Right</th>
                            <th className="py-2 px-3 text-center text-rose-400">Wrong</th>
                            <th className="py-2 px-3 text-right">Master This Topic</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 bg-slate-900/50">
                          {selectedAttemptTopicBreakdown.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td className="py-2 px-3 font-medium text-white">
                                <span className="text-emerald-300">{row.chapter}</span> — {row.topic}
                              </td>
                              <td className="py-2 px-3 text-center">{row.total}</td>
                              <td className="py-2 px-3 text-center text-emerald-300 font-bold">{row.correct}</td>
                              <td className="py-2 px-3 text-center text-rose-300 font-bold">{row.wrong}</td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => handleReviseChapterTopicWithAI(row.subject, row.chapter, row.topic, row.sampleQ)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
                                >
                                  📖 Revise Topic
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="text-xs font-bold text-white">
                  Filter Questions & Manage Order (`↑` `↓` / `Set Order` / `Remove Q`):
                </div>
                <div className="flex flex-wrap gap-2">
                  {['all', 'wrong', 'unattempted', 'correct', 'starred'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterMode(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                        filterMode === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {f === 'starred' ? '★ Starred' : f}
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
                  const qSpent = selectedAttempt.questionTimeSpent?.[idx] || 0;
                  const savedAiCoachNote = selectedAttempt.aiAnalysis?.[idx] || '';
                  const isAiLoading = !!aiLoadingMap[idx];

                  if (filterMode === 'wrong' && !isWrong) return null;
                  if (filterMode === 'unattempted' && !isSkipped) return null;
                  if (filterMode === 'correct' && !isCorrect) return null;
                  if (filterMode === 'starred' && !q.starred) return null;

                  const revPassage = getLocalizedPassageText(q, testLang);
                  const revQuestion = getLocalizedQuestionText(q, testLang);
                  const revExplanation = getLocalizedExplanationText(q, testLang);

                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-extrabold">
                            Order #{idx + 1} ({q.customLabel || `Q.${idx + 1}`})
                          </span>
                          <button
                            onClick={() => toggleStarInReview(idx)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              q.starred ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {q.starred ? '★ Starred' : '☆ Star'}
                          </button>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[11px]">
                            {q.chapter} • {q.topic}
                          </span>
                          <button
                            onClick={() => handleEditSingleQuestionMeta(idx)}
                            className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px]"
                          >
                            ✏️ Edit Topic
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 print:hidden">
                          <span className="text-[11px] text-slate-400 font-mono mr-1">
                            ⏱ {formatShortTime(qSpent)}
                          </span>
                          <button
                            onClick={() => handleCustomOrderAndRenameQuestion(idx)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold"
                          >
                            🔢 Set Order
                          </button>
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveQuestionInSavedMock(idx, idx - 1)}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs disabled:opacity-30"
                          >
                            ↑ Up
                          </button>
                          <button
                            disabled={idx === selectedAttempt.questions.length - 1}
                            onClick={() => handleMoveQuestionInSavedMock(idx, idx + 1)}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs disabled:opacity-30"
                          >
                            ↓ Down
                          </button>
                          <button
                            onClick={() => handleRemoveQuestionFromSavedMock(idx)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-xs font-semibold"
                          >
                            🗑️ Remove Q
                          </button>
                          {isCorrect && <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">Correct ✓</span>}
                          {isWrong && <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">Wrong ✗</span>}
                          {isSkipped && <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">Skipped</span>}
                        </div>
                      </div>

                      {revPassage && (
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-slate-300 whitespace-pre-line">
                          {revPassage}
                        </div>
                      )}

                      <p className="text-sm text-white whitespace-pre-line">{revQuestion}</p>

                      <div className="grid sm:grid-cols-2 gap-2">
                        {q.options.map((_, oIdx) => {
                          const isRightOpt = oIdx === q.correctIndex;
                          const isUserOpt = oIdx === uAns;
                          const optText = getLocalizedOptionText(q, oIdx, testLang);
                          let style = 'bg-slate-950 border-slate-800 text-slate-300';
                          if (isRightOpt) style = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
                          else if (isUserOpt && !isRightOpt) style = 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold';

                          return (
                            <div
                              key={oIdx}
                              onClick={() => updateCorrectOptionInReview(idx, oIdx)}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer ${style}`}
                            >
                              <span>{String.fromCharCode(65 + oIdx)}. {optText}</span>
                              {isRightOpt && <span>✓ Correct Key</span>}
                              {isUserOpt && !isRightOpt && <span>✗ Your Answer</span>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-line">
                        <strong className="text-indigo-400">Solution: </strong> {revExplanation}
                      </div>

                      <div className="p-3.5 rounded-xl bg-indigo-950/25 border border-indigo-500/30 space-y-3 print:hidden">
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={isAiLoading}
                            onClick={() => handleAskAiWhyWrong(idx, customDoubtInput[idx] || '')}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isAiLoading ? 'AI Analyzing...' : '🤖 Ask AI: Kyun Galat Hua & Short Trick'}
                          </button>

                          <button
                            onClick={() =>
                              handleReviseChapterTopicWithAI(
                                q.subject || 'Computer Knowledge',
                                q.chapter || 'General',
                                q.topic || 'Core Concept',
                                q
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            📖 Revise "{q.topic || q.chapter}" with AI
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customDoubtInput[idx] || ''}
                            onChange={(e) => setCustomDoubtInput({ ...customDoubtInput, [idx]: e.target.value })}
                            placeholder="Is question me apna koi khas doubt puchna ho to yahan likhein aur 'Ask AI' dabayein..."
                            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                          />
                        </div>

                        {savedAiCoachNote && (
                          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs text-slate-200 whitespace-pre-line">
                            {savedAiCoachNote}
                          </div>
                        )}
                      </div>

                      <div className="pt-1">
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
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold print:hidden"
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
