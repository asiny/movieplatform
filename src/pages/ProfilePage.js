import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './ProfilePage.css';

function ProfilePage() {
    const { user } = useContext(UserContext);
    const [reviews, setReviews] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('reviews');

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    const fetchUserData = async () => {
        try {
            // Kullanıcının yorumlarını getir
            const reviewsQuery = query(
                collection(db, 'reviews'),
                where('userId', '==', user.uid)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviewsList = [];
            
            for (const reviewDoc of reviewsSnapshot.docs) {
                const reviewData = reviewDoc.data();
                // Film bilgilerini getir
                const movieDoc = await doc(db, 'movies', reviewData.movieId).get();
                if (movieDoc.exists()) {
                    reviewsList.push({
                        id: reviewDoc.id,
                        ...reviewData,
                        movie: { id: movieDoc.id, ...movieDoc.data() }
                    });
                }
            }
            setReviews(reviewsList);

            // İzleme listesini getir
            const watchlistQuery = query(
                collection(db, 'watchlist'),
                where('userId', '==', user.uid)
            );
            const watchlistSnapshot = await getDocs(watchlistQuery);
            const watchlistMovies = [];
            
            for (const watchlistDoc of watchlistSnapshot.docs) {
                const movieDoc = await doc(db, 'movies', watchlistDoc.data().movieId).get();
                if (movieDoc.exists()) {
                    watchlistMovies.push({
                        id: watchlistDoc.id,
                        ...watchlistDoc.data(),
                        movie: { id: movieDoc.id, ...movieDoc.data() }
                    });
                }
            }
            setWatchlist(watchlistMovies);

            // Favorileri getir
            const favoritesQuery = query(
                collection(db, 'favorites'),
                where('userId', '==', user.uid)
            );
            const favoritesSnapshot = await getDocs(favoritesQuery);
            const favoriteMovies = [];
            
            for (const favoriteDoc of favoritesSnapshot.docs) {
                const movieDoc = await doc(db, 'movies', favoriteDoc.data().movieId).get();
                if (movieDoc.exists()) {
                    favoriteMovies.push({
                        id: favoriteDoc.id,
                        ...favoriteDoc.data(),
                        movie: { id: movieDoc.id, ...movieDoc.data() }
                    });
                }
            }
            setFavorites(favoriteMovies);

        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="profile-container">
                <div className="login-prompt">
                    Profil sayfasını görüntülemek için giriş yapmalısınız.
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-info">
                    <h1>Profil</h1>
                    <p className="email">{user.email}</p>
                </div>
                <div className="profile-stats">
                    <div className="stat">
                        <span className="stat-value">{reviews.length}</span>
                        <span className="stat-label">Yorum</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{favorites.length}</span>
                        <span className="stat-label">Favori</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{watchlist.length}</span>
                        <span className="stat-label">İzleme Listesi</span>
                    </div>
                </div>
            </div>

            <div className="profile-tabs">
                <button 
                    className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    Yorumlarım
                </button>
                <button 
                    className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
                    onClick={() => setActiveTab('favorites')}
                >
                    Favorilerim
                </button>
                <button 
                    className={`tab ${activeTab === 'watchlist' ? 'active' : ''}`}
                    onClick={() => setActiveTab('watchlist')}
                >
                    İzleme Listem
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'reviews' && (
                    <div className="reviews-list">
                        {reviews.length > 0 ? (
                            reviews.map(review => (
                                <div key={review.id} className="review-card">
                                    <img 
                                        src={review.movie.posterUrl} 
                                        alt={review.movie.name} 
                                        className="movie-poster"
                                    />
                                    <div className="review-content">
                                        <h3>{review.movie.name}</h3>
                                        <div className="review-rating">
                                            {'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}
                                        </div>
                                        <p className="review-text">{review.comment}</p>
                                        <span className="review-date">
                                            {review.createdAt.toDate().toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-content">Henüz yorum yapmadınız.</p>
                        )}
                    </div>
                )}

                {activeTab === 'favorites' && (
                    <div className="movies-grid">
                        {favorites.length > 0 ? (
                            favorites.map(favorite => (
                                <div key={favorite.id} className="movie-card">
                                    <img 
                                        src={favorite.movie.posterUrl} 
                                        alt={favorite.movie.name} 
                                        className="movie-poster"
                                    />
                                    <h3>{favorite.movie.name}</h3>
                                    <p className="movie-year">{favorite.movie.year}</p>
                                </div>
                            ))
                        ) : (
                            <p className="no-content">Favori film eklemediniz.</p>
                        )}
                    </div>
                )}

                {activeTab === 'watchlist' && (
                    <div className="movies-grid">
                        {watchlist.length > 0 ? (
                            watchlist.map(item => (
                                <div key={item.id} className="movie-card">
                                    <img 
                                        src={item.movie.posterUrl} 
                                        alt={item.movie.name} 
                                        className="movie-poster"
                                    />
                                    <h3>{item.movie.name}</h3>
                                    <p className="movie-year">{item.movie.year}</p>
                                </div>
                            ))
                        ) : (
                            <p className="no-content">İzleme listeniz boş.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfilePage; 