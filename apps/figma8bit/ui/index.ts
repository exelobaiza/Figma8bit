import { convert } from "pixelize";

function encode(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  imageData: ImageData
): Promise<Uint8Array> {
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer)
          resolve(new Uint8Array(reader.result));
        else {
          reject();
        }
      };
      reader.onerror = () => reject(new Error("Could not read from blob"));
      reader.readAsArrayBuffer(blob as Blob);
    });
  });
}

async function decode(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  bytes: Uint8Array
) {
  const url = URL.createObjectURL(new Blob([bytes]));
  const image: HTMLImageElement = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = url;
  });

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  return imageData;
}

export default (() => {
  let currentSize = 4;
  let originalBytes: Uint8Array | null = null;
  const buttons = document.querySelectorAll('.pixel-button');
  const currentSizeElement = document.querySelector('#current-size');
  const resetButton = document.querySelector('#reset-button');

  // Set initial active state
  document.querySelector('[data-size="4"]')?.classList.add('active');

  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const size = Number(target.dataset.size);
      
      // Update active state
      buttons.forEach(btn => btn.classList.remove('active'));
      target.classList.add('active');
      
      // Update current size
      currentSize = size;
      if (currentSizeElement) {
        currentSizeElement.textContent = String(size);
      }

      // Trigger re-render
      window.parent.postMessage({ pluginMessage: {} }, "*");
    });
  });

  resetButton?.addEventListener('click', async () => {
    if (originalBytes) {
      // Reset UI state
      buttons.forEach(btn => btn.classList.remove('active'));
      if (currentSizeElement) {
        currentSizeElement.textContent = '0';
      }
      currentSize = 0;

      // Send original image bytes directly back to Figma
      window.parent.postMessage({ pluginMessage: originalBytes }, "*");
    }
  });

  window.onmessage = async (event) => {
    const bytes = event.data.pluginMessage;
    
    // Store original bytes if we haven't yet
    if (!originalBytes) {
      originalBytes = bytes;
    }

    // Only apply pixelization if currentSize > 0
    if (currentSize > 0) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = await decode(canvas, ctx, bytes);
        const converted = await convert(
          {
            pixels: imageData.data,
            width: imageData.width,
            height: imageData.height,
          },
          currentSize
        );
        const newBytes = await encode(canvas, ctx, converted);
        window.parent.postMessage({ pluginMessage: newBytes }, "*");
      }
    }
  };
})();
