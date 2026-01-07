# Save The Past

Digital archaeology reconstruction app - transform archaeological artifacts into 3D models.

## Features

- **3D Reconstruction**: Generate 3D models from artifact photos using AI
- **Info Card Generation**: AI-powered artifact analysis with material, age, and cultural context
- **Multi-language**: English and Hebrew (RTL) support
- **Mobile-First**: Designed for field use on phones, works great on desktop too
- **Offline Storage**: All data stored locally in your browser

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Capture**: Take photos of an artifact from multiple angles or upload existing photos
2. **Generate 3D Model**: AI creates a 3D reconstruction from your photos
3. **View Info Card**: Get AI-generated analysis including material, estimated age, and cultural context
4. **Gallery**: Browse and manage all your documented artifacts

## Install as App

Save The Past is a Progressive Web App (PWA). You can install it on your phone:

- **iOS**: Open in Safari, tap Share, then "Add to Home Screen"
- **Android**: Open in Chrome, tap menu, then "Install app" or "Add to Home Screen"

## Tech Stack

- React 19 + TypeScript
- Vite
- TailwindCSS v4
- i18next (internationalization)
- IndexedDB (local storage)

## License

MIT
