# BACKEND_GUIDE.md — Balication (PBL5D2)

Panduan untuk tim backend: apa yang harus dibuat, bentuk datanya, dan **di file mana aplikasi harus disambungkan**.
Kode aplikasi ditulis tanpa backend dan belum pernah diuji pada server sungguhan, jadi anggap bagian "yang perlu diubah di aplikasi" sebagai titik awal, bukan jaminan.

---

## 1. Status saat ini: apa yang sudah jalan, apa yang masih tiruan

| Fitur | Status sekarang | Yang harus dipasang | File aplikasi |
|---|---|---|---|
| Daftar / masuk | **Tiruan lokal.** Akun disimpan di perangkat, password **tidak diperiksa** | Auth server (token) | `src/context/auth.tsx` |
| Ubah nama / foto profil | Tersimpan lokal | `PATCH /me` | `auth.tsx` → `updateAccount` |
| Data wisata (daftar, search, detail) | **Data contoh** (`USE_MOCK = true`) | `GET /destinations` | `src/lib/destinations.ts` |
| Destinasi populer (Home) | Memanggil `GET /destinations/popular` | Endpoint itu | `src/lib/api.ts` |
| Wishlist | Lokal, **satu daftar untuk semua akun** di perangkat | `GET/PUT/DELETE /me/wishlist` | `src/lib/wishlist-store.ts` |
| Preferensi wisata | Lokal per email | `GET/PUT /me/preferences` | `src/context/preferences.tsx` |
| Rekomendasi "For You" & "Show all" | Dihitung di perangkat dari daftar destinasi | Opsional: endpoint rekomendasi | `src/lib/preference-categories.ts` |
| Chatbot AI | **Jawaban tiruan** (`USE_MOCK = true`) | `POST /chat` + LLM | `src/lib/chat-api.ts` |
| Itinerary | Disusun di perangkat (aturan sederhana), disimpan lokal | Opsional: `POST /itineraries/generate` | `src/lib/itinerary.ts` |
| Cuaca | **Sudah jalan**, Open-Meteo gratis tanpa API key | Tidak perlu | `src/lib/api.ts` |
| Bahasa (id/en) | Sepenuhnya di aplikasi | Opsional: konten dua bahasa | `src/context/language.tsx` |
| Notifikasi, Chat Preferences | Menu ada, **halaman belum dibuat** | Belum ditentukan | `src/app/tabs/profile.tsx` |

---

## 2. Konfigurasi dasar

### 2.1 Alamat server

Aplikasi membaca alamat dari file `.env` di root proyek:

```
EXPO_PUBLIC_API_URL=https://api.contoh.com
```

Tanpa garis miring di akhir. Setelah mengubah `.env`: `npx expo start --clear`.

Alamat saat pengembangan:

| Perangkat | Alamat |
|---|---|
| Emulator Android | `http://10.0.2.2:3000` (10.0.2.2 = komputer pengembang) |
| iPhone / HP lewat Expo Go | `http://<IP-LAN-komputer>:3000` (satu Wi-Fi), atau URL `https://` dari ngrok |
| Produksi | **Wajib HTTPS** |

> Jangan menaruh rahasia apa pun di variabel `EXPO_PUBLIC_*`. Semua isinya **terbaca oleh siapa pun** yang membongkar aplikasi. API key AI, kunci database, dan secret JWT hanya boleh ada di server.

### 2.2 Konvensi API yang disarankan

- JSON, UTF-8. Header aplikasi: `Accept: application/json`, `Content-Type: application/json`.
- Autentikasi: `Authorization: Bearer <accessToken>`.
- Bahasa: aplikasi dapat mengirim `Accept-Language: id` atau `en` (lihat bagian 4.10).
- Respons sukses: objek atau `{ "data": ... }`. Aplikasi sudah menerima **kedua bentuk** untuk daftar destinasi (`[...]` atau `{ "data": [...] }`).
- Respons error (seragam):

