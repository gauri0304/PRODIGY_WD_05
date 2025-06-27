const API_KEY = '9ecf6c6123a07b350c4643b2187f8aff';

document.addEventListener('DOMContentLoaded', () => {
  addThemeToggle();
});

async function getWeatherByCity() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return showToast('Please enter a city name');

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`)
    ]);

    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    if (weatherData.cod !== 200) throw new Error(weatherData.message);

    updateCurrentWeather(weatherData);
    updateHourlyForecast(forecastData);
    updateWeeklyForecast(forecastData);
  } catch (error) {
    showToast(`❗ ${error.message}`);
  }
}

// Current weather update
function updateCurrentWeather(data) {
  document.getElementById('cityName').textContent = data.name;
  document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°`;
  document.getElementById('realFeel').textContent = `${Math.round(data.main.feels_like)}°`;
  document.getElementById('humidity').textContent = `${data.main.humidity}%`;
  document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
  document.getElementById('windSpeed').textContent = `${data.wind.speed} km/h`;
  document.getElementById('rainChance').textContent = `Chance of rain: ${data.clouds.all}%`;

  // Sunrise & Sunset
  const sunrise = new Date((data.sys.sunrise + data.timezone) * 1000).toUTCString().slice(17, 22);
  const sunset = new Date((data.sys.sunset + data.timezone) * 1000).toUTCString().slice(17, 22);
  document.getElementById('sunTime').textContent = `🌅 Sunrise: ${sunrise} | 🌇 Sunset: ${sunset}`;

  const iconCode = data.weather[0].icon;
  document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  document.getElementById('weatherIcon').alt = data.weather[0].main;

  updateLocalTime(data.timezone);
}

// Local time update
function updateLocalTime(offsetInSeconds) {
  const localTime = new Date(Date.now() + offsetInSeconds * 1000);
  document.getElementById('localTime').textContent = `🕒 Local Time: ${localTime.toUTCString().slice(17, 22)}`;
}

// Hourly forecast update
function updateHourlyForecast(data) {
  const hourlyContainer = document.getElementById('hourlyForecast');
  hourlyContainer.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const entry = data.list[i];
    const hour = new Date(entry.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const temp = `${Math.round(entry.main.temp)}°C`;
    const iconCode = entry.weather[0].icon;

    const hourBlock = document.createElement('div');
    hourBlock.className = 'hour';
    hourBlock.innerHTML = `
      <p>${hour}</p>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${iconCode}.png" alt="">
      <p>${temp}</p>
    `;
    hourlyContainer.appendChild(hourBlock);
  }
}

// Weekly forecast update
function updateWeeklyForecast(data) {
  const forecastContainer = document.getElementById('weeklyForecast');
  const days = {};

  data.list.forEach(item => {
    const date = new Date(item.dt_txt);
    const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
    const hour = date.getHours();

    if (hour === 12 && !days[dayName]) {
      days[dayName] = {
        icon: item.weather[0].icon,
        description: item.weather[0].main,
        max: Math.round(item.main.temp_max),
        min: Math.round(item.main.temp_min)
      };
    }
  });

  forecastContainer.innerHTML = '<ul>' + Object.entries(days).slice(0, 7).map(([day, data]) => `
    <li>
      <span>${day}</span>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${data.icon}.png" alt="">
      ${data.description}
      <span>${data.max}/${data.min}°</span>
    </li>
  `).join('') + '</ul>';
}

// 🔔 Toast Notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #f44336;
    color: white;
    padding: 12px 20px;
    border-radius: 5px;
    font-size: 14px;
    box-shadow: 0 0 10px rgba(0,0,0,0.4);
    z-index: 9999;
    animation: fadeOut 4s forwards;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// 🌗 Theme Toggle
function addThemeToggle() {
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '🌓';
  toggleBtn.setAttribute('aria-label', 'Toggle Theme');
  toggleBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fbc531;
    color: #10131c;
    border: none;
    padding: 8px 12px;
    font-size: 18px;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 9999;
  `;
  document.body.appendChild(toggleBtn);

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
  });
}

function getWeatherByLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        getWeatherByCoordinates(lat, lon);
      },
      error => {
        console.error(error);
        alert("Location access denied or unavailable.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

function getWeatherByCoordinates(lat, lon) {
    const urlWeather = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    Promise.all([
        fetch(urlWeather),
        fetch(urlForecast)
    ])
    .then(async ([weatherRes, forecastRes]) => {
        const weatherData = await weatherRes.json();
        const forecastData = await forecastRes.json();

        if (weatherData.cod !== 200) throw new Error(weatherData.message);

        updateCurrentWeather(weatherData);
        updateHourlyForecast(forecastData);
        updateWeeklyForecast(forecastData);
    })
    .catch(error => {
        console.error("Error in fetching weather by coordinates:", error);
        showToast(`❗ ${error.message}`);
    });
}

