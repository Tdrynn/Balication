import { Hurricane_400Regular } from '@expo-google-fonts/hurricane';
import { Idiqlat_400Regular } from '@expo-google-fonts/idiqlat';
import { StyleSheet, Text, View } from 'react-native';

import { HOME } from '@/components/home/home-theme';

export const BRAND_FONTS = { Idiqlat_400Regular, Hurricane_400Regular };

const GOLD = '#F0A93A';

export function BrandName({ scale = 1 }: { scale?: number }) {
    return (
        <View accessible accessibilityLabel="Balication" style={styles.wrap}>
            <Text
                style={[
                    styles.bali,
                    {
                        fontSize: 28 * scale,
                        lineHeight: 44 * scale,
                        paddingTop: 6 * scale,
                        paddingHorizontal: 4 * scale,
                    },
                ]}
            >
                Bali
            </Text>
            <Text
                style={[
                    styles.cation,
                    {
                        fontSize: 52 * scale,
                        lineHeight: 64 * scale,
                        paddingHorizontal: 12 * scale,
                        marginLeft: 12 * scale,
                        marginTop: -22 * scale,
                        marginBottom: -10 * scale,
                    },
                ]}
            >
                Cation
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignSelf: 'flex-start',
        overflow: 'visible',
    },
    bali: {
        color: HOME.title,
        fontFamily: 'Idiqlat_400Regular',
        includeFontPadding: false,
    },
    cation: {
        color: GOLD,
        fontFamily: 'Hurricane_400Regular',
        includeFontPadding: false,
    },
});