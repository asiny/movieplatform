import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import './MoviePage.css';

function RecommendationsPage() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!auth.currentUser) {
                setError('Önerileri görmek için giriş yapmalısınız');
                setLoading(false);
                return;
            }

            try {
                // Kullanıcının favori ve izleme listesini al
                const favoritesQuery = query(
                    collection(db, 'favorites'),
                    where('userId', '==', auth.currentUser.uid)
                );
                const watchlistQuery = query(
                    collection(db, 'watchlist'),
                    where('userId', '==', auth.currentUser.uid)
                );

                const [favoritesSnapshot, watchlistSnapshot] = await Promise.all([
                    getDocs(favoritesQuery),
                    getDocs(watchlistQuery)
                ]);

                // Film ID'lerini ve genre ID'lerini topla
                const movieIds = new Set();
                const genreFrequency = {};
                
                // TMDB'den film detaylarını al
                const fetchMovieDetails = async (movieId) => {
                    const options = {
                        method: 'GET',
                        headers: {
                            accept: 'application/json',
                            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyN2MxZjBlZDk4MzYyOGIwNzczNTk1MzM3ODhmYWYyMSIsIm5iZiI6MTczNTc2OTIzMi41NTIsInN1YiI6IjY3NzViYzkwYmYxMGZmMTk4NDYyNGE1NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.OO82wI9dD8Lirpdo1ZRkmfgQjWD3yCZUPPyGrQz1C_s'
                        }
                    };

                    const response = await fetch(
                        `https://api.themoviedb.org/3/movie/${movieId}?language=tr-TR`,
                        options
                    );

                    if (!response.ok) throw new Error('Film detayları alınamadı');
                    return response.json();
                };

                // Favori ve izleme listesindeki her film için detayları al
                const processMovies = async (snapshot) => {
                    for (const doc of snapshot.docs) {
                        const movieId = doc.data().movieId;
                        try {
                            const movieDetails = await fetchMovieDetails(movieId);
                            movieIds.add(movieId);
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

                // Her iki liste için film detaylarını al
                await Promise.all([
                    processMovies(favoritesSnapshot),
                    processMovies(watchlistSnapshot)
                ]);

                console.log('Genre frequency:', genreFrequency); // Debug için

                // En çok tekrar eden 3 kategoriyi bul
                const topGenres = Object.entries(genreFrequency)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([genreId]) => genreId);

                console.log('Top genres:', topGenres); // Debug için

                if (topGenres.length === 0) {
                    setError('Film tercihleri analiz edilemedi');
                    setLoading(false);
                    return;
                }

                // Her kategori için benzer filmler al
                const recommendationPromises = topGenres.map(async (genreId) => {
                    const options = {
                        method: 'GET',
                        headers: {
                            accept: 'application/json',
                            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyN2MxZjBlZDk4MzYyOGIwNzczNTk1MzM3ODhmYWYyMSIsIm5iZiI6MTczNTc2OTIzMi41NTIsInN1YiI6IjY3NzViYzkwYmYxMGZmMTk4NDYyNGE1NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.OO82wI9dD8Lirpdo1ZRkmfgQjWD3yCZUPPyGrQz1C_s'
                        }
                    };

                    const response = await fetch(
                        `https://api.themoviedb.org/3/discover/movie?language=tr-TR&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100`,
                        options
                    );

                    if (!response.ok) throw new Error('Film önerileri alınamadı');
                    return response.json();
                });

                const recommendationResults = await Promise.all(recommendationPromises);
                
                // Önerileri birleştir ve tekrar edenleri kaldır
                const allRecommendations = recommendationResults
                    .flatMap(result => result.results)
                    .filter(movie => !movieIds.has(movie.id.toString())) // String'e çevirerek karşılaştır
                    .reduce((unique, movie) => {
                        return unique.some(m => m.id === movie.id)
                            ? unique
                            : [...unique, { ...movie, year: new Date(movie.release_date).getFullYear() }];
                    }, [])
                    .sort((a, b) => b.vote_average - a.vote_average)
                    .slice(0, 20);

                console.log('Final recommendations:', allRecommendations); // Debug için

                setRecommendations(allRecommendations);
            } catch (err) {
                console.error('Öneriler alınırken hata:', err);
                setError('Öneriler yüklenirken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    if (loading) {
        return <div className="loading">Öneriler yükleniyor...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (recommendations.length === 0) {
        return (
            <div className="movies-container">
                <h1>Film Önerileri</h1>
                <div className="no-results">
                    Öneri oluşturmak için favori listenize veya izleme listenize film eklemelisiniz.
                </div>
            </div>
        );
    }

    return (
        <div className="movies-container">
            <h1>Size Özel Film Önerileri</h1>
            <div className="movies-grid">
                {recommendations.map(movie => (
                    <Link to={`/movie/${movie.id}`} key={movie.id} className="movie-card">
                        <div className="movie-poster">
                            <img
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title}
                                onError={(e) => {
                                    e.target.src = '/placeholder.jpg';
                                }}
                            />
                        </div>
                        <div className="movie-info">
                            <h3>{movie.title}</h3>
                            <div className="movie-meta">
                                <span className="year">{movie.year}</span>
                                <span className="rating">★ {movie.vote_average.toFixed(1)}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default RecommendationsPage; 