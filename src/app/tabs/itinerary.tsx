import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop as GradientStop } from 'react-native-svg';

import { Cover } from '@/components/destination/cover';
import { HOME, SIDE } from '@/components/home/home-theme';
import { useLanguage } from '@/context/language';
import { shortPrice, type Destination } from '@/lib/destinations';
import {
  formatClock,
  resetTripDraft,
  stopCost,
  useItinerary,
  type Day,
  type Itinerary,
  type Stop,
} from '@/lib/itinerary';

/** Ruang untuk navbar melayang di bawah layar */
const NAV_SPACE = 110;
const TIME_W = 62;
const DOT_COL = 22;
const IMAGE_SIZE = 64;

type IconName = ComponentProps<typeof Ionicons>['name'];

function openMap(d: Destination) {
  const query =
    d.latitude != null && d.longitude != null
      ? `${d.latitude},${d.longitude}`
      : encodeURIComponent(`${d.name} ${d.area} Bali`);
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
    // tidak ada aplikasi peta: abaikan
  });
}

function Hero() {
  const { t } = useLanguage();
  return (
    <View style={styles.hero}>
      {/* Gradien matahari terbenam sebagai pengganti foto; ganti dengan <Image> bila ada fotonya */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sunset" x1="0" y1="0" x2="1" y2="1">
            <GradientStop offset="0" stopColor="#3C3F6B" />
            <GradientStop offset="0.55" stopColor="#D9728A" />
            <GradientStop offset="1" stopColor="#F2A65A" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#sunset)" />
      </Svg>
      <Text style={styles.heroTitle}>{t('trip.hero')}</Text>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={HOME.primary} />
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function TripDetail({ trip }: { trip: Itinerary }) {
  const { t } = useLanguage();
  const stops = trip.days.reduce((sum, d) => sum + d.stops.length, 0);
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailTitle}>{t('trip.detail')}</Text>
      <View style={styles.stats}>
        <Stat icon="location" label={t('trip.stops')} value={String(stops)} />
        <Stat icon="time" label={t('trip.duration.short')} value={t('trip.hours', { count: trip.totalHours })} />
        <Stat icon="wallet" label={t('trip.cost')} value={shortPrice(trip.totalCost)} />
        <Stat icon="people" label={t('trip.travelers.short')} value={String(trip.travelers)} />
      </View>
    </View>
  );
}

function StopCard({
  stop,
  trip,
  onPress,
}: {
  stop: Stop;
  trip: Itinerary;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  const d = stop.destination;
  const cost = stopCost(d, trip.travelers, 1);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.viewDetailOf', { name: d.name })}
      onPress={onPress}
      style={({ pressed }) => [styles.stopCard, pressed && styles.pressed]}
    >
      <Cover
        uri={d.images[0]}
        kind={d.kind}
        width={IMAGE_SIZE}
        height={IMAGE_SIZE}
        radius={12}
      />

      <View style={styles.stopBody}>
        <Text style={styles.stopName} numberOfLines={1}>
          {d.name}
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText} numberOfLines={1}>
            {d.category}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location" size={11} color={HOME.primary} />
          <Text style={styles.stopArea} numberOfLines={1}>
            {d.area}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="star" size={11} color="#F0A93A" />
          <Text style={styles.stopArea}>{d.rating.toFixed(1)}/5</Text>
        </View>
      </View>

      <View style={styles.stopSide}>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={12} color={HOME.body} />
          <Text style={styles.sideText} numberOfLines={1}>
            {d.hours}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="wallet-outline" size={12} color={HOME.body} />
          <Text style={styles.sideText} numberOfLines={1}>
            {cost === 0 ? t('filter.price.free') : shortPrice(cost)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={6}
          onPress={() => openMap(d)}
          style={styles.mapButton}
        >
          <Ionicons name="navigate" size={11} color={HOME.title} />
          <Text style={styles.mapText}>{t('trip.viewLocation')}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function DaySection({
  day,
  index,
  trip,
  onOpen,
}: {
  day: Day;
  index: number;
  trip: Itinerary;
  onOpen: (id: string) => void;
}) {
  const { t, language } = useLanguage();

  return (
    <View style={styles.day}>
      <View style={styles.dayHeader}>
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>{t('trip.dayLabel', { n: index + 1 })}</Text>
        </View>
        <Ionicons name="location" size={18} color={HOME.dark} />
        <Text style={styles.dayTitle} numberOfLines={1}>
          {day.title}
        </Text>
      </View>

      {day.stops.map((stop, i) => (
        <View key={`${stop.destination.id}-${i}`} style={styles.timelineRow}>
          <Text style={styles.time}>{formatClock(stop.start, language)}</Text>

          {/* Garis waktu: garis penuh per baris supaya tersambung, titik di bagian atas */}
          <View style={styles.dotCol}>
            <View
              style={[
                styles.line,
                i === 0 && { top: 12 },
                // baris terakhir: garis berhenti di titik, tidak memanjang ke bawah
                i === day.stops.length - 1 && { bottom: undefined, height: i === 0 ? 0 : 12 },
              ]}
            />
            <View style={styles.dot} />
          </View>

          <View style={styles.stopWrap}>
            <StopCard stop={stop} trip={trip} onPress={() => onOpen(stop.destination.id)} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Tab Itinerary: belum ada rencana -> ajakan menyusun; sudah ada -> jadwal per hari. */
export default function ItineraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const trip = useItinerary();

  const plan = () => {
    resetTripDraft();
    router.push('/trip-preferences');
  };

  const open = (id: string) => router.push({ pathname: '/destination/[id]', params: { id } });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + NAV_SPACE,
          flexGrow: 1,
        }}
      >
        <View style={styles.pad}>
          <Hero />
        </View>

        {!trip ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar" size={34} color={HOME.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('trip.empty.title')}</Text>
            <Text style={styles.emptyText}>{t('trip.empty.text')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={plan}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Text style={styles.ctaText}>{t('trip.empty.cta')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.pad}>
              <TripDetail trip={trip} />

              {trip.stay ? (
                <View style={styles.stayCard}>
                  <Ionicons name="bed" size={20} color={HOME.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stayLabel}>{t('trip.stay')}</Text>
                    <Text style={styles.stayName} numberOfLines={1}>
                      {trip.stay.name} · {trip.stay.area}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {trip.days.map((day, index) => (
              <DaySection key={index} day={day} index={index} trip={trip} onOpen={open} />
            ))}

            <View style={styles.pad}>
              <Pressable
                accessibilityRole="button"
                onPress={plan}
                style={({ pressed }) => [styles.again, pressed && styles.pressed]}
              >
                <Ionicons name="refresh" size={18} color={HOME.title} />
                <Text style={styles.againText}>{t('trip.replan')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HOME.bg,
  },
  pad: {
    paddingHorizontal: SIDE,
    gap: 12,
  },
  hero: {
    height: 104,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 36,
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#D7ECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: HOME.title,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: HOME.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  cta: {
    marginTop: 8,
    height: 50,
    paddingHorizontal: 28,
    borderRadius: 25,
    backgroundColor: HOME.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
  detailCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#C9E2DD',
    gap: 10,
  },
  detailTitle: {
    color: HOME.title,
    fontSize: 14,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    color: HOME.body,
    fontSize: 10,
  },
  statValue: {
    color: HOME.title,
    fontSize: 14,
    fontWeight: '800',
  },
  stayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HOME.border,
    backgroundColor: HOME.card,
  },
  stayLabel: {
    color: HOME.body,
    fontSize: 11,
  },
  stayName: {
    color: HOME.title,
    fontSize: 14,
    fontWeight: '800',
  },
  day: {
    marginTop: 22,
    paddingHorizontal: SIDE,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dayPill: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 8,
    backgroundColor: HOME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  dayTitle: {
    flex: 1,
    color: HOME.title,
    fontSize: 16,
    fontWeight: '800',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 10,
  },
  time: {
    width: TIME_W,
    marginTop: 2,
    color: HOME.title,
    fontSize: 11,
    fontWeight: '700',
  },
  dotCol: {
    width: DOT_COL,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    top: 0,
    bottom: -10,
    width: 2,
    backgroundColor: HOME.dark,
  },
  dot: {
    marginTop: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: HOME.dark,
  },
  stopWrap: {
    flex: 1,
  },
  stopCard: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: HOME.border,
    backgroundColor: HOME.card,
  },
  stopBody: {
    flex: 1,
    gap: 3,
  },
  stopName: {
    color: HOME.title,
    fontSize: 13,
    fontWeight: '800',
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: HOME.border,
    justifyContent: 'center',
  },
  pillText: {
    color: HOME.body,
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stopArea: {
    flexShrink: 1,
    color: HOME.body,
    fontSize: 10,
  },
  stopSide: {
    width: 84,
    gap: 5,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: HOME.border,
  },
  sideText: {
    flexShrink: 1,
    color: HOME.body,
    fontSize: 10,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C9E2DD',
  },
  mapText: {
    color: HOME.title,
    fontSize: 9,
    fontWeight: '700',
  },
  again: {
    marginTop: 24,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: HOME.title,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  againText: {
    color: HOME.title,
    fontSize: 14,
    fontWeight: '800',
  },
});