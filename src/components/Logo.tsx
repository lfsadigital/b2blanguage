import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  variant?: 'light' | 'dark';
  className?: string;
}

export default function Logo({ 
  width = 80, 
  height = 30, 
  variant = 'dark',
  className = ''
}: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/images/logo.svg"
        alt="B2B Languages Logo"
        width={width}
        height={height}
        priority
        className={variant === 'light' ? 'invert' : ''}
      />
    </div>
  );
} 