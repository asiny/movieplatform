import React from 'react';
import './MovieBackground.css';

const moviePosters = [
    'https://image.tmdb.org/t/p/w500/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg', // Inception
    'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', // The Shawshank Redemption
    'https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg', // Interstellar
    'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // Fight Club
    'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', // The Dark Knight
    'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', // The Matrix
    'https://image.tmdb.org/t/p/w500/hEjK9A9BkNXejFW4tfacVAEHtkn.jpg', // Pulp Fiction
    'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', // Parasite
    'https://image.tmdb.org/t/p/w500/velWPhVMQeQKcxggNEU8YmIo52R.jpg', // The Lord of the Rings
    'https://image.tmdb.org/t/p/w500/pVL9AyKKLfUwrYD6jhdsI6gqtZj.jpg', // Breaking Bad
    'https://image.tmdb.org/t/p/w500/wXSnajAZ5ppTKa8Z5zzWGOK85YH.jpg', // Game of Thrones
    'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', // Breaking Bad
    'https://image.tmdb.org/t/p/w500/5MI9pMz0RqLAQ5Lt3E4M6xc3qWF.jpg', // The Witcher
    'https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg', // Stranger Things
    'https://image.tmdb.org/t/p/w500/gKG5QGz5Ngf8fgWpBsWtlg5L2SF.jpg', // The Mandalorian
];

function MovieBackground() {
    return (
        <div className="movie-background">
            <div className="poster-row row-1">
                {[...moviePosters, ...moviePosters].map((poster, index) => (
                    <div key={index} className="poster-wrapper">
                        <img src={poster} alt="Movie Poster" className="poster" />
                    </div>
                ))}
            </div>
            <div className="poster-row row-2">
                {[...moviePosters, ...moviePosters].map((poster, index) => (
                    <div key={index} className="poster-wrapper">
                        <img src={poster} alt="Movie Poster" className="poster" />
                    </div>
                ))}
            </div>
            <div className="overlay"></div>
        </div>
    );
}

export default MovieBackground; 