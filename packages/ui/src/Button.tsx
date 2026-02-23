import { Pressable, Text } from 'react-native';
import type { PressableProps } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
    title: string;
    variant?: ButtonVariant;
    loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary-600 active:bg-primary-700',
    secondary: 'bg-gray-200 active:bg-gray-300',
    destructive: 'bg-destructive-600 active:bg-destructive-700',
    ghost: 'bg-transparent active:bg-gray-100',
};

const textClasses: Record<ButtonVariant, string> = {
    primary: 'text-white font-semibold',
    secondary: 'text-gray-900 font-semibold',
    destructive: 'text-white font-semibold',
    ghost: 'text-gray-700 font-medium',
};

/**
 * Cross-platform button with variant support.
 * Uses NativeWind className for styling.
 */
export function Button({ title, variant = 'primary', loading, disabled, ...props }: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            className={`rounded-lg px-4 py-3 items-center justify-center ${variantClasses[variant]} ${isDisabled ? 'opacity-50' : ''}`}
            disabled={isDisabled}
            {...props}
        >
            <Text className={`text-base ${textClasses[variant]}`}>{loading ? 'Loading...' : title}</Text>
        </Pressable>
    );
}
