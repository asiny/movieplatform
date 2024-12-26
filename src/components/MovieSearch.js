import React, { useState } from 'react';
import './MovieSearch.css';

function MovieSearch({ onSearch, categories }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedRating, setSelectedRating] = useState('all');

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch({
            searchTerm,
            category: selectedCategory,
            year: selectedYear,
            rating: selectedRating
        });
    };

    return (
        <div className="movie-search">
            <form onSubmit={handleSearch}>
                <div className="search-input">
                    <input
                        type="text"
                        placeholder="Film veya dizi ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filters">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="all">Tüm Kategoriler</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="all">Tüm Yıllar</option>
                        {Array.from({ length: 2024 - 1990 + 1 }, (_, i) => 2024 - i).map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedRating}
                        onChange={(e) => setSelectedRating(e.target.value)}
                    >
                        <option value="all">Tüm Puanlar</option>
                        <option value="9">9+ Puan</option>
                        <option value="8">8+ Puan</option>
                        <option value="7">7+ Puan</option>
                        <option value="6">6+ Puan</option>
                    </select>
                </div>

                <button type="submit" className="search-button">
                    Ara
                </button>
            </form>
        </div>
    );
}

export default MovieSearch; 