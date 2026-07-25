// Dynamically load Sir Ganguly Analytics & GTM Core
(function() {
    if (typeof window !== 'undefined') {
        const analyticsScript = document.createElement('script');
        analyticsScript.src = '/sirganguly-analytics.js?v=20260530-unified-v1';
        analyticsScript.async = true;
        document.head.appendChild(analyticsScript);
    }
})();

function isLocalPDFPath(pdfPath) {
    try {
        const url = new URL(pdfPath, window.location.href);
        return url.origin === window.location.origin && url.pathname.toLowerCase().endsWith('.pdf');
    } catch (error) {
        return false;
    }
}


function getPDFViewerURL(pdfPath) {
    const url = new URL(pdfPath, window.location.href);
    const filePath = url.pathname + url.search + url.hash;
    return `/pdf-viewer.html?file=${encodeURIComponent(filePath)}`;
}

function showPDFError() {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    if (!errorModal || !errorMessage) return;
    errorMessage.textContent = 'Sorry, this PDF is currently unavailable. Please try again later.';
    errorModal.style.display = 'flex';
}

function handlePDFClick(event, pdfPath) {
    if (event) event.preventDefault();

    try {
        if (isLocalPDFPath(pdfPath)) {
            window.location.href = new URL(pdfPath, window.location.href).href;
            return;
        }

        window.open(pdfPath, '_blank', 'noopener,noreferrer');
    } catch (error) {
        showPDFError();
    }
}

document.addEventListener('click', function(event) {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';

    if (isLocalPDFPath(href)) {
        handlePDFClick(event, href);
    }
});

function closeErrorModal() {
    const errorModal = document.getElementById('errorModal');
    errorModal.style.display = 'none';
}

function showError(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    const container = submenu.previousElementSibling;
    
    if (submenu.classList.contains('active')) {
        submenu.classList.remove('active');
        container.classList.remove('active');
    } else {
        submenu.classList.add('active');
        container.classList.add('active');
    }
}

function handleVideoClick(event, videoPath) {
    event.preventDefault();
    
    try {
        // Open video in new tab
        const link = document.createElement('a');
        link.href = videoPath;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        try {
            // Fallback: Window.open
            window.open(videoPath, '_blank');
        } catch (error2) {
            // Show error modal if opening fails
            const errorModal = document.getElementById('errorModal');
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Sorry, this video is currently unavailable. Please try again later.';
            errorModal.style.display = 'flex';
        }
    }
}

const PORTAL_INTRO_SPEECH_TEXT = `The vision behind this effort is inspired by the words of Rabindranath Tagore.

Where the mind is without fear and the head is held high.
Where knowledge is free.

This portal believes that education and knowledge should reach every learner without barriers.`;

let portalIntroUtterance = null;
let portalIntroAudio = null;
let portalIntroVoicesReadyPromise = null;
const PORTAL_INTRO_AUDIO_URL = '/audio/portal-introduction.wav?v=20260517-static-intro-audio';
const PORTAL_INTRO_PLAYED_STORAGE_KEY = 'sirgangulyPortalIntroPlayed';
let portalIntroSpeechInitialized = false;
let portalIntroAutoplayInProgress = false;

function hasPortalIntroPlayed() {
    if (window.__sirGangulyPortalIntroPlayed === true) return true;

    try {
        if (localStorage.getItem(PORTAL_INTRO_PLAYED_STORAGE_KEY) === 'true') {
            window.__sirGangulyPortalIntroPlayed = true;
            return true;
        }
    } catch (error) {}

    try {
        const cookieName = `${PORTAL_INTRO_PLAYED_STORAGE_KEY}=true`;
        if (document.cookie.split('; ').includes(cookieName)) {
            window.__sirGangulyPortalIntroPlayed = true;
            return true;
        }
    } catch (error) {}

    return false;
}

