

# UrbanRewear – Cloth Redesign Canvas

A mobile-first, single-page design canvas app built with React, Tailwind CSS, and Konva.js. Users upload clothing images and redesign them with drawing tools, shapes, text, and assets — then send designs to AI for reimagining.

## Branding & Visual Style
- **Logo**: The uploaded UR gradient logo displayed in the top header bar
- **Theme**: Dark base UI with rainbow gradient accents inspired by the logo (purple → blue → cyan → green → yellow → orange → red)
- **Mobile-first**: Optimized for phones, scales gracefully to desktop

---

## Layout (Single Page)

### Top Toolbar
- UR logo + app name "UrbanRewear" on the left
- Undo / Redo buttons
- Save, Export, and Version History buttons on the right

### Center: Canvas Area
- Konva.js stage filling the main viewport
- Toggle between **Design Canvas** and **AI Preview** modes (tab-style toggle above the canvas)
- In AI Preview mode, a prominent **"Send to AI"** button appears

### Bottom Panel
- Scrollable icon-based tool selector (tap to activate a tool, tap again or swipe to see options)
- Tools expand upward into a small options tray when selected (e.g., color picker, thickness slider)

---

## Features

### 1. Drawing Tools
- Freehand brush with color palette, stroke thickness slider, opacity slider
- Selectable stroke styles (solid, dashed, dotted)
- Stroke sloppiness control (smooth ↔ sketchy)
- Eraser tool

### 2. Shape Tools
- Line, Rectangle/Square, Circle/Ellipse, Triangle, Star, Arrow, Polygon
- Fill color + stroke color for shapes

### 3. Text Tool
- Add text anywhere on canvas
- Font family selector (curated list of web fonts)
- Font size, color, bold/italic controls

### 4. Image Upload
- **Upload clothing image** — sets as the base canvas background layer
- **Upload assets** (patches, logos, patterns) — added as movable/resizable objects on the canvas

### 5. Selection & Transform
- Tap to select any object → resize handles, rotation
- Group / Ungroup selected objects
- Copy, Duplicate, Delete
- Reflect (flip horizontal/vertical)

### 6. Layers Panel
- Simple layer list showing all objects
- Reorder layers (move up/down)
- Toggle visibility per layer
- Lock layers

### 7. Canvas Management
- **Save**: Auto-save to localStorage + manual save
- **Export**: Download as PNG or JSON (design file)
- **Import**: Load a previously exported JSON design
- **Version History**: List of saved versions in localStorage with timestamps, restore any version

### 8. AI Redesign Integration
- Toggle switch to flip between Design Canvas ↔ AI Preview
- **Send to AI** button in the Preview panel (placeholder — logs the canvas data, ready for future backend integration)
- Preview area shows a placeholder/mock result for now

### 9. Color Palette
- Preset color swatches + custom color picker
- Recently used colors row

