import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import MovieSearch from '../components/MovieSearch';
import './MoviePage.css';

function MoviePage() {
    const location = useLocation();
    const [movies, setMovies] = useState([]);
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMovies();
    }, []);

    useEffect(() => {
        // URL'den kategori parametresini al
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');

        if (categoryParam) {
            // Kategori parametresi varsa, filmleri filtrele
            const filtered = movies.filter(movie => 
                movie.genre && movie.genre.toLowerCase().includes(categoryParam.toLowerCase())
            );
            setFilteredMovies(filtered);
        } else {
            // Kategori parametresi yoksa, tüm filmleri göster
            setFilteredMovies(movies);
        }
    }, [location.search, movies]);

    const fetchMovies = async () => {
        try {
            const moviesSnapshot = await getDocs(collection(db, 'movies'));
            const moviesList = moviesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    year: parseInt(data.year),
                    rating: parseFloat(data.rating)
                };
            });
            setMovies(moviesList);
            setFilteredMovies(moviesList);
        } catch (err) {
            console.error('Error fetching movies:', err);
            setError('Filmler yüklenirken bir hata oluştu: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (searchTerm) => {
        if (!searchTerm.trim()) {
            // URL'den kategori parametresini kontrol et
            const params = new URLSearchParams(location.search);
            const categoryParam = params.get('category');
            
            if (categoryParam) {
                const filtered = movies.filter(movie => 
                    movie.genre && movie.genre.toLowerCase().includes(categoryParam.toLowerCase())
                );
                setFilteredMovies(filtered);
            } else {
                setFilteredMovies(movies);
            }
            return;
        }

        const searchResults = movies.filter(movie =>
            movie.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (movie.description && movie.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (movie.director && movie.director.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (movie.actors && movie.actors.some(actor => 
                actor.toLowerCase().includes(searchTerm.toLowerCase())
            ))
        );
        setFilteredMovies(searchResults);
    };

    const handleFilter = (filters) => {
        let results = [...movies];

        // URL'den kategori parametresini al
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');

        // Önce URL'deki kategori filtresini uygula
        if (categoryParam) {
            results = results.filter(movie => 
                movie.genre && movie.genre.toLowerCase().includes(categoryParam.toLowerCase())
            );
        }

        // Sonra diğer filtreleri uygula
        if (filters.genre && filters.genre !== '') {
            results = results.filter(movie => 
                movie.genre && movie.genre.toLowerCase() === filters.genre.toLowerCase()
            );
        }

        if (filters.year && filters.year !== '') {
            const filterYear = parseInt(filters.year);
            results = results.filter(movie => movie.year === filterYear);
        }

        if (filters.minRating && filters.minRating !== '') {
            const minRating = parseFloat(filters.minRating);
            results = results.filter(movie => movie.rating >= minRating);
        }

        if (filters.sortBy && filters.sortBy !== '') {
            switch (filters.sortBy) {
                case 'rating':
                    results.sort((a, b) => b.rating - a.rating);
                    break;
                case 'year':
                    results.sort((a, b) => b.year - a.year);
                    break;
                case 'title':
                    results.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                default:
                    break;
            }
        }

        setFilteredMovies(results);
    };

    if (loading && movies.length === 0) {
        return <div className="loading">Filmler yükleniyor...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="movies-container">
            <h1>Filmler</h1>
            
            <MovieSearch onSearch={handleSearch} onFilter={handleFilter} />

            <div className="movies-grid">
                {filteredMovies.map(movie => (
                    <Link to={`/movie/${movie.id}`} key={movie.id} className="movie-card">
                        <div className="movie-poster">
                            <img
                                src={movie.posterUrl}
                                alt={movie.name}
                                onError={(e) => {
                                    e.target.src = '/placeholder.jpg';
                                }}
                            />
                        </div>
                        <div className="movie-info">
                            <h3>{movie.name}</h3>
                            <div className="movie-meta">
                                <span className="year">
                                    {movie.year}
                                </span>
                                <span className="rating">
                                    ★ {movie.rating.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredMovies.length === 0 && (
                <div className="no-results">Arama kriterlerinize uygun film bulunamadı.</div>
            )}
        </div>
    );
}

export default MoviePage;
