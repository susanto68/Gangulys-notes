function handlePDFClick(event, pdfPath) {
    event.preventDefault();
    
    // Check if it's a local PDF file or external link
    if (pdfPath.startsWith('../pdf/') || pdfPath.startsWith('pdfs/') || pdfPath.startsWith('pdf/')) {
        // For local PDF files, try multiple approaches
        try {
            // First try: Direct file access
            const link = document.createElement('a');
            link.href = pdfPath;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            try {
                // Second try: Window.open
                window.open(pdfPath, '_blank');
            } catch (error2) {
                // Third try: Show error modal
                const errorModal = document.getElementById('errorModal');
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = 'Sorry, this PDF is currently unavailable. Please try again later.';
                errorModal.style.display = 'flex';
            }
        }
    } else {
        // For external links (like Google Drive), convert forward slashes to backslashes for Windows
        const windowsPath = pdfPath.replace(/\//g, '\\');
        
        try {
            // Open PDF in the same window
            window.location.href = windowsPath;
        } catch (error) {
            // Show error modal only if opening fails
            const errorModal = document.getElementById('errorModal');
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Sorry, this PDF is currently unavailable. Please try again later.';
            errorModal.style.display = 'flex';
        }
    }
}

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
    // Check if we've already counted this session to avoid double counting
    const sessionKey = 'visitor_counted_' + window.location.pathname;
    if (sessionStorage.getItem(sessionKey)) {
        console.log('✅ Visitor already counted for this page in this session');
        return;
    }

    // Get visitor's country using a free IP geolocation service
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            // Send visitor data to our counter API
            return fetch('/api/visitor-counter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    countryCode: data.country_code || 'Unknown',
                    ipAddress: data.ip || 'Unknown',
                    userAgent: navigator.userAgent,
                    pageUrl: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Visitor counted:', data);
            // Mark this page as counted in this session
            sessionStorage.setItem(sessionKey, 'true');
            
            // Add a subtle animation to the counter
            const counterImg = document.querySelector('img[alt="page hit counter"]');
            if (counterImg) {
                counterImg.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    counterImg.style.transform = 'scale(1)';
                }, 200);
            }
            
            // Update counter display with actual count
            updateCounterDisplay(data.globalCount, data.indiaCount);
        })
        .catch(error => {
            console.error('❌ Visitor counter error:', error);
            // Still mark as counted to avoid retries
            sessionStorage.setItem(sessionKey, 'true');
        });
}

// Function to update counter display with actual numbers
function updateCounterDisplay(globalCount, indiaCount) {
    const counterContainer = document.querySelector('.visitor-counter');
    if (counterContainer) {
        let fallbackCounter = counterContainer.querySelector('.fallback-counter');
        
        if (!fallbackCounter) {
            // Create fallback counter element
            fallbackCounter = document.createElement('div');
            fallbackCounter.className = 'fallback-counter';
            fallbackCounter.style.cssText = `
                display: flex;
                gap: 2px;
                justify-content: center;
                align-items: center;
                margin-top: 4px;
            `;
            
            // Add it after the image
            const img = counterContainer.querySelector('img');
            if (img) {
                img.parentNode.appendChild(fallbackCounter);
            }
        }
        
        // Update with actual count
        if (globalCount) {
            const countStr = globalCount.toString();
            fallbackCounter.innerHTML = countStr.split('').map(digit => 
                `<span style="
                    background: #66a6ff; 
                    color: white; 
                    padding: 2px 4px; 
                    border-radius: 3px; 
                    font-size: 12px; 
                    font-weight: bold;
                    min-width: 16px;
                    text-align: center;
                    display: inline-block;
                ">${digit}</span>`
            ).join('');
        }
    }
}

// Function to initialize mobile-friendly counter
function initMobileCounter() {
    const counterContainer = document.querySelector('.visitor-counter');
    if (counterContainer) {
        // Always show our custom counter immediately
        updateCounterDisplay(503, 127); // Default values until API loads
    }
}

// Function to fetch and display real visitor count
async function fetchVisitorCount() {
    try {
        const response = await fetch('/api/visitor-counter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                countryCode: 'FETCH',
                ipAddress: '0.0.0.0',
                userAgent: 'Counter Display'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            updateCounterDisplay(data.globalCount, data.indiaCount);
            console.log('✅ Visitor count updated:', data);
        }
    } catch (error) {
        console.log('ℹ️ Using default visitor count');
    }
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
        fetchVisitorCount(); // Fetch real visitor count
        checkFontAwesome(); // Check Font Awesome loading
    });
    window.addEventListener('resize', initMobileCounter);
}

// Run counter when page loads
if (typeof window !== 'undefined') {
    // Count visitor immediately
    initVisitorCounter();
    
    // Also count when page becomes visible (for mobile apps, tabs, etc.)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // Small delay to ensure page is fully loaded
            setTimeout(initVisitorCounter, 1000);
        }
    });
}