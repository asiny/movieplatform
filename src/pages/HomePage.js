import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import './HomePage.css';

function HomePage() {
    const { user } = useContext(UserContext);
    const [recommendations, setRecommendations] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPopularMovies();
        if (user) {
            fetchRecommendations();
        }
    }, [user]);

    const fetchPopularMovies = async () => {
        try {
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyN2MxZjBlZDk4MzYyOGIwNzczNTk1MzM3ODhmYWYyMSIsIm5iZiI6MTczNTc2OTIzMi41NTIsInN1YiI6IjY3NzViYzkwYmYxMGZmMTk4NDYyNGE1NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.OO82wI9dD8Lirpdo1ZRkmfgQjWD3yCZUPPyGrQz1C_s'
                }
            };

            const response = await fetch(
                'https://api.themoviedb.org/3/movie/popular?language=tr-TR&page=1',
                options
            );

            if (!response.ok) {
                throw new Error('Filmler yüklenirken hata oluştu');
            }

            const data = await response.json();
            const moviesWithYear = data.results.map(movie => ({
                ...movie,
                year: new Date(movie.release_date).getFullYear()
            }));
            setPopularMovies(moviesWithYear);
        } catch (err) {
            console.error('Error fetching popular movies:', err);
            setError('Filmler yüklenirken bir hata oluştu');
        }
    };

    const fetchRecommendations = async () => {
        try {
            // Kullanıcının favori filmlerini al
            const favoritesQuery = query(
                collection(db, 'favorites'),
                where('userId', '==', user.uid),
                limit(5)
            );
            const favoritesSnapshot = await getDocs(favoritesQuery);
            
            if (favoritesSnapshot.empty) {
                return;
            }

            // Favori filmlerin detaylarını al
            const moviePromises = favoritesSnapshot.docs.map(async (doc) => {
                const movieId = doc.data().movieId;
                const options = {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyN2MxZjBlZDk4MzYyOGIwNzczNTk1MzM3ODhmYWYyMSIsIm5iZiI6MTczNTc2OTIzMi41NTIsInN1YiI6IjY3NzViYzkwYmYxMGZmMTk4NDYyNGE1NCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.OO82wI9dD8Lirpdo1ZRkmfgQjWD3yCZUPPyGrQz1C_s'
                    }
                };

                const response = await fetch(
                    `https://api.themoviedb.org/3/movie/${movieId}/recommendations?language=tr-TR&page=1`,
                    options
                );

                if (!response.ok) {
                    throw new Error('Film önerileri alınamadı');
                }

                const data = await response.json();
                return data.results.slice(0, 3).map(movie => ({
                    ...movie,
                    year: new Date(movie.release_date).getFullYear()
                }));
            });

            const recommendationsResults = await Promise.all(moviePromises);
            const flattenedRecommendations = recommendationsResults
                .flat()
                .reduce((unique, movie) => {
                    return unique.some(m => m.id === movie.id)
                        ? unique
                        : [...unique, movie];
                }, [])
                .slice(0, 8);

            setRecommendations(flattenedRecommendations);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError('Öneriler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !popularMovies.length) {
        return <div className="loading">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="home-container">
            {user && (
                <div className="welcome-section">
                    <h2>Hoş Geldin, {user.email}</h2>
                </div>
            )}

            {user && recommendations.length > 0 && (
                <div className="recommendations-section">
                    <h2>Sizin İçin Öneriler</h2>
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
            )}

            <div className="popular-movies-section">
                <h2>Popüler Filmler</h2>
                <div className="movies-grid">
                    {popularMovies.map(movie => (
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
        </div>
    );
}

export default HomePage;
