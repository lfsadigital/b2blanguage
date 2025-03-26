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
  // Use the new logo files
  const logoFile = variant === 'light' 
    ? '/images/Design%20sem%20nome%20(1).svg' 
    : '/images/Design%20sem%20nome.svg';
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={logoFile}
        alt="B2B Languages Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
    </div>
  );
} 