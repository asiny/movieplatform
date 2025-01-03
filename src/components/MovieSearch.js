import React, { useState } from 'react';
import './MovieSearch.css';

function MovieSearch({ onSearch, onFilter }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        year: '',
        minRating: '',
        sortBy: 'title',
        genre: ''
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

    // Sabit kategori listesi
    const genres = [
        "Aksiyon",
        "Macera",
        "Animasyon",
        "Komedi",
        "Suç",
        "Belgesel",
        "Dram",
        "Aile",
        "Fantastik",
        "Tarih",
        "Korku",
        "Müzik",
        "Gizem",
        "Romantik",
        "Bilim Kurgu",
        "TV Film",
        "Gerilim",
        "Savaş",
        "Vahşi Batı"
    ];

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        onSearch(value);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = {
            ...filters,
            [name]: value
        };
        setFilters(newFilters);
        onFilter(newFilters);
    };

    return (
        <div className="search-container">
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Film ara..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="filters">
                <select 
                    name="genre"
                    value={filters.genre}
                    onChange={handleFilterChange}
                >
                    <option value="">Tüm Kategoriler</option>
                    {genres.map(genre => (
                        <option key={genre} value={genre}>
                            {genre}
                        </option>
                    ))}
                </select>

                <select 
                    name="year" 
                    value={filters.year}
                    onChange={handleFilterChange}
                >
                    <option value="">Yıl Seçin</option>
                    {years.map(year => (
                        <option key={year} value={year.toString()}>
                            {year}
                        </option>
                    ))}
                </select>

                <select 
                    name="minRating" 
                    value={filters.minRating}
                    onChange={handleFilterChange}
                >
                    <option value="">Minimum Puan</option>
                    <option value="9">9+ Puan</option>
                    <option value="8">8+ Puan</option>
                    <option value="7">7+ Puan</option>
                    <option value="6">6+ Puan</option>
                    <option value="5">5+ Puan</option>
                </select>

                <select 
                    name="sortBy" 
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                >
                    <option value="title">İsme Göre</option>
                    <option value="rating">Puana Göre</option>
                    <option value="year">Yıla Göre</option>
                </select>
            </div>
        </div>
    );
}

export default MovieSearch; 