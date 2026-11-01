import { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
    type ImageSourcePropType,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';

import { HOME, SIDE } from './home-theme';

type Slide = { id: string; title: string; image: ImageSourcePropType };

/**
 * Isi carousel. Siapkan 3 gambar di assets/images/home/ (slide-1.jpg, slide-2.jpg, slide-3.jpg).
 * Ukuran yang disarankan: 1080 x 450 px (rasio sekitar 2,4 : 1).
 */
const SLIDES: Slide[] = [
    {
        id: '1',
        title: 'Discover the beauty of Bali in your own style',
        image: require('@/assets/images/home/slide-1.png'),
    },
    {
        id: '2',
        title: 'Experience the magic of Balinese culture',
        image: require('@/assets/images/home/slide-2.png'),
    },
    {
        id: '3',
        title: 'Make every moment an adventure',
        image: require('@/assets/images/home/slide-3.png'),
    },
    {
        id: '4',
        title: 'Find your own tropical paradise',
        image: require('@/assets/images/home/slide-4.png'),
    },
    {
        id: '5',
        title: 'Relax and enjoy your Bali escape',
        image: require('@/assets/images/home/slide-5.png'),
    },
];

const CARD_HEIGHT = 150;
const AUTOPLAY_MS = 4000;

export function HeroCarousel() {
    const { width } = useWindowDimensions();
    const cardWidth = width - SIDE * 2;

    const listRef = useRef<FlatList<Slide>>(null);
    const [index, setIndex] = useState(0);

    // Geser otomatis. Dihitung ulang setiap indeks berubah, jadi geseran manual
    // pengguna otomatis mengulang hitung mundurnya.
    useEffect(() => {
        const timer = setInterval(() => {
            const next = (index + 1) % SLIDES.length;
            listRef.current?.scrollToOffset({ offset: next * width, animated: true });
            setIndex(next);
        }, AUTOPLAY_MS);
        return () => clearInterval(timer);
    }, [index, width]);

    const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    };

    return (
        <View>
            <FlatList
                ref={listRef}
                data={SLIDES}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
                getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                renderItem={({ item }) => (
                    <View style={{ width, paddingHorizontal: SIDE }}>
                        <View style={[styles.card, { height: CARD_HEIGHT }]}>\
                            <Image
                                source={item.image}
                                resizeMode="cover"
                                style={{ width: cardWidth, height: CARD_HEIGHT }}
                            />
                            <View style={[styles.shade, { width: cardWidth, height: CARD_HEIGHT }]} />
                            <View style={styles.titleWrap}>
                                <Text style={styles.title}>{item.title}</Text>
                            </View>
                        </View>
                    </View>
                )}
            />

            <View style={styles.dots}>
                {SLIDES.map((slide, i) => (
                    <View key={slide.id} style={[styles.dot, i === index && styles.dotActive]} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: HOME.dark,
    },
    shade: {
        position: 'absolute',
        left: 0,
        top: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.28)',
    },
    titleWrap: {
        position: 'absolute',
        left: 18,
        right: 18,
        top: 20,
        bottom: 0,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        lineHeight: 31,
        fontWeight: '800',
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 10,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: HOME.border,
    },
    dotActive: {
        width: 18,
        backgroundColor: HOME.primary,
    },
});