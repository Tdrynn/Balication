import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Place } from '@/lib/chat-api';

import { HOME, SIDE } from '@/components/home/home-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const AI_BUBBLE = '#D3E4E1';
const AI_TEXT = '#2F5E5A';
const USER_BUBBLE = '#5E908B';

export type ChatMessage = {
    id: string;
    role: 'ai' | 'user';
    text: string;
    time: Date;
    places?: Place[];
};

/** 09.00 AM */
export function formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}.${minutes} ${suffix}`;
}

function AiAvatar() {
    return (
        <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={20} color={HOME.primary} />
        </View>
    );
}

/** Pesan dari AI (kiri) dengan kartu destinasi opsional. */
export function AiMessage({ message }: { message: ChatMessage }) {
    return (
        <View style={styles.block}>
            <View style={styles.aiRow}>
                <AiAvatar />
                <View style={styles.aiColumn}>
                    <View style={[styles.bubble, styles.aiBubble]}>
                        <Text style={[styles.bubbleText, { color: AI_TEXT }]}>{message.text}</Text>
                    </View>
                    <Text style={styles.time}>{formatTime(message.time)}</Text>
                </View>
            </View>

            {message.places && message.places.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cards}
                >
                    {message.places.map((place) => (
                        <PlaceCard key={place.id} place={place} />
                    ))}
                </ScrollView>
            ) : null}
        </View>
    );
}

/** Pesan dari pengguna (kanan). */
export function UserMessage({ message, initial }: { message: ChatMessage; initial: string }) {
    return (
        <View style={[styles.block, styles.userRow]}>
            <View style={styles.userColumn}>
                <View style={[styles.bubble, styles.userBubble]}>
                    <Text style={[styles.bubbleText, { color: '#FFFFFF' }]}>{message.text}</Text>
                </View>
                <Text style={[styles.time, styles.timeRight]}>{formatTime(message.time)}</Text>
            </View>
            <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{initial}</Text>
            </View>
        </View>
    );
}

/** Indikator "AI sedang mengetik". */
export function TypingIndicator() {
    return (
        <View style={[styles.block, styles.aiRow]}>
            <AiAvatar />
            <View style={[styles.bubble, styles.aiBubble, styles.typing]}>
                <ActivityIndicator size="small" color={HOME.primary} />
                <Text style={[styles.bubbleText, { color: AI_TEXT }]}>Balication AI is typing...</Text>
            </View>
        </View>
    );
}

/** Tombol pertanyaan cepat. */
export function SuggestionChip({
    label,
    icon,
    onPress,
}: {
    label: string;
    icon: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
            <Ionicons name={icon as IconName} size={16} color={HOME.primary} />
            <Text style={styles.chipText}>{label}</Text>
        </Pressable>
    );
}

const CARD_WIDTH = 168;
const CARD_IMAGE_HEIGHT = 92;

function PlaceCard({ place }: { place: Place }) {
    return (
        <View style={styles.card}>
            <View style={styles.cardImageWrap}>
                {place.imageUrl ? (
                    <Image
                        source={{ uri: place.imageUrl }}
                        resizeMode="cover"
                        style={{ width: CARD_WIDTH - 12, height: CARD_IMAGE_HEIGHT }}
                    />
                ) : (
                    <View style={styles.cardImageFallback}>
                        <Ionicons name="leaf" size={34} color="#FFFFFF" />
                    </View>
                )}
                <View style={styles.areaBadge}>
                    <Ionicons name="location" size={10} color={HOME.primary} />
                    <Text style={styles.areaText} numberOfLines={1}>
                        {place.area}
                    </Text>
                </View>
            </View>

            <Text style={styles.cardName} numberOfLines={1}>
                {place.name}
            </Text>

            <View style={styles.cardMeta}>
                {place.rating !== undefined ? (
                    <>
                        <Ionicons name="star" size={12} color="#F2A33A" />
                        <Text style={styles.cardMetaText}>{place.rating.toFixed(1)}/5</Text>
                    </>
                ) : null}
                {place.hours ? (
                    <>
                        <Text style={styles.cardMetaDivider}>|</Text>
                        <Ionicons name="time-outline" size={12} color={HOME.body} />
                        <Text style={styles.cardMetaText} numberOfLines={1}>
                            {place.hours}
                        </Text>
                    </>
                ) : null}
            </View>

            {place.price ? (
                <View style={styles.pricePill}>
                    <Text style={styles.priceText} numberOfLines={1}>
                        {place.price}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    block: {
        marginBottom: 14,
    },
    pressed: {
        opacity: 0.75,
    },

    // AI
    aiRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingHorizontal: SIDE,
    },
    aiAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5EFED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiColumn: {
        flexShrink: 1,
        maxWidth: '82%',
    },
    bubble: {
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 18,
    },
    aiBubble: {
        backgroundColor: AI_BUBBLE,
        borderTopLeftRadius: 6,
    },
    bubbleText: {
        fontSize: 13,
        lineHeight: 19,
    },
    time: {
        marginTop: 4,
        marginLeft: 4,
        color: HOME.primary,
        fontSize: 10,
        fontWeight: '600',
    },
    timeRight: {
        marginLeft: 0,
        marginRight: 4,
        textAlign: 'right',
    },
    typing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    // Pengguna
    userRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        gap: 10,
        paddingHorizontal: SIDE,
    },
    userColumn: {
        flexShrink: 1,
        maxWidth: '78%',
        alignItems: 'flex-end',
    },
    userBubble: {
        backgroundColor: USER_BUBBLE,
        borderTopRightRadius: 6,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: HOME.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userAvatarText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },

    // Tombol cepat
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#B9D2CE',
        backgroundColor: '#DDEAE7',
    },
    chipText: {
        color: HOME.primary,
        fontSize: 12,
        fontWeight: '600',
    },

    // Kartu destinasi
    cards: {
        gap: 10,
        paddingLeft: SIDE + 50,
        paddingRight: SIDE,
        paddingTop: 10,
    },
    card: {
        width: CARD_WIDTH,
        padding: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: HOME.border,
        backgroundColor: '#FFFFFF',
    },
    cardImageWrap: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardImageFallback: {
        height: CARD_IMAGE_HEIGHT,
        backgroundColor: '#4E8F86',
        alignItems: 'center',
        justifyContent: 'center',
    },
    areaBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        maxWidth: CARD_WIDTH - 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
    },
    areaText: {
        flexShrink: 1,
        color: HOME.primary,
        fontSize: 9,
        fontWeight: '700',
    },
    cardName: {
        marginTop: 8,
        marginHorizontal: 2,
        color: HOME.title,
        fontSize: 13,
        fontWeight: '800',
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 3,
        marginHorizontal: 2,
    },
    cardMetaText: {
        flexShrink: 1,
        color: HOME.body,
        fontSize: 10,
    },
    cardMetaDivider: {
        color: HOME.muted,
        fontSize: 10,
        marginHorizontal: 2,
    },
    pricePill: {
        alignSelf: 'stretch',
        marginTop: 7,
        marginHorizontal: 2,
        marginBottom: 2,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#E1ECE9',
        alignItems: 'center',
    },
    priceText: {
        color: HOME.primary,
        fontSize: 9,
        fontWeight: '700',
    },
});