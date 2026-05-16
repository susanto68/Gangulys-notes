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

// Initialize visitor counter with text display
function initVisitorCounter() {
    loadVisitorCounter();
}

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

async function updateVisitorApi(countVisit) {
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

    updateCounterDisplay('--', undefined, undefined);
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

// Initialize mobile counter on load
if (typeof window !== 'undefined') {
    window.addEventListener('load', function() {
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
