import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './RecommendationsPage.css';

function RecommendationsPage() {
    const { user } = useContext(UserContext);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userPreferences, setUserPreferences] = useState(null);

    useEffect(() => {
        if (user) {
            fetchUserPreferences();
        }
    }, [user]);

    useEffect(() => {
        if (userPreferences) {
            generateRecommendations();
        }
    }, [userPreferences]);

    const fetchUserPreferences = async () => {
        try {
            // Kullanıcının favori filmlerini getir
            const favoritesQuery = query(
                collection(db, 'favorites'),
                where('userId', '==', user.uid)
            );
            const favoritesSnapshot = await getDocs(favoritesQuery);
            const favoriteMovies = [];

            for (const favoriteDoc of favoritesSnapshot.docs) {
                const movieDoc = await getDoc(doc(db, 'movies', favoriteDoc.data().movieId));
                if (movieDoc.exists()) {
                    favoriteMovies.push({
                        id: movieDoc.id,
                        ...movieDoc.data()
                    });
                }
            }

            // Kullanıcının izleme listesini getir
            const watchlistQuery = query(
                collection(db, 'watchlist'),
                where('userId', '==', user.uid)
            );
            const watchlistSnapshot = await getDocs(watchlistQuery);
            const watchlistMovies = [];

            for (const watchlistDoc of watchlistSnapshot.docs) {
                const movieDoc = await getDoc(doc(db, 'movies', watchlistDoc.data().movieId));
                if (movieDoc.exists()) {
                    watchlistMovies.push({
                        id: movieDoc.id,
                        ...movieDoc.data()
                    });
                }
            }

            // Kullanıcının yorumlarını getir
            const reviewsQuery = query(
                collection(db, 'reviews'),
                where('userId', '==', user.uid)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviewedMovies = [];

            for (const reviewDoc of reviewsSnapshot.docs) {
                const movieDoc = await getDoc(doc(db, 'movies', reviewDoc.data().movieId));
                if (movieDoc.exists()) {
                    reviewedMovies.push({
                        id: movieDoc.id,
                        ...movieDoc.data(),
                        rating: reviewDoc.data().rating
                    });
                }
            }

            // Kullanıcı tercihlerini analiz et
            const preferences = analyzePreferences(favoriteMovies, watchlistMovies, reviewedMovies);
            setUserPreferences(preferences);

        } catch (error) {
            console.error('Error fetching user preferences:', error);
        }
    };

    const analyzePreferences = (favorites, watchlist, reviews) => {
        const genreCount = {};
        const yearCount = {};
        const allMovies = [...favorites, ...watchlist, ...reviews];

        // Film türü ve yıl tercihlerini analiz et
        allMovies.forEach(movie => {
            genreCount[movie.genre] = (genreCount[movie.genre] || 0) + 1;
            const yearDecade = Math.floor(movie.year / 10) * 10;
            yearCount[yearDecade] = (yearCount[yearDecade] || 0) + 1;
        });

        // En çok tercih edilen türleri bul
        const favoriteGenres = Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);

        // En çok tercih edilen yıl aralığını bul
        const favoriteDecade = Object.entries(yearCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0];

        return {
            genres: favoriteGenres,
            decade: favoriteDecade,
            minRating: 7 // Minimum IMDB puanı
        };
    };

    const generateRecommendations = async () => {
        try {
            // Kullanıcının tercih ettiği türlerde filmleri getir
            const moviesQuery = query(
                collection(db, 'movies'),
                where('genre', 'in', userPreferences.genres)
            );
            const moviesSnapshot = await getDocs(moviesQuery);
            let recommendedMovies = moviesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filmleri filtreleme ve sıralama
            recommendedMovies = recommendedMovies
                .filter(movie => 
                    // Minimum IMDB puanı kontrolü
                    movie.rating >= userPreferences.minRating &&
                    // Tercih edilen yıl aralığına yakınlık
                    Math.abs(movie.year - userPreferences.decade) <= 20
                )
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 12);

            setRecommendations(recommendedMovies);
        } catch (error) {
            console.error('Error generating recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="recommendations-container">
                <div className="login-prompt">
                    Kişiselleştirilmiş öneriler için giriş yapmalısınız.
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="recommendations-container">
                <div className="loading">Öneriler hazırlanıyor...</div>
            </div>
        );
    }

    return (
        <div className="recommendations-container">
            <div className="recommendations-header">
                <h1>Size Özel Öneriler</h1>
                <p className="subtitle">
                    İzleme geçmişiniz ve tercihlerinize göre seçilmiş filmler
                </p>
            </div>

            {recommendations.length > 0 ? (
                <div className="movies-grid">
                    {recommendations.map(movie => (
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
                                <span className="genre">{movie.genre}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="no-recommendations">
                    <p>
                        Henüz yeterli veri yok. Daha iyi öneriler için film izlemeye devam edin ve 
                        favorilerinizi işaretleyin.
                    </p>
                </div>
            )}
        </div>
    );
}

export default RecommendationsPage; 