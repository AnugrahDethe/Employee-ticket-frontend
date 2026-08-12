import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
    const { user, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

        if (!user && !inAuthGroup) {
            // Redirect to the sign-in page.
            router.replace('/login');
        } else if (user && inAuthGroup) {
            // Redirect away from the sign-in page.
            router.replace('/dashboard');
        }
    }, [user, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <Stack screenOptions={{
            headerStyle: { backgroundColor: COLORS.surface },
            headerTintColor: COLORS.textMain,
            headerTitleStyle: { fontWeight: '600' },
        }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ title: 'Dashboard', headerLeft: () => null }} />
            <Stack.Screen name="tickets" options={{ title: 'Tickets' }} />
            <Stack.Screen name="create-ticket" options={{ title: 'New Ticket' }} />
            <Stack.Screen name="ticket-details" options={{ title: 'Ticket Details' }} />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
