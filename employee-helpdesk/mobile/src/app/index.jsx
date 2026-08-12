import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

export default function Index() {
    // The actual routing logic is handled by _layout.jsx
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
}
