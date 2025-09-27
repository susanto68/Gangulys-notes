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