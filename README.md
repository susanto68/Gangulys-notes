# Educational Notes Portal - Ganguly's

> [!WARNING]
> **CRITICAL REPOSITORY STRUCTURE POLICY - PLEASE READ BEFORE MODIFYING**
> 
> This repository is dedicated **strictly** to the **Classic Notes Project** (`sirganguly.com`), which is a pure static HTML, CSS, and JS website served directly from the root directory. 
> 
> A previous merge accidentally brought the Next.js modern AI project (`ai.sirganguly.com`) into this repository's root, causing serious conflict, path duplicates, and broken builds. This has been resolved by **archiving the Next.js AI project inside `_modern_ai_project_archive/`** and restoring the static Classic Notes site to the root.
> 
> **MANDATORY RULES FOR DEVELOPERS & AI ASSISTANTS:**
> 1. **Do NOT** try to move the Next.js files back to the root or re-integrate them.
> 2. The root folder **must** remain pure HTML/CSS/JS (no framework files like `pages/`, `components/`, `package.json` in the root).
> 3. All future updates to Classic Notes must be done directly on the root static files.
> 4. Keep the AI project archived in `_modern_ai_project_archive/` unless explicitly instructed otherwise by the owner.

## Project Structure

- `index.html`: The main landing page with links to different class notes.
- `class8.html`: Notes for Class 8.
- `class9.html`: Notes for Class 9.
- `class10.html`: Notes for Class 10.
- `class12.html`: Notes for Class 12.
- `styles.css`: Main stylesheet for the portal.
- `chapters.css`: Stylesheet specific to chapter content (if applicable).
- `scripts.js`: JavaScript for any interactive elements (if applicable).

## How to Use

1. Open the `index.html` file in your web browser.
2. Click on the button corresponding to the class whose notes you want to view.

## Contributing

Feel free to contribute to this project by adding more notes, improving the existing content, or enhancing the website's functionality.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/YourFeature`).
6. Open a Pull Request.

## License

&copy; 2024 Ganguly's Educational Notes. All rights reserved.