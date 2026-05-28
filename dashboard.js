// State Management
let allBookmarks = [];      // Flat array of all bookmark nodes
let foldersMap = {};        // Map of folderId -> folderName
let foldersList = [];       // List of folder nodes
let folderParentMap = {};   // Map of folderId -> parentFolderId
let historyMap = {};        // Map of URL -> lastVisitTime (timestamp)
let selectedBookmarkIds = new Set();
let currentTab = 'all';     // 'all', 'inactive', 'duplicates', 'categorizer'
let isMockMode = false;

// Mock Data for Standalone Preview (if not running inside Chrome Extension)
const MOCK_FOLDERS = {
  '0': 'Root',
  '1': 'Bookmarks Bar',
  '2': 'Other Bookmarks',
  '3': 'Development',
  '4': 'Design Assets',
  '5': 'Shopping',
  '6': 'Reading List'
};

const MOCK_BOOKMARKS = [
  { id: '10', title: 'GitHub - Build software together', url: 'https://github.com', parentId: '3', dateAdded: Date.now() - 500 * 24 * 60 * 60 * 1000 },
  { id: '11', title: 'Stack Overflow - Developer Community', url: 'https://stackoverflow.com', parentId: '3', dateAdded: Date.now() - 300 * 24 * 60 * 60 * 1000 },
  { id: '12', title: 'Figma: Collaborative Design Tool', url: 'https://figma.com', parentId: '4', dateAdded: Date.now() - 100 * 24 * 60 * 60 * 1000 },
  { id: '13', title: 'Amazon.com: Online Shopping', url: 'https://amazon.com', parentId: '5', dateAdded: Date.now() - 600 * 24 * 60 * 60 * 1000 },
  { id: '14', title: 'eBay: Electronics, Cars, Clothing', url: 'https://ebay.com', parentId: '5', dateAdded: Date.now() - 400 * 24 * 60 * 60 * 1000 },
  { id: '15', title: 'YouTube', url: 'https://youtube.com', parentId: '1', dateAdded: Date.now() - 50 * 24 * 60 * 60 * 1000 },
  { id: '16', title: 'Reddit - Dive into anything', url: 'https://reddit.com', parentId: '1', dateAdded: Date.now() - 10 * 24 * 60 * 60 * 1000 },
  { id: '17', title: 'Wikipedia, the free encyclopedia', url: 'https://wikipedia.org', parentId: '6', dateAdded: Date.now() - 450 * 24 * 60 * 60 * 1000 },
  { id: '18', title: 'Medium – Where good ideas find you', url: 'https://medium.com', parentId: '6', dateAdded: Date.now() - 250 * 24 * 60 * 60 * 1000 },
  
  // Duplicates
  { id: '19', title: 'GitHub - Code Repository', url: 'https://github.com', parentId: '6', dateAdded: Date.now() - 10 * 24 * 60 * 60 * 1000 }, // duplicate of 10
  { id: '20', title: 'Figma Web App', url: 'https://figma.com', parentId: '1', dateAdded: Date.now() - 5 * 24 * 60 * 60 * 1000 }, // duplicate of 12
  { id: '21', title: 'Amazon Shop', url: 'https://amazon.com', parentId: '6', dateAdded: Date.now() - 2 * 24 * 60 * 60 * 1000 }, // duplicate of 13
  
  // Inactive Developer Links (Older than 1 Year)
  { id: '22', title: 'NPM Packages Registry', url: 'https://npmjs.com', parentId: '3', dateAdded: Date.now() - 450 * 24 * 60 * 60 * 1000 },
  { id: '23', title: 'Dev.to - Dev Community', url: 'https://dev.to', parentId: '3', dateAdded: Date.now() - 500 * 24 * 60 * 60 * 1000 },
  { id: '24', title: 'Dribbble - Discover Graphic Designers', url: 'https://dribbble.com', parentId: '4', dateAdded: Date.now() - 380 * 24 * 60 * 60 * 1000 }
];