```json
{ "error": { "code": "EMAIL_TAKEN", "message": "Email sudah terdaftar." } }
```

| Status | Arti |
|---|---|
| 400 / 422 | Input tidak valid |
| 401 | Belum masuk / token kedaluwarsa / password salah |
| 403 | Tidak punya hak |
| 404 | Tidak ditemukan |
| 409 | Bentrok (email sudah dipakai) |
| 429 | Terlalu banyak permintaan |

### 2.3 Pembungkus fetch bersama (belum ada, perlu dibuat di aplikasi)

Saat ini tiap file memanggil `fetch` sendiri. Setelah ada login, semua permintaan terproteksi perlu token. Buat satu pembungkus, misalnya `src/lib/http.ts`:

```ts
import * as SecureStore from 'expo-secure-store'; // npx expo install expo-secure-store
import { API_URL } from '@/lib/api';

const TOKEN_KEY = 'access_token';

export const saveToken = (t: string) => SecureStore.setItemAsync(TOKEN_KEY, t);
export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
```

Simpan token di **SecureStore** (terenkripsi), bukan AsyncStorage. Jika memakai refresh token, tambahkan satu kali percobaan ulang saat menerima 401.

---

## 3. Model data (disarankan)

Contoh untuk PostgreSQL. Nama kolom bebas, yang penting JSON keluarnya sesuai bagian 4.

```
users            id, name, email (unik, huruf kecil), password_hash, avatar (teks, nullable), created_at
destinations     id, kind, name, category, area, regency, price (integer rupiah), price_unit,
                 hours, description, rating, reviews, latitude, longitude, is_popular, created_at
destination_images   id, destination_id, url, position
destination_tags     destination_id, tag
user_preferences     user_id, category_id            -- id kategori preferensi, lihat 4.3
wishlist             user_id, destination_id, created_at   -- kunci unik (user_id, destination_id)
itineraries          id, user_id, travelers, total_cost, total_hours, stay_destination_id, created_at
itinerary_days       id, itinerary_id, day_index, title
itinerary_stops      id, day_id, destination_id, position, start_minutes, duration_minutes
reviews (opsional)   id, destination_id, user_id, rating, comment, created_at
```

Hitung `rating` dan `reviews` dari tabel `reviews` bila fitur ulasan dibuat; sementara boleh diisi manual.

---

## 4. Endpoint per fitur

### 4.1 Akun (auth)

