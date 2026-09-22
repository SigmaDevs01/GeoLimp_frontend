import { useThemeStore } from '@/store/useThemeStore';

interface LogoProps {
  className?: string;
  showName?: boolean;
}

export function Logo({ className, showName = false }: LogoProps) {
  const { theme } = useThemeStore();
  
  if (showName) {
    const src = theme === 'dark' ? '/logo+name_light.svg' : '/logo+name_dark.svg';
    return <img src={src} alt="GeoLimp Logo" className={className} />;
  }

  return <img src="/logo.svg" alt="GeoLimp Logo" className={className} />;
}
