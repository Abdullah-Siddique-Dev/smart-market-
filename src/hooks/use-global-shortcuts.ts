import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';
export function useGlobalShortcuts(onF10?: () => void) {
  const navigate = useNavigate();

  // F1: Billing POS
  useHotkeys('f1', (e) => {
    e.preventDefault();
    navigate('/billing');
  });

  // F2: Orders
  useHotkeys('f2', (e) => {
    e.preventDefault();
    navigate('/orders');
  });

  // F3: Dispatch Slips
  useHotkeys('f3', (e) => {
    e.preventDefault();
    navigate('/dispatch');
  });

  // F4: Inventory & Imports
  useHotkeys('f4', (e) => {
    e.preventDefault();
    navigate('/inventory');
  });

  // F5: Order Bookers
  useHotkeys('f5', (e) => {
    e.preventDefault();
    navigate('/bookers');
  });

  // F6: Retail Shops
  useHotkeys('f6', (e) => {
    e.preventDefault();
    navigate('/shops');
  });

  // F7: Profit Reports
  useHotkeys('f7', (e) => {
    e.preventDefault();
    navigate('/reports');
  });

  // F8: Audit Ledger
  useHotkeys('f8', (e) => {
    e.preventDefault();
    navigate('/audit');
  });

  // F10: Checkout / Save Action
  useHotkeys('f10', (e) => {
    e.preventDefault();
    if (onF10) onF10();
  });
}
