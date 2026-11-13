import React from 'react';
import {
  BookOpen,
  Briefcase,
  Bus,
  Gift,
  HeartHandshake,
  Home,
  MoreHorizontal,
  RotateCcw,
  Shirt,
  ShoppingBag,
  Smartphone,
  Utensils,
  Wallet,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Bus':
      return <Bus className={className} />;
    case 'Home':
      return <Home className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Shirt':
      return <Shirt className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'RotateCcw':
      return <RotateCcw className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
};