function markPortalIntroPlayed() {
    window.__sirGangulyPortalIntroPlayed = true;

    try {
        localStorage.setItem(PORTAL_INTRO_PLAYED_STORAGE_KEY, 'true');
    } catch (error) {}

    try {
        document.cookie = `${PORTAL_INTRO_PLAYED_STORAGE_KEY}=true; Max-Age=31536000; Path=/; SameSite=Lax`;
    } catch (error) {}
}

function getPortalIntroVoice() {
    if (!window.speechSynthesis) return null;

    const voices = window.speechSynthesis.getVoices();

    return voices.find((voice) =>
        /en-IN|hi-IN/i.test(voice.lang) && /male|ravi|hemant|amit|arjun|madhur/i.test(voice.name)
    ) || voices.find((voice) =>
        /en-IN|hi-IN/i.test(voice.lang)
    ) || voices.find((voice) =>
        /india|indian/i.test(voice.name)
    ) || voices.find((voice) =>
        /^en\b/i.test(voice.lang)
    ) || voices[0] || null;
}

function waitForPortalIntroVoices() {
    if (!window.speechSynthesis) return Promise.resolve();
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) return Promise.resolve();
    if (portalIntroVoicesReadyPromise) return portalIntroVoicesReadyPromise;

    portalIntroVoicesReadyPromise = new Promise((resolve) => {
        let finished = false;
        const complete = () => {
            if (finished) return;
            finished = true;
            window.speechSynthesis.removeEventListener('voiceschanged', complete);
            resolve();
        };

        window.speechSynthesis.addEventListener('voiceschanged', complete);
        setTimeout(complete, 700);
    });

    return portalIntroVoicesReadyPromise;
}

function resetPortalIntroButton() {
    const speakButton = document.getElementById('portalIntroSpeakBtn');
    const wave = document.getElementById('audioWaveContainer');
    if (speakButton) {
        speakButton.disabled = false;
        speakButton.innerHTML = '<i class="fas fa-volume-up"></i> Hear Introduction';
    }
    if (wave) {
        wave.classList.remove('speaking');
    }
}

function setPortalIntroSpeakingState(message) {
    const speakButton = document.getElementById('portalIntroSpeakBtn');
    const wave = document.getElementById('audioWaveContainer');
    const status = document.getElementById('portalIntroSpeechStatus');

    if (speakButton) {
        speakButton.disabled = true;
        speakButton.innerHTML = '<i class="fas fa-volume-up"></i> Speaking...';
    }
    if (wave) {
        wave.classList.add('speaking');
    }
    if (status) status.textContent = message || 'Teacher introduction is playing.';
}

function shouldUsePortalIntroMp3First() {
    // Always return true to use the high-quality pre-recorded audio file for premium, clean voice output
    return true;
}

function stopPortalIntroduction() {
    if (portalIntroAudio) {
        try {
            portalIntroAudio.pause();
            portalIntroAudio.currentTime = 0;
        } catch (error) {}
        portalIntroAudio = null;
    }

    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    portalIntroUtterance = null;
}

async function playPortalIntroductionAudio(status, reason) {
    try {
        portalIntroAudio = new Audio(PORTAL_INTRO_AUDIO_URL);
        portalIntroAudio.preload = 'auto';
        setPortalIntroSpeakingState('Teacher introduction is playing.');

        portalIntroAudio.onended = () => {
            portalIntroAudio = null;
            resetPortalIntroButton();
            if (status) status.textContent = '';
        };
        portalIntroAudio.onerror = () => {
            portalIntroAudio = null;
            resetPortalIntroButton();
            if (status) status.textContent = 'Your browser blocked the introduction audio. Please tap once more.';
        };

        await portalIntroAudio.play();
        return true;
    } catch (error) {
        resetPortalIntroButton();
        if (status) {
            status.textContent = reason
                ? `${reason} Please tap Hear Introduction once more.`
                : 'Introduction audio was blocked. Please tap Hear Introduction once more.';
        }
        return false;
    }
}