const MOCK_HISTORY = {
  'https://github.com': Date.now() - 400 * 24 * 60 * 60 * 1000,       // > 365 days ago
  'https://stackoverflow.com': Date.now() - 15 * 24 * 60 * 60 * 1000,  // 15 days ago
  'https://figma.com': Date.now() - 5 * 24 * 60 * 60 * 1000,          // 5 days ago
  'https://amazon.com': Date.now() - 500 * 24 * 60 * 60 * 1000,       // > 365 days ago
  'https://ebay.com': Date.now() - 410 * 24 * 60 * 60 * 1000,         // > 365 days ago
  'https://youtube.com': Date.now() - 1 * 24 * 60 * 60 * 1000,        // 1 day ago
  'https://reddit.com': Date.now() - 2 * 60 * 60 * 1000,              // 2 hours ago
  'https://wikipedia.org': Date.now() - 120 * 24 * 60 * 60 * 1000,    // 120 days ago (inactive for 90, active for 365)
  'https://medium.com': Date.now() - 200 * 24 * 60 * 60 * 1000,       // 200 days ago
  'https://npmjs.com': Date.now() - 420 * 24 * 60 * 60 * 1000,        // > 365 days ago
  'https://dev.to': Date.now() - 480 * 24 * 60 * 60 * 1000,           // > 365 days ago
  'https://dribbble.com': Date.now() - 370 * 24 * 60 * 60 * 1000      // > 365 days ago
};

// Auto-Categorizer configuration Rules (Simulating AI tagging)
const AUTO_CATEGORIES = [
  {
    name: 'Development & Tech',
    icon: '💻',
    domains: ['github.com', 'stackoverflow.com', 'dev.to', 'npmjs.com', 'medium.com', 'developer.chrome.com', 'codepen.io'],
    keywords: ['dev', 'code', 'api', 'repository', 'docs', 'programming', 'javascript', 'python', 'tutorial']
  },
  {
    name: 'Social Media & Networks',
    icon: '👥',
    domains: ['reddit.com', 'youtube.com', 'facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'instagram.com', 'tiktok.com'],
    keywords: ['social', 'community', 'feed', 'profile', 'video']
  },
  {
    name: 'Design & Creative',
    icon: '🎨',
    domains: ['figma.com', 'dribbble.com', 'behance.net', 'unsplash.com', 'canva.com', 'pinterest.com'],
    keywords: ['design', 'creative', 'inspiration', 'asset', 'illustration', 'ui', 'ux']
  },
  {
    name: 'Shopping & Commerce',
    icon: '🛍️',
    domains: ['amazon.com', 'ebay.com', 'aliexpress.com', 'etsy.com', 'shopify.com', 'walmart.com'],
    keywords: ['shop', 'store', 'cart', 'buy', 'checkout', 'price', 'product']
  },
  {
    name: 'Reference & Education',
    icon: '📚',
    domains: ['wikipedia.org', 'w3schools.com', 'coursera.org', 'udemy.com', 'edu', 'britannica.com'],
    keywords: ['learn', 'wiki', 'study', 'education', 'encyclopedia', 'course']
  }
];

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  detectEnvironment();
  await loadData();
  setupEventListeners();
  renderApp();
});

// Detect if running inside a Chrome Extension or standalone tab
function detectEnvironment() {
  if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.history) {
    isMockMode = false;
  } else {
    isMockMode = true;
    console.log("ZenMark is running in MOCK mode (standalone browser tab). Live Chrome APIs are bypassed.");
  }
}

// Utility to normalize URLs for precise history matching
function normalizeUrl(url) {
  if (!url) return '';
  try {
    let norm = url.toLowerCase().trim();
    if (norm.endsWith('/')) norm = norm.slice(0, -1);
    return norm;
  } catch (e) {
    return url;
  }
}

// Resolve full folder path starting after Bookmarks Bar or Other Bookmarks
function getFolderPath(folderId) {
  if (!folderId || folderId === '0' || folderId === '1' || folderId === '2' || folderId === '3') return '/';
  
  // If the folder itself is directly under the root or its parent is missing, return '/'
  if (folderParentMap[folderId] === '0' || !folderParentMap[folderId]) return '/';
  
  const pathParts = [];
  let currentId = folderId;
  
  while (currentId && currentId !== '0') {
    // Stop when we reach system root folders, parent is root, or parent is missing
    if (currentId === '1' || currentId === '2' || currentId === '3' || 
        folderParentMap[currentId] === '0' || !folderParentMap[currentId]) {
      break;
    }
    const name = foldersMap[currentId];
    if (name) {
      pathParts.unshift(name);
    }
    currentId = folderParentMap[currentId];
  }
  
  return pathParts.length > 0 ? pathParts.join(' › ') : '/';
}

// Load Bookmarks and History with Graceful Fallback
async function loadData() {
  showLoading(true);
  try {
    if (isMockMode) {
      await loadMockData();
    } else {
      await loadLiveData();
    }
  } catch (error) {
    console.error("Failed to load live Chrome data. Falling back to Mock Mode for demonstration.", error);
    isMockMode = true;
    await loadMockData();
  } finally {
    // Populate folder filters
    populateFolderDropdowns();
    // Calculate Stats
    calculateStats();
    showLoading(false);
  }
}

