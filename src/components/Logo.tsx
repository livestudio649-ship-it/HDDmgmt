import { HardDrive } from 'lucide-react';
import { useCompany } from '@/lib/company';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { defaultLogoUrl } from '@/assets/logo';

// Default logo - correctly referenced from public directory
const DEFAULT_LOGO_URL = defaultLogoUrl;

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFallback?: boolean;
  alt?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-32 h-32',
};

const iconSizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const Logo = ({ className, size = 'md', showFallback = true, alt }: LogoProps) => {
  const { company } = useCompany();
  const [imageError, setImageError] = useState(false);
  
  // Use custom logo first, then default to the company's default logo
  const logoSrc = company.logoBase64 || company.logoUrl || DEFAULT_LOGO_URL;
  const altText = alt || `${company.companyName} Logo`;

  // Show fallback if image failed to load or no source
  if ((imageError || !logoSrc) && showFallback) {
    return (
      <div className={cn('bg-primary rounded-lg flex items-center justify-center', sizeClasses[size], className)}>
        <HardDrive className={cn('text-primary-foreground', iconSizeClasses[size])} />
      </div>
    );
  }

  if (!logoSrc && !showFallback) {
    return null;
  }

  return (
    <div className={cn('rounded-lg flex items-center justify-center overflow-hidden bg-white', sizeClasses[size], className)}>
      <img
        src={logoSrc}
        alt={altText}
        className="w-full h-full object-contain"
        onError={(e) => {
          console.error('Logo failed to load:', logoSrc);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('Logo loaded successfully:', logoSrc);
        }}
      />
    </div>
  );
};

// Inline logo for invoices/estimates (no wrapper div, just img)
export const LogoImage = ({ className, alt }: { className?: string; alt?: string }) => {
  const { company } = useCompany();
  const logoSrc = company.logoBase64 || company.logoUrl || DEFAULT_LOGO_URL;
  const altText = alt || `${company.companyName} Logo`;

  if (!logoSrc) {
    return null;
  }

  return (
    <img
      src={logoSrc}
      alt={altText}
      className={cn('object-contain', className)}
      onError={(e) => {
        // Hide if fails to load
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};
