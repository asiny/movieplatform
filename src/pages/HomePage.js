import React from 'react';
import FilmList from '../components/FilmList';

function HomePage() {
    const films = [
        { id: 1, name: 'Inception', genre: 'Bilim Kurgu', rating: 8.8, year: 2010 },
        { id: 2, name: 'The Godfather', genre: 'Suç', rating: 9.2, year: 1972 },
        { id: 3, name: 'Interstellar', genre: 'Bilim Kurgu', rating: 8.6, year: 2014 },
        { id: 4, name: 'The Dark Knight', genre: 'Aksiyon', rating: 9.0, year: 2008 },
    ];

    return (
        <div>
            <h1>Film Öneri Platformu</h1>
            <FilmList films={films} />
        </div>
    );
}

export default HomePage;
