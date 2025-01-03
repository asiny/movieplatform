import React, { useContext, useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import "./Header.css";

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAdmin } = useContext(UserContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Çıkış yapılırken hata oluştu:", error);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <header className="header">
            <div className="header-content">
                <Link to={user ? "/home" : "/"} className="logo">
                    MoviePlatform
                </Link>

                <button className="mobile-menu-button" onClick={toggleMobileMenu}>
                    {isMobileMenuOpen ? "✕" : "☰"}
                </button>

                <nav className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                    <Link to={user ? "/home" : "/"} className="nav-link">
                        Ana Sayfa
                    </Link>
                    <Link to="/movies" className="nav-link">
                        Filmler
                    </Link>
                    {user && (
                        <Link to="/recommendations" className="nav-link">
                            Öneriler
                        </Link>
                    )}
                    <div className="dropdown">
                        <button className="nav-link dropdown-trigger">
                            Kategoriler
                        </button>
                        <div className="dropdown-content">
                            <Link to="/movies?category=Aksiyon">Aksiyon</Link>
                            <Link to="/movies?category=Macera">Macera</Link>
                            <Link to="/movies?category=Animasyon">Animasyon</Link>
                            <Link to="/movies?category=Komedi">Komedi</Link>
                            <Link to="/movies?category=Suç">Suç</Link>
                            <Link to="/movies?category=Belgesel">Belgesel</Link>
                            <Link to="/movies?category=Dram">Dram</Link>
                            <Link to="/movies?category=Aile">Aile</Link>
                            <Link to="/movies?category=Fantastik">Fantastik</Link>
                            <Link to="/movies?category=Tarih">Tarih</Link>
                            <Link to="/movies?category=Korku">Korku</Link>
                            <Link to="/movies?category=Müzik">Müzik</Link>
                            <Link to="/movies?category=Gizem">Gizem</Link>
                            <Link to="/movies?category=Romantik">Romantik</Link>
                            <Link to="/movies?category=Bilim Kurgu">Bilim Kurgu</Link>
                            <Link to="/movies?category=Gerilim">Gerilim</Link>
                            <Link to="/movies?category=Savaş">Savaş</Link>
                            <Link to="/movies">Tüm Kategoriler</Link>
                        </div>
                    </div>
                    {isAdmin && (
                        <Link to="/admin" className="nav-link admin-link">
                            Admin Panel
                        </Link>
                    )}
                </nav>

                <div className="auth-buttons">
                    {user ? (
                        <div className="user-section">
                            <span className="user-email">
                                {isAdmin && <span className="crown">👑</span>}
                                {user.email}
                            </span>
                            <Link to="/profile" className="profile-link">
                                Profilim
                            </Link>
                            <button onClick={handleLogout} className="auth-button logout">
                                Çıkış
                            </button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => navigate("/login")} className="auth-button login">
                                Giriş
                            </button>
                            <button onClick={() => navigate("/signup")} className="auth-button signup">
                                Kayıt
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