function speakPortalIntroductionWithSynthesis(status, attempt) {
    return new Promise((resolve, reject) => {
        const selectedVoice = getPortalIntroVoice();
        const utterance = new SpeechSynthesisUtterance(PORTAL_INTRO_SPEECH_TEXT);
        let started = false;
        let settled = false;
        portalIntroUtterance = utterance;

        utterance.lang = selectedVoice?.lang || 'en-IN';
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.pitch = 0.72;
        utterance.rate = 0.82;
        utterance.volume = 1;

        const settle = (handler, value) => {
            if (settled) return;
            settled = true;
            handler(value);
        };

        utterance.onstart = () => {
            started = true;
            setPortalIntroSpeakingState('Teacher introduction is playing.');
        };

        utterance.onend = () => {
            portalIntroUtterance = null;
            resetPortalIntroButton();
            if (status) status.textContent = '';
            settle(resolve);
        };

        utterance.onerror = (event) => {
            portalIntroUtterance = null;
            resetPortalIntroButton();
            settle(reject, new Error(event.error || 'Speech was blocked'));
        };

        window.speechSynthesis.speak(utterance);

        setTimeout(() => {
            if (!started && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
                portalIntroUtterance = null;
                resetPortalIntroButton();
                settle(reject, new Error(attempt > 1 ? 'Mobile speech was blocked.' : 'Speech did not start.'));
            }
        }, 1200);
    });
}

async function speakPortalIntroduction() {
    const speakButton = document.getElementById('portalIntroSpeakBtn');
    const status = document.getElementById('portalIntroSpeechStatus');

    if (speakButton) speakButton.disabled = true;
    if (status) status.textContent = 'Starting introduction...';

    stopPortalIntroduction();

    if (shouldUsePortalIntroMp3First()) {
        return await playPortalIntroductionAudio(status);
    }

    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
        return await playPortalIntroductionAudio(status, 'Speech is not supported in this browser.');
    }

    await waitForPortalIntroVoices();

    try {
        await speakPortalIntroductionWithSynthesis(status, 1);
        return true;
    } catch (firstError) {
        try {
            window.speechSynthesis.cancel();
            await new Promise((resolve) => setTimeout(resolve, 120));
            if (status) status.textContent = 'Starting introduction again...';
            await speakPortalIntroductionWithSynthesis(status, 2);
            return true;
        } catch (secondError) {
            return await playPortalIntroductionAudio(status, 'Speech was blocked.');
        }
    }
}

function initPortalIntroductionSpeech() {
    const speakButton = document.getElementById('portalIntroSpeakBtn');
    if (!speakButton) return;
    if (portalIntroSpeechInitialized) return;
    portalIntroSpeechInitialized = true;

    speakButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        const played = await speakPortalIntroduction();
        if (played) markPortalIntroPlayed();
    });
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener('voiceschanged', getPortalIntroVoice);
    }
    window.addEventListener('pagehide', stopPortalIntroduction);

    const autoplayEvents = ['click', 'touchstart', 'pointerdown', 'keydown'];
    const removeAutoplayListeners = () => {
        autoplayEvents.forEach((eventName) => {
            document.removeEventListener(eventName, triggerAutoplay);
        });
    };
    const addAutoplayListeners = () => {
        if (hasPortalIntroPlayed()) return;
        autoplayEvents.forEach((eventName) => {
            document.addEventListener(eventName, triggerAutoplay);
        });
    };

    const triggerAutoplay = async () => {
        if (hasPortalIntroPlayed() || portalIntroAutoplayInProgress) {
            removeAutoplayListeners();
            return;
        }

        portalIntroAutoplayInProgress = true;
        removeAutoplayListeners();
        try {
            const played = await speakPortalIntroduction();
            if (played) {
                markPortalIntroPlayed();
            } else {
                addAutoplayListeners();
            }
        } catch (e) {
            console.log('Interaction autoplay failed:', e);
            addAutoplayListeners();
        } finally {
            portalIntroAutoplayInProgress = false;
        }
    };

    // 1. Try to play immediately on window load (Chrome allows it if site has high media engagement)
    setTimeout(async () => {
        if (hasPortalIntroPlayed() || portalIntroAutoplayInProgress) return;
        portalIntroAutoplayInProgress = true;
        try {
            const played = await speakPortalIntroduction();
            if (played) {
                markPortalIntroPlayed();
            }
        } catch (err) {
            // Autoplay blocked by browser policy, fallback to first interaction
            console.log('Immediate autoplay was blocked, waiting for first user interaction to play...');
        } finally {
            portalIntroAutoplayInProgress = false;
        }
    }, 400);

    // 2. Add global interaction listeners as fallback to play on the absolute first click, touch, or keypress anywhere on screen
    addAutoplayListeners();
}

