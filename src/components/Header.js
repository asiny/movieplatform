import React, { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import "./Header.css";

function Header() {
    const navigate = useNavigate();
    const { user, isAdmin } = useContext(UserContext);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Çıkış yapılırken hata oluştu:", error);
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="logo">
                    MoviePlatform
                </Link>

                <nav className="nav-menu">
                    <Link to="/" className="nav-link">Ana Sayfa</Link>
                    <Link to="/movies" className="nav-link">Filmler</Link>
                    {user && <Link to="/recommendations" className="nav-link">Öneriler</Link>}
                    <div className="dropdown">
                        <button className="nav-link dropdown-trigger">Kategoriler</button>
                        <div className="dropdown-content">
                            <Link to="/movies?category=Aksiyon">Aksiyon</Link>
                            <Link to="/movies?category=Drama">Drama</Link>
                            <Link to="/movies?category=Komedi">Komedi</Link>
                            <Link to="/movies?category=Bilim-Kurgu">Bilim Kurgu</Link>
                            <Link to="/movies">Tüm Kategoriler</Link>
                        </div>
                    </div>
                    {isAdmin && <Link to="/admin" className="nav-link">Admin Panel</Link>}
                    {user && <Link to="/profile" className="nav-link">Profilim</Link>}
                </nav>

                <div className="auth-buttons">
                    {user ? (
                        <>
                            <span className="user-email">{user.email}</span>
                            <button onClick={handleLogout} className="auth-button logout">
                                Çıkış Yap
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate("/login")} className="auth-button login">
                                Giriş Yap
                            </button>
                            <button onClick={() => navigate("/signup")} className="auth-button signup">
                                Kayıt Ol
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
