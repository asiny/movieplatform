import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, addDoc, where, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminPage.css';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

function AdminPage() {
    const { user, isAdmin } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState('movies');
    const [movies, setMovies] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingMovie, setEditingMovie] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFilters, setSearchFilters] = useState({
        name: '',
        genre: '',
        year: '',
        director: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [recommendationSettings, setRecommendationSettings] = useState({
        genreWeight: 30,
        ratingWeight: 25,
        yearWeight: 15,
        popularityWeight: 20,
        userHistoryWeight: 10,
        minimumRating: 6.0,
        maximumYearDiff: 20,
        recommendationCount: 10
    });
    const [newMovie, setNewMovie] = useState({
        name: '',
        description: '',
        genre: '',
        year: '',
        rating: '',
        director: '',
        actors: '',
        duration: '',
        posterUrl: ''
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [importStatus, setImportStatus] = useState({
        isImporting: false,
        progress: 0,
        total: 0,
        error: null
    });

    useEffect(() => {
        if (user && isAdmin) {
            fetchData();
            fetchRecommendationSettings();
        }
        setLoading(false);
    }, [user, isAdmin]);

    const fetchData = async () => {
        try {
            await Promise.all([
                fetchMovies(),
                fetchUsers(),
                fetchStats()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAddMovie = async (e) => {
        e.preventDefault();
        try {
            const movieData = {
                ...newMovie,
                year: parseInt(newMovie.year),
                rating: parseFloat(newMovie.rating),
                duration: parseInt(newMovie.duration),
                actors: newMovie.actors.split(',').map(actor => actor.trim()),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await addDoc(collection(db, 'movies'), movieData);
            setNewMovie({
                name: '',
                description: '',
                genre: '',
                year: '',
                rating: '',
                director: '',
                actors: '',
                duration: '',
                posterUrl: ''
            });
            setShowAddForm(false);
            await fetchMovies();
        } catch (error) {
            console.error('Error adding movie:', error);
        }
    };

    const fetchMovies = async () => {
        const moviesSnapshot = await getDocs(collection(db, 'movies'));
        const moviesList = moviesSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Film verisi:', {
                id: doc.id,
                ...data
            });
            return {
                id: doc.id,
                ...data
            };
        });
        setMovies(moviesList);
    };

    const fetchUsers = async () => {
        try {
            // Tüm kullanıcıları getir
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersList = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    email: data.email,
                    role: data.role,
                    createdAt: data.createdAt || null,
                    ...data
                };
            });

            // Kullanıcı yorumlarını getir
            const reviewsQuery = query(collection(db, 'reviews'));
            const reviewsSnapshot = await getDocs(reviewsQuery);
            
            // Her kullanıcı için yorum sayısını ve son aktivite tarihini hesapla
            const userReviewStats = new Map();
            reviewsSnapshot.docs.forEach(doc => {
                const review = doc.data();
                if (!userReviewStats.has(review.userId)) {
                    userReviewStats.set(review.userId, {
                        reviewCount: 1,
                        lastActivity: review.createdAt || null
                    });
                } else {
                    const stats = userReviewStats.get(review.userId);
                    stats.reviewCount++;
                    if (review.createdAt && (!stats.lastActivity || review.createdAt.toDate() > stats.lastActivity.toDate())) {
                        stats.lastActivity = review.createdAt;
                    }
                }
            });

            // Kullanıcı bilgilerini yorum istatistikleriyle birleştir
            const enrichedUsers = usersList.map(user => ({
                ...user,
                reviewCount: userReviewStats.has(user.id) ? userReviewStats.get(user.id).reviewCount : 0,
                lastActivity: userReviewStats.has(user.id) ? userReviewStats.get(user.id).lastActivity : null
            }));

            setUsers(enrichedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchStats = async () => {
        const [moviesSnapshot, reviewsSnapshot, usersSnapshot] = await Promise.all([
            getDocs(collection(db, 'movies')),
            getDocs(collection(db, 'reviews')),
            getDocs(collection(db, 'users'))
        ]);

        const genreStats = {};
        const yearStats = {};
        let totalRating = 0;
        let ratingCount = 0;

        moviesSnapshot.docs.forEach(doc => {
            const movie = doc.data();
            genreStats[movie.genre] = (genreStats[movie.genre] || 0) + 1;
            const decade = Math.floor(movie.year / 10) * 10;
            yearStats[decade] = (yearStats[decade] || 0) + 1;
            if (movie.rating) {
                totalRating += movie.rating;
                ratingCount++;
            }
        });

        setStats({
            totalMovies: moviesSnapshot.size,
            totalReviews: reviewsSnapshot.size,
            totalUsers: usersSnapshot.size,
            averageRating: (totalRating / ratingCount).toFixed(1),
            genreDistribution: genreStats,
            yearDistribution: yearStats
        });
    };

    const handleDeleteMovie = async (movieId) => {
        if (!window.confirm('Bu filmi silmek istediğinizden emin misiniz?')) return;

        try {
            await deleteDoc(doc(db, 'movies', movieId));
            
            // İlgili yorumları sil
            const reviewsQuery = query(
                collection(db, 'reviews'),
                where('movieId', '==', movieId)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const deletePromises = reviewsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            await fetchMovies();
        } catch (error) {
            console.error('Error deleting movie:', error);
        }
    };

    const handleUpdateMovie = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, 'movies', editingMovie.id), {
                name: editingMovie.name,
                description: editingMovie.description,
                genre: editingMovie.genre,
                year: parseInt(editingMovie.year),
                rating: parseFloat(editingMovie.rating),
                director: editingMovie.director,
                actors: editingMovie.actors,
                duration: parseInt(editingMovie.duration),
                posterUrl: editingMovie.posterUrl
            });

            setEditingMovie(null);
            await fetchMovies();
        } catch (error) {
            console.error('Error updating movie:', error);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: newRole
            });

            // Eğer rol değişikliği yapılan kullanıcı mevcut giriş yapmış kullanıcı ise
            if (user.uid === userId) {
                // UserContext'i güncellemek için sayfayı yenile
                window.location.reload();
            } else {
                // Sadece kullanıcı listesini güncelle
                await fetchUsers();
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Rol değiştirme işlemi başarısız oldu: ' + error.message);
        }
    };

    const fetchRecommendationSettings = async () => {
        try {
            const settingsDoc = await getDoc(doc(db, 'settings', 'recommendations'));
            if (settingsDoc.exists()) {
                setRecommendationSettings(settingsDoc.data());
            }
        } catch (error) {
            console.error('Error fetching recommendation settings:', error);
        }
    };

    const handleSettingsUpdate = async () => {
        try {
            const settingsRef = doc(db, 'settings', 'recommendations');
            const settingsDoc = await getDoc(settingsRef);

            if (!settingsDoc.exists()) {
                // Doküman yoksa oluştur
                await setDoc(settingsRef, recommendationSettings);
            } else {
                // Doküman varsa güncelle
                await updateDoc(settingsRef, recommendationSettings);
            }
            
            alert('Öneri ayarları başarıyla güncellendi!');
        } catch (error) {
            console.error('Error updating recommendation settings:', error);
            alert('Ayarlar güncellenirken bir hata oluştu: ' + error.message);
        }
    };

    const importMoviesFromTMDB = async (startYear, endYear, limit = 100) => {
        try {
            setImportStatus({
                isImporting: true,
                progress: 0,
                total: 0,
                error: null
            });

            // Her yıl için film listesi al
            for (let year = startYear; year <= endYear; year++) {
                // İlk sayfayı al ve toplam sayfa sayısını öğren
                const firstPageResponse = await fetch(
                    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=tr-TR&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&primary_release_year=${year}&with_original_language=en`
                );
                
                const firstPageData = await firstPageResponse.json();
                const totalPages = Math.min(firstPageData.total_pages, 5); // Her yıl için maksimum 5 sayfa (100 film)
                let movies = [...firstPageData.results];

                // Diğer sayfaları paralel olarak al
                if (totalPages > 1) {
                    const pagePromises = [];
                    for (let page = 2; page <= totalPages; page++) {
                        const promise = fetch(
                            `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=tr-TR&sort_by=popularity.desc&include_adult=false&include_video=false&page=${page}&primary_release_year=${year}&with_original_language=en`
                        ).then(res => res.json());
                        pagePromises.push(promise);
                    }

                    const pageResults = await Promise.all(pagePromises);
                    pageResults.forEach(pageData => {
                        movies = [...movies, ...pageData.results];
                    });
                }

                setImportStatus(prev => ({
                    ...prev,
                    total: movies.length
                }));

                // Her film için detay bilgilerini paralel olarak al
                const movieDetailsPromises = movies.slice(0, limit).map(movie => 
                    fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=credits`)
                        .then(res => res.json())
                );

                const movieDetails = await Promise.all(movieDetailsPromises);

                // Firestore'a kaydetme işlemlerini grupla
                const batchSize = 10;
                for (let i = 0; i < movieDetails.length; i += batchSize) {
                    const batch = movieDetails.slice(i, i + batchSize);
                    await Promise.all(batch.map(async (movieDetail) => {
                        const movieData = {
                            name: movieDetail.title,
                            description: movieDetail.overview,
                            genre: movieDetail.genres.map(g => g.name).join(', '),
                            year: parseInt(movieDetail.release_date.substring(0, 4)),
                            rating: movieDetail.vote_average,
                            director: movieDetail.credits.crew.find(c => c.job === 'Director')?.name || 'Bilinmiyor',
                            actors: movieDetail.credits.cast.slice(0, 5).map(actor => actor.name),
                            duration: movieDetail.runtime,
                            posterUrl: `https://image.tmdb.org/t/p/w500${movieDetail.poster_path}`,
                            popularity: movieDetail.popularity,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            voteCount: movieDetail.vote_count,
                            originalLanguage: movieDetail.original_language,
                            budget: movieDetail.budget,
                            revenue: movieDetail.revenue
                        };

                        await addDoc(collection(db, 'movies'), movieData);
                    }));

                    setImportStatus(prev => ({
                        ...prev,
                        progress: i + batch.length
                    }));
                }
            }

            await fetchMovies(); // Film listesini yenile
            setImportStatus({
                isImporting: false,
                progress: 0,
                total: 0,
                error: null
            });
            alert('Filmler başarıyla içe aktarıldı!');
        } catch (error) {
            console.error('Error importing movies:', error);
            setImportStatus(prev => ({
                ...prev,
                isImporting: false,
                error: error.message
            }));
            alert('Film içe aktarma sırasında bir hata oluştu: ' + error.message);
        }
    };

    // Yıl seçimi için event handler ekleyelim
    const handleYearChange = (e) => {
        console.log('Seçilen yıl:', e.target.value);
        console.log('Seçilen yılın tipi:', typeof e.target.value);
        setSearchFilters({
            ...searchFilters,
            year: e.target.value
        });
    };

    if (!user || !isAdmin) {
        return (
            <div className="admin-container">
                <div className="error-message">
                    Bu sayfaya erişim yetkiniz yok. Sadece admin kullanıcıları bu sayfaya erişebilir.
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading">Yükleniyor...</div>
            </div>
        );
    }

    const filteredMovies = movies.filter(movie => {
        // Debug logları
        console.log('Film:', {
            name: movie.name,
            year: movie.year,
            yearType: typeof movie.year
        });

        // Yıl filtresi için özel kontrol
        if (searchFilters.year) {
            const movieYear = parseInt(movie.year);
            const filterYear = parseInt(searchFilters.year);
            
            console.log('Yıl karşılaştırması:', {
                filmAdi: movie.name,
                filmYili: movieYear,
                arananYil: filterYear,
                eslesme: movieYear === filterYear
            });

            if (movieYear !== filterYear) {
                return false;
            }
        }

        // Diğer filtreler için kontrol
        if (searchFilters.name && !movie.name?.toLowerCase().includes(searchFilters.name.toLowerCase())) {
            return false;
        }

        if (searchFilters.genre && !movie.genre?.toLowerCase().includes(searchFilters.genre.toLowerCase())) {
            return false;
        }

        if (searchFilters.director && !movie.director?.toLowerCase().includes(searchFilters.director.toLowerCase())) {
            return false;
        }

        // Ana arama terimi kontrolü
        if (searchTerm) {
            return (
                movie.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movie.genre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movie.director?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movie.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movie.actors?.some(actor => actor.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return true;
    });

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Admin Panel</h1>
                <div className="admin-tabs">
                    <button 
                        className={`tab ${activeTab === 'movies' ? 'active' : ''}`}
                        onClick={() => setActiveTab('movies')}
                    >
                        Filmler
                    </button>
                    <button 
                        className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Kullanıcılar
                    </button>
                    <button 
                        className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recommendations')}
                    >
                        Öneriler
                    </button>
                    <button 
                        className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        İstatistikler
                    </button>
                </div>
            </div>

            {activeTab === 'movies' && (
                <div className="movies-section">
                    <div className="section-header">
                        <div className="search-container">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Film ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                <button 
                                    className="filter-toggle-button"
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    {showFilters ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
                                </button>
                            </div>
                            
                            {showFilters && (
                                <div className="advanced-filters">
                                    <div className="filter-group">
                                        <input
                                            type="text"
                                            placeholder="Film Adı"
                                            value={searchFilters.name}
                                            onChange={(e) => setSearchFilters({
                                                ...searchFilters,
                                                name: e.target.value
                                            })}
                                            className="filter-input"
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <input
                                            type="text"
                                            placeholder="Tür"
                                            value={searchFilters.genre}
                                            onChange={(e) => setSearchFilters({
                                                ...searchFilters,
                                                genre: e.target.value
                                            })}
                                            className="filter-input"
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <select
                                            value={searchFilters.year}
                                            onChange={handleYearChange}
                                            className="filter-input"
                                        >
                                            <option value="">Tüm Yıllar</option>
                                            {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <input
                                            type="text"
                                            placeholder="Yönetmen"
                                            value={searchFilters.director}
                                            onChange={(e) => setSearchFilters({
                                                ...searchFilters,
                                                director: e.target.value
                                            })}
                                            className="filter-input"
                                        />
                                    </div>
                                    <button
                                        className="clear-filters-button"
                                        onClick={() => {
                                            setSearchFilters({
                                                name: '',
                                                genre: '',
                                                year: '',
                                                director: ''
                                            });
                                            setSearchTerm('');
                                        }}
                                    >
                                        Filtreleri Temizle
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="action-buttons">
                            <button 
                                className="add-movie-button"
                                onClick={() => setShowAddForm(true)}
                            >
                                Yeni Film Ekle
                            </button>
                            <button 
                                className="import-movies-button"
                                onClick={() => {
                                    const startYear = prompt('Başlangıç yılını girin:', '1990');
                                    const endYear = prompt('Bitiş yılını girin:', '2023');
                                    const limit = prompt('Her yıl için maksimum film sayısı:', '20');
                                    
                                    if (startYear && endYear && limit) {
                                        importMoviesFromTMDB(
                                            parseInt(startYear),
                                            parseInt(endYear),
                                            parseInt(limit)
                                        );
                                    }
                                }}
                                disabled={importStatus.isImporting}
                            >
                                {importStatus.isImporting 
                                    ? `İçe Aktarılıyor... (${importStatus.progress}/${importStatus.total})`
                                    : 'TMDB\'den Film İçe Aktar'}
                            </button>
                        </div>
                    </div>

                    {importStatus.error && (
                        <div className="import-error">
                            İçe aktarma hatası: {importStatus.error}
                        </div>
                    )}

                    <div className="search-results-info">
                        {filteredMovies.length === 0 ? (
                            <p className="no-results">Arama kriterlerine uygun film bulunamadı.</p>
                        ) : (
                            <p className="results-count">Toplam {filteredMovies.length} film bulundu</p>
                        )}
                    </div>

                    {showAddForm && (
                        <div className="modal">
                            <div className="modal-content">
                                <h2>Yeni Film Ekle</h2>
                                <form onSubmit={handleAddMovie}>
                                    <div className="form-group">
                                        <label>Film Adı</label>
                                        <input
                                            type="text"
                                            value={newMovie.name}
                                            onChange={(e) => setNewMovie({
                                                ...newMovie,
                                                name: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Açıklama</label>
                                        <textarea
                                            value={newMovie.description}
                                            onChange={(e) => setNewMovie({
                                                ...newMovie,
                                                description: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Tür</label>
                                            <input
                                                type="text"
                                                value={newMovie.genre}
                                                onChange={(e) => setNewMovie({
                                                    ...newMovie,
                                                    genre: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Yıl</label>
                                            <input
                                                type="number"
                                                value={newMovie.year}
                                                onChange={(e) => setNewMovie({
                                                    ...newMovie,
                                                    year: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>IMDB Puanı</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={newMovie.rating}
                                                onChange={(e) => setNewMovie({
                                                    ...newMovie,
                                                    rating: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Yönetmen</label>
                                        <input
                                            type="text"
                                            value={newMovie.director}
                                            onChange={(e) => setNewMovie({
                                                ...newMovie,
                                                director: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Oyuncular (virgülle ayırın)</label>
                                        <input
                                            type="text"
                                            value={newMovie.actors}
                                            onChange={(e) => setNewMovie({
                                                ...newMovie,
                                                actors: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Süre (dakika)</label>
                                        <input
                                            type="number"
                                            value={newMovie.duration}
                                            onChange={(e) => setNewMovie({
                                                ...newMovie,
                                                duration: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Poster URL</label>
                                        <input
                                            type="url"
                                            value={newMovie.posterUrl}
                                            onChange={(e) => setNewMovie({
                                                ...newMovie,
                                                posterUrl: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="save-button">
                                            Kaydet
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowAddForm(false)}
                                            className="cancel-button"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {editingMovie && (
                        <div className="modal">
                            <div className="modal-content">
                                <h2>Film Düzenle</h2>
                                <form onSubmit={handleUpdateMovie}>
                                    <div className="form-group">
                                        <label>Film Adı</label>
                                        <input
                                            type="text"
                                            value={editingMovie.name}
                                            onChange={(e) => setEditingMovie({
                                                ...editingMovie,
                                                name: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Açıklama</label>
                                        <textarea
                                            value={editingMovie.description}
                                            onChange={(e) => setEditingMovie({
                                                ...editingMovie,
                                                description: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Tür</label>
                                            <input
                                                type="text"
                                                value={editingMovie.genre}
                                                onChange={(e) => setEditingMovie({
                                                    ...editingMovie,
                                                    genre: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Yıl</label>
                                            <input
                                                type="number"
                                                value={editingMovie.year}
                                                onChange={(e) => setEditingMovie({
                                                    ...editingMovie,
                                                    year: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>IMDB Puanı</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={editingMovie.rating}
                                                onChange={(e) => setEditingMovie({
                                                    ...editingMovie,
                                                    rating: e.target.value
                                                })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Yönetmen</label>
                                        <input
                                            type="text"
                                            value={editingMovie.director}
                                            onChange={(e) => setEditingMovie({
                                                ...editingMovie,
                                                director: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Oyuncular (virgülle ayırın)</label>
                                        <input
                                            type="text"
                                            value={Array.isArray(editingMovie.actors) ? editingMovie.actors.join(', ') : editingMovie.actors}
                                            onChange={(e) => setEditingMovie({
                                                ...editingMovie,
                                                actors: e.target.value.split(',').map(actor => actor.trim())
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Süre (dakika)</label>
                                        <input
                                            type="number"
                                            value={editingMovie.duration}
                                            onChange={(e) => setEditingMovie({
                                                ...editingMovie,
                                                duration: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Poster URL</label>
                                        <input
                                            type="url"
                                            value={editingMovie.posterUrl}
                                            onChange={(e) => setEditingMovie({
                                                ...editingMovie,
                                                posterUrl: e.target.value
                                            })}
                                            required
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="save-button">
                                            Kaydet
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setEditingMovie(null)}
                                            className="cancel-button"
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="movies-list">
                        <div className="movies-grid">
                            {filteredMovies.map(movie => (
                                <div key={movie.id} className="movie-card">
                                    <img 
                                        src={movie.posterUrl} 
                                        alt={movie.name} 
                                        className="movie-poster"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
                                        }}
                                    />
                                    <div className="movie-info">
                                        <h3>{movie.name}</h3>
                                        <div className="movie-meta">
                                            <span>{movie.year}</span>
                                            <span>{movie.genre}</span>
                                        </div>
                                        <div className="movie-actions">
                                            <button 
                                                onClick={() => setEditingMovie(movie)}
                                                className="edit-button"
                                            >
                                                Düzenle
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteMovie(movie.id)}
                                                className="delete-button"
                                            >
                                                Sil
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="users-section">
                    <div className="users-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>Kullanıcı ID</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Yorum Sayısı</th>
                                    <th>Kayıt Tarihi</th>
                                    <th>Son Aktivite</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`role-badge ${user.role || 'user'}`}>
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td>{user.reviewCount || 0}</td>
                                        <td>
                                            {user.createdAt && typeof user.createdAt.toDate === 'function' 
                                                ? user.createdAt.toDate().toLocaleDateString('tr-TR') 
                                                : '-'}
                                        </td>
                                        <td>
                                            {user.lastActivity && typeof user.lastActivity.toDate === 'function'
                                                ? user.lastActivity.toDate().toLocaleDateString('tr-TR')
                                                : '-'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.lastActivity ? 'active' : 'inactive'}`}>
                                                {user.lastActivity ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={user.role || 'user'}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className="role-select"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'recommendations' && (
                <div className="recommendations-section">
                    <div className="settings-card">
                        <h2>Öneri Algoritması Ayarları</h2>
                        <div className="settings-form">
                            <div className="settings-group">
                                <div className="weight-header">
                                    <h3>Ağırlık Faktörleri</h3>
                                    <div className="total-weight">
                                        Toplam: {Object.values(recommendationSettings).slice(0, 5).reduce((a, b) => a + b, 0)}%
                                        <span className={Object.values(recommendationSettings).slice(0, 5).reduce((a, b) => a + b, 0) === 100 ? 'valid' : 'invalid'}>
                                            {Object.values(recommendationSettings).slice(0, 5).reduce((a, b) => a + b, 0) === 100 ? '✓' : '!'}
                                        </span>
                                    </div>
                                </div>
                                <div className="weight-settings">
                                    <div className="form-group">
                                        <label>
                                            Tür Ağırlığı
                                            <span className="weight-value">{recommendationSettings.genreWeight}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={recommendationSettings.genreWeight}
                                            onChange={(e) => setRecommendationSettings({
                                                ...recommendationSettings,
                                                genreWeight: parseInt(e.target.value)
                                            })}
                                            className="weight-slider"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            Puan Ağırlığı
                                            <span className="weight-value">{recommendationSettings.ratingWeight}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={recommendationSettings.ratingWeight}
                                            onChange={(e) => setRecommendationSettings({
                                                ...recommendationSettings,
                                                ratingWeight: parseInt(e.target.value)
                                            })}
                                            className="weight-slider"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            Yıl Ağırlığı
                                            <span className="weight-value">{recommendationSettings.yearWeight}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={recommendationSettings.yearWeight}
                                            onChange={(e) => setRecommendationSettings({
                                                ...recommendationSettings,
                                                yearWeight: parseInt(e.target.value)
                                            })}
                                            className="weight-slider"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            Popülerlik Ağırlığı
                                            <span className="weight-value">{recommendationSettings.popularityWeight}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={recommendationSettings.popularityWeight}
                                            onChange={(e) => setRecommendationSettings({
                                                ...recommendationSettings,
                                                popularityWeight: parseInt(e.target.value)
                                            })}
                                            className="weight-slider"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            Kullanıcı Geçmişi Ağırlığı
                                            <span className="weight-value">{recommendationSettings.userHistoryWeight}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={recommendationSettings.userHistoryWeight}
                                            onChange={(e) => setRecommendationSettings({
                                                ...recommendationSettings,
                                                userHistoryWeight: parseInt(e.target.value)
                                            })}
                                            className="weight-slider"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="settings-group">
                                <h3>Filtreleme Kriterleri</h3>
                                <div className="filter-settings">
                                    <div className="form-group">
                                        <label>
                                            Minimum IMDB Puanı
                                            <span className="current-value">{recommendationSettings.minimumRating.toFixed(1)}</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={recommendationSettings.minimumRating}
                                            onChange={(e) => setRecommendationSettings({
                                                ...recommendationSettings,
                                                minimumRating: parseFloat(e.target.value)
                                            })}
                                            className="filter-slider"
                                        />
                                        <div className="slider-labels">
                                            <span>0</span>
                                            <span>5</span>
                                            <span>10</span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            Maksimum Yıl Farkı
                                            <span className="current-value">{recommendationSettings.maximumYearDiff} yıl</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={recommendationSettings.maximumYearDiff}
                                            onChange={(e) => setRecommendationSettings({
                                                ...recommendationSettings,
                                                maximumYearDiff: parseInt(e.target.value)
                                            })}
                                            className="filter-slider"
                                        />
                                        <div className="slider-labels">
                                            <span>0</span>
                                            <span>25</span>
                                            <span>50</span>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            Öneri Sayısı
                                            <span className="current-value">{recommendationSettings.recommendationCount} film</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={recommendationSettings.recommendationCount}
                                            onChange={(e) => setRecommendationSettings({
                                                ...recommendationSettings,
                                                recommendationCount: parseInt(e.target.value)
                                            })}
                                            className="filter-slider"
                                        />
                                        <div className="slider-labels">
                                            <span>1</span>
                                            <span>25</span>
                                            <span>50</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-actions">
                                <button 
                                    className="save-button"
                                    onClick={handleSettingsUpdate}
                                    disabled={Object.values(recommendationSettings).slice(0, 5).reduce((a, b) => a + b, 0) !== 100}
                                >
                                    {Object.values(recommendationSettings).slice(0, 5).reduce((a, b) => a + b, 0) === 100 
                                        ? 'Ayarları Kaydet' 
                                        : 'Ağırlıkların toplamı 100 olmalı'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'stats' && stats && (
                <div className="stats-section">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Toplam Film</h3>
                            <div className="stat-value">{stats.totalMovies}</div>
                        </div>
                        <div className="stat-card">
                            <h3>Toplam Kullanıcı</h3>
                            <div className="stat-value">{stats.totalUsers}</div>
                        </div>
                        <div className="stat-card">
                            <h3>Toplam Yorum</h3>
                            <div className="stat-value">{stats.totalReviews}</div>
                        </div>
                        <div className="stat-card">
                            <h3>Ortalama IMDB Puanı</h3>
                            <div className="stat-value">★ {stats.averageRating}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPage; 