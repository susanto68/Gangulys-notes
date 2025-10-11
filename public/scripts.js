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
        })
        .catch(error => {
            console.error('❌ Visitor counter error:', error);
            // Still mark as counted to avoid retries
            sessionStorage.setItem(sessionKey, 'true');
        });
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