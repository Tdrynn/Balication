import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Cover } from '@/components/destination/cover';
import { HOME } from '@/components/home/home-theme';
import { useLanguage } from '@/context/language';
import { shortPrice, type Destination } from '@/lib/destinations';

const IMAGE_SIZE = 92;

type Props = {
    destination: Destination;
    wished: boolean;
    onPress: () => void;
    onToggleWish: () => void;
};

export function ResultCard({ destination, wished, onPress, onToggleWish }: Props) {
    const { t } = useLanguage();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('card.viewDetailOf', { name: destination.name })}
            onPress={onPress}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <Cover
                uri={destination.images[0]}
                kind={destination.kind}
                width={IMAGE_SIZE}
                height={IMAGE_SIZE}
                radius={18}
            />

            <View style={styles.body}>
                <View style={styles.titleRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {destination.name}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={wished ? t('card.removeWish') : t('card.addWish')}
                        hitSlop={10}
                        onPress={onToggleWish}
                    >
                        <Ionicons
                            name={wished ? 'heart' : 'heart-outline'}
                            size={22}
                            color={wished ? '#E53935' : HOME.muted}
                        />
                    </Pressable>
                </View>

                <View style={styles.areaRow}>
                    <Ionicons name="location" size={12} color={HOME.primary} />
                    <Text style={styles.area} numberOfLines={1}>
                        {destination.area || '-'}
                    </Text>
                </View>

                <View style={styles.tag}>
                    <Text style={styles.tagText} numberOfLines={1}>
                        {destination.category}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <View style={styles.rating}>
                        <Ionicons name="star" size={13} color="#F2A33A" />
                        <Text style={styles.ratingText}>{destination.rating.toFixed(1)}/5</Text>
                        <Text style={styles.price}>• {shortPrice(destination.price)}</Text>
                    </View>
                    <View style={styles.detail}>
                        <Text style={styles.detailText}>{t('card.viewDetail')}</Text>
                        <Ionicons name="chevron-forward" size={14} color={HOME.primary} />
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        gap: 12,
        padding: 8,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#C9DAD6',
        backgroundColor: '#FFFFFF',
    },
    pressed: {
        opacity: 0.85,
    },
    body: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 2,
        paddingRight: 4,
        gap: 3,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    name: {
        flex: 1,
        color: HOME.title,
        fontSize: 16,
        fontWeight: '800',
    },
    areaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    area: {
        flexShrink: 1,
        color: HOME.body,
        fontSize: 11,
    },
    tag: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#B9CFCA',
    },
    tagText: {
        color: HOME.body,
        fontSize: 11,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        flexShrink: 1,
    },
    ratingText: {
        color: HOME.body,
        fontSize: 11,
    },
    price: {
        color: HOME.muted,
        fontSize: 11,
    },
    detail: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        color: HOME.primary,
        fontSize: 12,
        fontWeight: '600',
    },
});