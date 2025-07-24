function handlePDFClick(event, pdfPath) {
    event.preventDefault();
    
    // Convert forward slashes to backslashes for Windows
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

function closeErrorModal() {
    const errorModal = document.getElementById('errorModal');
    errorModal.style.display = 'none';
}