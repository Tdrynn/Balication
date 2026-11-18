import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HOME, SIDE } from '@/components/home/home-theme';
import { OptionSheet } from '@/components/search/option-sheet';
import { ResultCard } from '@/components/search/result-card';
import { useLanguage } from '@/context/language';
import { useRemote } from '@/hooks/use-remote';
import {
  KINDS,
  PRICE_OPTIONS,
  RATING_OPTIONS,
  fetchDestinations,
  type Destination,
  type Kind,
  type Option,
} from '@/lib/destinations';
import { REGENCIES } from '@/lib/regencies';
import { regencyLabel } from '@/lib/regency-label';
import type { TranslationKey } from '@/lib/translations';
import { useWishlist } from '@/lib/wishlist-store';

type KindFilter = 'All' | Kind;
type SheetName = 'category' | 'location' | 'price' | 'rating' | null;

const ANY = 'any';
const KIND_CHIPS: KindFilter[] = ['All', ...KINDS];
const KIND_KEYS: Record<KindFilter, TranslationKey> = {
  All: 'filter.all',
  Destination: 'kind.destination',
  Activity: 'kind.activity',
  Accommodation: 'kind.accommodation',
};

// Tinggi navbar mengambang (jarak 16 + tinggi 70) ditambah ruang napas. Samakan dengan halaman lain.
const NAV_SPACE = 110;

