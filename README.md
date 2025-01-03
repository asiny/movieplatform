# MoviePlatform - Firebase Implementasyonu

Bu doküman, MoviePlatform projesinde kullanılan Firebase servislerini ve implementasyonunu detaylı olarak açıklamaktadır.

## İçindekiler
- [Neden Firebase?](#neden-firebase)
- [Firebase Servisleri](#firebase-servisleri)
- [Veri Yapısı](#veri-yapısı)
- [Firebase İndeksleri](#firebase-indeksleri)
- [Veri İşlemleri](#veri-işlemleri)
- [Güvenlik Kuralları](#güvenlik-kuralları)
- [Avantajlar ve Dezavantajlar](#avantajlar-ve-dezavantajlar)

## Neden Firebase?

Firebase'i tercih etmemizin başlıca sebepleri:
- Gerçek zamanlı veri senkronizasyonu
- Hazır kullanıcı kimlik doğrulama sistemi
- Serverless mimari (sunucu yönetimi gerektirmez)
- Otomatik ölçeklenebilirlik
- Esnek NoSQL veri modeli
- Dahili hosting hizmeti
- Kolay kurulum ve yönetim

## Firebase Servisleri

### Firebase Authentication
```javascript
// Kullanıcı girişi
signInWithEmailAndPassword(auth, email, password)

// Kullanıcı kaydı
createUserWithEmailAndPassword(auth, email, password)

// Çıkış işlemi
signOut(auth)
```

### Firestore Database
Koleksiyonlarımız:
- `movies` (Filmler)
- `users` (Kullanıcılar)
- `comments` (Yorumlar)
- `favorites` (Favoriler)
- `watchlist` (İzleme Listesi)
- `reviews` (İncelemeler)
- `settings` (Ayarlar)

## Veri Yapısı

### Movies Koleksiyonu
```javascript
{
    name: "Film Adı",
    description: "Film Açıklaması",
    genre: "Aksiyon, Macera",
    year: 2023,
    rating: 8.5,
    director: "Yönetmen Adı",
    actors: ["Oyuncu1", "Oyuncu2"],
    duration: 120,
    posterUrl: "poster-url",
    createdAt: timestamp,
    updatedAt: timestamp
}
```

### Users Koleksiyonu
```javascript
{
    email: "user@example.com",
    role: "user", // veya "admin"
    createdAt: timestamp,
    lastActivity: timestamp
}
```

## Firebase İndeksleri

Firestore'da sorguları hızlandırmak için oluşturulan indeksler:

```javascript
// Bileşik indeksler:
comments: movieId + timestamp (DESC)
favorites: userId + movieId
watchlist: userId + movieId
reviews: movieId + timestamp
```

## Veri İşlemleri

### Temel CRUD Operasyonları
```javascript
// Veri Ekleme
await addDoc(collection(db, 'movies'), movieData);

// Veri Okuma
const moviesSnapshot = await getDocs(collection(db, 'movies'));

// Veri Güncelleme
await updateDoc(doc(db, 'movies', movieId), updatedData);

// Veri Silme
await deleteDoc(doc(db, 'movies', movieId));
```

### Filtreleme ve Sıralama
```javascript
const query = query(
    collection(db, 'movies'),
    where('genre', '==', 'Aksiyon'),
    orderBy('rating', 'desc')
);
```

## Güvenlik Kuralları

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcı kimlik doğrulaması
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Admin kontrolü
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Film koleksiyonu kuralları
    match /movies/{movieId} {
      allow read: if true; // Herkes okuyabilir
      allow write: if isAdmin(); // Sadece admin yazabilir
    }

    // Kullanıcı koleksiyonu kuralları
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    // Yorum koleksiyonu kuralları
    match /comments/{commentId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## Avantajlar ve Dezavantajlar

### Avantajlar
- Otomatik ölçeklendirme
- Gerçek zamanlı veri senkronizasyonu
- Offline veri desteği
- Güvenlik kuralları ile veri erişim kontrolü
- Kolay entegrasyon
- Hızlı geliştirme süreci

### Dezavantajlar
- Karmaşık sorgularda kısıtlamalar
- Belirli bir veri miktarından sonra maliyetli olabilir
- İlişkisel veri modellemesi zor

## Örnek Kullanım Senaryoları

### Film Arama
```javascript
const searchMovies = async (searchTerm) => {
    const moviesRef = collection(db, 'movies');
    const q = query(
        moviesRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
};
```

### Kullanıcı Favorileri
```javascript
const getUserFavorites = async (userId) => {
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
};
```

### Film Yorumları
```javascript
const getMovieComments = async (movieId) => {
    const commentsRef = collection(db, 'comments');
    const q = query(
        commentsRef,
        where('movieId', '==', movieId),
        orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
};
```

## Sonuç

Firebase, projemizde backend ihtiyaçlarımızı karşılayan, hızlı geliştirme yapabilmemizi sağlayan ve kullanıcı yönetimini kolaylaştıran bir platform olarak kullanıldı. MySQL gibi ilişkisel veritabanlarına göre daha esnek ve hızlı bir geliştirme süreci sundu. 