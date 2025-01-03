import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './ProfilePage.css';

function ProfilePage() {
    const [userComments, setUserComments] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('favorites');

    useEffect(() => {
        if (!auth.currentUser) return;

        // Favoriler için real-time listener
        const favoritesQuery = query(
            collection(db, "favorites"),
            where("userId", "==", auth.currentUser.uid),
            orderBy("timestamp", "desc")
        );
        const unsubscribeFavorites = onSnapshot(favoritesQuery, (snapshot) => {
            const favoritesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setFavorites(favoritesData);
        });

        // İzleme listesi için real-time listener
        const watchlistQuery = query(
            collection(db, "watchlist"),
            where("userId", "==", auth.currentUser.uid),
            orderBy("timestamp", "desc")
        );
        const unsubscribeWatchlist = onSnapshot(watchlistQuery, (snapshot) => {
            const watchlistData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWatchlist(watchlistData);
        });

        // Yorumlar için real-time listener
        const commentsQuery = query(
            collection(db, "comments"),
            where("userId", "==", auth.currentUser.uid),
            orderBy("timestamp", "desc")
        );
        const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUserComments(commentsData);
            setLoading(false);
        });

        // Cleanup function to unsubscribe from all listeners
        return () => {
            unsubscribeFavorites();
            unsubscribeWatchlist();
            unsubscribeComments();
        };
    }, []);

    if (!auth.currentUser) {
        return (
            <div className="profile-container">
                <div className="login-prompt">
                    Profil sayfasını görüntülemek için giriş yapmalısınız.
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-info">
                    <h1>{auth.currentUser.displayName || 'Kullanıcı'}</h1>
                    <span className="email">{auth.currentUser.email}</span>
                </div>
                <div className="profile-stats">
                    <div className="stat">
                        <span className="stat-value">{favorites.length}</span>
                        <span className="stat-label">Favori</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{watchlist.length}</span>
                        <span className="stat-label">İzleme Listesi</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{userComments.length}</span>
                        <span className="stat-label">Yorum</span>
                    </div>
                </div>
            </div>

            <div className="profile-tabs">
                <button 
                    className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
                    onClick={() => setActiveTab('favorites')}
                >
                    Favorilerim
                </button>
                <button 
                    className={`tab ${activeTab === 'watchlist' ? 'active' : ''}`}
                    onClick={() => setActiveTab('watchlist')}
                >
                    İzleme Listem
                </button>
                <button 
                    className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comments')}
                >
                    Yorumlarım
                </button>
            </div>

            <div className="profile-content">
                {activeTab === 'favorites' && (
                    <div className="movies-grid">
                        {favorites.length > 0 ? favorites.map(movie => (
                            <Link to={`/movie/${movie.movieId}`} key={movie.id} className="movie-card">
                                <img 
                                    src={movie.posterPath} 
                                    alt={movie.movieTitle} 
                                    className="movie-poster"
                                />
                                <div className="movie-info">
                                    <h3>{movie.movieTitle}</h3>
                                </div>
                            </Link>
                        )) : (
                            <div className="no-content">Henüz favori film eklemediniz.</div>
                        )}
                    </div>
                )}

                {activeTab === 'watchlist' && (
                    <div className="movies-grid">
                        {watchlist.length > 0 ? watchlist.map(movie => (
                            <Link to={`/movie/${movie.movieId}`} key={movie.id} className="movie-card">
                                <img 
                                    src={movie.posterPath} 
                                    alt={movie.movieTitle} 
                                    className="movie-poster"
                                />
                                <div className="movie-info">
                                    <h3>{movie.movieTitle}</h3>
                                </div>
                            </Link>
                        )) : (
                            <div className="no-content">İzleme listeniz boş.</div>
                        )}
                    </div>
                )}

                {activeTab === 'comments' && (
                    <div className="comments-list">
                        {userComments.length > 0 ? userComments.map(comment => (
                            <div key={comment.id} className="comment-card">
                                <Link to={`/movie/${comment.movieId}`} className="comment-movie-info">
                                    <img 
                                        src={comment.posterPath} 
                                        alt={comment.movieTitle} 
                                        className="comment-movie-poster"
                                    />
                                    <h3>{comment.movieTitle}</h3>
                                </Link>
                                <p className="comment-content">{comment.content}</p>
                                <span className="comment-date">
                                    {comment.timestamp?.toDate().toLocaleDateString()}
                                </span>
                            </div>
                        )) : (
                            <div className="no-content">Henüz yorum yapmadınız.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProfilePage; 