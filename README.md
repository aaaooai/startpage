# Startpage

A minimal, keyboard-driven browser startpage with bookmark management and customizable themes.

## Features

- **Keyboard-First Navigation**: Navigate and search entirely with your keyboard
- **Real-time Bookmark Search**: Instantly filter bookmarks by name, URL, or tags
- **Command System**: Vim-style commands for quick actions
- **Customizable Appearance**: Configure colors, background images, blur, and mask overlays
- **Smart URL Detection**: Automatically opens domains or searches the web
- **Import/Export**: Backup and restore your settings and bookmarks
- **localStorage Support**: All settings persist locally with JSON fallback

## Quick Start

1. Clone this repository
   ```bash
   git clone https://github.com/aaaooai/startpage.git
   cd startpage
   ```
2. Open `docs/index.html` in your browser
3. Set it as your browser's homepage

### Local Development with Docker/Podman

You can run the startpage locally using Docker or Podman:

**Using Docker Compose or Podman Compose:**
```bash
docker compose up -d
# or
podman compose up -d
```

**Using Docker or Podman directly:**
```bash
# Docker
docker run --rm -it -v ./docs:/usr/share/nginx/html -p 8000:80 nginx:latest

# Podman
podman run --rm -it -v ./docs:/usr/share/nginx/html:Z -p 8000:80 docker.io/nginx:latest
```

Then access at `http://localhost:8000`

### GitHub Pages Deployment

The startpage is designed to work with GitHub Pages:

1. Push the repository to GitHub
2. Enable GitHub Pages in repository settings
3. Select the `docs` folder as the source
4. Access at `https://<username>.github.io/<repository>/`

## Usage

### Basic Search

- **Type to search**: Start typing to filter bookmarks in real-time
- **Direct URL**: Enter a domain (e.g., `github.com`) to open it directly
- **Web search**: Enter any text to search with your configured search engine
- **Arrow keys**: Navigate through results with `↑` and `↓`
- **Enter**: Open selected bookmark or perform search
- **Escape**: Clear input field

### Commands

All commands start with `:` and support autocomplete:

- `:list` - Show all bookmarks
- `:config` - Open settings page
- `:bookmark` - Edit bookmarks
- `:export` - Export settings and bookmarks as JSON
- `:import` - Import settings and bookmarks from JSON
- `:help` - Show keyboard shortcuts
- `:reset` - Reset all settings to default (with confirmation)

### Managing Bookmarks

Access the bookmark editor with `:bookmark` or navigate to `bookmarks.html`.

#### Adding Bookmarks

- Click any `+` button between bookmarks to insert at that position
- Fill in the name, URL, and optional tags
- Changes are saved automatically

#### Editing Bookmarks

- **Name**: Required field (displays in search results)
- **URL**: Required field, must be a valid URL format
- **Tags**: Optional, comma-separated with space after comma (e.g., `dev, code, web`)
- Invalid fields are highlighted with a red border
- Tags are auto-formatted on blur

#### Reordering Bookmarks

- Drag bookmarks by the `≡` handle on the right
- A blue line shows where the bookmark will be inserted
- Order is saved automatically

#### Deleting Bookmarks

- Click the `×` button in the top-right corner of any bookmark
- Confirmation dialog will appear
- Invalid bookmarks (empty URL) are removed when navigating back to the startpage

### Customizing Appearance

Access settings with `:config` or navigate to `config.html`.

#### Basic Colors

- **Background Color**: Main background color
- **Text Color**: Primary text color
- **Accent Color**: Highlight color for selected items and borders

#### Background Image

- **Background Image URL**: Local file path or external URL
- **Background Blur**: 0-20px blur effect (use slider)
- **Mask Color**: Color overlay on background image
- **Mask Opacity**: 0-100% opacity for mask (use slider, default: 60%)

*Tip: Use blur and mask to improve text readability over background images*

#### Search Engine

Enter your preferred search engine URL with query parameter, e.g.:
- `https://www.google.com/search?q=`
- `https://duckduckgo.com/?q=`
- `https://www.startpage.com/search?q=`

All settings are previewed in real-time and saved automatically.

## Data Management

### Export Settings

1. Use `:export` command
2. A JSON file will download with timestamp: `startpage-export-YYYY-MM-DD.json`
3. Contains all settings and bookmarks

### Import Settings

1. Use `:import` command
2. Select a previously exported JSON file
3. Page will reload with imported settings

### Reset to Default

1. Use `:reset` command
2. Confirm the action
3. All localStorage data is cleared and page reloads

## File Structure

```
startpage/
├── docs/
│   ├── index.html          # Main startpage
│   ├── config.html         # Settings page
│   ├── bookmarks.html      # Bookmark editor
│   ├── script.js           # Main application logic
│   ├── style.css           # Shared styles
│   ├── config.json         # Default configuration (fallback)
│   └── bookmark.json       # Default bookmarks (fallback)
└── README.md
```

## Default Configuration

```json
{
  "backgroundColor": "#000000",
  "textColor": "#ffffff",
  "accentColor": "#4a9eff",
  "searchEngine": "https://www.startpage.com/search?q=",
  "backgroundImage": "",
  "backgroundBlur": 0,
  "maskColor": "#000000",
  "maskOpacity": 60
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Type` | Auto-focus search and filter bookmarks |
| `:` | Show command suggestions |
| `↓` / `↑` | Navigate results |
| `Enter` | Open bookmark / Execute command / Search |
| `Esc` | Clear input / Close help |

## Browser Compatibility

- Modern browsers with ES6+ support
- localStorage API required
- Tested on: Chrome, Firefox, Safari, Edge

## Privacy

- All data stored locally in browser's localStorage
- No external requests except for user-configured background images
- No analytics or tracking

## License

MIT License - Feel free to modify and use as you wish.
