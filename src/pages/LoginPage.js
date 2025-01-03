import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import MovieBackground from '../components/MovieBackground';
import "./LoginPage.css";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/home");
        } catch (err) {
            console.error("Login error:", err);
            setError("E-posta veya şifre hatalı!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <MovieBackground />
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Giriş Yap</h2>
                    {error && <div className="auth-error">{error}</div>}
                    <form className="auth-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>E-posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="E-posta adresiniz"
                            />
                        </div>
                        <div className="form-group">
                            <label>Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Şifreniz"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                        </button>
                    </form>
                    <div className="auth-links">
                        <p>Hesabınız yok mu? <Link to="/signup">Kayıt Ol</Link></p>
                        <Link to="/" className="back-home">Ana Sayfaya Dön</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default LoginPage;
