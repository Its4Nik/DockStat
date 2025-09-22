import type * as React from 'react';
import { cn } from '~/utils/cn';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => {
  return (
    <article
      className={cn('text-card-text rounded-lg border bg-card-bg border-border shadow-sm shadow-glow overflow-hidden', className)}
      {...rest}
      aria-labelledby={undefined}
    >
      {children}
    </article>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <header className={cn('text-xl px-4 py-3 border-border border-b', className)} {...rest}>
    {children}
  </header>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div className={cn('text-md p-4', className)} {...rest}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <footer className={cn('text-sm px-4 py-3 border-border border-t', className)} {...rest}>
    {children}
  </footer>
);

Card.displayName = "Card"
