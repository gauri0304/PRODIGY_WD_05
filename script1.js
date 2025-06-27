let unit = "metric";
const apiKey = "9ecf6c6123a07b350c4643b2187f8aff";

// Trigger search
async function getWeatherByCity() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) return;

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`;
    fetchWeather(weatherUrl);

    try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
        const geoData = await geoRes.json();

        if (!geoData || !geoData[0]) {
            alert("⚠️ Unable to get forecast for this location.");
            return;
        }

        const { lat, lon } = geoData[0];
        getForecastByCoords(lat, lon);
    } catch (e) {
        alert("⚠️ Could not retrieve forecast data.");
        console.error("Geocoding failed:", e);
    }
}

// Use user location
function getWeatherByLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=${unit}`;
                fetchWeather(url);
                getForecastByCoords(latitude, longitude);
            },
            () => alert("📍 Please allow location access to use this feature.")
        );
    } else {
        alert("⚠️ Geolocation is not supported by this browser.");
    }
}

// Fetch current weather (basic info only)
async function fetchWeather(url) {
    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data || !data.main || !data.weather) {
            alert("❌ Invalid weather data received.");
            return;
        }

        displayWeather(data);
    } catch (e) {
        alert("❌ Error fetching weather.");
        console.error(e);
    }
}

// Display current weather (basic info)
function displayWeather(data) {
    const { name, main, weather, wind } = data;
    const condition = weather[0].main.toLowerCase();
    const description = capitalize(weather[0].description);

    document.getElementById("cityName").textContent = name;
    document.getElementById("temperature").textContent = `${Math.round(main.temp)}°`;

    const temperature = Math.round(main.temp);
    const iconSrc = getTempBasedIcon(temperature);
    document.getElementById("weatherIcon").src = iconSrc;
    document.getElementById("weatherIcon").alt = description;

    document.getElementById("realFeel").textContent = `${Math.round(main.feels_like)}°`;
    document.getElementById("windSpeed").textContent = `${wind.speed} km/h`;
    document.getElementById("humidity").textContent = `${main.humidity}%`;
    document.getElementById("pressure").textContent = `${main.pressure} hPa`;

    setWeatherBackground(condition);
}

// Format time using timezone offset
function formatTime(utcSeconds, offsetSeconds) {
    return new Date((utcSeconds + offsetSeconds) * 1000).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

// Display 7-day forecast
function displayForecast(days) {
    const container = document.getElementById("weeklyForecast");
    container.innerHTML = "";

    days.forEach((day, i) => {
        const date = new Date(day.dt * 1000);
        const dayName = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
        const icon = day.weather[0].icon;
        const desc = day.weather[0].main;
        const min = Math.round(day.temp.min);
        const max = Math.round(day.temp.max);

        container.innerHTML += `
      <div class="forecast-day">
        <span class="day">${dayName}</span>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" />
        <span class="temp">${max}°/${min}°</span>
      </div>
    `;
    });
}

// Display hourly forecast with timezone offset
function displayHourlyForecast(hours, offset = 0) {
    const container = document.getElementById("hourlyForecast");
    container.innerHTML = "";

    hours.slice(0, 6).forEach(hour => {
        const localTime = formatTime(hour.dt, offset);
        const temp = Math.round(hour.temp);
        const icon = getIcon(hour.weather[0].main.toLowerCase());

        container.innerHTML += `
            <div class="hour">
                <p>${localTime}</p>
                <img src="${icon}" alt="${hour.weather[0].main}" class="forecast-icon" />
                <p>${temp}°</p>
            </div>
        `;
    });
}

// Fetch forecast data from One Call API
async function getForecastByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=${unit}&appid=${apiKey}`;

    try {
        console.log("🔗 Fetching One Call API from:", url);
        const res = await fetch(url);
        const data = await res.json();

        console.log("🌤️ One Call API Response:", data);

        const hasDaily = Array.isArray(data.daily) && data.daily.length > 0;
        const hasHourly = Array.isArray(data.hourly) && data.hourly.length > 0;

        const offset = data.timezone_offset;
        const current = data.current;

        // Set local time, sunrise, sunset
        document.getElementById("localTime").textContent = `🕒 Local Time: ${formatTime(current.dt, offset)}`;
        document.getElementById("sunTime").textContent = `🌅 Sunrise: ${formatTime(current.sunrise, offset)} | 🌇 Sunset: ${formatTime(current.sunset, offset)}`;

        // Set chance of rain
        const chanceOfRain = data.hourly[0]?.pop !== undefined
            ? Math.round(data.hourly[0].pop * 100)
            : 0;
        document.getElementById("rainChance").textContent = `Chance of rain: ${chanceOfRain}%`;

        if (hasDaily) displayForecast(data.daily.slice(0, 7));
        if (hasHourly) displayHourlyForecast(data.hourly, offset);
    } catch (e) {
        alert("⚠️ Forecast unavailable.");
        console.error(e);
    }
}

// Helpers
function getTempBasedIcon(temp) {
    if (temp <= 0) return "icons/snow.png";
    if (temp > 0 && temp <= 15) return "icons/cold.png";
    if (temp > 15 && temp <= 25) return "icons/cloudy.png";
    if (temp > 25 && temp <= 32) return "icons/sunny_cloudy.png";
    if (temp > 32) return "icons/sunny.png";
    return "icons/unknown.png";
}

function getIcon(condition) {
    if (condition.includes("clear")) return "icons/sunny.png";
    if (condition.includes("cloud")) return "icons/sunny_cloudy.png";
    if (condition.includes("rain")) return "icons/rain.png";
    if (condition.includes("storm")) return "icons/thunderstorm.png";
    if (condition.includes("snow")) return "icons/snowy.png";
    return "icons/default.png";
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function setWeatherBackground(condition) {
    const body = document.body;
    body.className = "";
    body.classList.add(condition);
}

// Load default city
window.onload = () => {
    const defaultCity = "Mumbai";
    document.getElementById("cityInput").value = defaultCity;
    getWeatherByCity();
};
