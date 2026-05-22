export async function cropImage(base64: string, box: number[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }
      const [ymin, xmin, ymax, xmax] = box;
      const sx = (xmin / 1000) * img.width;
      const sy = (ymin / 1000) * img.height;
      const sw = ((xmax - xmin) / 1000) * img.width;
      const sh = ((ymax - ymin) / 1000) * img.height;
      canvas.width = sw;
      canvas.height = sh;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}

export async function processImageForOCR(base64: string, targetWidth = 2048): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) { reject(new Error('Canvas context failed')); return; }
      canvas.width = targetWidth;
      canvas.height = targetWidth * (img.height / img.width);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}
