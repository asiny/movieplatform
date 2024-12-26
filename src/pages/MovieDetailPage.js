import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserContext } from '../context/UserContext';
import './MovieDetailPage.css';

function MovieDetailPage() {
    const { id } = useParams();
    const { user } = useContext(UserContext);
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRating, setUserRating] = useState(0);
    const [review, setReview] = useState('');
    const [reviews, setReviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [favoriteId, setFavoriteId] = useState(null);
    const [watchlistId, setWatchlistId] = useState(null);
    const [similarMovies, setSimilarMovies] = useState([]);

    useEffect(() => {
        fetchMovieDetails();
        fetchReviews();
        if (user) {
            checkFavoriteStatus();
            checkWatchlistStatus();
        }
    }, [id, user]);

    useEffect(() => {
        if (movie) {
            fetchSimilarMovies();
        }
    }, [movie]);

    const fetchMovieDetails = async () => {
        try {
            const movieDoc = await getDoc(doc(db, 'movies', id));
            if (movieDoc.exists()) {
                setMovie({ id: movieDoc.id, ...movieDoc.data() });
            } else {
                setError('Film bulunamadı');
            }
        } catch (err) {
            console.error('Error fetching movie:', err);
            setError('Film bilgileri yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const checkFavoriteStatus = async () => {
        try {
            const favoriteQuery = query(
                collection(db, 'favorites'),
                where('userId', '==', user.uid),
                where('movieId', '==', id)
            );
            const favoriteSnapshot = await getDocs(favoriteQuery);
            if (!favoriteSnapshot.empty) {
                setIsFavorite(true);
                setFavoriteId(favoriteSnapshot.docs[0].id);
            }
        } catch (err) {
            console.error('Error checking favorite status:', err);
        }
    };

    const checkWatchlistStatus = async () => {
        try {
            const watchlistQuery = query(
                collection(db, 'watchlist'),
                where('userId', '==', user.uid),
                where('movieId', '==', id)
            );
            const watchlistSnapshot = await getDocs(watchlistQuery);
            if (!watchlistSnapshot.empty) {
                setIsInWatchlist(true);
                setWatchlistId(watchlistSnapshot.docs[0].id);
            }
        } catch (err) {
            console.error('Error checking watchlist status:', err);
        }
    };

    const toggleFavorite = async () => {
        if (!user) return;

        try {
            if (isFavorite) {
                await deleteDoc(doc(db, 'favorites', favoriteId));
                setIsFavorite(false);
                setFavoriteId(null);
            } else {
                const docRef = await addDoc(collection(db, 'favorites'), {
                    userId: user.uid,
                    movieId: id,
                    addedAt: new Date()
                });
                setIsFavorite(true);
                setFavoriteId(docRef.id);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    const toggleWatchlist = async () => {
        if (!user) return;

        try {
            if (isInWatchlist) {
                await deleteDoc(doc(db, 'watchlist', watchlistId));
                setIsInWatchlist(false);
                setWatchlistId(null);
            } else {
                const docRef = await addDoc(collection(db, 'watchlist'), {
                    userId: user.uid,
                    movieId: id,
                    addedAt: new Date()
                });
                setIsInWatchlist(true);
                setWatchlistId(docRef.id);
            }
        } catch (err) {
            console.error('Error toggling watchlist:', err);
        }
    };

    const fetchReviews = async () => {
        try {
            const reviewsQuery = query(collection(db, 'reviews'), where('movieId', '==', id));
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviewsList = reviewsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReviews(reviewsList);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'reviews'), {
                movieId: id,
                userId: user.uid,
                userEmail: user.email,
                rating: userRating,
                comment: review,
                createdAt: new Date()
            });

            await fetchReviews();
            setUserRating(0);
            setReview('');
        } catch (err) {
            console.error('Error submitting review:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const fetchSimilarMovies = async () => {
        try {
            const moviesQuery = query(
                collection(db, 'movies'),
                where('genre', '==', movie.genre),
                where('id', '!=', id)
            );
            const moviesSnapshot = await getDocs(moviesQuery);
            const movies = moviesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const sortedMovies = movies.sort((a, b) => b.rating - a.rating).slice(0, 6);
            setSimilarMovies(sortedMovies);
        } catch (err) {
            console.error('Error fetching similar movies:', err);
        }
    };

    if (loading) return <div className="loading">Yükleniyor...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!movie) return <div className="error">Film bulunamadı</div>;

    return (
        <div className="movie-detail-container">
            <div className="movie-detail-header">
                <div className="movie-poster">
                    <img src={movie.posterUrl} alt={movie.name} />
                </div>
                <div className="movie-info">
                    <h1>{movie.name}</h1>
                    <div className="movie-meta">
                        <span className="year">{movie.year}</span>
                        <span className="genre">{movie.genre}</span>
                        <span className="duration">{movie.duration} dk</span>
                    </div>
                    <div className="rating">
                        <span className="imdb-rating">IMDB: {movie.rating}/10</span>
                        {reviews.length > 0 && (
                            <span className="user-rating">
                                Kullanıcı Puanı: {(reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)}/5
                            </span>
                        )}
                    </div>
                    {user && (
                        <div className="action-buttons">
                            <button 
                                className={`action-button ${isFavorite ? 'active' : ''}`}
                                onClick={toggleFavorite}
                            >
                                {isFavorite ? '❤️ Favorilerden Çıkar' : '🤍 Favorilere Ekle'}
                            </button>
                            <button 
                                className={`action-button ${isInWatchlist ? 'active' : ''}`}
                                onClick={toggleWatchlist}
                            >
                                {isInWatchlist ? '✓ İzleme Listesinden Çıkar' : '+ İzleme Listesine Ekle'}
                            </button>
                        </div>
                    )}
                    <p className="description">{movie.description}</p>
                    <div className="credits">
                        <p><strong>Yönetmen:</strong> {movie.director}</p>
                        <p><strong>Oyuncular:</strong> {movie.actors.join(', ')}</p>
                    </div>
                </div>
            </div>

            <div className="reviews-section">
                <h2>Yorumlar ve Değerlendirmeler</h2>
                
                {user ? (
                    <form className="review-form" onSubmit={handleReviewSubmit}>
                        <div className="rating-input">
                            <label>Puanınız:</label>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star ${star <= userRating ? 'active' : ''}`}
                                        onClick={() => setUserRating(star)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="review-input">
                            <label>Yorumunuz:</label>
                            <textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="Film hakkında düşüncelerinizi paylaşın..."
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="submit-review" 
                            disabled={submitting || !userRating}
                        >
                            {submitting ? 'Gönderiliyor...' : 'Yorumu Gönder'}
                        </button>
                    </form>
                ) : (
                    <div className="login-prompt">
                        Yorum yapmak için <Link to="/login">giriş yapın</Link>
                    </div>
                )}

                <div className="reviews-list">
                    {reviews.length > 0 ? (
                        reviews.sort((a, b) => b.createdAt - a.createdAt).map(review => (
                            <div key={review.id} className="review-item">
                                <div className="review-header">
                                    <span className="review-author">{review.userEmail}</span>
                                    <span className="review-rating">
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}
                                    </span>
                                </div>
                                <p className="review-comment">{review.comment}</p>
                                <span className="review-date">
                                    {review.createdAt.toDate().toLocaleDateString()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="no-reviews">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
                    )}
                </div>
            </div>

            {similarMovies.length > 0 && (
                <div className="similar-movies-section">
                    <h2>Benzer Filmler</h2>
                    <div className="movies-grid">
                        {similarMovies.map(movie => (
                            <Link to={`/movie/${movie.id}`} key={movie.id} className="movie-card">
                                <img 
                                    src={movie.posterUrl} 
                                    alt={movie.name} 
                                    className="movie-poster"
                                />
                                <div className="movie-info">
                                    <h3>{movie.name}</h3>
                                    <div className="movie-meta">
                                        <span className="year">{movie.year}</span>
                                        <span className="rating">★ {movie.rating}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MovieDetailPage; 