// Initialize visitor counter with text display
function initVisitorCounter() {
    loadVisitorCounter();
}

const VISITOR_COUNTER_FALLBACK = {
    totalVisitors: 630,
    indiaCount: 127,
    activeNow: 0
};

const FIREBASE_COUNTER_PATH = 'sirgangulyVisitorCounter';
let firebaseCounterStarted = false;
let firebaseCounterConfigPromise = null;
let firebaseCounterModulesPromise = null;

// Function to update counter display with actual numbers
function getVisitorId() {
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
        visitorId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('visitorId', visitorId);
    }
    return visitorId;
}

function updateCounterDisplay(totalVisitors, indiaCount, activeNow) {
    const counter = document.querySelector('.visitor-counter-display');
    if (!counter) return;

    const total = typeof totalVisitors === 'string'
        ? totalVisitors
        : (Number(totalVisitors) || 0).toLocaleString();
    const india = typeof indiaCount === 'number'
        ? indiaCount.toLocaleString()
        : '--';
    const active = typeof activeNow === 'number'
        ? activeNow.toLocaleString()
        : '--';

    counter.innerHTML = `
        <span class="visitor-count-value" style="display:block;white-space:nowrap;line-height:1.25;">Total Visitors: ${total}</span>
        <span class="visitor-count-value" style="display:block;white-space:nowrap;line-height:1.25;">Indian Visitor: ${india}</span>
        <span class="visitor-count-value" style="display:block;white-space:nowrap;line-height:1.25;">Active now: ${active}</span>
    `;
}

function updateCounterFallback() {
    updateCounterDisplay(
        VISITOR_COUNTER_FALLBACK.totalVisitors,
        VISITOR_COUNTER_FALLBACK.indiaCount,
        VISITOR_COUNTER_FALLBACK.activeNow
    );
}

function hasFirebaseCounterConfig() {
    const config = window.SIRGANGULY_FIREBASE_CONFIG;
    return Boolean(
        config &&
        config.apiKey &&
        config.authDomain &&
        config.databaseURL &&
        config.projectId &&
        config.appId
    );
}

function ensureFirebaseCounterConfig() {
    if (hasFirebaseCounterConfig()) return Promise.resolve(true);
    if (firebaseCounterConfigPromise) return firebaseCounterConfigPromise;

    firebaseCounterConfigPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = '/firebase-config.js?v=20260516';
        script.async = true;
        script.onload = () => resolve(hasFirebaseCounterConfig());
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });

    return firebaseCounterConfigPromise;
}

