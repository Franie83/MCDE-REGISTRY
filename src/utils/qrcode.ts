import QRCode from 'qrcode';

export function getCorrespondencePreviewUrl(correspondenceId: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?preview=${encodeURIComponent(correspondenceId)}`;
}

export async function generateQRCodeDataUrl(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  try {
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: 'M',
      margin: 1.5,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      ...options,
    };
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (err) {
    console.error('Error generating QR code', err);
    return '';
  }
}
