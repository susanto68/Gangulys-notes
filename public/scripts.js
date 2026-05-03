function handlePDFClick(event, pdfPath) {
    event.preventDefault();
    
    // Check if it's a local PDF file or external link
    if (pdfPath.startsWith('../pdf/') || pdfPath.startsWith('/pdf/') || pdfPath.startsWith('pdfs/') || pdfPath.startsWith('pdf/')) {
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
    loadGoatCounterVisitorCount();
}

// Function to update counter display with actual numbers
function updateCounterDisplay(globalCount, indiaCount) {
    const counter = document.querySelector('.visitor-counter-display');
    if (!counter) return;

    const count = typeof globalCount === 'string'
        ? globalCount
        : (Number(globalCount) || 0).toLocaleString();
    counter.innerHTML = `<span class="visitor-count-value">${count}</span>`;
}

// Function to initialize mobile-friendly counter
function initMobileCounter() {
    const counter = document.querySelector('.visitor-counter-display');
    if (!counter || counter.textContent.trim()) return;

    counter.innerHTML = '<span class="visitor-count-value">Loading...</span>';
}

// Function to fetch and display GoatCounter total visitor count
async function loadGoatCounterVisitorCount() {
    try {
        const response = await fetch('https://gangulysnotes.goatcounter.com/counter/TOTAL.json', {
            cache: 'no-store'
        });
        
        if (response.ok) {
            const data = await response.json();
            updateCounterDisplay(data.count || '--');
            console.log('✅ GoatCounter visitor count updated:', data);
            return;
        }
    } catch (error) {
        console.log('ℹ️ GoatCounter visitor count unavailable');
    }

    updateCounterDisplay('--');
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
        loadGoatCounterVisitorCount();
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