function getFirebaseVisitorKey() {
    return getVisitorId().replace(/[.#$\[\]/]/g, '_');
}

function loadFirebaseCounterModules() {
    if (!firebaseCounterModulesPromise) {
        firebaseCounterModulesPromise = Promise.all([
            import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js')
        ]).then(([app, database]) => ({ app, database }));
    }

    return firebaseCounterModulesPromise;
}

function countSnapshotChildren(snapshot) {
    let count = 0;
    snapshot.forEach(() => {
        count++;
    });
    return count;
}

async function startFirebaseCounter(countVisit) {
    if (firebaseCounterStarted) return false;
    const hasConfig = await ensureFirebaseCounterConfig();
    if (!hasConfig) return false;
    firebaseCounterStarted = true;

    try {
        const { app, database } = await loadFirebaseCounterModules();
        const firebaseApp = app.getApps().length
            ? app.getApps()[0]
            : app.initializeApp(window.SIRGANGULY_FIREBASE_CONFIG);
        const db = database.getDatabase(firebaseApp);
        const statsRef = database.ref(db, `${FIREBASE_COUNTER_PATH}/stats`);
        const activeRef = database.ref(db, `${FIREBASE_COUNTER_PATH}/active`);
        const myActiveRef = database.ref(db, `${FIREBASE_COUNTER_PATH}/active/${getFirebaseVisitorKey()}`);

        let latestStats = { ...VISITOR_COUNTER_FALLBACK };
        let latestActiveNow = VISITOR_COUNTER_FALLBACK.activeNow;
        const renderLatest = () => {
            updateCounterDisplay(
                latestStats.totalVisitors,
                latestStats.indiaCount,
                latestActiveNow
            );
        };

        database.onValue(statsRef, (snapshot) => {
            const stats = snapshot.val() || {};
            latestStats = {
                totalVisitors: Number(stats.totalVisitors) || VISITOR_COUNTER_FALLBACK.totalVisitors,
                indiaCount: Number(stats.indiaCount) || VISITOR_COUNTER_FALLBACK.indiaCount
            };
            renderLatest();
        });

        database.onValue(activeRef, (snapshot) => {
            latestActiveNow = countSnapshotChildren(snapshot);
            renderLatest();
        });

        database.onValue(database.ref(db, '.info/connected'), async (snapshot) => {
            if (snapshot.val() !== true) return;

            await database.onDisconnect(myActiveRef).remove();
            await database.set(myActiveRef, {
                lastSeen: database.serverTimestamp(),
                page: window.location.pathname || '/'
            });
        });

        setInterval(() => {
            database.update(myActiveRef, {
                lastSeen: database.serverTimestamp(),
                page: window.location.pathname || '/'
            }).catch(() => {});
        }, 30000);

        if (countVisit) {
            const isIndia = isLikelyIndianVisitor();

            await database.runTransaction(statsRef, (stats) => {
                const current = stats || {};
                const totalVisitors = Number(current.totalVisitors) || VISITOR_COUNTER_FALLBACK.totalVisitors;
                const indiaCount = Number(current.indiaCount) || VISITOR_COUNTER_FALLBACK.indiaCount;

                return {
                    totalVisitors: totalVisitors + 1,
                    indiaCount: indiaCount + (isIndia ? 1 : 0),
                    lastUpdated: database.serverTimestamp()
                };
            });
        }

        return true;
    } catch (error) {
        firebaseCounterStarted = false;
        console.log('Firebase visitor counter unavailable');
        return false;
    }
}

// Function to initialize mobile-friendly counter
function initMobileCounter() {
    const counter = document.querySelector('.visitor-counter-display');
    if (!counter || counter.textContent.trim()) return;

    counter.innerHTML = '<span class="visitor-count-value">Loading...</span>';
}

async function detectVisitorCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (!response.ok) return {};
        const data = await response.json();

        return {
            countryCode: data.country_code || 'UNKNOWN',
            ipAddress: data.ip || ''
        };
    } catch (error) {
        return {};
    }
}

function isLikelyIndianVisitor() {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const languages = navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language];

    return timeZone === 'Asia/Kolkata' ||
        timeZone === 'Asia/Calcutta' ||
        languages.some((language) => /-IN\b/i.test(language || ''));
}

async function updateVisitorApi(countVisit) {
    if (firebaseCounterStarted) return true;

    try {
        const location = countVisit ? await detectVisitorCountry() : {};
        const activityResponse = await fetch('/api/visitor-counter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                countryCode: location.countryCode || 'HEARTBEAT',
                ipAddress: location.ipAddress,
                visitorId: getVisitorId(),
                userAgent: navigator.userAgent,
                countVisit
            })
        });

        if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            updateCounterDisplay(activityData.totalVisitors, activityData.indiaCount, activityData.activeNow);
            return true;
        }
    } catch (error) {
        console.log('Visitor activity API unavailable');
    }

    return false;
}

