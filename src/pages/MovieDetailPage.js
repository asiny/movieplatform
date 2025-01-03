import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { db, auth } from '../firebase';
import { collection, query, getDocs, addDoc, deleteDoc, where, serverTimestamp, doc, getDoc, orderBy } from 'firebase/firestore';
import './MovieDetailPage.css';

function MovieDetailPage() {
    const { id } = useParams();
    const { user } = useContext(UserContext);
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);

    useEffect(() => {
        fetchMovieDetails();
        fetchComments();
        if (auth.currentUser) {
            checkUserInteractions();
        }
    }, [id]);

    const fetchMovieDetails = async () => {
        try {
            const movieRef = doc(db, 'movies', id);
            const movieDoc = await getDoc(movieRef);

            if (!movieDoc.exists()) {
                throw new Error('Film bulunamadı');
            }

            const movieData = {
                id: movieDoc.id,
                ...movieDoc.data()
            };

            setMovie(movieData);
        } catch (err) {
            console.error('Error fetching movie:', err);
            setError('Film bilgileri yüklenirken bir hata oluştu: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const commentsQuery = query(
                collection(db, "comments"),
                where("movieId", "==", id),
                orderBy("timestamp", "desc")
            );
            const commentsSnapshot = await getDocs(commentsQuery);
            const commentsData = commentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));
            setComments(commentsData);
        } catch (error) {
            console.error("Yorumlar yüklenirken hata:", error);
        }
    };

    const checkUserInteractions = async () => {
        try {
            // Favori kontrolü
            const favoriteQuery = query(
                collection(db, "favorites"),
                where("userId", "==", auth.currentUser.uid),
                where("movieId", "==", id)
            );
            const favoriteSnap = await getDocs(favoriteQuery);
            setIsFavorite(!favoriteSnap.empty);

            // İzleme listesi kontrolü
            const watchlistQuery = query(
                collection(db, "watchlist"),
                where("userId", "==", auth.currentUser.uid),
                where("movieId", "==", id)
            );
            const watchlistSnap = await getDocs(watchlistQuery);
            setIsInWatchlist(!watchlistSnap.empty);
        } catch (error) {
            console.error("Kullanıcı etkileşimleri kontrol edilirken hata:", error);
        }
    };

    const toggleFavorite = async () => {
        if (!auth.currentUser) {
            alert('Favorilere eklemek için giriş yapmalısınız!');
            return;
        }

        try {
            const favoriteQuery = query(
                collection(db, "favorites"),
                where("userId", "==", auth.currentUser.uid),
                where("movieId", "==", id)
            );
            const querySnapshot = await getDocs(favoriteQuery);

            if (querySnapshot.empty) {
                await addDoc(collection(db, "favorites"), {
                    userId: auth.currentUser.uid,
                    movieId: id,
                    movieTitle: movie.name,
                    posterPath: movie.posterUrl,
                    timestamp: serverTimestamp()
                });
                setIsFavorite(true);
                alert('Film favorilere eklendi!');
            } else {
                await deleteDoc(querySnapshot.docs[0].ref);
                setIsFavorite(false);
                alert('Film favorilerden çıkarıldı!');
            }
        } catch (error) {
            console.error("Favori işlemi sırasında hata:", error);
            alert('İşlem sırasında bir hata oluştu.');
        }
    };

    const toggleWatchlist = async () => {
        if (!auth.currentUser) {
            alert('İzleme listesine eklemek için giriş yapmalısınız!');
            return;
        }

        try {
            const watchlistQuery = query(
                collection(db, "watchlist"),
                where("userId", "==", auth.currentUser.uid),
                where("movieId", "==", id)
            );
            const querySnapshot = await getDocs(watchlistQuery);

            if (querySnapshot.empty) {
                await addDoc(collection(db, "watchlist"), {
                    userId: auth.currentUser.uid,
                    movieId: id,
                    movieTitle: movie.name,
                    posterPath: movie.posterUrl,
                    timestamp: serverTimestamp()
                });
                setIsInWatchlist(true);
                alert('Film izleme listesine eklendi!');
            } else {
                await deleteDoc(querySnapshot.docs[0].ref);
                setIsInWatchlist(false);
                alert('Film izleme listesinden çıkarıldı!');
            }
        } catch (error) {
            console.error("İzleme listesi işlemi sırasında hata:", error);
            alert('İşlem sırasında bir hata oluştu.');
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!auth.currentUser) {
            alert('Yorum yapmak için giriş yapmalısınız!');
            return;
        }

        if (!comment.trim()) {
            alert('Lütfen bir yorum yazın!');
            return;
        }

        try {
            await addDoc(collection(db, "comments"), {
                userId: auth.currentUser.uid,
                movieId: id,
                movieTitle: movie.name,
                content: comment,
                posterPath: movie.posterUrl,
                timestamp: serverTimestamp(),
                userEmail: auth.currentUser.email
            });

            setComment('');
            fetchComments();
            alert('Yorumunuz eklendi!');
        } catch (error) {
            console.error("Yorum eklenirken hata oluştu:", error);
            alert('Yorum eklenirken bir hata oluştu.');
        }
    };

    if (loading) return <div className="loading">Yükleniyor...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!movie) return <div className="error">Film bulunamadı</div>;

    return (
        <div className="movie-detail-container">
            <div className="movie-detail-header">
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
                    <h1>{movie.name}</h1>
                    <div className="movie-meta">
                        <span className="year">
                            {movie.year}
                        </span>
                        <span className="duration">
                            {movie.duration} dk
                        </span>
                    </div>
                    <div className="rating">
                        <span className="imdb-rating">
                            Puan: {movie.rating.toFixed(1)}/10
                        </span>
                    </div>
                    {user && (
                        <div className="action-buttons">
                            <button 
                                onClick={toggleFavorite}
                                className={`action-button ${isFavorite ? 'active' : ''}`}
                            >
                                {isFavorite ? '❤️ Favorilerden Çıkar' : '🤍 Favorilere Ekle'}
                            </button>
                            <button 
                                onClick={toggleWatchlist}
                                className={`action-button ${isInWatchlist ? 'active' : ''}`}
                            >
                                {isInWatchlist ? '✓ İzleme Listesinden Çıkar' : '+ İzleme Listesine Ekle'}
                            </button>
                        </div>
                    )}
                    <p className="description">{movie.description}</p>
                    <div className="movie-details">
                        <p><strong>Yönetmen:</strong> {movie.director}</p>
                        <p><strong>Oyuncular:</strong> {movie.actors.join(', ')}</p>
                        <p><strong>Kategori:</strong> {movie.genre}</p>
                    </div>
                </div>
            </div>

            <div className="comment-section">
                <h3>Yorum Yap</h3>
                <form onSubmit={handleCommentSubmit}>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Yorumunuzu buraya yazın..."
                        required
                    />
                    <button type="submit">Yorum Ekle</button>
                </form>

                <div className="comments-list">
                    {comments.length > 0 ? (
                        comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-header">
                                    <span className="comment-author">{comment.userEmail}</span>
                                    <span className="comment-date">
                                        {comment.timestamp ? comment.timestamp.toLocaleDateString() : 'Tarih yok'}
                                    </span>
                                </div>
                                <p className="comment-content">{comment.content}</p>
                            </div>
                        ))
                    ) : (
                        <div className="no-comments">Henüz yorum yapılmamış.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MovieDetailPage; 