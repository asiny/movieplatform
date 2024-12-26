import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import MovieBackground from '../components/MovieBackground';
import './WelcomePage.css';

function WelcomePage() {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    if (user) {
        navigate('/movies');
        return null;
    }

    return (
        <>
            <MovieBackground />
            <div className="welcome-container">
                <h1 className="welcome-title">Film ve Dizi Dünyasına Hoş Geldiniz</h1>
                <p className="welcome-description">
                    Binlerce film ve dizi arasından size en uygun olanı bulmak için
                    6 basit soruyu cevaplayın ve size özel önerilerimizi keşfedin!
                </p>
                <div className="welcome-buttons">
                    <button 
                        className="welcome-button primary"
                        onClick={() => navigate('/signup')}
                    >
                        Hemen Başla
                    </button>
                    <button 
                        className="welcome-button secondary"
                        onClick={() => navigate('/login')}
                    >
                        Giriş Yap
                    </button>
                </div>
            </div>
        </>
    );
}

export default WelcomePage;
