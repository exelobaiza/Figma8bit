# 8-Bit Pixel Art Converter for Figma

A Figma plugin that converts your images into beautiful 8-bit pixel art style, complete with authentic retro color palettes.

## Features

- Convert any image into pixel art using nearest-neighbor scaling
- Choose from classic retro color palettes:
  - NES (52 colors)
  - Game Boy (4 colors)
  - SNES (256 colors)
- Adjustable pixel size (2px to 16px)
- Live preview of the effect
- Export options:
  - Apply directly to the selected image
  - Export as a new PNG layer

## How to Use

1. Install the plugin in Figma
2. Select a rectangle with an image fill
3. Run the plugin
4. Choose your desired settings:
   - Select a color palette (NES, Game Boy, or SNES)
   - Adjust the pixel size using the slider
   - Preview the effect in real-time
5. Click "Apply Effect" to modify the selected image
   OR
   Click "Export PNG" to create a new layer with the effect

## Development

To modify or build the plugin:

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run watch
   ```
4. Open Figma -> Plugins -> Development -> Import plugin from manifest...
5. Select the manifest.json file from this project

## Technical Details

The plugin uses nearest-neighbor interpolation for authentic pixel art scaling and implements color quantization using the selected retro palette. The process involves:

1. Scaling down the image to the desired pixel size
2. Mapping each color to the nearest color in the chosen palette
3. Scaling back up with nearest-neighbor interpolation for crisp pixels

## License

MIT License - feel free to modify and use this plugin as you like! 