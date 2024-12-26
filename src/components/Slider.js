import React from "react";
import "./Slider.css";

function Slider() {
    return (
        <div className="slider">
            <div className="slider-track">
                <img src="https://via.placeholder.com/200x300" alt="Film 1" />
                <img src="https://via.placeholder.com/200x300" alt="Film 2" />
                <img src="https://via.placeholder.com/200x300" alt="Film 3" />
                <img src="https://via.placeholder.com/200x300" alt="Film 4" />
                <img src="https://via.placeholder.com/200x300" alt="Film 5" />
                <img src="https://via.placeholder.com/200x300" alt="Film 6" />
                {/* Aynı resim grubunu tekrar ekleyin */}
                <img src="https://via.placeholder.com/200x300" alt="Film 1" />
                <img src="https://via.placeholder.com/200x300" alt="Film 2" />
                <img src="https://via.placeholder.com/200x300" alt="Film 3" />
                <img src="https://via.placeholder.com/200x300" alt="Film 4" />
                <img src="https://via.placeholder.com/200x300" alt="Film 5" />
                <img src="https://via.placeholder.com/200x300" alt="Film 6" />
            </div>
        </div>
    );
}

export default Slider;
