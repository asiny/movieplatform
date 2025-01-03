import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { UserContext } from "../context/UserContext";
import MovieBackground from '../components/MovieBackground';
import { doc, setDoc } from 'firebase/firestore';
import "./LoginPage.css";

function SignupPage() {
    const { user } = useContext(UserContext);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Kullanıcı oturum durumunu kontrol et
    useEffect(() => {
        if (user && success) {
            navigate('/home', { replace: true });
        }
    }, [user, success, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Form validasyonu
        if (formData.password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Kullanıcı oluştur
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // Admin kontrolü
            const isAdmin = formData.email === 'admin@example.com';
            
            // Kullanıcı verilerini hazırla
            const userData = {
                email: formData.email,
                role: isAdmin ? 'admin' : 'user',
                createdAt: new Date().toISOString(),
                displayName: formData.email.split('@')[0],
                favorites: [],
                watchlist: []
            };

            // Firestore'a kullanıcı bilgilerini kaydet
            await setDoc(doc(db, 'users', userCredential.user.uid), userData);
            
            setSuccess(true);

        } catch (error) {
            console.error('Kayıt hatası:', error);
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    setError('Bu email adresi zaten kullanımda');
                    break;
                case 'auth/invalid-email':
                    setError('Geçersiz email adresi');
                    break;
                case 'auth/weak-password':
                    setError('Şifre en az 6 karakter olmalıdır');
                    break;
                case 'auth/network-request-failed':
                    setError('İnternet bağlantınızı kontrol edin');
                    break;
                default:
                    setError('Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    useEffect(() => {
        if (user && !success) {
            navigate('/home', { replace: true });
        }
    }, [user, success, navigate]);

    return (
        <>
            <MovieBackground />
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Kayıt Ol</h2>
                    {error && <div className="auth-error">{error}</div>}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>E-posta</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="E-posta adresiniz"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label>Şifre</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Şifreniz (en az 6 karakter)"
                                minLength="6"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label>Şifre Tekrar</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Şifrenizi tekrar girin"
                                minLength="6"
                                disabled={loading}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                        </button>
                    </form>
                    <div className="auth-links">
                        <p>Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link></p>
                        <Link to="/" className="back-home">Ana Sayfaya Dön</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SignupPage;
