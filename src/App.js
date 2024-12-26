import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import Header from "./components/Header";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MoviePage from "./pages/MoviePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import ProfilePage from "./pages/ProfilePage";
import RecommendationsPage from "./pages/RecommendationsPage";
import AdminPage from "./pages/AdminPage";
import "./styles/global.css";

function App() {
    return (
        <UserProvider>
            <Router>
                <div className="app-container">
                    <Header />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<WelcomePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/movies" element={<MoviePage />} />
                            <Route path="/movie/:id" element={<MovieDetailPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/recommendations" element={<RecommendationsPage />} />
                            <Route path="/admin" element={<AdminPage />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </UserProvider>
    );
}

export default App;
