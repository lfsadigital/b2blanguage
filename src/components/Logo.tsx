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
  // Add a version parameter to prevent caching
  const version = '2.0';
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={`/images/logo.svg?v=${version}`}
        alt="B2B Languages Logo"
        width={width}
        height={height}
        priority
        className={`${variant === 'light' ? 'brightness-0 invert' : ''} object-contain`}
      />
    </div>
  );
} 