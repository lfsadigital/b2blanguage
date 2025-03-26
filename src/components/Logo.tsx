import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  variant?: 'light' | 'dark';
  className?: string;
}

export default function Logo({ 
  width = 100, 
  height = 33, 
  variant = 'dark',
  className = ''
}: LogoProps) {
  // Use web-friendly filenames
  const logoPath = variant === 'light' 
    ? '/images/b2b-logo-light.svg' 
    : '/images/b2b-logo.svg';
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={logoPath}
        alt="B2B Languages Logo"
        width={width}
        height={height}
        className="object-contain"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
} 