| Metode | Path | Isi |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/refresh` | `{ refreshToken }` (jika memakai refresh token) |
| POST | `/auth/logout` | cabut refresh token (opsional) |
| GET | `/me` | profil akun yang sedang masuk |
| PATCH | `/me` | `{ name?, avatar? }` |

Respons `register` dan `login` (status 201 / 200):

```json
{
  "user": { "id": "u_123", "name": "Dewi", "email": "dewi@mail.com", "avatar": "beach" },
  "accessToken": "eyJ...",
  "refreshToken": "..."
}
```

`GET /me` dan `PATCH /me` mengembalikan objek `user` saja.

Aturan server:
- Simpan password dengan **argon2 atau bcrypt**, tidak pernah teks biasa.
- Email dinormalkan ke huruf kecil dan unik. Kode error: `EMAIL_TAKEN` (409), `INVALID_CREDENTIALS` (401), `VALIDATION` (422).
- Validasi yang sama dengan aplikasi: nama wajib diisi (maks 40 karakter), email format valid, password minimal sesuai aturan di `register.tsx`.
- `avatar` adalah **id teks** pilihan gambar bawaan: `palm`, `beach`, `temple`, `surf`, `flower`, `sunset`, `paw`, `food`, atau kosong (artinya pakai huruf pertama nama). Daftarnya ada di `src/components/profile/avatar.tsx`. Jika nanti ingin foto unggahan sendiri, tambahkan `POST /me/avatar` (multipart) dan simpan ke penyimpanan objek (S3, Cloudinary, dan sejenisnya), lalu kirim URL-nya.
- Beri batas laju (rate limit) pada `/auth/login` dan `/auth/register`.

**Yang diubah di aplikasi** (`src/context/auth.tsx`):
1. `signUp` → panggil `POST /auth/register`, simpan token dengan `saveToken`, simpan `user` ke state.
2. `signIn` → panggil `POST /auth/login`. Bagian "HANYA email yang dicocokkan" dihapus, karena server yang memeriksa password.
3. `signOut` → `clearToken()`, kosongkan state, dan **kosongkan data lokal per akun** (lihat bagian 5).
4. `updateAccount` → panggil `PATCH /me`, lalu perbarui state dari respons.
5. Saat aplikasi dibuka: jika ada token, panggil `GET /me` untuk memulihkan sesi. Setelah itu ubah `KEEP_SIGNED_IN` menjadi `true`.
6. `AuthResult.error` saat ini berisi teks bahasa Inggris. Lebih baik kembalikan **kode error** (`EMAIL_TAKEN`, dst.) lalu terjemahkan dengan `t()` di `register.tsx` dan `login.tsx`, supaya pesan ikut bahasa pilihan pengguna.

### 4.2 Data wisata

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/destinations` | semua destinasi (aplikasi memakai ini untuk Search, Wishlist, For You, detail, rekomendasi trip) |
| GET | `/destinations/popular` | untuk bagian "Popular Destination" di Home |
| GET | `/destinations/:id` | opsional, detail satu item |

**Bentuk satu destinasi** (nama field yang dibaca `normalize()` di `destinations.ts`; aplikasi toleran terhadap beberapa nama alternatif, tetapi pakai yang utama):

```json
{
  "id": "seminyak-beach",
  "kind": "Destination",
  "name": "Seminyak Beach",
  "category": "Beach",
  "area": "Seminyak, Kuta",
  "regency": "Badung",
  "rating": 4.5,
  "reviews": 5253,
  "price": 0,
  "priceUnit": "person",
  "hours": "24 Hours",
  "description": "Teks deskripsi.",
  "tags": ["Beach", "Sunset"],
  "images": ["https://cdn.contoh.com/seminyak-1.jpg", "https://cdn.contoh.com/seminyak-2.jpg"],
  "latitude": -8.6913,
  "longitude": 115.1585
}
```

Aturan nilai (penting, karena beberapa fitur bergantung pada ini):

| Field | Aturan |
|---|---|
| `id` | teks unik dan stabil (dipakai untuk wishlist dan rute `/destination/[id]`) |
| `kind` | tepat salah satu: `Destination`, `Activity`, `Accommodation` (tab pada Search, Wishlist, dan layar pilih trip). Field `type` juga dibaca |
| `category` | teks bebas, tetapi **harus mengandung kata kunci** pada tabel di bawah agar muncul di rekomendasi preferensi |
| `regency` | nama kabupaten: `Badung`, `Bangli`, `Buleleng`, `Denpasar`, `Gianyar`, `Jembrana`, `Karangasem`, `Klungkung`, `Tabanan`. Dipakai filter Location dan pilihan wilayah trip. Jika kosong, aplikasi menebak dari `area` |
| `price` | bilangan bulat rupiah; `0` = gratis |
| `priceUnit` | `"person"` atau `"night"` (akomodasi). Memengaruhi perhitungan biaya itinerary |
| `hours` | teks tampil apa adanya, contoh `"09.00 - 18.00"`, `"24 Hours"` |
| `images` | **URL absolut** (`https://...`). Boleh kosong, aplikasi menampilkan ikon pengganti. Untuk `/destinations/popular`, URL relatif juga diterima dan ditambah `API_URL` |
| `rating` | 0–5 |
| `latitude`, `longitude` | angka; dipakai tombol "View Location" (Google Maps) |
| `tags` | daftar teks; ikut dicocokkan ke preferensi |

