import { useEffect, useCallback, useRef } from 'react';

interface UseBarcodeOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  maxDelay?: number;
}

export function useBarcodeScanner({ 
  onScan, 
  minLength = 4, 
  maxDelay = 50 
}: UseBarcodeOptions) {
  const buffer = useRef('');
  const lastKeyTime = useRef(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const currentTime = Date.now();
    const target = event.target as HTMLElement;
    
    // Ignore if we're typing in an input field (except for Enter key)
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable
    ) {
      // Only process Enter in input fields if we have a valid barcode buffer
      if (event.key === 'Enter' && buffer.current.length >= minLength) {
        event.preventDefault();
        onScan(buffer.current);
        buffer.current = '';
      }
      return;
    }

    // Reset buffer if too much time has passed since last key
    if (currentTime - lastKeyTime.current > maxDelay) {
      buffer.current = '';
    }
    
    lastKeyTime.current = currentTime;

    // Handle Enter key - submit barcode
    if (event.key === 'Enter') {
      if (buffer.current.length >= minLength) {
        event.preventDefault();
        onScan(buffer.current);
      }
      buffer.current = '';
      return;
    }

    // Only add printable characters
    if (event.key.length === 1) {
      buffer.current += event.key;
    }
  }, [onScan, minLength, maxDelay]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const clearBuffer = useCallback(() => {
    buffer.current = '';
  }, []);

  return { clearBuffer };
}
