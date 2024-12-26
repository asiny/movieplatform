import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import MovieSearch from "../components/MovieSearch";
import FilmList from "../components/FilmList";
import "./MoviePage.css";

const categories = [
    "Aksiyon",
    "Macera",
    "Animasyon",
    "Komedi",
    "Suç",
    "Belgesel",
    "Drama",
    "Aile",
    "Fantastik",
    "Tarih",
    "Korku",
    "Müzikal",
    "Gizem",
    "Romantik",
    "Bilim Kurgu",
    "Gerilim",
    "Savaş",
    "Western"
];

function MoviePage() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [films, setFilms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchMovies();
    }, [user, navigate]);

    const fetchMovies = async (filters = {}) => {
        try {
            setLoading(true);
            let moviesQuery = collection(db, "movies");
            
            // Apply filters
            if (filters.category && filters.category !== 'all') {
                moviesQuery = query(moviesQuery, where("genre", "==", filters.category));
            }
            if (filters.year && filters.year !== 'all') {
                moviesQuery = query(moviesQuery, where("year", "==", parseInt(filters.year)));
            }
            if (filters.rating && filters.rating !== 'all') {
                moviesQuery = query(moviesQuery, where("rating", ">=", parseInt(filters.rating)));
            }

            const querySnapshot = await getDocs(moviesQuery);
            let moviesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Apply text search if provided
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                moviesData = moviesData.filter(movie =>
                    movie.name.toLowerCase().includes(searchLower) ||
                    movie.description?.toLowerCase().includes(searchLower)
                );
            }

            setFilms(moviesData);
            setError(null);
        } catch (err) {
            console.error("Error fetching movies:", err);
            setError("Filmler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (searchFilters) => {
        fetchMovies(searchFilters);
    };

    if (!user) {
        return null; // Navigate will handle the redirect
    }

    return (
        <div className="movie-page">
            <h1>Film ve Dizi Önerileri</h1>
            
            <MovieSearch 
                onSearch={handleSearch}
                categories={categories}
            />

            {error && <p className="error-message">{error}</p>}
            
            {loading ? (
                <div className="loading">Yükleniyor...</div>
            ) : (
                <>
                    {films.length > 0 ? (
                        <FilmList films={films} />
                    ) : (
                        <p className="no-results">Hiç film bulunamadı.</p>
                    )}
                </>
            )}
        </div>
    );
}

export default MoviePage;