// Function to fetch and display live visitor counts
async function loadVisitorCounter() {
    if (window.__visitorCounterLoading) return;
    window.__visitorCounterLoading = true;

    const sessionKey = 'visitorCounted';
    const shouldCountVisit = sessionStorage.getItem(sessionKey) !== 'true';
    const firebaseStarted = await startFirebaseCounter(shouldCountVisit);

    if (firebaseStarted) {
        if (shouldCountVisit) {
            sessionStorage.setItem(sessionKey, 'true');
        }
        window.__visitorCounterLoading = false;
        return;
    }

    const apiUpdated = await updateVisitorApi(shouldCountVisit);

    if (apiUpdated) {
        if (shouldCountVisit) {
            sessionStorage.setItem(sessionKey, 'true');
        }
        window.__visitorCounterLoading = false;
        return;
    }

    try {
        const response = await fetch('https://gangulysnotes.goatcounter.com/counter/TOTAL.json', {
            cache: 'no-store'
        });
        
        if (response.ok) {
            const data = await response.json();
            updateCounterDisplay(data.count || '--');
            window.__visitorCounterLoading = false;
            console.log('✅ GoatCounter visitor count updated:', data);
            return;
        }
    } catch (error) {
        console.log('ℹ️ GoatCounter visitor count unavailable');
    }

    updateCounterFallback();
    window.__visitorCounterLoading = false;
}

// Check if Font Awesome loaded and apply fallbacks if needed
function checkFontAwesome() {
    // Wait a bit for Font Awesome to load
    setTimeout(() => {
        const testIcon = document.createElement('i');
        testIcon.className = 'fa fa-whatsapp';
        testIcon.style.position = 'absolute';
        testIcon.style.left = '-9999px';
        document.body.appendChild(testIcon);
        
        const computedStyle = window.getComputedStyle(testIcon, '::before');
        const content = computedStyle.content;
        
        // If Font Awesome didn't load, the content will be empty or not a Font Awesome icon
        if (!content || content === 'none' || content === '""' || content === "''") {
            console.log('📱 Font Awesome not loaded, using emoji fallbacks');
            // Add a class to indicate fallbacks are active
            document.body.classList.add('fontawesome-fallback');
        } else {
            console.log('✅ Font Awesome loaded successfully');
        }
        
        document.body.removeChild(testIcon);
    }, 1000);
}

const FLOATING_TEACHER_PET_MOODS = [
    { emotion: 'happy', message: 'Namaste, ready to learn?' },
    { emotion: 'thinking', message: 'Ask your AI teacher.' },
    { emotion: 'focused', message: 'I am listening.' },
    { emotion: 'excited', message: 'Great question!' }
];

