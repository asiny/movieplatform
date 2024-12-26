import React from 'react';
import FilmCard from './FilmCard';
import './FilmList.css';

function FilmList({ films }) {
    return (
        <div className="film-list">
            <div className="film-grid">
                {films.map((film) => (
                    <FilmCard key={film.id} film={film} />
                ))}
            </div>
        </div>
    );
}

export default FilmList;
