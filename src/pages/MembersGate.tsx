import { useEffect, useState } from 'react';
import Members from './Members';
import MembersUnavailable from './MembersUnavailable';
import { settingsAPI } from '@/lib/api';

const MembersGate = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const loadVisibility = async () => {
      try {
        const settings = await settingsAPI.getMembersVisibility();
        setIsVisible(settings.visible);
      } catch (error) {
        console.error('Failed to load members visibility:', error);
        setIsVisible(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadVisibility();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="font-display text-4xl tracking-[0.2em] text-primary">404</p>
          <p className="mt-3 text-sm text-muted-foreground">Проверяем доступность страницы...</p>
        </div>
      </div>
    );
  }

  return isVisible ? <Members /> : <MembersUnavailable />;
};

export default MembersGate;
