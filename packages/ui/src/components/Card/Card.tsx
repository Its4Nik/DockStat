import type { MouseEventHandler, ReactNode } from 'react'
import React from 'react'

export type CardVariant =
	| 'default'
	| 'outlined'
	| 'elevated'
	| 'flat'
	| 'dark'
export type CardSize = 'sm' | 'md' | 'lg'

export interface CardProps {
	children: ReactNode
	variant?: CardVariant
	size?: CardSize
	className?: string
	onClick?: MouseEventHandler<HTMLButtonElement>
	hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
	children,
	variant = 'default',
	size = 'md',
	className = '',
	onClick,
	hoverable = false,
}) => {
	const baseClasses =
		'shadow-xl rounded-lg transition-all duration-200'

	const variantClasses: Record<CardVariant, string> = {
		default:
			'bg-card-default-bg border border-card-default-border text-primary-text',
		outlined:
			'border border-card-outlined-border bg-main-bg text-secondary-text',
		elevated: 'bg-card-elevated-bg shadow-2xl text-primary-text',
		flat: 'bg-card-flat-bg border-none text-muted-text',
		dark:
			'bg-card-dark-bg border border-card-dark-border text-primary-text',
	}

	const sizeClasses: Record<CardSize, string> = {
		sm: 'p-3',
		md: 'p-6',
		lg: 'p-8',
	}

	const hoverClasses = hoverable
		? `hover:shadow-lg hover:-translate-y-1 ${variant === 'outlined' ? 'hover:border-2' : ''}`
		: ''

	const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${hoverClasses} ${className}`

	if (onClick) {
		return (
			<button
				type="button"
				className={`${classes} cursor-pointer hover:text-muted-text`}
				onClick={onClick}
			>
				{children}
			</button>
		)
	}

	return <div className={`${classes} w-fit`}>{children}</div>
}

// Export subcomponents
export { CardBody, type CardBodyProps } from './CardBody'
export { CardFooter, type CardFooterProps } from './CardFooter'
export { CardHeader, type CardHeaderProps } from './CardHeader'