**Kata kunci kategori preferensi** (dibandingkan huruf kecil, boleh sebagian kata, terhadap `category` dan `tags`):

| id preferensi | kata kunci |
|---|---|
| beach | beach |
| nature | nature |
| temples | temple, culture |
| waterpark | water park |
| hiking | hiking, trekking, trek |
| spa | spa, wellness |
| shopping | shopping, market |
| culinary | culinary, food, restaurant, cafe |
| zoo | zoo, wildlife |
| watersport | water sport, diving, snorkel, surf |
| adventure | adventure |
| museum | museum, gallery |
| themepark | theme park |
| cultural | cultural experience, cultural |
| hotel | hotel, resort |
| villa | villa |
| guesthouse | guest house, guesthouse, homestay |

Jika nama kategori di database berbeda, ubah daftar `match` di `src/lib/preference-categories.ts` atau sesuaikan datanya.

**`/destinations/popular`** saat ini dibaca oleh `fetchPopularDestinations` di `api.ts` dengan tipe lebih kecil (`id`, `name`, `location`, `image`). Paling mudah: kembalikan objek destinasi lengkap seperti di atas (field tambahan diabaikan). Saran perbaikan aplikasi: hapus tipe `Destination` kedua di `api.ts` dan pakai tipe dari `destinations.ts`, agar kartu populer bisa dibuka ke halaman detail (saat ini `onPress` masih kosong, ada `TODO`).

**Yang diubah di aplikasi** (`src/lib/destinations.ts`):
1. `const USE_MOCK = false;`
2. Pastikan `DESTINATIONS_PATH = '/destinations'`.
3. Header `Authorization` bila endpoint dibuat terproteksi (ganti `fetch` dengan `api()` dari bagian 2.3).
4. Aplikasi menyimpan hasil di memori selama 60 detik (`CACHE_MS`).

**Skala data.** Sekarang aplikasi mengunduh **seluruh** daftar, lalu menyaring di perangkat. Itu aman sampai kira-kira ratusan item. Jika data jauh lebih besar, buat filter di server:

```
GET /destinations?q=ubud&kind=Activity&category=Hiking&regency=gianyar&minRating=4&maxPrice=300000&page=1&limit=20
→ { "data": [...], "page": 1, "totalPages": 5 }
```

lalu ubah `search.tsx` agar memanggil endpoint itu (dengan jeda 300 ms setelah pengguna berhenti mengetik).

### 4.3 Preferensi wisata

| Metode | Path | Isi |
|---|---|---|
| GET | `/me/preferences` | `{ "categories": ["beach", "nature", "temples"] }` |
| PUT | `/me/preferences` | `{ "categories": [...] }` (mengganti seluruhnya) |

- Nilai `categories` adalah **id** dari tabel kata kunci di 4.2 (`beach`, `temples`, dst.), bukan label.
- Aturan yang dipakai aplikasi: minimal **3** kategori dianggap "selesai"; halaman pilih preferensi hanya tampil bila belum selesai. Server boleh menolak kurang dari 3 (422).
- **Yang diubah di aplikasi** (`src/context/preferences.tsx`): sekarang menyimpan di AsyncStorage dengan kunci `preferences_v1` per email. Ganti pembacaan awal dengan `GET /me/preferences` setelah login, dan `save` dengan `PUT /me/preferences`. Karena akun baru belum punya preferensi, respons kosong berarti halaman preferensi tampil sekali.