function getFloatingTeacherPetMarkup() {
    return `
        <div class="floating-pet-bubble" role="status" aria-live="polite">Namaste, ready to learn?</div>
        <button type="button" class="floating-pet-button" aria-label="Toggle Sir Ganguly cartoon companion">
            <span class="teacher-pet-glow" aria-hidden="true"></span>
            <span class="teacher-pet-shadow" aria-hidden="true"></span>
            <span class="teacher-pet-action-ring" aria-hidden="true"></span>
            <span class="teacher-pet" aria-hidden="true">
                <span class="teacher-pet-neck"></span>
                <span class="teacher-pet-shirt">
                    <span class="teacher-pet-collar teacher-pet-collar-left"></span>
                    <span class="teacher-pet-collar teacher-pet-collar-right"></span>
                    <span class="teacher-pet-placket"></span>
                </span>
                <span class="teacher-pet-head">
                    <span class="teacher-pet-ear teacher-pet-ear-left"></span>
                    <span class="teacher-pet-ear teacher-pet-ear-right"></span>
                    <span class="teacher-pet-hair"></span>
                    <span class="teacher-pet-hair-sweep"></span>
                    <span class="teacher-pet-brow teacher-pet-brow-left"></span>
                    <span class="teacher-pet-brow teacher-pet-brow-right"></span>
                    <span class="teacher-pet-glasses">
                        <span class="teacher-pet-lens teacher-pet-lens-left"></span>
                        <span class="teacher-pet-bridge"></span>
                        <span class="teacher-pet-lens teacher-pet-lens-right"></span>
                    </span>
                    <span class="teacher-pet-eye teacher-pet-eye-left"><span class="teacher-pet-pupil"></span></span>
                    <span class="teacher-pet-eye teacher-pet-eye-right"><span class="teacher-pet-pupil"></span></span>
                    <span class="teacher-pet-nose"></span>
                    <span class="teacher-pet-cheek teacher-pet-cheek-left"></span>
                    <span class="teacher-pet-cheek teacher-pet-cheek-right"></span>
                    <span class="teacher-pet-moustache"></span>
                    <span class="teacher-pet-smile"></span>
                    <span class="teacher-pet-mouth-open"></span>
                </span>
                <span class="teacher-pet-arm teacher-pet-arm-left"><span class="teacher-pet-hand"></span></span>
                <span class="teacher-pet-arm teacher-pet-arm-right"><span class="teacher-pet-hand"></span></span>
                <span class="teacher-pet-leg teacher-pet-leg-left"><span class="teacher-pet-shoe"></span></span>
                <span class="teacher-pet-leg teacher-pet-leg-right"><span class="teacher-pet-shoe"></span></span>
                <span class="teacher-pet-spark teacher-pet-spark-one"></span>
                <span class="teacher-pet-spark teacher-pet-spark-two"></span>
            </span>
        </button>
    `;
}

