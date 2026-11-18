import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';

import type { Destination } from '@/lib/destinations';
import type { TranslationKey } from '@/lib/translations';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Minimal kategori yang harus dipilih pengguna. */
export const MIN_CATEGORIES = 3;

export type PrefCategory = {
    id: string;
    labelKey: TranslationKey;
    colors: [string, string];
    match: string[];
    image?: ImageSourcePropType;
};

export const PREFERENCE_CATEGORIES: PrefCategory[] = [
    {
        id: 'beach',
        labelKey: 'pref.cat.beach',
        image: require('@/assets/images/preferences/beach.png'),
        colors: ['#34B3C6', '#1A6F86'],
        match: ['beach']
    },
    {
        id: 'nature',
        labelKey: 'pref.cat.nature',
        image: require('@/assets/images/preferences/nature.png'),
        colors: ['#5DB26B', '#2A6B3F'],
        match: ['nature']
    },
    {
        id: 'temples',
        labelKey: 'pref.cat.temples',
        image: require('@/assets/images/preferences/temple.png'),
        colors: ['#6FA8D6', '#34678F'],
        match: ['temple', 'culture'],
    },
    {
        id: 'waterpark',
        labelKey: 'pref.cat.waterpark',
        image: require('@/assets/images/preferences/waterpark.png'),
        colors: ['#3DC1D3', '#0F7C9D'],
        match: ['water park']
    },
    {
        id: 'hiking',
        labelKey: 'pref.cat.hiking',
        image: require('@/assets/images/preferences/tracking.png'),
        colors: ['#E0A25A', '#9A5B2A'],
        match: ['hiking', 'trekking', 'trek'],
    },
    {
        id: 'spa',
        labelKey: 'pref.cat.spa',
        image: require('@/assets/images/preferences/spa.png'),
        colors: ['#D79AB0', '#8F5470'],
        match: ['spa', 'wellness']
    },
    {
        id: 'shopping',
        labelKey: 'pref.cat.shopping',
        image: require('@/assets/images/preferences/shopping.png'),
        colors: ['#E8825B', '#A64A2C'],
        match: ['shopping', 'market']
    },
    {
        id: 'culinary',
        labelKey: 'pref.cat.culinary',
        image: require('@/assets/images/preferences/culinary.png'),
        colors: ['#E8B04B', '#A8721B'],
        match: ['culinary', 'food', 'restaurant', 'cafe'],
    },
    {
        id: 'zoo',
        labelKey: 'pref.cat.zoo',
        image: require('@/assets/images/preferences/zoo.png'),
        colors: ['#8FB86A', '#4F7A35'],
        match: ['zoo', 'wildlife'],
    },
    {
        id: 'watersport',
        labelKey: 'pref.cat.watersport',
        image: require('@/assets/images/preferences/watersport.png'),
        colors: ['#2E9FD6', '#14598C'],
        match: ['water sport', 'diving', 'snorkel', 'surf'],
    },
    {
        id: 'adventure',
        labelKey: 'pref.cat.adventure',
        image: require('@/assets/images/preferences/adventure.png'),
        colors: ['#D9784A', '#8F3F22'],
        match: ['adventure']
    },
    {
        id: 'museum',
        labelKey: 'pref.cat.museum',
        image: require('@/assets/images/preferences/museum.png'),
        colors: ['#9B86D6', '#5A4A97'],
        match: ['museum', 'gallery'],
    },
    {
        id: 'themepark',
        labelKey: 'pref.cat.themepark',
        image: require('@/assets/images/preferences/theme.png'),
        colors: ['#F08FA8', '#B14565'],
        match: ['theme park'],
    },
    {
        id: 'cultural',
        labelKey: 'pref.cat.cultural',
        image: require('@/assets/images/preferences/cutural.png'),
        colors: ['#C58E4A', '#7E5420'],
        match: ['cultural experience', 'cultural'],
    },
    {
        id: 'hotel',
        labelKey: 'pref.cat.hotel',
        image: require('@/assets/images/preferences/hotel.png'),
        colors: ['#5B8DB8', '#2D4F73'],
        match: ['hotel', 'resort']
    },
    {
        id: 'villa',
        labelKey: 'pref.cat.villa',
        image: require('@/assets/images/preferences/villa.png'),
        colors: ['#4FB59B', '#22705F'],
        match: ['villa']
    },
    {
        id: 'guesthouse',
        labelKey: 'pref.cat.guesthouse',
        image: require('@/assets/images/preferences/guest.png'),
        colors: ['#E28F8F', '#9C4A4A'],
        match: ['guest house', 'guesthouse', 'homestay'],
    },
];

export const findCategory = (id: string) => PREFERENCE_CATEGORIES.find((c) => c.id === id);

export function matchedCategories(destination: Destination, selectedIds: string[]): PrefCategory[] {
    const haystack = [destination.category, ...destination.tags].map((s) => s.toLowerCase());
    return PREFERENCE_CATEGORIES.filter(
        (c) =>
            selectedIds.includes(c.id) &&
            c.match.some((term) => haystack.some((text) => text.includes(term))),
    );
}

export type Recommendation = { destination: Destination; matches: PrefCategory[] };

/**
 * Destinasi yang cocok dengan preferensi: yang cocok paling banyak kategori lebih dulu,
 * lalu rating tertinggi.
 */
export function recommend(
    all: Destination[],
    selectedIds: string[],
    limit = 8,
): Recommendation[] {
    return all
        .map((destination) => ({ destination, matches: matchedCategories(destination, selectedIds) }))
        .filter((item) => item.matches.length > 0)
        .sort(
            (a, b) =>
                b.matches.length - a.matches.length || b.destination.rating - a.destination.rating,
        )
        .slice(0, limit);
}