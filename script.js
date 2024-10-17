const OPENWEATHER_API_KEY = '61f914574ac18c77533800b760147c1e'; // Replace with your actual OpenWeather API key
const GEMINI_API_KEY = 'AIzaSyAxVIeE9zkWrV9-wV8O8qKh0MfkfkvI2VA'; // Replace with your Gemini API key

let isCelsius = true;
let forecastData = [];
let weatherData; // Store current weather data
let currentPage = 1;
const itemsPerPage = 5;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const errorDiv = document.getElementById('error');
const weatherWidget = document.getElementById('weatherWidget');
const forecastTable = document.getElementById('forecastTable');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const unitToggle = document.getElementById('unit-toggle');
const loadingSpinner = document.getElementById('loading-spinner');

// Chart initialization
const ctx1 = document.getElementById('temperatureChart').getContext('2d');
const ctx2 = document.getElementById('conditionsChart').getContext('2d');
const ctx3 = document.getElementById('temperatureTrendChart').getContext('2d');

let tempBarChart = new Chart(ctx1, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature (°C)',
            data: [],
            backgroundColor: 'rgba(0, 128, 255, 0.7)', // Light blue
        }],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

let weatherDoughnutChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
        labels: ['Clear', 'Clouds', 'Rain', 'Other'],
        datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#FFCE56', '#36A2EB', '#FF6384', '#4BC0C0'],
        }],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
    }
});

let tempLineChart = new Chart(ctx3, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature Changes',
            data: [],
            borderColor: '#007BFF', // Blue
            fill: false,
        }],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Event listeners
searchBtn.addEventListener('click', () => handleSearch(fetchWeatherByCity));
sendChatBtn.addEventListener('click', handleChatSubmit);
unitToggle.addEventListener('change', toggleUnitsAndFetchWeather);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
});

// Toggle between Celsius and Fahrenheit
function toggleUnitsAndFetchWeather() {
    isCelsius = !isCelsius;
    handleSearch(fetchWeatherByCity);
}

function formatTemperature(temp) {
    return isCelsius ? `${Math.round(temp)}°C` : `${Math.round(temp * 9 / 5 + 32)}°F`;
}

// Fetch data from API
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        displayError(error.message);
        throw error;
    }
}

// Fetch weather data by city name
async function fetchWeatherByCity() {
    const city = cityInput.value.trim();
    if (!city) return displayError('City name is required.');

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;

    try {
        weatherData = await fetchData(weatherUrl);
        displayWeather(weatherData);
        fetchForecast(weatherData.coord.lat, weatherData.coord.lon);
    } catch (error) {
        console.error('Error fetching weather:', error);
    }
}

