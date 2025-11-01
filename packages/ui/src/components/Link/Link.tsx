import type React from 'react';

export interface LinkWithIconProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  external?: boolean;
}

export const LinkWithIcon: React.FC<LinkWithIconProps> = ({
  href,
  label,
  icon,
  iconPosition = 'left',
  className = '',
  external = false,
}) => {
  const isLeft = icon && iconPosition === 'left';
  const isRight = icon && iconPosition === 'right';

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`inline-flex items-center text-icon-link-text hover:icon-link-text-hover transition-colors ${className}`}
    >
      {isLeft && <span className="mr-1">{icon}</span>}
      <span>{label}</span>
      {isRight && <span className="ml-1">{icon}</span>}
    </a>
  );
};