// Load simulated mock data for fallback/demo
async function loadMockData() {
  // Simulate network/db delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  allBookmarks = JSON.parse(JSON.stringify(MOCK_BOOKMARKS));
  foldersMap = JSON.parse(JSON.stringify(MOCK_FOLDERS));
  
  foldersList = Object.keys(MOCK_FOLDERS).map(id => ({
    id: id,
    title: MOCK_FOLDERS[id]
  }));

  // Populate mock parent relationships
  folderParentMap = {
    '1': '0',
    '2': '0',
    '3': '1',
    '4': '1',
    '5': '2',
    '6': '2'
  };

  // Populate history map with normalized URL keys
  historyMap = {};
  Object.keys(MOCK_HISTORY).forEach(url => {
    historyMap[normalizeUrl(url)] = MOCK_HISTORY[url];
  });
}

// Load actual bookmarks and history from Chrome
async function loadLiveData() {
  // 1. Fetch entire bookmark tree
  const tree = await new Promise((resolve, reject) => {
    try {
      chrome.bookmarks.getTree(nodes => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(nodes);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
  
  allBookmarks = [];
  foldersMap = {};
  foldersList = [];
  folderParentMap = {};
  
  // Recursively traverse bookmarks tree
  function traverse(node) {
    if (node.children) {
      // It is a folder
      foldersMap[node.id] = node.title || (node.id === '0' ? 'Root' : 'Unnamed Folder');
      folderParentMap[node.id] = node.parentId;
      foldersList.push({ id: node.id, title: foldersMap[node.id] });
      node.children.forEach(traverse);
    } else {
      // It is a bookmark
      allBookmarks.push({
        id: node.id,
        title: node.title || 'Untitled',
        url: node.url || '',
        parentId: node.parentId,
        dateAdded: node.dateAdded || Date.now()
      });
    }
  }
  
  if (tree && Array.isArray(tree)) {
    tree.forEach(traverse);
  }

  // 2. Fetch Chrome history (all available history in browser database)
  const historyItems = await new Promise((resolve, reject) => {
    try {
      chrome.history.search({
        text: '',
        startTime: 0,
        maxResults: 99999
      }, items => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(items);
        }
      });
    } catch (e) {
      reject(e);
    }
  });

  historyMap = {};
  if (historyItems && Array.isArray(historyItems)) {
    historyItems.forEach(item => {
      if (item && item.url) {
        const norm = normalizeUrl(item.url);
        if (!historyMap[norm] || item.lastVisitTime > historyMap[norm]) {
          historyMap[norm] = item.lastVisitTime;
        }
      }
    });
  }
}

// Populate Folder Dropdowns (Main UI filter + Modal select)
function populateFolderDropdowns() {
  const folderFilter = document.getElementById('folder-filter');
  const modalFolderSelect = document.getElementById('modal-folder-select');
  
  // Clear options except first
  folderFilter.innerHTML = '<option value="all">All Folders (Root)</option>';
  modalFolderSelect.innerHTML = '';
  
  // Exclude system folders ('0', '1', '2') and map folders to their full branch path
  const foldersWithPaths = foldersList
    .filter(f => f.title && f.id !== '0' && f.id !== '1' && f.id !== '2' && f.id !== '3')
    .map(folder => ({
      id: folder.id,
      path: getFolderPath(folder.id)
    }))
    // Sort alphabetically by full branch path so subfolders naturally group together
    .sort((a, b) => a.path.localeCompare(b.path));
    
  foldersWithPaths.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.path;
    
    folderFilter.appendChild(option.cloneNode(true));
    modalFolderSelect.appendChild(option);
  });
}

// Calculate Stats for Top Header Cards
function calculateStats() {
  const totalCount = allBookmarks.length;
  document.getElementById('stat-total').textContent = totalCount;

  // Inactive count (default filter: 365 days / 1 year)
  const inactiveLimitMs = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let inactiveCount = 0;
  
  allBookmarks.forEach(b => {
    const lastVisit = historyMap[normalizeUrl(b.url)];
    // If visited > 365 days ago, or never visited (no history record)
    if (!lastVisit || (now - lastVisit) > inactiveLimitMs) {
      inactiveCount++;
    }
  });
  document.getElementById('stat-inactive').textContent = inactiveCount;

  // Duplicate groups count
  const dupGroups = getDuplicateGroups();
  document.getElementById('stat-duplicates').textContent = Object.keys(dupGroups).length;
}