// Fetch 5-day forecast data
async function fetchForecast(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;

    try {
        forecastData = await fetchData(forecastUrl);
        displayForecast(forecastData);
        createCharts(forecastData);
        updatePagination(); // Update pagination controls after fetching data
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

// Display current weather
function displayWeather(data) {
    const temp = formatTemperature(data.main.temp);
    const weatherHtml = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <p>Temperature: ${temp}</p>
        <p>Weather: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} m/s</p>
    `;
    weatherWidget.innerHTML = weatherHtml;
    errorDiv.textContent = '';
}

// Display 5-day forecast
function displayForecast(forecastData) {
    const dailyData = forecastData.list.filter((item, index) => index % 8 === 0);
    renderForecastTable(dailyData);
}

// Render the forecast table with pagination
function renderForecastTable(dailyData) {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = dailyData.slice(start, end);

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Temperature</th>
                    <th>Weather</th>
                </tr>
            </thead>
            <tbody>
    `;

    paginatedData.forEach(item => {
        const temp = formatTemperature(item.main.temp);
        tableHTML += `
            <tr>
                <td>${new Date(item.dt * 1000).toLocaleDateString()}</td>
                <td>${temp}</td>
                <td>${item.weather[0].description}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    forecastTable.innerHTML = tableHTML;
}

// Create charts
function createCharts(forecastData) {
    const dailyData = forecastData.list.filter((item, index) => index % 8 === 0);
    const labels = dailyData.map(item => new Date(item.dt * 1000).toLocaleDateString());
    const temperatures = dailyData.map(item => item.main.temp);
    const weatherConditions = dailyData.map(item => item.weather[0].main);

    // Update Temperature Bar Chart
    tempBarChart.data.labels = labels;
    tempBarChart.data.datasets[0].data = temperatures;
    tempBarChart.update();

    // Update Weather Conditions Doughnut Chart
    const weatherCounts = {
        Clear: weatherConditions.filter(w => w === 'Clear').length,
        Clouds: weatherConditions.filter(w => w === 'Clouds').length,
        Rain: weatherConditions.filter(w => w === 'Rain').length,
        Other: weatherConditions.filter(w => !['Clear', 'Clouds', 'Rain'].includes(w)).length
    };
    weatherDoughnutChart.data.datasets[0].data = Object.values(weatherCounts);
    weatherDoughnutChart.update();

    // Update Temperature Line Chart
    tempLineChart.data.labels = labels;
    tempLineChart.data.datasets[0].data = temperatures;
    tempLineChart.update();
}
// Handle chat submission
async function handleChatSubmit() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    chatInput.value = '';

    try {
        let response;

        // Check if the message includes any weather-related keywords
        if (message.toLowerCase().includes('weather') || message.toLowerCase().includes('temperature') || 
            message.toLowerCase().includes('forecast') || message.toLowerCase().includes('humidity') || 
            message.toLowerCase().includes('wind')) {
                
            const city = extractCityFromMessage(message);
            if (city) {
                const locationData = await fetchLocationData(city);
                if (locationData) {
                    await fetchForecast(locationData.lat, locationData.lon);
                    response = generateWeatherResponse();
                } else {
                    response = "Sorry, I couldn't find the weather for that city.";
                }
            } else {
                response = "Please provide a valid city name.";
            }
        } else {
            // If the query is not about weather, use the Gemini API
            response = await fetchGeminiResponse(message);
        }
        
        appendMessage('assistant', response);
    } catch (error) {
        appendMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
}

// Generate weather response based on current weather data
function generateWeatherResponse() {
    if (!weatherData) return "I'm sorry, I don't have any weather data at the moment.";

    const { main, weather } = weatherData;
    return `The current weather in ${weatherData.name} is ${weather[0].description} with a temperature of ${main.temp.toFixed(1)}°C.`;
}

// Extract city from user's message
function extractCityFromMessage(message) {
    const city = message.replace(/weather in |what is the weather in |temperature in |forecast for /i, '').trim();
    return city;
}

async function fetchLocationData(city) {
    const geocodingUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}`;
    try {
        const locationData = await fetchData(geocodingUrl);
        return { lat: locationData.coord.lat, lon: locationData.coord.lon };
    } catch (error) {
        console.error('Error fetching location data:', error);
        return null; // Return null if there's an error
    }
}




// Fetch response from Gemini API
async function fetchGeminiResponse(query) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`; 

    const payload = {
        contents: [
            {
                parts: [
                    { text: query } 
                ]
            }
        ]
    };

    try {
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.contents[0].parts[0].text; // Adjust based on Gemini's response structure
    } catch (error) {
        console.error('Error fetching from Gemini API:', error);
        return "Sorry, I'm unable to process that query.";
    }
}

// Append message to chat
function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Display error messages
function displayError(message) {
    errorDiv.textContent = message;
}

// Handle search with loading state
async function handleSearch(action) {
    searchBtn.disabled = true;
    loadingSpinner.style.display = 'block';
    weatherWidget.innerHTML = '<p>Loading...</p>';
    forecastTable.innerHTML = '';

    await action();

    searchBtn.disabled = false;
    loadingSpinner.style.display = 'none';
}

// Fetch and show forecast data for London as default
fetchForecast(51.5074, -0.1278); // Coordinates of London