function initFloatingTeacherPet() {
    if (document.getElementById('floatingTeacherPet')) return;

    const pet = document.createElement('div');
    pet.id = 'floatingTeacherPet';
    pet.className = 'floating-pet floating-pet-emotion-happy floating-pet-direction-idle';
    pet.innerHTML = getFloatingTeacherPetMarkup();
    document.body.appendChild(pet);

    const button = pet.querySelector('.floating-pet-button');
    const bubble = pet.querySelector('.floating-pet-bubble');
    const dragState = {
        pointerId: null,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
        moved: false,
        lastDirection: 'idle'
    };
    let messageIndex = 0;
    let emotionTimeout = null;

    const setPetClassState = (emotion, direction, dragging) => {
        pet.className = [
            'floating-pet',
            pet.classList.contains('floating-pet-open') ? 'floating-pet-open' : '',
            dragging ? 'floating-pet-dragging' : '',
            `floating-pet-emotion-${emotion}`,
            `floating-pet-direction-${direction}`
        ].filter(Boolean).join(' ');
    };

    const setTemporaryEmotion = (emotion, duration) => {
        window.clearTimeout(emotionTimeout);
        const direction = dragState.lastDirection || 'idle';
        setPetClassState(emotion, direction, dragState.pointerId !== null);
        emotionTimeout = window.setTimeout(() => {
            const currentMood = FLOATING_TEACHER_PET_MOODS[messageIndex];
            setPetClassState(currentMood.emotion, direction, dragState.pointerId !== null);
        }, duration || 900);
    };

    const clampPosition = (x, y) => {
        const width = window.innerWidth <= 768 ? 148 : 176;
        const height = window.innerWidth <= 768 ? 176 : 196;
        const padding = window.innerWidth <= 768 ? 6 : 10;

        return {
            x: Math.min(Math.max(padding, x), window.innerWidth - width - padding),
            y: Math.min(Math.max(padding, y), window.innerHeight - height - padding)
        };
    };

    const placePet = () => {
        const currentX = Number.parseFloat(pet.style.left);
        const currentY = Number.parseFloat(pet.style.top);
        const position = Number.isFinite(currentX) && Number.isFinite(currentY)
            ? clampPosition(currentX, currentY)
            : {
                x: window.innerWidth <= 768 ? 10 : 14,
                y: window.innerWidth <= 768 ? 84 : 104
            };

        pet.style.left = `${position.x}px`;
        pet.style.top = `${position.y}px`;
        pet.style.right = 'auto';
        pet.style.bottom = 'auto';
    };

    const rotateMessage = () => {
        messageIndex = (messageIndex + 1) % FLOATING_TEACHER_PET_MOODS.length;
        const mood = FLOATING_TEACHER_PET_MOODS[messageIndex];
        bubble.textContent = mood.message;
        setPetClassState(mood.emotion, dragState.lastDirection || 'idle', dragState.pointerId !== null);
    };

    const handlePointerDown = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const currentX = Number.parseFloat(pet.style.left) || 14;
        const currentY = Number.parseFloat(pet.style.top) || 104;

        button.setPointerCapture?.(event.pointerId);
        dragState.pointerId = event.pointerId;
        dragState.startX = event.clientX;
        dragState.startY = event.clientY;
        dragState.originX = currentX;
        dragState.originY = currentY;
        dragState.moved = false;
        dragState.lastDirection = 'idle';
        setPetClassState('focused', 'idle', true);
    };

    const handlePointerMove = (event) => {
        if (dragState.pointerId !== event.pointerId) return;
        event.preventDefault();
        event.stopPropagation();

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance > 3) dragState.moved = true;
        if (distance > 18) {
            dragState.lastDirection = Math.abs(deltaX) > Math.abs(deltaY)
                ? (deltaX > 0 ? 'right' : 'left')
                : (deltaY > 0 ? 'down' : 'up');
        }

        const position = clampPosition(dragState.originX + deltaX, dragState.originY + deltaY);
        pet.style.left = `${position.x}px`;
        pet.style.top = `${position.y}px`;
        setPetClassState('focused', dragState.lastDirection, true);
    };

    const handlePointerUp = (event) => {
        if (dragState.pointerId !== event.pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        button.releasePointerCapture?.(event.pointerId);

        const wasDragged = dragState.moved;
        dragState.pointerId = null;

        if (!wasDragged) {
            pet.classList.toggle('floating-pet-open');
            setTemporaryEmotion('surprised', 850);
        } else {
            setTemporaryEmotion('happy', 700);
        }

        window.setTimeout(() => {
            dragState.lastDirection = 'idle';
            setPetClassState(FLOATING_TEACHER_PET_MOODS[messageIndex].emotion, 'idle', false);
        }, 500);
    };

    const resetDragState = () => {
        if (dragState.pointerId === null) return;
        dragState.pointerId = null;
        dragState.moved = false;
        dragState.lastDirection = 'idle';
        setPetClassState(FLOATING_TEACHER_PET_MOODS[messageIndex].emotion, 'idle', false);
    };

    button.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('blur', resetDragState);
    button.addEventListener('pointerenter', () => setTemporaryEmotion('happy', 1100));
    button.addEventListener('focus', () => setTemporaryEmotion('happy', 1100));
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            pet.classList.toggle('floating-pet-open');
            setTemporaryEmotion('surprised', 850);
        }
    });
    window.addEventListener('resize', placePet);

    placePet();
    window.setInterval(rotateMessage, 7000);
}

// Initialize mobile counter on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', function() {
        initPortalIntroductionSpeech();
        initFloatingTeacherPet();
        initMobileCounter();
        loadVisitorCounter();
        setInterval(() => updateVisitorApi(false), 30000);
        checkFontAwesome(); // Check Font Awesome loading
    });
    window.addEventListener('resize', initMobileCounter);
}

// Run counter when page loads
if (typeof window !== 'undefined') {
    // Display visitor total immediately
    initVisitorCounter();

    // Refresh the display when returning to the tab.
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(initVisitorCounter, 1000);
        }
    });
}
