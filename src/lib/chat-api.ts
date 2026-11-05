import { API_URL } from '@/lib/api';

/** Kartu destinasi yang bisa dilampirkan pada jawaban AI. */
export type Place = {
    id: string;
    name: string;
    area: string; // contoh: "Ubud, Gianyar"
    rating?: number;
    hours?: string; // contoh: "09.00-18.00"
    price?: string; // contoh: "Est. IDR 260K-300K"
    imageUrl?: string; // opsional; tanpa gambar, kartu memakai ikon pengganti
};

export type AiReply = {
    text: string;
    places?: Place[];
};

/**
 * true  = jawaban TIRUAN (untuk mencoba tampilan tanpa backend).
 * false = memanggil backend Anda lewat askRemote().
 */
const USE_MOCK = true;

/** Path endpoint chat di backend Anda. Ubah sesuai API tim. */
const CHAT_PATH = '/chat';

/** Pertanyaan bawaan. Ditampilkan sebagai tombol cepat. */
export const SUGGESTIONS: { label: string; icon: string }[] = [
    { label: 'Recommend me a trip', icon: 'sparkles-outline' },
    { label: 'Best place to visit', icon: 'location-outline' },
    { label: 'Local food recommendation', icon: 'restaurant-outline' },
    { label: 'Find accommodation', icon: 'home-outline' },
    { label: 'Hidden gems in Bali', icon: 'compass-outline' },
    { label: 'Best beaches for sunset', icon: 'sunny-outline' },
    { label: '3-day itinerary on a budget', icon: 'calendar-outline' },
    { label: 'Best time to visit Bali', icon: 'partly-sunny-outline' },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Jawaban tiruan berdasarkan kata kunci sederhana. */
async function askMock(question: string): Promise<AiReply> {
    await wait(1100);
    const q = question.toLowerCase();

    if (q.includes('ubud')) {
        return {
            text: 'Of course! Ubud is known for its nature, culture, and peaceful atmosphere. Here are some popular destinations in Ubud that might interest you:',
            places: [
                {
                    id: 'monkey-forest',
                    name: 'Monkey Forest',
                    area: 'Ubud, Gianyar',
                    rating: 4.5,
                    hours: '09.00-18.00',
                    price: 'Est. IDR 260K-300K',
                },
                {
                    id: 'tegallalang',
                    name: 'Tegallalang Rice Terrace',
                    area: 'Tegallalang, Gianyar',
                    rating: 4.6,
                    hours: '08.00-18.00',
                    price: 'Est. IDR 150K-250K',
                },
                {
                    id: 'tirta-empul',
                    name: 'Tirta Empul Temple',
                    area: 'Tampaksiring, Gianyar',
                    rating: 4.7,
                    hours: '08.00-18.00',
                    price: 'Est. IDR 200K-300K',
                },
            ],
        };
    }

    if (q.includes('food') || q.includes('eat') || q.includes('makan')) {
        return {
            text: 'You should try these local favorites: babi guling, nasi campur Bali, lawar, and sate lilit. For a relaxed meal, look for a warung in Ubud or Denpasar.',
        };
    }

    if (q.includes('accommodation') || q.includes('hotel') || q.includes('stay')) {
        return {
            text: 'Tell me your budget and the area you like (for example Seminyak for nightlife, Ubud for nature, Uluwatu for cliffs), and I will suggest places to stay.',
        };
    }

    if (q.includes('beach') || q.includes('sunset')) {
        return {
            text: 'For sunsets, try Seminyak, Jimbaran, and Uluwatu. For calm water, Nusa Dua and Sanur are good choices.',
        };
    }

    return {
        text: 'Happy to help! Tell me where you want to go, how many days you have, and your budget, and I will build a plan for you.',
    };
}

/** Memanggil backend. Format yang diasumsikan: POST { message } -> { reply, places? }. */
async function askRemote(question: string, signal?: AbortSignal): Promise<AiReply> {
    const response = await fetch(`${API_URL}${CHAT_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
        signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    return {
        text: String(json.reply ?? json.text ?? json.message ?? ''),
        places: Array.isArray(json.places) ? json.places : undefined,
    };
}

export function askAI(question: string, signal?: AbortSignal): Promise<AiReply> {
    return USE_MOCK ? askMock(question) : askRemote(question, signal);
}