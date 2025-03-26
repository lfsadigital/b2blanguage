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
  // Use the new logo file
  const logoFile = '/images/use_this_one_white.svg';
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={logoFile}
        alt="B2B Languages Logo"
        width={width}
        height={height}
        priority
        className={`object-contain ${variant === 'dark' ? 'brightness-0' : ''}`}
      />
    </div>
  );
} 