# PolyModeler

Easy-to-use low poly 3D modeler for iPad built with Three.js and Capacitor.

## Features

- 🎨 **Low-poly modeling** - Create simple 3D models with primitive shapes
- 📱 **iPad optimized** - Touch-friendly UI with gesture controls
- 🎯 **Simple controls** - Intuitive panels for shapes, colors, and transforms
- 💾 **Export** - Export models as OBJ files
- ✨ **Real-time preview** - See your changes instantly

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

Run the dev server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

Build for production:

```bash
npm run build
```

### iOS Development

Sync with iOS and open in Xcode:

```bash
npm run ios
```

## Project Structure

```
PolyModeler/
├── src/              # Source files
│   ├── index.html    # Main HTML file
│   ├── app.ts        # Main application class
│   └── scripts/      # Old viewer (deprecated)
├── ios/              # iOS Capacitor app
├── dist/             # Build output (git-ignored)
└── node_modules/     # Dependencies (git-ignored)
```

## Usage

### Controls

- **Click** - Select objects
- **Drag** - Orbit camera
- **Scroll** - Zoom in/out

### Toolbar

- ➕ **Add Shape** - Spawn primitives (cube, sphere, cylinder, cone, torus)
- ↔️ **Transform** - Move, rotate, and scale selected objects
- 🎨 **Color** - Change object colors
- ◻️ **Wireframe** - Toggle wireframe mode
- 🗑️ **Delete** - Remove selected object
- 💾 **Export** - Download as OBJ file

## Tech Stack

- **Three.js** - 3D rendering
- **Capacitor** - Native iOS wrapper
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool

## License

MIT