// Find Duplicate Bookmarks grouped by URL
function getDuplicateGroups() {
  const urlGroups = {};
  allBookmarks.forEach(b => {
    if (!b.url) return;
    
    // Normalize URL (strip trailing slashes/hashes for better matching)
    let normUrl = b.url.toLowerCase().trim();
    if (normUrl.endsWith('/')) normUrl = normUrl.slice(0, -1);
    
    if (!urlGroups[normUrl]) {
      urlGroups[normUrl] = [];
    }
    urlGroups[normUrl].push(b);
  });

  // Filter groups that have more than 1 entry
  const duplicateGroups = {};
  Object.keys(urlGroups).forEach(url => {
    if (urlGroups[url].length > 1) {
      duplicateGroups[url] = urlGroups[url];
    }
  });

  return duplicateGroups;
}

// Generate Suggested Categories
function getSuggestedCategories() {
  const categoryBuckets = AUTO_CATEGORIES.map(cat => ({
    ...cat,
    bookmarks: []
  }));

  const uncategorized = [];

  allBookmarks.forEach(bookmark => {
    if (!bookmark.url) return;
    
    const domain = new URL(bookmark.url).hostname.toLowerCase();
    const title = bookmark.title.toLowerCase();
    
    let matched = false;
    for (let bucket of categoryBuckets) {
      // 1. Check domains match
      const domainMatch = bucket.domains.some(d => domain.includes(d));
      // 2. Check keywords match
      const keywordMatch = bucket.keywords.some(k => title.includes(k));
      
      if (domainMatch || keywordMatch) {
        bucket.bookmarks.push(bookmark);
        matched = true;
        break; // Add to first matching category
      }
    }

    if (!matched) {
      uncategorized.push(bookmark);
    }
  });

  // Filter out empty category suggestions
  return categoryBuckets.filter(b => b.bookmarks.length > 0);
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation Tabs
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentTab = item.getAttribute('data-tab');
      selectedBookmarkIds.clear();
      updateBulkActionBar();
      renderApp();
    });
  });

  // Filters & Search
  document.getElementById('search-input').addEventListener('input', renderApp);
  document.getElementById('folder-filter').addEventListener('change', renderApp);
  
  const timeFilter = document.getElementById('time-filter');
  timeFilter.addEventListener('change', renderApp);

  // Select All Checkbox
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const cards = document.querySelectorAll('.bookmark-card-checkbox-input');
    
    selectedBookmarkIds.clear();
    if (isChecked) {
      cards.forEach(cb => {
        const id = cb.getAttribute('data-id');
        selectedBookmarkIds.add(id);
        cb.checked = true;
        cb.closest('.bookmark-card')?.classList.add('selected');
      });
      
      // Handle duplicate item checkboxes if present
      const dupCheckboxes = document.querySelectorAll('.duplicate-item-checkbox');
      dupCheckboxes.forEach(cb => {
        const id = cb.getAttribute('data-id');
        selectedBookmarkIds.add(id);
        cb.checked = true;
      });
    } else {
      cards.forEach(cb => {
        cb.checked = false;
        cb.closest('.bookmark-card')?.classList.remove('selected');
      });
      
      const dupCheckboxes = document.querySelectorAll('.duplicate-item-checkbox');
      dupCheckboxes.forEach(cb => {
        cb.checked = false;
      });
    }
    updateBulkActionBar();
  });

  // Bulk Actions
  document.getElementById('btn-delete').addEventListener('click', showDeleteConfirmModal);
  document.getElementById('btn-move').addEventListener('click', showMoveModal);

  // Modals UI
  document.getElementById('close-modal-btn').addEventListener('click', hideModals);
  document.getElementById('btn-cancel-move').addEventListener('click', hideModals);
  document.getElementById('close-delete-modal-btn').addEventListener('click', hideModals);
  document.getElementById('btn-cancel-delete').addEventListener('click', hideModals);

  // Confirm Actions
  document.getElementById('btn-confirm-delete').addEventListener('click', executeBulkDelete);
  document.getElementById('btn-confirm-move').addEventListener('click', executeBulkMove);

  // Apply Categorizer
  document.getElementById('btn-apply-categories').addEventListener('click', applyAutoCategorization);
}

