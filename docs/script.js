let bookmarks = [];
let config = {};
let filteredBookmarks = [];
let selectedIndex = 0;
let currentCommandSuggestions = [];

const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results');

const STORAGE_KEYS = {
  CONFIG: 'startpageConfig',
  BOOKMARKS: 'startpageBookmarks'
};

const DEFAULT_CONFIG = {
  backgroundColor: '#000000',
  textColor: '#ffffff',
  accentColor: '#4a9eff',
  searchEngine: 'https://www.startpage.com/search?q=',
  backgroundImage: '',
  backgroundBlur: 0,
  maskColor: '#000000',
  maskOpacity: 60
};

const STYLE_CONSTANTS = {
  HOVER_OPACITY: 0.1,
  SELECTED_OPACITY: 0.2
};

/**
 * Generic function to load data from localStorage or JSON file.
 * @param {string} storageKey - localStorage key
 * @param {string} jsonFile - JSON file path
 * @param {*} fallback - Fallback value if both sources fail
 * @returns {Promise<*>} - Loaded data
 */
async function loadFromStorageOrFile(storageKey, jsonFile, fallback) {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    return JSON.parse(saved);
  }

  try {
    const response = await fetch(jsonFile);
    return await response.json();
  } catch (error) {
    console.error(`Failed to load ${jsonFile}:`, error);
    return fallback;
  }
}

/**
 * Loads configuration from localStorage or config.json file.
 * Falls back to DEFAULT_CONFIG if both sources fail.
 */
async function loadConfig() {
  config = await loadFromStorageOrFile(STORAGE_KEYS.CONFIG, 'config.json', DEFAULT_CONFIG);
  applyConfig();
}

/**
 * Loads bookmarks from localStorage or bookmark.json file.
 * Falls back to empty array if both sources fail.
 */
async function loadBookmarks() {
  bookmarks = await loadFromStorageOrFile(STORAGE_KEYS.BOOKMARKS, 'bookmark.json', []);
}

function getOrCreateStyleElement(id) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('style');
    element.id = id;
    document.head.appendChild(element);
  }
  return element;
}

function removeElementById(id) {
  const element = document.getElementById(id);
  if (element) {
    element.remove();
  }
}

function applyBackgroundImage(backgroundImage, backgroundBlur) {
  const blur = backgroundBlur || DEFAULT_CONFIG.backgroundBlur;
  const filterValue = blur > 0 ? `blur(${blur}px)` : 'none';

  const bgStyle = getOrCreateStyleElement('background-style');
  bgStyle.textContent = `
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('${backgroundImage}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: ${filterValue};
      z-index: -2;
    }
  `;
  document.body.style.backgroundImage = 'none';
}

function applyMask(maskColor, maskOpacity) {
  removeElementById('background-mask');

  const opacity = (maskOpacity || DEFAULT_CONFIG.maskOpacity) / 100;
  if (opacity > 0) {
    const mask = document.createElement('div');
    mask.id = 'background-mask';
    Object.assign(mask.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: maskColor || DEFAULT_CONFIG.maskColor,
      opacity: opacity.toString(),
      zIndex: '-1',
      pointerEvents: 'none'
    });
    document.body.appendChild(mask);
  }
}

