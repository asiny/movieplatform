import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import MovieBackground from '../components/MovieBackground';
import { doc, setDoc } from 'firebase/firestore';
import "./LoginPage.css";

function SignupPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor');
            setLoading(false);
            return;
        }

        try {
            console.log('Kayıt işlemi başlıyor...');
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            console.log('Kullanıcı oluşturuldu:', userCredential.user.uid);

            // Admin hesabı için özel işlem
            const isAdmin = formData.email === 'admin@example.com';
            const userData = {
                email: formData.email,
                role: isAdmin ? 'admin' : 'user',
                createdAt: new Date()
            };

            console.log('Kullanıcı verisi hazırlandı:', userData);

            // Firestore'a kullanıcı bilgilerini kaydet
            await setDoc(doc(db, 'users', userCredential.user.uid), userData);
            console.log('Kullanıcı verileri Firestore\'a kaydedildi');

            // Sayfayı yenile ve ana sayfaya yönlendir
            window.location.href = '/';
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
                default:
                    setError('Kayıt olurken bir hata oluştu');
            }
        } finally {
            setLoading(false);
        }
    };

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
                </div>
            </div>
        </>
    );
}

export default SignupPage;
