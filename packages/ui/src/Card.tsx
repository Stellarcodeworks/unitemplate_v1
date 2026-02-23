import { View } from 'react-native';
import type { ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
    children: React.ReactNode;
    variant?: 'default' | 'outlined';
}

/**
 * Cross-platform card container with padding, border, and shadow.
 */
export function Card({ children, variant = 'default', className, ...props }: CardProps) {
    const variantClass =
        variant === 'outlined'
            ? 'border border-gray-200 bg-white'
            : 'bg-white shadow-sm shadow-gray-200';

    return (
        <View className={`rounded-xl p-4 ${variantClass} ${className ?? ''}`} {...props}>
            {children}
        </View>
    );
}
