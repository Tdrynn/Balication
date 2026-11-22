# Balication

Aplikasi pendamping wisata Bali untuk Android dan iOS. Pengguna dapat menjelajahi destinasi, aktivitas, dan akomodasi, menyimpan favorit, mendapat rekomendasi sesuai minat, bertanya kepada asisten AI, dan menyusun itinerary perjalanan.

## Daftar isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Prasyarat](#prasyarat)
- [Menjalankan aplikasi](#menjalankan-aplikasi)
- [Konfigurasi `.env`](#konfigurasi-env)
- [Struktur proyek](#struktur-proyek)
- [Status pengembangan](#status-pengembangan)
- [Mengatasi error](#mengatasi-error)
- [Dokumen lain](#dokumen-lain)

## Fitur

- **Onboarding, daftar, dan masuk** dengan animasi splash.
- **Beranda:** carousel, cuaca per kabupaten (otomatis dari GPS atau dipilih manual), destinasi populer, dan rekomendasi "For You" sesuai preferensi.
- **Pencarian:** kata kunci dengan filter jenis, kategori, lokasi, rentang harga, dan rating. Filter bisa disembunyikan.
- **Detail destinasi** dengan carousel foto, jam buka, harga, dan deskripsi.
- **Preferensi wisata:** 17 kategori, dipilih sekali setelah membuat akun dan bisa diubah dari Profil.
- **Wishlist** dengan filter dan tombol urungkan.
- **Itinerary:** isi preferensi perjalanan, pilih destinasi, lalu aplikasi menyusun jadwal per hari dengan perkiraan biaya.
- **Chatbot AI** dengan pertanyaan bawaan dan kartu rekomendasi tempat.
- **Profil:** ubah foto profil (gambar bawaan), nama, dan bahasa lewat dialog.
- **Dua bahasa (Indonesia dan Inggris).** Bahasa awal mengikuti bahasa perangkat dan bisa diganti dari Profil.
- **Navbar Android bertema kaca (glassmorphism)** dengan animasi, dan navbar bawaan iOS (`NativeTabs`).

## Teknologi

| Bagian | Yang dipakai |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 58 + React Native |
| Bahasa | TypeScript |
| Navigasi | [Expo Router](https://docs.expo.dev/router/introduction/) (rute berbasis berkas, tipe rute otomatis) |
| Penyimpanan lokal | `@react-native-async-storage/async-storage` |
| Lokasi dan bahasa perangkat | `expo-location`, `expo-localization` |
| Font | `expo-font` + `@expo-google-fonts` (Idiqlat dan Hurricane untuk logo) |
| Grafik dan ikon | `react-native-svg`, `@expo/vector-icons` |
| Lainnya | `expo-haptics`, `react-native-safe-area-context` |
| Cuaca | [Open-Meteo](https://open-meteo.com) (gratis, tanpa API key) |
| Compiler | React Compiler aktif |

Versi paket yang tepat ada di `package.json`.

## Prasyarat

- [Node.js](https://nodejs.org) versi LTS dan npm.
- Salah satu atau kedua:
  - **Aplikasi Expo Go** di HP (Android atau iPhone) yang mendukung Expo SDK 58. Cek versi di App Store atau Play Store.
  - **Emulator Android** lewat [Android Studio](https://developer.android.com/studio) (Device Manager).
- HP dan komputer berada di **Wi-Fi yang sama** (atau pakai mode tunnel, lihat di bawah).
- Akun Expo (gratis) bila memakai mode tunnel.

Tidak perlu akun Apple Developer untuk mencoba di iPhone lewat Expo Go.

## Menjalankan aplikasi

```bash
# 1. Unduh proyek
git clone <URL-REPOSITORY-ANDA>
cd PBL5D2

# 2. Pasang dependensi
npm install

# 3. (Opsional) salin dan isi konfigurasi
#    Windows PowerShell: copy .env.example .env
cp .env.example .env

# 4. Jalankan
npx expo start
```

Setelah Metro berjalan, terminal menampilkan kode QR dan menu:

| Tombol | Fungsi |
|---|---|
| `a` | Buka di emulator Android |
| `r` | Muat ulang aplikasi |
| `j` | Buka debugger |
| `Ctrl + C` | Berhenti |

**Android (HP):** buka Expo Go, pilih *Scan QR code*, lalu scan kode di terminal.
**iPhone:** buka kamera bawaan, scan kode QR, lalu pilih *Open in Expo Go*.

### Jika HP tidak bisa terhubung (beda jaringan, jaringan kampus, firewall)

```bash
npx expo start --tunnel
```

Mode ini memakai ngrok (`@expo/ngrok`). Pertama kali, Expo mungkin meminta login: jalankan `npx expo login`.

### Setelah mengubah `.env` atau menambah paket

```bash
npx expo start --clear
```

### Perintah berguna

| Perintah | Fungsi |
|---|---|
| `npx expo start` | Jalankan server pengembangan |
| `npx expo start --clear` | Jalankan dengan membersihkan cache Metro |
| `npx expo start --tunnel` | Jalankan lewat tunnel |
| `npx expo install <paket>` | Pasang paket dengan versi yang cocok dengan SDK |
| `npx expo install --fix` | Samakan versi paket dengan SDK |
| `npx expo-doctor` | Periksa masalah konfigurasi proyek |
| `npx tsc --noEmit` | Periksa tipe TypeScript tanpa menjalankan aplikasi |

## Konfigurasi `.env`

Buat berkas `.env` di root proyek (berkas ini **tidak boleh** di-commit; pastikan ada di `.gitignore`):

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

| Perangkat | Nilai `EXPO_PUBLIC_API_URL` |
|---|---|
| Emulator Android | `http://10.0.2.2:3000` (`10.0.2.2` = komputer Anda) |
| HP lewat Expo Go | `http://<IP-komputer-di-Wi-Fi>:3000`, atau URL `https://` dari ngrok |
| Produksi | `https://...` (wajib HTTPS) |

Tanpa backend, biarkan kosong: aplikasi memakai data contoh. Jangan menaruh rahasia (API key AI, secret JWT) di variabel `EXPO_PUBLIC_*`, karena isinya terbaca dari aplikasi.

## Struktur proyek

```
src/
  app/                     Halaman (Expo Router)
    _layout.tsx            Root layout dan penjaga akses (Stack.Protected)
    index.tsx              Onboarding
    login.tsx, register.tsx
    preferences.tsx        Pilih preferensi (sekali setelah daftar)
    edit-preferences.tsx   Ubah preferensi (dari Profil)
    search.tsx             Pencarian
    destination/[id].tsx   Detail destinasi
    recommendations.tsx    Semua rekomendasi "For You"
    trip-preferences.tsx   Formulir itinerary
    trip-recommendations.tsx  Pilih destinasi untuk itinerary
    tabs/                  Home, Itinerary, Wishlist, Chatbot, Profile
  components/              Komponen tampilan (home, search, profile, chat, dst.)
  context/                 State global: auth, bahasa, onboarding, preferensi
  hooks/                   use-remote, use-regency
  lib/                     API, data destinasi, terjemahan, itinerary, wishlist
assets/                    Gambar dan font
```

Nama folder tab adalah `tabs` (bukan `(tabs)`).

## Status pengembangan

| Bagian | Status |
|---|---|
| Cuaca | Berfungsi (Open-Meteo) |
| Data destinasi | **Data contoh** (`USE_MOCK = true` di `src/lib/destinations.ts`) |
| Chatbot AI | **Jawaban tiruan** (`USE_MOCK = true` di `src/lib/chat-api.ts`) |
| Akun (daftar dan masuk) | **Tiruan lokal**: akun tersimpan di perangkat dan password belum diperiksa |
| Wishlist, preferensi, itinerary | Tersimpan lokal di perangkat |
| Terjemahan | Sebagian besar halaman sudah; halaman detail destinasi dan chatbot masih bahasa Inggris |

Cara menyambungkan semuanya ke server ada di [`BACKEND_GUIDE.md`](./BACKEND_GUIDE.md).

## Mengatasi error

Jika sesuatu aneh, urutan pertama yang sering menyelesaikan: hentikan server (`Ctrl + C`), jalankan `npx expo start --clear`, lalu tutup dan buka ulang Expo Go.

### Aplikasi dan Metro

**`Port 8081 is being used by another process`**
Ada Metro lain yang masih berjalan. Tutup terminal lama, atau jawab `Y` agar Expo memakai port lain. Di Windows: `netstat -ano | findstr :8081`, lalu `taskkill /PID <nomor> /F`.

**QR di-scan tetapi aplikasi tidak terbuka atau "Something went wrong" / timeout**
- Pastikan HP dan komputer di Wi-Fi yang sama, dan Wi-Fi tidak memakai isolasi klien (sering pada Wi-Fi kampus atau publik).
- Izinkan Node.js lewat firewall Windows pada jaringan *Private*.
- Coba `npx expo start --tunnel`.

**`npx expo start --tunnel` gagal atau ngrok error**
- Jalankan `npx expo login` dahulu.
- Pastikan paket `@expo/ngrok` terpasang: `npm install --save-dev @expo/ngrok`.
- Antivirus atau VPN dapat memblokir ngrok; matikan sementara.

**Expo Go menolak proyek: "Project is incompatible with this version of Expo Go"**
Versi Expo Go tidak sama dengan SDK proyek. Perbarui Expo Go dari toko aplikasi, lalu jalankan `npx expo install --fix`.

**Perubahan tidak muncul, tampilan lama masih tampil, atau `.env` tidak terbaca**
Jalankan `npx expo start --clear`. Variabel `.env` hanya dibaca saat Metro dimulai.

**`npm install` gagal karena konflik versi (peer dependency)**
Hapus `node_modules` dan `package-lock.json`, lalu `npm install`. Untuk paket Expo selalu pakai `npx expo install <paket>`, bukan `npm install <paket>`, agar versinya cocok dengan SDK. Periksa dengan `npx expo-doctor`.

**Emulator Android tidak terdeteksi saat menekan `a`**
Buka emulator dahulu dari Android Studio (Device Manager), tunggu sampai layar utama tampil. Periksa `adb devices`; jika kosong, tambahkan `platform-tools` ke PATH dan pastikan variabel `ANDROID_HOME` mengarah ke folder Android SDK.

### TypeScript dan editor

**`Argument of type '"/search"' is not assignable to parameter of type ...` (atau rute lain seperti `"/trip-preferences"`)**
Tipe rute dibuat otomatis dan belum diperbarui. Langkah:
1. Pastikan layar terdaftar di `src/app/_layout.tsx` (di dalam grup `Stack.Protected`).
2. Hentikan server, jalankan `npx expo start --clear`.
3. Di VS Code: `Ctrl + Shift + P` → **TypeScript: Restart TS Server**.

Jalan pintas sementara: `router.push('/rute' as Href)` (`import { type Href } from 'expo-router'`). Ini hanya menyembunyikan error tipe; rutenya tetap harus terdaftar.

**`Duplicate identifier 'X'`**
Dua impor memakai nama yang sama (contoh: `Stop` dari `react-native-svg` dan dari `lib/itinerary`). Ganti nama salah satunya: `import { Stop as GradientStop } from 'react-native-svg'`.

**`Property 'includeFontPadding' does not exist on type ...`**
`includeFontPadding` adalah properti **style**, bukan prop `<Text>`. Tulis di dalam `style={{ includeFontPadding: false }}`.

**Setelah menambah berkas baru, editor masih menandai error impor**
Restart TS Server (langkah di atas). Pastikan alias `@/` mengarah ke `src/` (cek `tsconfig.json`).

### Error saat aplikasi berjalan

**`Do not call Hooks inside useEffect(...)` / `useLanguage harus dipakai di dalam <LanguageProvider>`**
Sebuah hook (`useLanguage`, `useAuth`, dll.) dipanggil di luar komponen, misalnya di tingkat modul (di luar fungsi komponen). Pindahkan pemanggilan hook ke **dalam** komponen. Untuk teks yang didefinisikan di daftar statis, simpan **kunci terjemahan** di daftar itu dan panggil `t(kunci)` di dalam komponen.

**`undefined is not a function` di `navigation.emit` (navbar Android)**
Terjadi bila `app-tabs.android.tsx` versi lama dipakai. Gunakan versi terbaru, yang memeriksa `navigation?.emit` lebih dulu dan beralih ke `router.navigate` bila tidak ada. Jika navbar tidak muncul sama sekali, tambahkan `implementation="custom"` pada `<Tabs>`.

**Teks atau gambar tampil terpotong atau gambar terlihat "zoom"**
- Gambar: selalu beri `width` dan `height` eksplisit pada `<Image>`. Tanpa itu, React Native memakai ukuran asli gambar.
- Teks font kustom terpotong: perbesar `lineHeight` agar lebih tinggi dari `fontSize`, dan jangan memakai `fontWeight` pada font satu bobot (Android menebalkannya palsu).

**Navbar Android tertutup tombol navigasi HP**
Jarak bawah navbar dihitung dari `useSafeAreaInsets().bottom`. Pastikan `SafeAreaProvider` aktif (Expo Router sudah menyediakannya) dan layar memakai nilai `insets.bottom` untuk padding bawah.

**Font logo (Idiqlat / Hurricane) tidak tampil, atau layar tertahan di splash**
- Pasang: `npx expo install expo-font @expo-google-fonts/idiqlat @expo-google-fonts/hurricane`.
- Pastikan `useFonts(BRAND_FONTS)` dipanggil di `_layout.tsx` dan `fontsLoaded` ikut menjadi syarat `ready`.
- Jika TypeScript tidak menemukan ekspor `Idiqlat_400Regular` atau `Hurricane_400Regular`, buka `node_modules/@expo-google-fonts/<nama>/index.d.ts` dan sesuaikan nama ekspornya.
- Jalankan ulang dengan `--clear`.

**Bahasa tidak mengikuti bahasa HP (khusus Expo Go di iPhone)**
Expo Go hanya membawa bahasa Inggris pada beberapa perangkat, sehingga `expo-localization` melaporkan `en`. Itu keterbatasan Expo Go, bukan kesalahan kode. Uji dengan tombol bahasa di **Profil → Language**. Di aplikasi hasil build (standalone), tambahkan bahasa yang didukung pada konfigurasi plugin `expo-localization` di `app.json`.

**Cuaca tidak muncul atau lokasi tidak terdeteksi**
- Izinkan akses lokasi untuk aplikasi (Expo Go) di pengaturan HP, dan nyalakan layanan lokasi.
- Di emulator Android, atur lokasi lewat *Extended controls → Location*.
- Jika di luar Bali, aplikasi memakai kabupaten bawaan; pilih kabupaten secara manual di kartu cuaca.
- Cuaca butuh internet; periksa koneksi.

**"Tidak bisa terhubung. Periksa internet atau alamat server." atau "Server mengembalikan status ..."**
- Pastikan server backend berjalan dan `EXPO_PUBLIC_API_URL` benar untuk perangkat yang dipakai (lihat tabel [Konfigurasi `.env`](#konfigurasi-env)).
- Emulator Android tidak bisa memakai `localhost`; pakai `10.0.2.2`.
- HP dan komputer harus satu Wi-Fi, dan firewall mengizinkan port server.
- Restart Metro dengan `--clear` setelah mengubah `.env`.
- Android 9 ke atas memblokir `http://` (tanpa HTTPS) di aplikasi hasil build; pada Expo Go biasanya masih bisa. Untuk produksi gunakan HTTPS.

**`EXPO_PUBLIC_API_URL belum diatur di file .env`**
Buat `.env` seperti pada bagian konfigurasi, lalu jalankan `npx expo start --clear`.

**Data lama "nyangkut" (akun, preferensi, wishlist, bahasa)**
Data lokal disimpan di AsyncStorage. Cara mereset:
- Android: Pengaturan → Aplikasi → Expo Go → Penyimpanan → *Hapus data*. Di emulator bisa juga *Wipe Data*.
- iPhone: hapus lalu pasang ulang Expo Go.
- Alternatif sementara saat pengembangan: tambahkan `AsyncStorage.clear()` pada tombol debug.

Kunci yang dipakai: `auth_account_v1`, `auth_session_v1`, `onboarding_done_v1`, `preferences_v1`, `wishlist_v1`, `itinerary_v1`, `language_v1`, `weather_regency_v1`.

**Halaman pilih preferensi tidak muncul (atau muncul terus)**
Halaman itu tampil bila akun yang masuk memiliki kurang dari 3 kategori tersimpan. Jika tidak muncul, kategori untuk email itu sudah tersimpan (reset data seperti di atas). Jika muncul terus, penyimpanan gagal; periksa `src/context/preferences.tsx`.

**Setelah daftar, kembali ke halaman login setiap membuka aplikasi**
Itu pengaturan bawaan (`KEEP_SIGNED_IN = false` di `src/context/auth.tsx`). Ubah ke `true` agar sesi tetap tersimpan (sebaiknya setelah autentikasi server dipasang).

**Layar putih / splash tidak hilang**
Biasanya ada error saat memuat penyedia (provider). Lihat pesan merah atau log di terminal. Penyebab umum: font belum selesai dimuat (`fontsLoaded`), hook dipanggil di luar provider, atau berkas yang diimpor belum ada.

### Git dan GitHub

**Berkas `.env` atau `node_modules` ikut ter-commit**
Pastikan `.gitignore` memuat:
```
node_modules/
.expo/
dist/
.env
.env.*
!.env.example
```
Jika terlanjur ter-commit: `git rm -r --cached .env node_modules`, commit ulang, dan **ganti** rahasia yang sempat terunggah.

**Folder `.expo/types` ikut di-commit**
Folder itu dibuat otomatis (tipe rute) dan tidak perlu dibagikan. Cukup `.expo/` di `.gitignore`.

## Dokumen lain

- [`BACKEND_GUIDE.md`](./BACKEND_GUIDE.md): panduan membangun backend (akun, data wisata, wishlist, chatbot AI, itinerary) dan titik penyambungannya di aplikasi.

## Kontributor

PBL5D2

## Lisensi