function FilterPill({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon?: 'options-outline';
  onPress: () => void;
}) {
  const color = active ? '#FFFFFF' : HOME.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}
    >
      {icon ? <Ionicons name={icon} size={16} color={color} /> : null}
      <Text style={[styles.pillText, { color }]} numberOfLines={1}>
        {label}
      </Text>
      {icon ? null : <Ionicons name="chevron-down" size={14} color={color} />}
    </Pressable>
  );
}

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const wishlist = useWishlist();

  const [kind, setKind] = useState<KindFilter>('All');
  const [category, setCategory] = useState(ANY);
  const [regencyId, setRegencyId] = useState(ANY);
  const [priceId, setPriceId] = useState(ANY);
  const [ratingId, setRatingId] = useState(ANY);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [undo, setUndo] = useState<{ id: string; name: string } | null>(null);

  const destinations = useRemote(fetchDestinations);

  // Pesan "dihapus" hilang sendiri setelah 4 detik
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 4000);
    return () => clearTimeout(timer);
  }, [undo]);

  // Destinasi yang disimpan, yang terbaru di atas
  const byId = new Map((destinations.data ?? []).map((d) => [d.id, d]));
  const saved = [...wishlist.ids]
    .reverse()
    .map((id) => byId.get(id))
    .filter((d): d is Destination => d !== undefined);
  const hasSaved = saved.length > 0;

  // Pilihan filter (teks diterjemahkan saat dibuat)
  const categoryOptions: Option[] = [
    { id: ANY, label: t('filter.anyCategory') },
    ...[...new Set(saved.map((d) => d.category))].map((c) => ({ id: c, label: c })),
  ];
  const locationOptions: Option[] = [
    { id: ANY, label: t('filter.allLocations') },
    ...REGENCIES.map((r) => ({ id: r.id, label: regencyLabel(r, t) })),
  ];
  const priceOptions: Option[] = PRICE_OPTIONS.map((o) => ({ id: o.id, label: t(o.labelKey) }));
  const ratingOptions: Option[] = RATING_OPTIONS.map((o) => ({ id: o.id, label: t(o.labelKey) }));

  const labelOf = (options: Option[], id: string, fallback: string) =>
    id === ANY ? fallback : (options.find((o) => o.id === id)?.label ?? fallback);

  // Saring
  const price = PRICE_OPTIONS.find((o) => o.id === priceId) ?? PRICE_OPTIONS[0];
  const minRating = RATING_OPTIONS.find((o) => o.id === ratingId)?.min ?? 0;

  const results = saved.filter((d) => {
    if (kind !== 'All' && d.kind !== kind) return false;
    if (category !== ANY && d.category !== category) return false;
    if (regencyId !== ANY && d.regencyId !== regencyId) return false;
    if (!price.test(d.price)) return false;
    if (d.rating < minRating) return false;
    return true;
  });

  const filtersActive =
    category !== ANY || regencyId !== ANY || priceId !== ANY || ratingId !== ANY || kind !== 'All';

  const reset = () => {
    setKind('All');
    setCategory(ANY);
    setRegencyId(ANY);
    setPriceId(ANY);
    setRatingId(ANY);
  };

  const sheetProps: Record<
    Exclude<SheetName, null>,
    { title: string; options: Option[]; selectedId: string; onSelect: (id: string) => void }
  > = {
    category: {
      title: t('filter.category'),
      options: categoryOptions,
      selectedId: category,
      onSelect: setCategory,
    },
    location: {
      title: t('filter.location'),
      options: locationOptions,
      selectedId: regencyId,
      onSelect: setRegencyId,
    },
    price: {
      title: t('filter.priceRange'),
      options: priceOptions,
      selectedId: priceId,
      onSelect: setPriceId,
    },
    rating: {
      title: t('filter.rating'),
      options: ratingOptions,
      selectedId: ratingId,
      onSelect: setRatingId,
    },
  };
  const activeSheet = sheet ? sheetProps[sheet] : null;

  const open = (id: string) => router.push({ pathname: '/destination/[id]', params: { id } });

  // Ketuk hati di sini = hapus dari wishlist, dengan kesempatan membatalkan
  const remove = (destination: Destination) => {
    wishlist.toggle(destination.id);
    setUndo({ id: destination.id, name: destination.name });
  };
  const restore = () => {
    if (undo && !wishlist.has(undo.id)) wishlist.toggle(undo.id);
    setUndo(null);
  };

  const hero = (
    <View style={styles.hero}>
      <View style={styles.titleRow}>
        <Ionicons name="heart" size={34} color={HOME.dark} />
        <Text style={styles.title}>{t('wishlist.title')}</Text>
      </View>
      <Text style={styles.subtitle}>{t('wishlist.subtitle')}</Text>
    </View>
  );

  const filters = hasSaved ? (
    <View style={styles.filters}>
      {/* Jenis */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {KIND_CHIPS.map((item) => {
          const selected = item === kind;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setKind(item)}
              style={[styles.kind, selected && styles.kindActive]}
            >
              <Text style={[styles.kindText, selected && styles.kindTextActive]}>
                {t(KIND_KEYS[item])}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <FilterPill
          icon="options-outline"
          label={labelOf(categoryOptions, category, t('filter.filter'))}
          active={category !== ANY}
          onPress={() => setSheet('category')}
        />
        <FilterPill
          label={labelOf(locationOptions, regencyId, t('filter.location'))}
          active={regencyId !== ANY}
          onPress={() => setSheet('location')}
        />
        <FilterPill
          label={labelOf(priceOptions, priceId, t('filter.priceRange'))}
          active={priceId !== ANY}
          onPress={() => setSheet('price')}
        />
        <FilterPill
          label={labelOf(ratingOptions, ratingId, t('filter.rating'))}
          active={ratingId !== ANY}
          onPress={() => setSheet('rating')}
        />
      </ScrollView>

      <View style={styles.countRow}>
        <Text style={styles.count}>
          {t(results.length === 1 ? 'wishlist.count.one' : 'wishlist.count.other', {
            count: results.length,
          })}
        </Text>
        {filtersActive ? (
          <Pressable onPress={reset} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>{t('filter.reset')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {destinations.loading && !destinations.data ? (
        <View style={{ paddingTop: insets.top + 12 }}>
          {hero}
          <ActivityIndicator color={HOME.primary} style={styles.loader} />
        </View>
      ) : destinations.error && !destinations.data ? (
        <View style={{ paddingTop: insets.top + 12 }}>
          {hero}
          <View style={styles.state}>
            <Text style={styles.errorText}>
              {__DEV__ ? `${t('common.loadError')} (${destinations.error})` : t('common.loadError')}
            </Text>
            <Pressable onPress={destinations.reload} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              {hero}
              {filters}
            </View>
          }
          ListEmptyComponent={
            hasSaved ? (
              <View style={styles.empty}>
                <Ionicons name="funnel-outline" size={40} color={HOME.muted} />
                <Text style={styles.emptyTitle}>{t('filter.noResults')}</Text>
                <Text style={styles.emptyText}>{t('filter.noResultsText')}</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="heart-outline" size={40} color={HOME.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('wishlist.empty.title')}</Text>
                <Text style={styles.emptyText}>{t('wishlist.empty.text')}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/search')}
                  style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
                >
                  <Ionicons name="search" size={16} color="#FFFFFF" />
                  <Text style={styles.ctaText}>{t('wishlist.empty.cta')}</Text>
                </Pressable>
              </View>
            )
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + NAV_SPACE,
          }}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <ResultCard
                destination={item}
                wished
                onPress={() => open(item.id)}
                onToggleWish={() => remove(item)}
              />
            </View>
          )}
        />
      )}

      {/* Pesan "dihapus" + urungkan, di atas navbar */}
      {undo ? (
        <View style={[styles.snackbar, { bottom: insets.bottom + 98 }]}>
          <Text style={styles.snackText} numberOfLines={1}>
            {t('wishlist.removed')}
          </Text>
          <Pressable accessibilityRole="button" onPress={restore} hitSlop={10}>
            <Text style={styles.snackAction}>{t('wishlist.undo')}</Text>
          </Pressable>
        </View>
      ) : null}

      <OptionSheet
        visible={activeSheet !== null}
        title={activeSheet?.title ?? ''}
        options={activeSheet?.options ?? []}
        selectedId={activeSheet?.selectedId ?? ANY}
        onSelect={activeSheet?.onSelect ?? (() => { })}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HOME.bg,
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
    gap: 14,
    paddingBottom: 14,
  },
  hero: {
    gap: 6,
    paddingHorizontal: SIDE,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: HOME.title,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: HOME.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  filters: {
    gap: 12,
  },
  row: {
    gap: 8,
    paddingHorizontal: SIDE,
  },
  kind: {
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#BBD2CE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindActive: {
    backgroundColor: HOME.primary,
    borderColor: HOME.primary,
  },
  kindText: {
    color: HOME.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  kindTextActive: {
    color: '#FFFFFF',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#BBD2CE',
    backgroundColor: '#FFFFFF',
  },
  pillActive: {
    backgroundColor: HOME.primary,
    borderColor: HOME.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 140,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE,
  },
  count: {
    color: HOME.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  link: {
    color: HOME.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  item: {
    paddingHorizontal: SIDE,
  },
  separator: {
    height: 12,
  },
  loader: {
    marginTop: 60,
  },
  state: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  errorText: {
    color: HOME.error,
    fontSize: 13,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 50,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DDEAE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    color: HOME.title,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: HOME.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  cta: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: HOME.primary,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  snackbar: {
    position: 'absolute',
    left: SIDE,
    right: SIDE,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: HOME.dark,
  },
  snackText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  snackAction: {
    color: '#9FE0BF',
    fontSize: 13,
    fontWeight: '800',
  },
});