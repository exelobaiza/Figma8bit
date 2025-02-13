figma.showUI(__html__, { width: 340, height: 480 });

// Color palettes
const PALETTES = {
    nes: [
        '#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020', '#A81000', '#881400',
        '#503000', '#007800', '#006800', '#005800', '#004058', '#000000', '#000000', '#000000',
        '#BCBCBC', '#0078F8', '#0058F8', '#6844FC', '#D800CC', '#E40058', '#F83800', '#E45C10',
        '#AC7C00', '#00B800', '#00A800', '#00A844', '#008888', '#000000', '#000000', '#000000',
        '#F8F8F8', '#3CBCFC', '#6888FC', '#9878F8', '#F878F8', '#F85898', '#F87858', '#FCA044',
        '#F8B800', '#B8F818', '#58D854', '#58F898', '#00E8D8', '#787878', '#000000', '#000000',
        '#FCFCFC', '#A4E4FC', '#B8B8F8', '#D8B8F8', '#F8B8F8', '#F8A4C0', '#F0D0B0', '#FCE0A8',
        '#F8D878', '#D8F878', '#B8F8B8', '#B8F8D8', '#00FCFC', '#F8D8F8', '#000000', '#000000'
    ],
    gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    snes: generateSnesPalette()
};

function generateSnesPalette() {
    const palette = [];
    for (let r = 0; r < 8; r++) {
        for (let g = 0; g < 8; g++) {
            for (let b = 0; b < 4; b++) {
                palette.push(rgbToHex(r * 32, g * 32, b * 64));
            }
        }
    }
    return palette;
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function findNearestColor(r, g, b, palette) {
    let minDistance = Infinity;
    let nearestColor = palette[0];

    for (const color of palette) {
        const rgb = hexToRgb(color);
        const distance = Math.sqrt(
            Math.pow(r - rgb.r, 2) +
            Math.pow(g - rgb.g, 2) +
            Math.pow(b - rgb.b, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestColor = color;
        }
    }

    return nearestColor;
}

async function processImage(node, pixelSize, palette) {
    if (!node || node.type !== 'RECTANGLE') {
        figma.notify('Please select a rectangle with an image fill');
        return null;
    }

    if (node.fills.length === 0 || node.fills[0].type !== 'IMAGE') {
        figma.notify('Selected rectangle must have an image fill');
        return null;
    }

    const image = node.fills[0];
    const imageHash = image.imageHash;
    if (!imageHash) return null;

    const bytes = await figma.getImageByHash(imageHash);
    const imageData = await bytes.getBytesAsync();

    // Create an offscreen canvas
    const canvas = new OffscreenCanvas(node.width, node.height);
    const ctx = canvas.getContext('2d');

    // Create image bitmap and draw it
    const bitmap = await createImageBitmap(new Blob([imageData]));
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // Apply pixelation effect
    const pixelatedCanvas = new OffscreenCanvas(
        Math.ceil(canvas.width / pixelSize),
        Math.ceil(canvas.height / pixelSize)
    );
    const pixelatedCtx = pixelatedCanvas.getContext('2d');

    // Scale down
    pixelatedCtx.drawImage(canvas, 0, 0, pixelatedCanvas.width, pixelatedCanvas.height);

    // Get image data and process colors
    const imageDataObj = pixelatedCtx.getImageData(0, 0, pixelatedCanvas.width, pixelatedCanvas.height);
    const data = imageDataObj.data;

    // Apply color palette
    const selectedPalette = PALETTES[palette];
    for (let i = 0; i < data.length; i += 4) {
        const nearestColor = findNearestColor(data[i], data[i + 1], data[i + 2], selectedPalette);
        const rgb = hexToRgb(nearestColor);
        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
    }

    pixelatedCtx.putImageData(imageDataObj, 0, 0);

    // Scale back up with nearest-neighbor
    const finalCanvas = new OffscreenCanvas(canvas.width, canvas.height);
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = false;
    finalCtx.drawImage(
        pixelatedCanvas,
        0, 0, pixelatedCanvas.width, pixelatedCanvas.height,
        0, 0, canvas.width, canvas.height
    );

    return finalCanvas;
}

async function createPixelArtImage(canvas) {
    const imageData = await canvas.convertToBlob();
    const imageBytes = await imageData.arrayBuffer();
    const image = figma.createImage(new Uint8Array(imageBytes));
    return image;
}

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'update-preview' || msg.type === 'apply-effect' || msg.type === 'export-png') {
        const selection = figma.currentPage.selection;
        if (selection.length !== 1) {
            figma.notify('Please select a single rectangle with an image');
            return;
        }

        const node = selection[0];
        const canvas = await processImage(node, msg.pixelSize, msg.palette);
        
        if (!canvas) return;

        if (msg.type === 'update-preview') {
            const blob = await canvas.convertToBlob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                figma.ui.postMessage({
                    type: 'preview-update',
                    imageData: reader.result
                });
            };
        } else if (msg.type === 'apply-effect') {
            const image = await createPixelArtImage(canvas);
            node.fills = [{
                type: 'IMAGE',
                scaleMode: 'FILL',
                imageHash: image.hash
            }];
            figma.notify('Pixel art effect applied!');
        } else if (msg.type === 'export-png') {
            const image = await createPixelArtImage(canvas);
            const newNode = figma.createRectangle();
            newNode.resize(node.width, node.height);
            newNode.x = node.x + node.width + 20;
            newNode.y = node.y;
            newNode.fills = [{
                type: 'IMAGE',
                scaleMode: 'FILL',
                imageHash: image.hash
            }];
            figma.notify('Pixel art exported as new layer!');
        }
    }
}; 