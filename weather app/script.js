// script.js (ES module)
const apiKey = "60476590334cef983cbe24d944ee99d7"; // YOUR provided API KEY
const root = document;
const cityInput = root.getElementById("cityInput");
const searchBtn = root.getElementById("searchBtn");
const geoBtn = root.getElementById("geoBtn");
const loader = root.getElementById("loader");
const msg = root.getElementById("msg");
const card = root.getElementById("card");
const weatherBg = root.getElementById("weatherBg");

// UI fields
const cityName = root.getElementById("cityName");
const countryEl = root.getElementById("country");
const temperature = root.getElementById("temperature");
const desc = root.getElementById("desc");
const weatherIcon = root.getElementById("weatherIcon");
const feels = root.getElementById("feels");
const humidity = root.getElementById("humidity");
const wind = root.getElementById("wind");
const pressure = root.getElementById("pressure");
const visibility = root.getElementById("visibility");
const sunriseEl = root.getElementById("sunrise");
const sunsetEl = root.getElementById("sunset");

function showLoader(on = true) {
  loader.classList.toggle("hidden", !on);
  card.classList.toggle("hidden", on); // hide card while loading
  msg.style.display = "none";
}

function showMessage(text, isError = true) {
  msg.style.display = "block";
  msg.textContent = text;
  msg.style.background = isError ? "rgba(255, 80, 80, 0.08)" : "rgba(32,200,120,0.06)";
  if (!isError) setTimeout(()=>{ msg.style.display = "none"; }, 3000);
}

function kelvinToC(k) { return Math.round(k - 273.15); }

// convert unix timestamp + timezone offset (in seconds) -> local time string
function timeFromUnix(ts, tzOffsetSeconds) {
  const d = new Date((ts + tzOffsetSeconds) * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildBgForWeather(main) {
  // returns HTML to inject into .weather-bg showing simple animated elements for each weather category
  switch (main.toLowerCase()) {
    case "clear":
      return `<div class="sun" aria-hidden="true"></div>`;
    case "clouds":
      return `<div class="cloud" aria-hidden="true"></div>`;
    case "rain":
    case "drizzle":
      return `<div class="cloud" aria-hidden="true"></div><div class="rain" aria-hidden="true"></div>`;
    case "thunderstorm":
      return `<div class="cloud" aria-hidden="true"></div><div class="rain" aria-hidden="true"></div><div style="position:absolute;left:50%;top:18%;transform:translateX(-50%);font-weight:800;letter-spacing:0.6px">⚡</div>`;
    case "snow":
      return `<div style="position:absolute;left:44%;top:10%;font-size:26px">❄️</div><div class="cloud" aria-hidden="true"></div>`;
    case "mist":
    case "smoke":
    case "haze":
    case "fog":
      return `<div style="position:absolute;left:10%;top:10%;right:10%;bottom:10%;border-radius:12px;background:linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));backdrop-filter:blur(4px)"></div>`;
    default:
      return `<div class="sun" aria-hidden="true" style="width:58px;height:58px;top:26px;left:18px"></div>`;
  }
}

function displayWeather(data) {
  // show card
  cityName.textContent = `${data.name}`;
  countryEl.textContent = `${data.sys?.country ?? ""}`;
  desc.textContent = `${data.weather[0].description}`;
  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  feels.textContent = `${Math.round(data.main.feels_like)}°C`;
  humidity.textContent = `${data.main.humidity}%`;
  wind.textContent = `${data.wind.speed} m/s`;
  pressure.textContent = `${data.main.pressure} hPa`;
  visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  sunriseEl.textContent = timeFromUnix(data.sys.sunrise, data.timezone);
  sunsetEl.textContent = timeFromUnix(data.sys.sunset, data.timezone);

  // icon
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
  weatherIcon.alt = data.weather[0].description;

  // background/decoration
  weatherBg.innerHTML = buildBgForWeather(data.weather[0].main);

  // reveal card and hide loader
  loader.classList.add("hidden");
  card.classList.remove("hidden");
  showMessage("Weather updated", false);
}

async function fetchByUrl(url) {
  try {
    showLoader(true);
    const resp = await fetch(url);
    const json = await resp.json();
    if (!resp.ok) {
      showLoader(false);
      showMessage(json.message ?? "Failed to fetch weather");
      return null;
    }
    return json;
  } catch (err) {
    showLoader(false);
    showMessage("Network error — check your connection");
    console.error(err);
    return null;
  }
}

async function getWeatherByCity(city) {
  if (!city) { showMessage("Please type a city name"); return; }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
  const data = await fetchByUrl(url);
  if (data) displayWeather(data);
}

async function getWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const data = await fetchByUrl(url);
  if (data) displayWeather(data);
}

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  getWeatherByCity(city);
  try { localStorage.setItem("lastCity", city); } catch (e) {}
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showMessage("Geolocation not supported by your browser");
    return;
  }
  showLoader(true);
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      getWeatherByCoords(latitude, longitude);
    },
    err => {
      showLoader(false);
      showMessage("Location permission denied or unavailable");
    },
    { timeout: 10000, maximumAge: 600000 }
  );
});

// try load last city
window.addEventListener("load", () => {
  const last = localStorage.getItem("lastCity");
  if (last) {
    cityInput.value = last;
    getWeatherByCity(last);
  } else {
    // fetch a default city to show layout
    getWeatherByCity("New Delhi");
  }
});
