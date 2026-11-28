import html2canvas from 'html2canvas-pro';

/**
 * Render phần tử DOM sang HTMLCanvasElement độ phân giải cao (tương thích Tailwind CSS v4 oklch/oklab).
 */
export async function exportElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: Math.max(document.documentElement.clientWidth, element.scrollWidth + 40),
  });
}

/**
 * Chuyển Canvas sang Blob PNG để chia sẻ trực tiếp qua Web Share API.
 */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

/**
 * Tải xuống file ảnh PNG từ Canvas (tương thích cả Desktop lẫn Mobile).
 */
export function triggerPngDownload(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
