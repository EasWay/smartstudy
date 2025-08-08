import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNetworkState } from '../../hooks/useNetworkState';

interface OfflineIndicatorProps {
    size?: number;
    style?: any;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
    size = 8,
    style,
}) => {
    const { isOnline } = useNetworkState();

    const getDotColor = () => {
        return isOnline ? '#4CAF50' : '#9E9E9E'; // Green for online, grey for offline
    };

    return (
        <View
            style={[
                styles.dot,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: getDotColor(),
                },
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    dot: {
        // Base dot styles - size and color are set dynamically
    },
});