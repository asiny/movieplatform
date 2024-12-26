import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FilmCard.css';

function FilmCard({ film }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/movie/${film.id}`);
    };

    return (
        <div className="film-card" onClick={handleClick}>
            <div className="film-image">
                <img src={film.posterUrl || 'https://via.placeholder.com/300x450'} alt={film.name} />
                <div className="film-rating">{film.rating}/10</div>
            </div>
            <div className="film-info">
                <h3 className="film-title">{film.name}</h3>
                <div className="film-meta">
                    <span className="film-year">{film.year}</span>
                    <span className="film-genre">{film.genre}</span>
                </div>
                <p className="film-description">
                    {film.description?.length > 150 
                        ? `${film.description.substring(0, 150)}...` 
                        : film.description}
                </p>
                <div className="film-details">
                    {film.director && <p><strong>Yönetmen:</strong> {film.director}</p>}
                    {film.actors && <p><strong>Oyuncular:</strong> {film.actors.join(', ')}</p>}
                    {film.duration && <p><strong>Süre:</strong> {film.duration} dk</p>}
                </div>
                <button className="watch-button">Detayları Gör</button>
            </div>
        </div>
    );
}

export default FilmCard;