// Rendering Main Router
function renderApp() {
  const cardsGrid = document.getElementById('cards-grid');
  const duplicatesContainer = document.getElementById('duplicates-container');
  const categorizerContainer = document.getElementById('categorizer-container');
  const timeFilterContainer = document.getElementById('time-filter-container');
  const disclaimerBanner = document.getElementById('history-disclaimer');
  const toolbar = document.querySelector('.toolbar');
  const bulkActionBar = document.querySelector('.bulk-actions-bar');

  // Page Headings
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');
  
  // Hide all sections initially
  cardsGrid.classList.add('hidden');
  duplicatesContainer.classList.add('hidden');
  categorizerContainer.classList.add('hidden');
  timeFilterContainer.classList.add('hidden');
  disclaimerBanner.classList.add('hidden');
  
  // Enable search and folders for standard lists
  toolbar.classList.remove('hidden');
  bulkActionBar.classList.remove('hidden');

  switch (currentTab) {
    case 'all':
      title.textContent = 'All Bookmarks';
      subtitle.textContent = 'Browse and organize your full bookmark collection.';
      cardsGrid.classList.remove('hidden');
      renderBookmarksGrid(getFilteredBookmarks());
      break;

    case 'inactive':
      title.textContent = 'Inactive Bookmarks';
      subtitle.textContent = 'Bookmarks that haven\'t been visited in the selected time period.';
      cardsGrid.classList.remove('hidden');
      timeFilterContainer.classList.remove('hidden');
      disclaimerBanner.classList.remove('hidden');
      renderBookmarksGrid(getFilteredBookmarks());
      break;

    case 'duplicates':
      title.textContent = 'Duplicate Bookmarks';
      subtitle.textContent = 'Clean up duplicate bookmark entries of the same link.';
      duplicatesContainer.classList.remove('hidden');
      // Hide standard folder/search filters for duplicates for cleaner duplicate cleanup
      toolbar.classList.add('hidden');
      renderDuplicatesView();
      break;

    case 'categorizer':
      title.textContent = 'Auto-Categorizer';
      subtitle.textContent = 'Organize bookmarks into logical folders instantly.';
      categorizerContainer.classList.remove('hidden');
      // Hide search and bulk bars as categorizer has its own bulk flow
      toolbar.classList.add('hidden');
      bulkActionBar.classList.add('hidden');
      renderCategorizerView();
      break;
  }
}

// Get Bookmarks after applying search filters and folder filters
function getFilteredBookmarks() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
  const folderFilterVal = document.getElementById('folder-filter').value;
  const timeLimitDays = parseInt(document.getElementById('time-filter').value);
  
  return allBookmarks.filter(b => {
    // 1. Search Query filter
    const matchesSearch = b.title.toLowerCase().includes(searchQuery) || b.url.toLowerCase().includes(searchQuery);
    if (!matchesSearch) return false;

    // 2. Folder filter
    if (folderFilterVal !== 'all' && b.parentId !== folderFilterVal) {
      return false;
    }

    // 3. Time Filter (only for Inactive tab)
    if (currentTab === 'inactive') {
      const lastVisit = historyMap[normalizeUrl(b.url)];
      const thresholdMs = timeLimitDays * 24 * 60 * 60 * 1000;
      
      // If never visited (not in history map), it is considered older than limit.
      if (!lastVisit) return true;
      
      // Check if visited time is older than the threshold
      return (Date.now() - lastVisit) > thresholdMs;
    }

    return true;
  });
}

