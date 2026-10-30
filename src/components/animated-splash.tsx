import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import {
    Animated,
    Image,
    StyleSheet,
    View,
} from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => { });

const HOLD_MS = 1800;
const FADE_MS = 500;

export default function AnimatedSplash({
    onFinish,
}: {
    onFinish: () => void;
}) {
    const [opacity] = useState(() => new Animated.Value(1));
    const [imageReady, setImageReady] = useState(false);

    useEffect(() => {
        if (!imageReady) return;

        SplashScreen.hideAsync();

        const timer = setTimeout(() => {
            Animated.timing(opacity, {
                toValue: 0,
                duration: FADE_MS,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    onFinish();
                }
            });
        }, HOLD_MS);

        return () => clearTimeout(timer);
    }, [imageReady, onFinish, opacity]);

    return (
        <Animated.View
            style={[
                StyleSheet.absoluteFill,
                styles.container,
                { opacity },
            ]}
        >
            <Image
                source={require('@/assets/images/balication-splash.png')}
                resizeMode="cover"
                style={styles.image}
                onLoad={() => setImageReady(true)}
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#DCEAF6',
        zIndex: 999,
        elevation: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});
