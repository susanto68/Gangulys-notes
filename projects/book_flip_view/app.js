// app.js

// Set up PDF.js worker source. This is crucial for PDF.js to function correctly
// by offloading heavy rendering tasks to a web worker, keeping the UI responsive.
pdfjsLib.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

// Define the path to your PDF document.
// *** UPDATED: Using the new PDF filename provided by the user ***
const pdfUrl = 'pdfs/my_book.pdf';

// Get references to the HTML elements using jQuery, as Turn.js often relies on it.
const $flipbookContainer = $('#flipbook');
const $prevPageButton = $('#prevPage');
const $nextPageButton = $('#nextPage');
const $loadingMessage = $('.loading-message'); // The loading message element

let pdfDoc = null; // Stores the loaded PDF document object
let pageCanvases = []; // Array to store canvas elements for each PDF page

/**
 * Loads the PDF document and renders each page onto a separate HTML canvas element.
 * This function is asynchronous because PDF loading and rendering are time-consuming operations.
 */
async function renderPdfPages() {
    try {
        // Show the loading message while PDF is being processed
        $loadingMessage.show();
        $flipbookContainer.hide(); // Hide the flipbook container initially

        // 1. Load the PDF document
        // pdfjsLib.getDocument returns a PDFDocumentProxy object
        pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
        const numPages = pdfDoc.numPages;

        // Clear any existing content in the flipbook container
        $flipbookContainer.empty();

        // 2. Iterate through each page of the PDF and render it
        for (let i = 1; i <= numPages; i++) {
            const page = await pdfDoc.getPage(i);

            // Get the viewport for the page with a specific scale.
            // Adjust the scale (e.g., 1.5, 2.0) to control the resolution of the rendered pages.
            // Higher scale means better quality but more memory usage and longer rendering time.
            const viewport = page.getViewport({ scale: 1.5 });

            // Create a new canvas element for each page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Set canvas dimensions based on the viewport
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render the PDF page onto the canvas
            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // Add a class for Turn.js to identify pages if needed, though Turn.js often wraps them.
            $(canvas).addClass('turn-page');

            // Store the canvas element
            pageCanvases.push(canvas);
        }

        // 3. Initialize the Turn.js flipbook once all pages are rendered
        initializeFlipbook();

        // Hide the loading message and show the flipbook
        $loadingMessage.hide();
        $flipbookContainer.show();

    } catch (error) {
        // Log any errors during PDF loading or rendering
        console.error('Error loading or rendering PDF:', error);
        $loadingMessage.html('<span class="text-red-500">Error loading PDF. Please check the console for details.</span>');
        $loadingMessage.show();
        $flipbookContainer.hide();
    }
}

/**
 * Initializes the Turn.js library on the flipbook container.
 * This function should be called only after all PDF pages have been rendered to canvases.
 */
function initializeFlipbook() {
    // Append each rendered canvas to the flipbook container
    pageCanvases.forEach(canvas => {
        $flipbookContainer.append(canvas);
    });

    // Calculate optimal width and height for Turn.js based on the first page's dimensions.
    // Turn.js works best with explicit dimensions.
    // For 'double' display, the width should be twice the page width.
    const pageWidth = pageCanvases[0].width;
    const pageHeight = pageCanvases[0].height;

    // Determine the maximum width the flipbook can take while maintaining aspect ratio
    // and fitting within the parent container (max-w-3xl in index.html).
    // We'll use a responsive approach.
    const maxFlipbookWidth = $flipbookContainer.parent().width() * 0.9; // 90% of parent width
    const calculatedFlipbookHeight = maxFlipbookWidth / (pageWidth * 2 / pageHeight); // For double page spread

    // Initialize Turn.js with the calculated dimensions and other options.
    // 'display: "double"' shows two pages side-by-side.
    // 'autoCenter: true' centers the flipbook.
    // 'acceleration: true' uses CSS 3D transforms for smoother animations.
    // 'duration': Speed of the page turn animation in milliseconds.
    $flipbookContainer.turn({
        width: maxFlipbookWidth,
        height: calculatedFlipbookHeight,
        autoCenter: true,
        acceleration: true,
        display: 'double',
        duration: 800, // 800ms for a smooth flip
        // Add more Turn.js options here if needed, e.g., 'gradients', 'elevation'
    });

    // Adjust flipbook size on window resize to maintain responsiveness
    $(window).on('resize', function() {
        const newMaxFlipbookWidth = $flipbookContainer.parent().width() * 0.9;
        const newCalculatedFlipbookHeight = newMaxFlipbookWidth / (pageWidth * 2 / pageHeight);
        $flipbookContainer.turn('size', newMaxFlipbookWidth, newCalculatedFlipbookHeight);
    });

    // Add event listeners for navigation buttons
    $prevPageButton.on('click', function() {
        $flipbookContainer.turn('previous');
    });

    $nextPageButton.on('click', function() {
        $flipbookContainer.turn('next');
    });

    // Optional: Keyboard navigation (left/right arrow keys)
    $(document).keydown(function(e) {
        if (e.keyCode === 37) { // Left arrow key
            $flipbookContainer.turn('previous');
            e.preventDefault(); // Prevent default browser scroll
        } else if (e.keyCode === 39) { // Right arrow key
            $flipbookContainer.turn('next');
            e.preventDefault(); // Prevent default browser scroll
        }
    });

    // Optional: Event listener for when a page is turned
    $flipbookContainer.bind('turned', function(event, page, view) {
        console.log('Current page:', page, 'View:', view);
        // You can update a page number display here if you add one to your HTML
    });
}

// Start the process: render PDF pages when the document is ready
$(document).ready(function() {
    renderPdfPages();
});