function applyConfig() {
  const {
    backgroundColor,
    textColor,
    accentColor,
    backgroundImage,
    backgroundBlur,
    maskColor,
    maskOpacity
  } = config;

  document.body.style.backgroundColor = backgroundColor || DEFAULT_CONFIG.backgroundColor;
  document.body.style.color = textColor || DEFAULT_CONFIG.textColor;
  searchInput.style.color = textColor || DEFAULT_CONFIG.textColor;

  if (backgroundImage) {
    applyBackgroundImage(backgroundImage, backgroundBlur);
    applyMask(maskColor, maskOpacity);
  } else {
    document.body.style.backgroundImage = 'none';
    removeElementById('background-style');
    removeElementById('background-mask');
  }

  const color = accentColor || DEFAULT_CONFIG.accentColor;
  const style = getOrCreateStyleElement('dynamic-style');
  style.textContent = `
    .bookmark-item:hover,
    .bookmark-item.selected {
      border-left-color: ${color};
    }
    .bookmark-item:hover {
      background-color: ${hexToRgba(color, STYLE_CONSTANTS.HOVER_OPACITY)};
    }
    .bookmark-item.selected {
      background-color: ${hexToRgba(color, STYLE_CONSTANTS.SELECTED_OPACITY)};
    }
  `;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const commands = [
  { name: ':list', description: 'Show all bookmarks' },
  { name: ':config', description: 'Open settings' },
  { name: ':bookmark', description: 'Edit bookmarks' },
  { name: ':export', description: 'Export settings and bookmarks' },
  { name: ':import', description: 'Import settings and bookmarks' },
  { name: ':help', description: 'Show help' },
  { name: ':reset', description: 'Reset all settings and bookmarks' }
];

let showingAllBookmarks = false;

const commandHandlers = {
  ':config': () => { window.location.href = 'config.html'; },
  ':bookmark': () => { window.location.href = 'bookmarks.html'; },
  ':help': () => { toggleHelp(); },
  ':list': () => {
    showingAllBookmarks = true;
    filteredBookmarks = bookmarks;
    selectedIndex = 0;
    renderResults();
    searchInput.value = '';
    searchInput.focus();
  },
  ':reset': () => {
    if (confirm('Reset all settings and bookmarks to default? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
      window.location.reload();
    }
  },
  ':export': () => { exportData(); },
  ':import': () => { importData(); }
};

/**
 * Executes a command if the query matches a known command.
 * @param {string} query - The command string to execute
 * @returns {boolean} - True if command was executed, false otherwise
 */
function executeCommand(query) {
  const handler = commandHandlers[query];
  if (handler) {
    handler();
    return true;
  }
  return false;
}

function getFromLocalStorage(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

/**
 * Exports settings and bookmarks as a JSON file
 */
function exportData() {
  const data = {
    config: getFromLocalStorage(STORAGE_KEYS.CONFIG, config),
    bookmarks: getFromLocalStorage(STORAGE_KEYS.BOOKMARKS, bookmarks),
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `startpage-export-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports settings and bookmarks from a JSON file
 */
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (data.config) {
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
        }
        if (data.bookmarks) {
          localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(data.bookmarks));
        }

        alert('Import successful! Page will reload.');
        window.location.reload();
      } catch (error) {
        alert('Failed to import: Invalid file format');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/**
 * Checks if a bookmark matches the search query.
 * @param {Object} bookmark - The bookmark to check
 * @param {string} lowerQuery - The lowercased search query
 * @returns {boolean} - True if bookmark matches
 */
function bookmarkMatches(bookmark, lowerQuery) {
  return bookmark.name.toLowerCase().includes(lowerQuery) ||
         bookmark.url.toLowerCase().includes(lowerQuery) ||
         bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
}

/**
 * Filters bookmarks or shows command suggestions based on query.
 * @param {string} query - The search query
 */
function filterBookmarks(query) {
  if (!query) {
    filteredBookmarks = showingAllBookmarks ? bookmarks : [];
    currentCommandSuggestions = [];
    selectedIndex = 0;
    renderResults();
    return;
  }

  if (query.startsWith(':')) {
    showingAllBookmarks = false;
    const matchedCommands = commands.filter(cmd =>
      cmd.name.startsWith(query.toLowerCase())
    );
    currentCommandSuggestions = matchedCommands;
    selectedIndex = 0;
    renderCommandSuggestions(matchedCommands);
    return;
  }

  currentCommandSuggestions = [];
  const lowerQuery = query.toLowerCase();
  filteredBookmarks = bookmarks.filter(bookmark => bookmarkMatches(bookmark, lowerQuery));
  selectedIndex = 0;
  renderResults();
}

function createTextElement(className, text) {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = text;
  return element;
}

function createResultItem(isSelected, onClickHandler) {
  const item = document.createElement('div');
  item.className = 'bookmark-item' + (isSelected ? ' selected' : '');
  item.addEventListener('click', onClickHandler);
  return item;
}

function renderCommandSuggestions(matchedCommands) {
  resultsContainer.innerHTML = '';

  matchedCommands.forEach((cmd, index) => {
    const item = createResultItem(index === selectedIndex, () => {
      searchInput.value = cmd.name;
      executeCommand(cmd.name);
    });

    item.appendChild(createTextElement('bookmark-name', cmd.name));
    item.appendChild(createTextElement('bookmark-url', cmd.description));
    resultsContainer.appendChild(item);
  });

  updateScrollFade();
}

function createTagsElement(tags) {
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'bookmark-tags';
  tags.forEach(tag => {
    const tagSpan = document.createElement('span');
    tagSpan.className = 'tag';
    tagSpan.textContent = `#${tag}`;
    tagsContainer.appendChild(tagSpan);
  });
  return tagsContainer;
}

function renderResults() {
  resultsContainer.innerHTML = '';

  filteredBookmarks.forEach((bookmark, index) => {
    const item = createResultItem(index === selectedIndex, () => openBookmark(bookmark));

    item.appendChild(createTextElement('bookmark-name', bookmark.name));
    item.appendChild(createTextElement('bookmark-url', bookmark.url));
    item.appendChild(createTagsElement(bookmark.tags));
    resultsContainer.appendChild(item);
  });

  updateScrollFade();
}

function openBookmark(bookmark) {
  window.location.href = bookmark.url;
}

function toggleHelp() {
  const existingOverlay = document.getElementById('help-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
    return;
  }

  const accentColor = config.accentColor || DEFAULT_CONFIG.accentColor;
  const textColor = config.textColor || DEFAULT_CONFIG.textColor;

  const helpOverlay = document.createElement('div');
  helpOverlay.id = 'help-overlay';
  Object.assign(helpOverlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000'
  });

  const helpContent = document.createElement('div');
  Object.assign(helpContent.style, {
    background: 'rgba(20, 20, 20, 0.95)',
    border: `1px solid ${accentColor}`,
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '500px',
    color: textColor
  });

  helpContent.innerHTML = `
    <h2 style="margin-bottom: 30px; text-align: center; color: ${accentColor};">Keyboard Shortcuts</h2>
    <div style="line-height: 2;">
      <div><strong>:</strong> - Show command suggestions</div>
      <div><strong>:list</strong> - Show all bookmarks</div>
      <div><strong>:config</strong> - Open settings</div>
      <div><strong>:bookmark</strong> - Edit bookmarks</div>
      <div><strong>:export</strong> - Export settings and bookmarks</div>
      <div><strong>:import</strong> - Import settings and bookmarks</div>
      <div><strong>:reset</strong> - Reset all settings and bookmarks</div>
      <div><strong>:help</strong> - Show/hide this help</div>
      <div><strong>↓ / ↑</strong> - Move down / up</div>
      <div><strong>Enter</strong> - Open bookmark / Search</div>
      <div><strong>Esc</strong> - Clear input / Close help</div>
    </div>
    <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9rem;">
      Press Esc to close
    </div>
  `;

  helpOverlay.appendChild(helpContent);
  document.body.appendChild(helpOverlay);

  helpOverlay.addEventListener('click', (e) => {
    if (e.target === helpOverlay) {
      helpOverlay.remove();
    }
  });
}

/**
 * Updates the fade effect classes based on scroll position.
 */
function updateScrollFade() {
  const container = resultsContainer;
  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;

  // Check if content is scrollable
  const isScrollable = scrollHeight > clientHeight;

  if (!isScrollable) {
    container.classList.remove('has-scroll-top', 'has-scroll-bottom');
    return;
  }

  // Check if scrolled from top (with small threshold)
  const hasScrollTop = scrollTop > 10;

  // Check if not at bottom (with small threshold)
  const hasScrollBottom = scrollTop < scrollHeight - clientHeight - 10;

  container.classList.toggle('has-scroll-top', hasScrollTop);
  container.classList.toggle('has-scroll-bottom', hasScrollBottom);
}

/**
 * Scrolls the selected item into view, keeping it centered when possible.
 */
function scrollSelectedIntoView() {
  const container = resultsContainer;
  const selectedElement = container.querySelector('.bookmark-item.selected');

  if (!selectedElement) return;

  const containerRect = container.getBoundingClientRect();
  const elementRect = selectedElement.getBoundingClientRect();
  const containerHeight = containerRect.height;
  const elementHeight = elementRect.height;

  // Calculate the center position
  const centerPosition = containerHeight / 2 - elementHeight / 2;

  // Get current scroll position relative to container
  const elementTop = selectedElement.offsetTop;
  const currentScroll = container.scrollTop;

  // Calculate desired scroll position to center the element
  const desiredScroll = elementTop - centerPosition;

  // Smooth scroll to the desired position
  container.scrollTo({
    top: desiredScroll,
    behavior: 'smooth'
  });

  // Update fade effects after scroll
  setTimeout(updateScrollFade, 100);
}

/**
 * Moves the selection cursor up or down in the results list.
 * @param {string} direction - Either 'up' or 'down'
 */
function moveSelection(direction) {
  const items = currentCommandSuggestions.length > 0 ? currentCommandSuggestions : filteredBookmarks;
  if (items.length === 0) return;

  const delta = direction === 'down' ? 1 : -1;
  const newIndex = selectedIndex + delta;

  // Don't loop - stop at boundaries
  if (newIndex < 0 || newIndex >= items.length) {
    return;
  }

  selectedIndex = newIndex;

  if (currentCommandSuggestions.length > 0) {
    renderCommandSuggestions(currentCommandSuggestions);
  } else {
    renderResults();
  }

  scrollSelectedIntoView();
}

searchInput.addEventListener('input', (e) => {
  filterBookmarks(e.target.value);
});

// Add scroll event listener to update fade effects
resultsContainer.addEventListener('scroll', updateScrollFade);

document.addEventListener('keydown', (e) => {
  const isInputFocused = document.activeElement === searchInput;
  const noModifiers = !e.ctrlKey && !e.metaKey;

  // Auto-focus on typing
  if (!isInputFocused && noModifiers && !e.altKey && e.key.length === 1 && e.key !== ' ') {
    searchInput.focus();
    return;
  }

  // Navigation and actions when input is focused
  if (isInputFocused) {
    if (e.key === 'ArrowDown' && noModifiers) {
      e.preventDefault();
      moveSelection('down');
    } else if (e.key === 'ArrowUp' && noModifiers) {
      e.preventDefault();
      moveSelection('up');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleEnterKey();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEscapeKey();
    }
  }
});

function isUrl(query) {
  // Check if it looks like a URL or domain
  if (query.startsWith('http://') || query.startsWith('https://')) {
    return true;
  }

  // Check if it looks like a domain (contains dot and no spaces)
  if (/^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+/.test(query)) {
    return true;
  }

  return false;
}

function handleEnterKey() {
  const query = searchInput.value.trim();

  if (currentCommandSuggestions.length > 0) {
    const selectedCommand = currentCommandSuggestions[selectedIndex];
    searchInput.value = selectedCommand.name;
    currentCommandSuggestions = [];
    executeCommand(selectedCommand.name);
    return;
  }

  if (executeCommand(query)) {
    return;
  }

  if (filteredBookmarks.length > 0) {
    openBookmark(filteredBookmarks[selectedIndex]);
  } else if (query && !query.startsWith(':')) {
    if (isUrl(query)) {
      // Add https:// if no protocol specified
      const url = query.startsWith('http') ? query : `https://${query}`;
      window.location.href = url;
    } else {
      const searchEngine = config.searchEngine || DEFAULT_CONFIG.searchEngine;
      window.location.href = searchEngine + encodeURIComponent(query);
    }
  }
}

function handleEscapeKey() {
  const helpOverlay = document.getElementById('help-overlay');
  if (helpOverlay) {
    helpOverlay.remove();
  } else {
    showingAllBookmarks = false;
    searchInput.value = '';
    filterBookmarks('');
    searchInput.focus();
  }
}

async function init() {
  await loadConfig();
  await loadBookmarks();
}

init();
