import { TextInput, Text, View } from 'react-native';
import type { TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

/**
 * Cross-platform text input with label and error state.
 * Uses NativeWind className for styling.
 */
export function Input({ label, error, className, ...props }: InputProps) {
    return (
        <View className="gap-1">
            {label ? <Text className="text-sm font-medium text-gray-700">{label}</Text> : null}
            <TextInput
                className={`rounded-lg border px-3 py-2.5 text-base ${error ? 'border-destructive-500' : 'border-gray-300'
                    } ${className ?? ''}`}
                placeholderTextColor="#9CA3AF"
                {...props}
            />
            {error ? <Text className="text-sm text-destructive-500">{error}</Text> : null}
        </View>
    );
}