// Render Bookmarks Grid view
function renderBookmarksGrid(bookmarks) {
  const grid = document.getElementById('cards-grid');
  const emptyState = document.getElementById('empty-state');
  
  grid.innerHTML = '';
  
  if (bookmarks.length === 0) {
    grid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    document.getElementById('empty-message').textContent = 'No bookmarks match your search or filter requirements.';
    return;
  }
  
  emptyState.classList.add('hidden');
  grid.classList.remove('hidden');
  
  bookmarks.forEach(bookmark => {
    const isSelected = selectedBookmarkIds.has(bookmark.id);
    
    // Resolve Domain Favicon
    let faviconUrl = '';
    try {
      const urlObj = new URL(bookmark.url);
      faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch(e) {
      faviconUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%23999"><rect width="16" height="16" rx="3"/></svg>';
    }

    const card = document.createElement('div');
    card.className = `bookmark-card ${isSelected ? 'selected' : ''}`;
    card.setAttribute('data-id', bookmark.id);

    // Meta Badge for folder path
    const folderPath = getFolderPath(bookmark.parentId);
    const folderBadgeHtml = folderPath && folderPath !== '/'
      ? `<span class="badge badge-folder" title="Folder Path: ${folderPath}">📁 ${escapeHtml(folderPath)}</span>`
      : '';

    // Meta Badge for Last Visited
    const lastVisit = historyMap[bookmark.url];
    let visitBadgeHtml = '';
    if (lastVisit) {
      const days = Math.round((Date.now() - lastVisit) / (24 * 60 * 60 * 1000));
      visitBadgeHtml = `<span class="badge badge-status">Opened ${days}d ago</span>`;
    } else {
      // Calculate how long ago the bookmark was created
      const dateAdded = bookmark.dateAdded || Date.now();
      const daysCreated = Math.round((Date.now() - dateAdded) / (24 * 60 * 60 * 1000));
      visitBadgeHtml = `<span class="badge badge-status">Never opened (Created ${daysCreated}d ago)</span>`;
    }

    card.innerHTML = `
      <div class="card-top">
        <div class="card-checkbox-wrapper">
          <input type="checkbox" class="card-checkbox bookmark-card-checkbox-input" data-id="${bookmark.id}" ${isSelected ? 'checked' : ''}>
        </div>
        <img src="${faviconUrl}" width="16" height="16" style="border-radius: 4px; object-fit: contain; flex-shrink: 0;" alt="">
        <div class="card-info">
          <div class="card-title-url-group">
            <h4 class="card-title" title="${escapeHtml(bookmark.title)}">${escapeHtml(bookmark.title || 'Untitled')}</h4>
            <a href="${bookmark.url}" target="_blank" class="card-url" title="${bookmark.url}">${bookmark.url}</a>
          </div>
        </div>
      </div>
      <div class="card-meta">
        ${folderBadgeHtml}
        ${visitBadgeHtml}
      </div>
      <div class="card-actions">
        <button class="btn-icon btn-delete-single" data-id="${bookmark.id}" title="Delete Bookmark">🗑️</button>
      </div>
    `;

    // Click handler for selecting cards
    card.addEventListener('click', (e) => {
      // If clicking URL link, let it open normally
      if (e.target.tagName === 'A' || e.target.closest('.card-url')) return;
      // If clicking delete button, handle deletion
      if (e.target.classList.contains('btn-delete-single')) {
        e.stopPropagation();
        singleDelete(bookmark.id);
        return;
      }

      const cb = card.querySelector('.card-checkbox');
      if (e.target !== cb) {
        cb.checked = !cb.checked;
      }
      
      toggleSelectBookmark(bookmark.id, cb.checked);
      card.classList.toggle('selected', cb.checked);
    });

    grid.appendChild(card);
  });
}

// Render duplicates view
function renderDuplicatesView() {
  const container = document.getElementById('duplicates-container');
  const emptyState = document.getElementById('empty-state');
  
  container.innerHTML = '';
  
  const dupGroups = getDuplicateGroups();
  const urls = Object.keys(dupGroups);
  
  if (urls.length === 0) {
    container.classList.add('hidden');
    emptyState.classList.remove('hidden');
    document.getElementById('empty-message').textContent = 'Congratulations! You have no duplicate bookmarks.';
    return;
  }
  
  emptyState.classList.add('hidden');
  container.classList.remove('hidden');
  
  urls.forEach(url => {
    const list = dupGroups[url];
    const groupCard = document.createElement('div');
    groupCard.className = 'duplicate-group';
    
    groupCard.innerHTML = `
      <div class="duplicate-group-header">
        <div class="duplicate-group-title">
          <span>🔗</span>
          <span style="font-weight: 600;">${escapeHtml(list[0].title || 'Duplicate Link')}</span>
        </div>
        <button class="btn btn-secondary btn-keep-first" style="padding: 6px 12px; font-size: 12px;">Keep First, Select Rest</button>
      </div>
      <a href="${url}" target="_blank" class="duplicate-group-url">${url}</a>
      <div class="duplicate-items-list">
        <!-- Dynamically rendered duplicates of this URL -->
      </div>
    `;
    
    const itemsList = groupCard.querySelector('.duplicate-items-list');
    
    list.forEach((item, index) => {
      const isSelected = selectedBookmarkIds.has(item.id);
      const itemRow = document.createElement('div');
      itemRow.className = 'duplicate-item';
      
      const folderPath = getFolderPath(item.parentId);
      
      itemRow.innerHTML = `
        <div class="duplicate-item-left">
          <input type="checkbox" class="duplicate-item-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
          <div class="duplicate-item-info">
            <div class="duplicate-item-title">${escapeHtml(item.title || 'Untitled')}</div>
            <div class="duplicate-item-path">Path: ${escapeHtml(folderPath)} • Added: ${new Date(item.dateAdded).toLocaleDateString()}</div>
          </div>
        </div>
        <span class="badge badge-duplicate">${index === 0 ? 'Original (Keep)' : 'Duplicate'}</span>
      `;
      
      const cb = itemRow.querySelector('.duplicate-item-checkbox');
      cb.addEventListener('change', (e) => {
        toggleSelectBookmark(item.id, e.target.checked);
      });
      
      itemsList.appendChild(itemRow);
    });
    
    // "Keep First, Select Rest" helper helper action
    groupCard.querySelector('.btn-keep-first').addEventListener('click', () => {
      const checkboxes = groupCard.querySelectorAll('.duplicate-item-checkbox');
      checkboxes.forEach((cb, idx) => {
        if (idx === 0) {
          cb.checked = false;
          toggleSelectBookmark(list[idx].id, false);
        } else {
          cb.checked = true;
          toggleSelectBookmark(list[idx].id, true);
        }
      });
    });

    container.appendChild(groupCard);
  });
}

// Render Suggested AI Categorization Panel
function renderCategorizerView() {
  const listContainer = document.getElementById('categorizer-groups-list');
  const emptyState = document.getElementById('empty-state');
  
  listContainer.innerHTML = '';
  
  const suggestedCategories = getSuggestedCategories();
  
  if (suggestedCategories.length === 0) {
    document.getElementById('btn-apply-categories').disabled = true;
    listContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');
    document.getElementById('empty-message').textContent = 'We couldn\'t find any clear folder recommendations for your current bookmarks.';
    return;
  }
  
  document.getElementById('btn-apply-categories').disabled = false;
  emptyState.classList.add('hidden');
  listContainer.classList.remove('hidden');

  suggestedCategories.forEach(category => {
    const card = document.createElement('div');
    card.className = 'category-group-card';
    
    card.innerHTML = `
      <div class="category-group-header">
        <div class="category-name-wrapper">
          <span class="category-icon">${category.icon}</span>
          <span class="category-name">${category.name}</span>
        </div>
        <span class="category-count">${category.bookmarks.length} links</span>
      </div>
      <div class="category-bookmarks-list">
        <!-- populated -->
      </div>
    `;
    
    const itemsList = card.querySelector('.category-bookmarks-list');
    category.bookmarks.forEach(b => {
      const item = document.createElement('div');
      item.className = 'category-bookmark-item';
      item.innerHTML = `
        <span style="font-size: 11px;">🔗</span>
        <span title="${escapeHtml(b.title || b.url)}">${escapeHtml(b.title || b.url)}</span>
      `;
      itemsList.appendChild(item);
    });

    listContainer.appendChild(card);
  });
}

// Keep Track of Selected Bookmarks
function toggleSelectBookmark(id, isSelected) {
  if (isSelected) {
    selectedBookmarkIds.add(id);
  } else {
    selectedBookmarkIds.delete(id);
  }
  updateBulkActionBar();
}

// Enable/Disable buttons based on selection count
function updateBulkActionBar() {
  const count = selectedBookmarkIds.size;
  document.getElementById('selected-count').textContent = `${count} selected`;
  
  const btnDelete = document.getElementById('btn-delete');
  const btnMove = document.getElementById('btn-move');
  
  if (count > 0) {
    btnDelete.removeAttribute('disabled');
    btnMove.removeAttribute('disabled');
  } else {
    btnDelete.setAttribute('disabled', 'true');
    btnMove.setAttribute('disabled', 'true');
  }
  
  // Synchronize top checkbox state
  const topCheckbox = document.getElementById('select-all-checkbox');
  const cardsCount = document.querySelectorAll('.bookmark-card-checkbox-input, .duplicate-item-checkbox').length;
  
  if (count === 0) {
    topCheckbox.checked = false;
    topCheckbox.indeterminate = false;
  } else if (count === cardsCount) {
    topCheckbox.checked = true;
    topCheckbox.indeterminate = false;
  } else {
    topCheckbox.checked = false;
    topCheckbox.indeterminate = true;
  }
}

// Show Modals
function showMoveModal() {
  document.getElementById('modal-selected-count').textContent = selectedBookmarkIds.size;
  document.getElementById('new-folder-input').value = '';
  document.getElementById('move-modal').classList.remove('hidden');
}

function showDeleteConfirmModal() {
  document.getElementById('delete-selected-count').textContent = selectedBookmarkIds.size;
  document.getElementById('delete-modal').classList.remove('hidden');
}

function hideModals() {
  document.getElementById('move-modal').classList.add('hidden');
  document.getElementById('delete-modal').classList.add('hidden');
}

// Single Delete Action
async function singleDelete(id) {
  if (confirm("Are you sure you want to delete this bookmark?")) {
    if (isMockMode) {
      allBookmarks = allBookmarks.filter(b => b.id !== id);
    } else {
      await new Promise(resolve => chrome.bookmarks.remove(id, resolve));
    }
    selectedBookmarkIds.delete(id);
    await loadData();
    renderApp();
  }
}

// Execute Bulk Delete
async function executeBulkDelete() {
  showLoading(true);
  hideModals();
  
  const idsToDelete = Array.from(selectedBookmarkIds);
  
  if (isMockMode) {
    allBookmarks = allBookmarks.filter(b => !idsToDelete.includes(b.id));
  } else {
    // Delete bookmarks concurrently
    await Promise.all(idsToDelete.map(id => {
      return new Promise(resolve => chrome.bookmarks.remove(id, resolve));
    }));
  }
  
  selectedBookmarkIds.clear();
  await loadData();
  renderApp();
}

// Execute Bulk Move to Folder
async function executeBulkMove() {
  showLoading(true);
  hideModals();
  
  const idsToMove = Array.from(selectedBookmarkIds);
  let targetFolderId = document.getElementById('modal-folder-select').value;
  const newFolderName = document.getElementById('new-folder-input').value.trim();

  if (isMockMode) {
    if (newFolderName) {
      // Simulate creating new folder
      targetFolderId = Math.random().toString(36).substring(7);
      foldersMap[targetFolderId] = newFolderName;
      foldersList.push({ id: targetFolderId, title: newFolderName });
    }
    
    // Move items in mock data
    allBookmarks.forEach(b => {
      if (idsToMove.includes(b.id)) {
        b.parentId = targetFolderId;
      }
    });
  } else {
    // 1. Check if user wants to create a new folder
    if (newFolderName) {
      // Create folder inside 'Other Bookmarks' (usually parentId '2') or 'Bookmarks Bar' ('1')
      const newFolder = await new Promise(resolve => {
        chrome.bookmarks.create({
          parentId: '1', // Bookmarks bar
          title: newFolderName
        }, resolve);
      });
      targetFolderId = newFolder.id;
    }

    // 2. Move bookmarks
    await Promise.all(idsToMove.map(id => {
      return new Promise(resolve => {
        chrome.bookmarks.move(id, { parentId: targetFolderId }, resolve);
      });
    }));
  }

  selectedBookmarkIds.clear();
  await loadData();
  renderApp();
}

// Auto-Categorizer: Apply suggested groupings
async function applyAutoCategorization() {
  if (!confirm("This will organize all classified bookmarks into suggested folders. Do you want to continue?")) {
    return;
  }

  showLoading(true);
  const suggestedCategories = getSuggestedCategories();

  for (let cat of suggestedCategories) {
    let folderId = null;
    
    // Check if folder already exists in our loaded folders
    const existingFolder = foldersList.find(f => f.title.toLowerCase() === cat.name.toLowerCase());
    
    if (existingFolder) {
      folderId = existingFolder.id;
    } else {
      // Create folder
      if (isMockMode) {
        folderId = Math.random().toString(36).substring(7);
        foldersMap[folderId] = cat.name;
        foldersList.push({ id: folderId, title: cat.name });
      } else {
        const folder = await new Promise(resolve => {
          chrome.bookmarks.create({ parentId: '1', title: cat.name }, resolve);
        });
        folderId = folder.id;
      }
    }

    // Move bookmarks to this folder
    const idsToMove = cat.bookmarks.map(b => b.id);
    if (isMockMode) {
      allBookmarks.forEach(b => {
        if (idsToMove.includes(b.id)) {
          b.parentId = folderId;
        }
      });
    } else {
      await Promise.all(idsToMove.map(id => {
        return new Promise(resolve => {
          chrome.bookmarks.move(id, { parentId: folderId }, resolve);
        });
      }));
    }
  }

  alert("Categorization complete! All matching bookmarks have been filed.");
  await loadData();
  renderApp();
}

// Loading state overlay control
function showLoading(show) {
  const spinner = document.getElementById('loading-spinner');
  const grid = document.getElementById('cards-grid');
  const empty = document.getElementById('empty-state');
  
  if (show) {
    spinner.classList.remove('hidden');
    grid.classList.add('hidden');
    empty.classList.add('hidden');
  } else {
    spinner.classList.add('hidden');
  }
}

// Utility function to escape HTML string
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
