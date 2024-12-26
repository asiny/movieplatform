import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, addDoc, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminPage.css';

function AdminPage() {
    const { user, isAdmin } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState('movies');
    const [movies, setMovies] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingMovie, setEditingMovie] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
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

    useEffect(() => {
        if (user && isAdmin) {
            fetchData();
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
        const moviesList = moviesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setMovies(moviesList);
    };

    const fetchUsers = async () => {
        const reviewsQuery = query(collection(db, 'reviews'));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        
        const userMap = new Map();
        reviewsSnapshot.docs.forEach(doc => {
            const review = doc.data();
            if (!userMap.has(review.userId)) {
                userMap.set(review.userId, {
                    id: review.userId,
                    email: review.userEmail,
                    reviewCount: 1,
                    lastActivity: review.createdAt
                });
            } else {
                const userData = userMap.get(review.userId);
                userData.reviewCount++;
                if (review.createdAt > userData.lastActivity) {
                    userData.lastActivity = review.createdAt;
                }
            }
        });

        setUsers(Array.from(userMap.values()));
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

    const filteredMovies = movies.filter(movie => 
        movie.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.director.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <input
                            type="text"
                            placeholder="Film ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <button 
                            className="add-movie-button"
                            onClick={() => setShowAddForm(true)}
                        >
                            Yeni Film Ekle
                        </button>
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

                    <div className="movies-list">
                        <div className="movies-grid">
                            {movies.map(movie => (
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
                                    <th>Kullanıcı</th>
                                    <th>Rol</th>
                                    <th>Kayıt Tarihi</th>
                                    <th>Son Aktivite</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.email}</td>
                                        <td>{user.role || 'user'}</td>
                                        <td>{user.createdAt?.toDate().toLocaleDateString()}</td>
                                        <td>{user.lastActivity?.toDate().toLocaleDateString() || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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