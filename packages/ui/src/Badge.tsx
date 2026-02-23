import { Text, View } from 'react-native';
import type { ViewProps } from 'react-native';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends ViewProps {
    label: string;
    variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: 'bg-gray-100', text: 'text-gray-800' },
    success: { bg: 'bg-green-100', text: 'text-green-800' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    error: { bg: 'bg-red-100', text: 'text-red-800' },
    info: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

/**
 * Cross-platform status badge with variant colors.
 */
export function Badge({ label, variant = 'default', className, ...props }: BadgeProps) {
    const colors = variantClasses[variant];

    return (
        <View
            className={`rounded-full px-2.5 py-0.5 self-start ${colors.bg} ${className ?? ''}`}
            {...props}
        >
            <Text className={`text-xs font-medium ${colors.text}`}>{label}</Text>
        </View>
    );
}
