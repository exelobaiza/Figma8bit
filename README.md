# Figma 8-bit Image Converter

A Figma plugin that transforms your images into retro 8-bit style pixelated art with customizable pixel sizes.

<img src="pluginCover.png"/>

## Features

- 🎮 Convert images to 8-bit pixel art style
- 🔧 Customize pixel size for different effects
- 🖼️ Support for multiple image formats
- 🎨 Maintain color palette authenticity
- ⚡ Batch conversion support
- 🔄 Real-time preview

## How It Works

The plugin takes your selected images in Figma and applies an 8-bit pixelation effect, allowing you to:
- Choose your desired pixel size
- Preview the result before applying
- Convert multiple images at once
- Maintain aspect ratio while pixelating

## Installation

1. Open Figma
2. Go to Menu > Plugins > Development > Import plugin from manifest
3. Select the manifest.json file from this project

## Usage

1. Select an image or multiple images in Figma
2. Run the plugin
3. Choose your desired pixel size using the slider
4. Preview the result
5. Click "Apply" to convert your images

## Technical Details

- Built with Figma Plugin API
- Uses image processing algorithms for pixelation
- Supports various image formats
- Optimized for performance with large images

## Development

The plugin consists of:
- `code.js`: Main plugin logic for image processing
- `ui.html`: Plugin UI interface with pixel size controls
- `manifest.json`: Plugin configuration

### Storage Structure

```javascript
pageStatuses: {
  [pageId]: {
    status: string
  }
}