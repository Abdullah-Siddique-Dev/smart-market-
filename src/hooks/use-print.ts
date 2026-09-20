import { useState, useCallback } from 'react';

export function usePrint<T = unknown>() {
  const [printData, setPrintData] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openPreview = useCallback((data: T) => {
    setPrintData(data);
    setIsOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsOpen(false);
    setPrintData(null);
  }, []);

  const triggerBrowserPrint = useCallback(() => {
    window.print();
  }, []);

  return {
    isOpen,
    printData,
    openPreview,
    closePreview,
    triggerBrowserPrint,
  };
}