### 4.4 Wishlist

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/me/wishlist` | `{ "ids": ["tanah-lot", "bali-zoo"] }` urut dari lama ke baru |
| PUT | `/me/wishlist/:destinationId` | tambah (idempoten) |
| DELETE | `/me/wishlist/:destinationId` | hapus (idempoten) |

Aplikasi hanya perlu **daftar id**; datanya diambil dari `/destinations`. Jika id tidak ada lagi di database, aplikasi mengabaikannya.

**Yang diubah di aplikasi** (`src/lib/wishlist-store.ts`):
- `load()` → isi `ids` dari `GET /me/wishlist` setelah login.
- `toggleWishlist(id)` → ubah state dulu (supaya hati langsung berubah), lalu panggil `PUT` atau `DELETE`. Jika gagal, kembalikan state dan tampilkan pesan.
- Simpan cache lokal boleh, tetapi kuncinya harus **per akun** (lihat bagian 5).

### 4.5 Chatbot AI

Ini bagian yang butuh LLM. **API key AI hanya di server.**

| Metode | Path |
|---|---|
| POST | `/chat` |

Permintaan yang disarankan (aplikasi sekarang baru mengirim `{ "message": "..." }`, sisanya perlu ditambahkan di `askRemote`):

```json
{
  "message": "Rekomendasikan tempat di Ubud",
  "language": "id",
  "history": [
    { "role": "user", "text": "Halo" },
    { "role": "assistant", "text": "Halo! Mau ke mana?" }
  ]
}
```

Respons (bentuk ini sudah dibaca `chat-api.ts`; boleh pakai `reply`, `text`, atau `message` untuk isi teks):

```json
{
  "reply": "Tentu! Ubud terkenal dengan alam dan budayanya. Berikut beberapa pilihan:",
  "places": [
    {
      "id": "monkey-forest",
      "name": "Monkey Forest",
      "area": "Ubud, Gianyar",
      "rating": 4.5,
      "hours": "09.00-18.00",
      "price": "Est. IDR 100K",
      "imageUrl": "https://cdn.contoh.com/monkey.jpg"
    }
  ]
}
```

`places` bersifat opsional. Tiap `id` **harus ada di tabel destinations**, karena kartu di chat membuka halaman detail berdasarkan id itu.

**Arsitektur yang disarankan (mencegah AI mengarang tempat):**

1. Server menerima pesan pengguna.
2. Server **mencari destinasi yang relevan di database sendiri** (pencarian teks / filter wilayah dan kategori; untuk data besar bisa pakai embedding + pgvector). Ambil 10–20 teratas.
3. Server memanggil LLM dengan: instruksi sistem, riwayat singkat (misalnya 10 pesan terakhir), pesan pengguna, dan **daftar destinasi hasil langkah 2 (id, nama, area, kategori, harga, jam)**.
4. Minta LLM menjawab dalam JSON: `{ "reply": "...", "placeIds": ["monkey-forest"] }`.
5. Server memvalidasi `placeIds` (hanya id yang ada di langkah 2), mengisi detail tempat dari database, lalu mengirim `reply` + `places`.

Dengan begitu AI hanya boleh merekomendasikan tempat yang benar-benar ada di data Anda. Contoh instruksi sistem:

```
Kamu adalah asisten wisata Bali untuk aplikasi Balication.
Jawab singkat, ramah, dalam bahasa {language}.
Rekomendasikan HANYA tempat dari daftar yang diberikan. Jangan mengarang tempat, harga, atau jam buka.
Jika informasi tidak ada di daftar, katakan tidak tahu dan tawarkan alternatif dari daftar.
Keluaran WAJIB JSON: {"reply": string, "placeIds": string[]}.
```

Pilihan LLM: API Claude dari Anthropic (dokumentasi: https://docs.claude.com), atau penyedia lain. Pilih model kecil dan cepat untuk chat biasa, model lebih besar bila butuh penalaran perencanaan. Cek daftar model dan harga terbaru di dokumentasi penyedia sebelum memilih.

Hal wajib di sisi server:
- Autentikasi (hanya pengguna masuk yang boleh memakai chat) dan **batas laju** per pengguna (biaya LLM dihitung per token).
- Batas panjang pesan dan riwayat; timeout (balasan LLM bisa 5–20 detik, aplikasi sudah menampilkan indikator mengetik).
- Jangan mencatat data pribadi di log.
- Opsional: streaming (SSE) agar teks muncul bertahap. Aplikasi saat ini menunggu respons utuh; streaming memerlukan perubahan di `chat-api.ts` dan `chatbot.tsx`.

**Yang diubah di aplikasi** (`src/lib/chat-api.ts`): `USE_MOCK = false`; `CHAT_PATH = '/chat'`; tambahkan `language` dan `history` pada `body` di `askRemote`; pakai `api()` agar token ikut terkirim. Pertanyaan bawaan (`SUGGESTIONS`) masih bahasa Inggris dan belum diterjemahkan.

### 4.6 Itinerary

Saat ini jadwal dibuat **di perangkat** oleh `buildItinerary()` (`src/lib/itinerary.ts`): tempat berdekatan dikelompokkan per hari, mulai 09.00, jeda 45 menit, biaya dihitung dari `price`, `priceUnit`, jumlah malam, dan jumlah wisatawan. Hasil disimpan di AsyncStorage (`itinerary_v1`). Aplikasi ini **sudah berfungsi tanpa backend**. Ada tiga tingkat:

**Tingkat A, tanpa perubahan.** Biarkan di perangkat.

**Tingkat B, simpan ke akun** (agar tidak hilang saat ganti HP):

| Metode | Path |
|---|---|
| GET | `/me/itineraries/latest` |
| PUT | `/me/itineraries/latest` |

Bentuk data (sama dengan tipe `Itinerary` di `itinerary.ts`, tetapi `destination` cukup berupa id):

```json
{
  "travelers": 2,
  "totalCost": 1850000,
  "totalHours": 10,
  "stayDestinationId": "villa-canggu",
  "days": [
    {
      "title": "Seminyak & Kuta",
      "stops": [
        { "destinationId": "seminyak-beach", "startMinutes": 540, "durationMinutes": 120 },
        { "destinationId": "waterboom", "startMinutes": 705, "durationMinutes": 120 }
      ]
    }
  ]
}
```

`startMinutes` adalah menit sejak 00.00 (540 = 09.00). Di aplikasi, saat memuat, ubah `destinationId` menjadi objek `Destination` dari `/destinations`.

**Tingkat C, jadwal dibuat server (dengan AI atau algoritma rute):**

`POST /itineraries/generate`

```json
{
  "categories": ["beach", "culinary"],
  "regencyIds": ["badung", "gianyar"],
  "budgetMaxPerPerson": 3000000,
  "days": 3,
  "travelers": 2,
  "selectedIds": ["seminyak-beach", "waterboom", "villa-canggu"]
}
```

Respons: bentuk seperti di Tingkat B. Server dapat memakai LLM seperti di 4.5 (dengan daftar destinasi hasil filter sebagai satu-satunya bahan) atau algoritma rute sederhana berdasarkan koordinat. Di aplikasi, ganti isi `buildItinerary` (dipanggil dari `trip-recommendations.tsx`, tombol "Generate My Itinerary") dengan panggilan ini, dan tampilkan indikator memuat selama menunggu.

`budgetId` di formulir adalah salah satu dari `b1` (<1 jt), `b2` (1–3 jt), `b3` (3–5 jt), `b4` (>5 jt) per orang untuk seluruh perjalanan. Ubah ke angka rupiah sebelum dikirim.

### 4.7 Rekomendasi "For You"

Saat ini dihitung di perangkat: destinasi yang cocok kategori pilihan, diurutkan menurut jumlah kecocokan lalu rating. Cukup untuk data ratusan item. Jika ingin di server:

`GET /me/recommendations?limit=8` → daftar destinasi (bentuk seperti 4.2) berdasarkan preferensi akun. Di aplikasi ganti `recommend()` di `for-you.tsx` dan `recommendations.tsx`.

### 4.8 Cuaca

Memakai **Open-Meteo** langsung dari aplikasi. Tidak perlu API key dan tidak perlu backend. Catatan: paket gratis Open-Meteo ditujukan untuk pemakaian non-komersial; untuk produk komersial lihat syarat mereka. Jika ingin menyembunyikan sumber atau menyimpan cache, buat proxy `GET /weather?regency=badung` di server dan ubah `fetchWeather` di `api.ts`.

### 4.9 Ulasan (belum ada di aplikasi)

Halaman detail menampilkan `rating` dan `reviews` (angka saja). Jika ingin ulasan pengguna: `GET /destinations/:id/reviews`, `POST /destinations/:id/reviews`. Perlu halaman baru di aplikasi.

### 4.10 Bahasa konten

Teks antarmuka sudah dua bahasa di aplikasi. **Isi data** dari server (nama, `description`, `category`) tampil apa adanya. Pilihan:
- Cukup satu bahasa (sederhana).
- Server membaca header `Accept-Language` dan mengirim `description`, `category` sesuai bahasa. Di aplikasi, tambahkan header itu pada pembungkus `api()`, dan **kosongkan `cache`** di `destinations.ts` saat bahasa berganti. Catatan: kata kunci kategori preferensi (4.2) saat ini bahasa Inggris, jadi jika `category` diterjemahkan, rekomendasi bisa tidak cocok. Kirim `tags` dalam bahasa Inggris tetap, atau tambahkan field `categoryKey` yang tidak diterjemahkan.

---

## 5. Data lokal yang harus dibuat "per akun" (penting)

Beberapa data lokal sekarang **dipakai bersama semua akun di satu perangkat**. Setelah ada backend dan beberapa pengguna bisa login di HP yang sama, ini menyebabkan data bocor antar akun:

| Kunci AsyncStorage | Isi | Masalah | Solusi |
|---|---|---|---|
| `wishlist_v1` | id wishlist | Satu daftar untuk semua akun | Muat dari server saat login; hapus saat `signOut` |
| `itinerary_v1` | itinerary terakhir | Sama | Sama, atau sertakan id akun pada kunci |
| `preferences_v1` | preferensi (per email) | Sudah per email, tetapi sebaiknya dari server | Lihat 4.3 |
| `auth_account_v1`, `auth_session_v1` | akun tiruan | Diganti token | Hapus setelah auth server aktif |
| `language_v1`, `onboarding_done_v1`, `weather_regency_v1` | pengaturan perangkat | Aman dibiarkan | Tidak perlu diubah |

Saat `signOut`: kosongkan state wishlist dan itinerary di memori **dan** penyimpanan lokalnya.

---

## 6. Pilihan teknologi backend

**Jalur A: server sendiri** (paling fleksibel, paling banyak pekerjaan)
- Node.js (Express / Fastify / NestJS) atau Python (FastAPI) + PostgreSQL (+ Prisma / Drizzle / SQLAlchemy).
- Auth: JWT (access 15 menit + refresh 30 hari) atau sesi. Hash: argon2.
- Gambar: simpan di S3 / Cloudinary / Supabase Storage; database hanya menyimpan URL.
- Deploy: Railway, Render, Fly.io, atau VPS. Wajib HTTPS.

**Jalur B: layanan siap pakai** (tercepat untuk proyek kuliah)
- Supabase (Postgres + Auth + Storage + Row Level Security) atau Firebase.
- Auth, tabel (4.2–4.4), dan penyimpanan gambar sudah tersedia. Endpoint khusus seperti `/chat` tetap perlu server kecil (Supabase Edge Function / Cloud Function) agar API key AI tersembunyi.
- Kekurangan: bentuk JSON mengikuti tabel Anda, jadi `normalize()` di `destinations.ts` dan fungsi `auth` di aplikasi perlu disesuaikan.

Apa pun pilihannya, bentuk JSON di bagian 4 adalah kontrak yang dibaca aplikasi.

---

## 7. Keamanan: daftar periksa singkat

- [ ] HTTPS di produksi; CORS tidak relevan untuk aplikasi native, tetapi aktifkan dengan benar bila ada web.
- [ ] Password di-hash (argon2/bcrypt), tidak pernah dicatat di log.
- [ ] Rate limit pada login, register, dan chat.
- [ ] Setiap endpoint `/me/*` memeriksa token **dan** hanya mengakses data milik pengguna itu (cegah mengakses wishlist orang lain lewat id).
- [ ] Validasi semua input di server (panjang, tipe, daftar nilai yang diizinkan), jangan percaya aplikasi.
- [ ] API key AI dan secret JWT hanya di variabel lingkungan server.
- [ ] Token di SecureStore, bukan AsyncStorage.
- [ ] Batas ukuran dan tipe file jika ada unggah foto.

---

## 8. Urutan pengerjaan yang disarankan

1. **Data wisata**: `GET /destinations` dengan 10–20 destinasi nyata (+ gambar URL absolut). Set `USE_MOCK = false`. Ini langsung mengaktifkan Home, Search, Detail, For You, dan layar pilih trip.
2. **`GET /destinations/popular`** (boleh memakai `is_popular` atau urutan rating).
3. **Auth** (4.1) + pembungkus `api()`. Aktifkan `KEEP_SIGNED_IN`.
4. **Preferensi** dan **wishlist** per akun (4.3, 4.4) + pembersihan saat logout (bagian 5).
5. **Chatbot** (4.5) dengan pola "cari di database dulu, lalu AI".
6. **Itinerary tersimpan di akun** (4.6 Tingkat B), lalu bila perlu Tingkat C.
7. Opsional: filter di server, ulasan, unggah foto profil, notifikasi.

### Uji cepat dengan curl

```bash
# Data wisata
curl -s http://localhost:3000/destinations | head -c 600

# Daftar & masuk
curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dewi","email":"dewi@mail.com","password":"Rahasia123"}'

# Wishlist (ganti TOKEN)
curl -s -X PUT http://localhost:3000/me/wishlist/tanah-lot -H "Authorization: Bearer TOKEN"
curl -s http://localhost:3000/me/wishlist -H "Authorization: Bearer TOKEN"

# Chat
curl -s -X POST http://localhost:3000/chat \
  -H "Authorization: Bearer TOKEN" -H 'Content-Type: application/json' \
  -d '{"message":"tempat makan enak di Ubud","language":"id"}'
```

Jika aplikasi menampilkan "Tidak bisa terhubung", periksa urutan ini: (1) server berjalan, (2) `EXPO_PUBLIC_API_URL` benar untuk perangkat yang dipakai (tabel 2.1) dan Expo dijalankan ulang dengan `--clear`, (3) HP dan komputer satu Wi-Fi, dan firewall Windows mengizinkan port server.

---

## 9. Peta cepat: file aplikasi yang perlu disentuh

| Tujuan | File | Perubahan |
|---|---|---|
| Alamat server | `.env` | `EXPO_PUBLIC_API_URL` |
| Pembungkus fetch + token | `src/lib/http.ts` (baru) | bagian 2.3 |
| Akun | `src/context/auth.tsx`, `src/app/register.tsx`, `src/app/login.tsx` | 4.1 |
| Data wisata | `src/lib/destinations.ts` | `USE_MOCK = false` |
| Destinasi populer | `src/lib/api.ts` | `POPULAR_PATH`, samakan tipe |
| Wishlist | `src/lib/wishlist-store.ts` | 4.4 |
| Preferensi | `src/context/preferences.tsx` | 4.3 |
| Chat AI | `src/lib/chat-api.ts` | 4.5 |
| Itinerary | `src/lib/itinerary.ts`, `src/app/trip-recommendations.tsx` | 4.6 |
| Kategori ↔ data | `src/lib/preference-categories.ts` | daftar `match` |
