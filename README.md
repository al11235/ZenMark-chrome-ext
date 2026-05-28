[README.md](https://github.com/user-attachments/files/28339908/README.md)
# ZenMark
> A premium, zero-dependency Chrome Extension to scan, clean, and organize your bookmark database.

ZenMark helps you declutter your bookmarks bar, find duplicate bookmarks, identify old or inactive links you haven't opened in months, and automatically organize them into folders.

---

## Key Features

* **Inactive Link Finder:** Cross-references your bookmarks with Chrome's history API. Shows exactly how many days ago you last opened a link (e.g. `Opened 12d ago`). If a bookmark has no history record, it calculates the bookmark's age and displays `Never opened (Created 14d ago)` or `Opened 90d+ ago`.
* **Duplicate Bookmark Scanner:** Groups duplicate URLs across all your folders. Features a **"Keep First, Select Rest"** button to instantly clean up redundant entries while keeping one copy safe.
* **Suggested Auto-Categorization:** Scans bookmark titles and domains against semantic rules. Instantly groups matching links into logical folders (e.g. *Development & Tech*, *Shopping & Commerce*, *Design & Creative*) and allows bulk moving them in one click.
* **Clean Folder Breadcrumbs:** Rebuilds nested folder paths (e.g., `Work › Projects › Antigravity`) and automatically hides the Bookmarks Bar prefix since it is assumed.
* **Presentation-Ready Mock Mode:** Open `dashboard.html` directly in any browser. The page will automatically detect the lack of extension APIs and load a simulated bookmark database. This lets you demonstrate or test the tool with zero installation!

---

## Installation Guide

To run this as a Chrome Extension:
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the project folder containing these files (`/modest-hawking`).
5. Open the extension popup from your toolbar and click **Launch Dashboard**!

---

## File Structure

```text
├── manifest.json      # Manifest V3 Extension configuration
├── popup.html         # Toolbar popup interface
├── popup.js           # Redirect script to dashboard tab
├── dashboard.html     # Main workspace interface
├── dashboard.css      # Custom HSL dark-mode theme & animations
├── dashboard.js       # Core logic, Chrome API integration, and Mock fallback
└── README.md          # Project documentation
```

---

## Tech Stack
* **HTML5:** Semantic workspace layout.
* **CSS3:** Responsive flex grid, dark-theme variables, glassmorphic blurs, and hover micro-animations.
* **Vanilla JavaScript:** ES6 modules, Chrome Extension APIs (`bookmarks`, `history`), and inline database mock engine.
