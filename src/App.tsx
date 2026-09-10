import { useEffect, useState } from 'react';
import RegistrationPage from '@/pages/RegistrationPage';
import CoordinatorConsole from '@/pages/CoordinatorConsole';

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return pathname;
}

export function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function App() {
  const pathname = usePathname();
  const isCoordinator = pathname.startsWith('/coordinator');

  return isCoordinator ? <CoordinatorConsole /> : <RegistrationPage />;
}
