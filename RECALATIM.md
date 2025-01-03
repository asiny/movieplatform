# MoviePlatform - Öneri Algoritması Açıklaması

Bu doküman, MoviePlatform'da kullanılan film öneri algoritmasının detaylı açıklamasını ve kod yapısını içermektedir.

## İçindekiler
- [Algoritma Genel Bakış](#algoritma-genel-bakış)
- [Kod Yapısı ve Açıklamalar](#kod-yapısı-ve-açıklamalar)
- [Çalışma Mantığı](#çalışma-mantığı)
- [Özel Durumlar](#özel-durumlar)

## Algoritma Genel Bakış

MoviePlatform'un öneri sistemi, kullanıcıların film tercihlerini analiz ederek kişiselleştirilmiş öneriler sunar. Sistem, kullanıcının favori listesi ve izleme listesindeki filmleri baz alarak çalışır.

## Kod Yapısı ve Açıklamalar

### 1. Kullanıcı Verilerinin Toplanması
```javascript
// Kullanıcının favori ve izleme listesini alıyoruz
const favoritesQuery = query(
    collection(db, 'favorites'),
    where('userId', '==', auth.currentUser.uid)
);
const watchlistQuery = query(
    collection(db, 'watchlist'),
    where('userId', '==', auth.currentUser.uid)
);

// İki listeyi paralel olarak çekiyoruz
const [favoritesSnapshot, watchlistSnapshot] = await Promise.all([
    getDocs(favoritesQuery),
    getDocs(watchlistQuery)
]);
```

Bu bölümde:
- Firebase Firestore'dan kullanıcının favori ve izleme listeleri çekilir
- `Promise.all` kullanılarak iki sorgu paralel olarak çalıştırılır
- Performans optimizasyonu sağlanır

### 2. Film Detaylarının ve Kategorilerin Analizi
```javascript
const movieIds = new Set(); // Tekrar eden filmleri önlemek için Set kullanıyoruz
const genreFrequency = {}; // Kategori sıklığını tutmak için obje

const processMovies = async (snapshot) => {
    for (const doc of snapshot.docs) {
        const movieId = doc.data().movieId;
        try {
            const movieDetails = await fetchMovieDetails(movieId);
            movieIds.add(movieId);
            // Her filmin kategorilerini sayıyoruz
            if (movieDetails.genres) {
                movieDetails.genres.forEach(genre => {
                    genreFrequency[genre.id] = (genreFrequency[genre.id] || 0) + 1;
                });
            }
        } catch (error) {
            console.error(`Film detayları alınamadı (ID: ${movieId}):`, error);
        }
    }
};
```

Bu bölümde:
- Her film için TMDB API'sinden detaylı bilgiler çekilir
- Film kategorileri analiz edilir ve sayılır
- Hata yönetimi yapılır

### 3. En Popüler Kategorilerin Belirlenmesi
```javascript
const topGenres = Object.entries(genreFrequency)
    .sort(([,a], [,b]) => b - a) // Sıklığa göre azalan sıralama
    .slice(0, 3) // İlk 3 kategoriyi al
    .map(([genreId]) => genreId);
```

Bu bölümde:
- Kategori sıklıkları sıralanır
- En çok tercih edilen 3 kategori seçilir

### 4. Öneri Filmlerinin Getirilmesi
```javascript
const recommendationPromises = topGenres.map(async (genreId) => {
    const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?language=tr-TR&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100`,
        options
    );
    return response.json();
});

const recommendationResults = await Promise.all(recommendationPromises);
```

Bu bölümde:
- Her popüler kategori için TMDB API'sinden film önerileri alınır
- Filmler popülerlik ve oy sayısına göre filtrelenir
- Türkçe dil desteği olan filmler seçilir

### 5. Önerilerin Filtrelenmesi ve Sıralanması
```javascript
const allRecommendations = recommendationResults
    .flatMap(result => result.results)
    .filter(movie => !movieIds.has(movie.id.toString()))
    .reduce((unique, movie) => {
        return unique.some(m => m.id === movie.id)
            ? unique
            : [...unique, { ...movie, year: new Date(movie.release_date).getFullYear() }];
    }, [])
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 20);
```

Bu bölümde:
- Tekrar eden filmler kaldırılır
- Kullanıcının zaten listesinde olan filmler çıkarılır
- Puana göre sıralama yapılır
- En iyi 20 film seçilir

## Çalışma Mantığı

1. **Veri Toplama Aşaması**
   - Kullanıcının favori ve izleme listeleri alınır
   - Her film için detaylı bilgiler toplanır
   - Kategori analizi yapılır

2. **Analiz Aşaması**
   - Kategori sıklıkları hesaplanır
   - En popüler kategoriler belirlenir
   - Kullanıcı tercihleri analiz edilir

3. **Öneri Oluşturma Aşaması**
   - Popüler kategorilerde film araması yapılır
   - Kullanıcının görmediği filmler seçilir
   - Yüksek puanlı filmler filtrelenir

4. **Sonuçların İyileştirilmesi**
   - Tekrarlar kaldırılır
   - Sıralama yapılır
   - Son liste oluşturulur

## Özel Durumlar

1. **Hata Yönetimi**
   - API bağlantı hataları
   - Veri çekme hataları
   - Kullanıcı giriş kontrolleri

2. **Performans Optimizasyonu**
   - Paralel veri çekme
   - Önbellek kullanımı
   - Verimli veri yapıları

3. **Kullanıcı Deneyimi**
   - Yükleme durumları
   - Hata mesajları
   - Boş durum kontrolleri

4. **Güvenlik**
   - Kullanıcı kimlik doğrulama
   - API anahtarı yönetimi
   - Veri erişim kontrolleri

## Gelecek Geliştirmeler

1. **Algoritma İyileştirmeleri**
   - Makine öğrenimi entegrasyonu
   - Daha detaylı kullanıcı analizi
   - Gerçek zamanlı öneriler

2. **Performans İyileştirmeleri**
   - Daha iyi önbellek stratejisi
   - Daha verimli veri yapıları
   - Daha hızlı API istekleri

3. **Kullanıcı Deneyimi İyileştirmeleri**
   - Daha kişiselleştirilmiş öneriler
   - Daha iyi filtreleme seçenekleri
   - Daha zengin metadata kullanımı 