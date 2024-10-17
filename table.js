const OPENWEATHER_API_KEY = '61f914574ac18c77533800b760147c1e';
const GEMINI_API_KEY = 'AIzaSyAxVIeE9zkWrV9-wV8O8qKh0MfkfkvI2VA';

let forecastData = [];
let currentPage = 1;
const itemsPerPage = 5;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const forecastTable = document.getElementById('forecastTable');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const loadingSpinner = document.getElementById('loading-spinner');
const errorDiv = document.getElementById('error');

// Event listeners
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});
sendChatBtn.addEventListener('click', handleChatSubmit);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
});

// Search Weather Function
async function searchWeather() {
    try {
        const city = cityInput.value.trim();
        if (!city) {
            throw new Error('Please enter a city name');
        }

        // Show loading state
        searchBtn.disabled = true;
        loadingSpinner.style.display = 'block';
        errorDiv.textContent = '';

        // Fetch and display weather data
        const weatherData = await fetchCurrentWeather(city);
        const forecastData = await fetchForecast(city);
        displayWeather(weatherData);
        displayForecast(forecastData);

    } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = error.message || 'Failed to fetch weather data';
        forecastTable.innerHTML = '<p>Failed to load weather data</p>';
    } finally {
        searchBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

// Fetch current weather
async function fetchCurrentWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'City not found');
    }
    
    return data;
}

// Fetch 5-day weather forecast
async function fetchForecast(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Could not fetch forecast data');
    }

    return data;
}

// Display Weather Data
function displayWeather(data) {
    const date = new Date(data.dt * 1000);
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;

    const tableHTML = `
        <table class="forecast-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>City</th>
                    <th>Temperature</th>
                    <th>Weather</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${'Current'}</td>
                    <td>${data.name}</td>
                    <td>${temp}°C</td>
                    <td>${description}</td>
                </tr>
            </tbody>
        </table>
    `;

    forecastTable.innerHTML = tableHTML;
}

// Display 5-Day Forecast Data
function displayForecast(data) {
    const days = {};
    
    // Group forecast data by date
    data.list.forEach(entry => {
        const date = new Date(entry.dt * 1000).toLocaleDateString();
        if (!days[date]) {
            days[date] = {
                temp: Math.round(entry.main.temp),
                description: entry.weather[0].description
            };
        }
    });

    const forecastHTML = `
        <h3>5-Day Weather Forecast</h3>
        <table class="forecast-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Temperature</th>
                    <th>Weather</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(days).map(([date, { temp, description }]) => {
                    return `
                        <tr>
                            <td>${date}</td>
                            <td>${temp}°C</td>
                            <td>${description}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    forecastTable.innerHTML += forecastHTML; // Append forecast to existing weather table
}

// Chatbot functions
async function handleChatSubmit() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    chatInput.value = '';

    try {
        if (message.toLowerCase().includes('weather') || message.toLowerCase().includes('temperature')) {
            const city = extractCityFromMessage(message);
            if (city) {
                const weatherResponse = await getChatWeatherResponse(city);
                appendMessage('assistant', weatherResponse);
            } else {
                appendMessage('assistant', "I couldn't determine which city you're asking about. Please specify a city name.");
            }
        } else {
            const response = await fetchGeminiResponse(message);
            appendMessage('assistant', response);
        }
    } catch (error) {
        appendMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
}

async function getChatWeatherResponse(city) {
    try {
        const weatherData = await fetchCurrentWeather(city);
        const currentTemp = weatherData.main.temp;
        const description = weatherData.weather[0].description;

        return `Current weather in ${weatherData.name}:
• Temperature: ${Math.round(currentTemp)}°C
• Conditions: ${description}`;
    } catch (error) {
        return `I'm sorry, I couldn't find weather information for ${city}. Please check the city name and try again.`;
    }
}

function extractCityFromMessage(message) {
    const matches = message.match(/weather(?:\s+in)?\s+([a-zA-Z\s]+)|(?:what's|what is|how's|how is)\s+the\s+weather\s+(?:like\s+)?(?:in\s+)?([a-zA-Z\s]+)/i);
    if (matches) {
        return (matches[1] || matches[2]).trim();
    }
    const cityMatch = message.match(/in\s+([a-zA-Z\s]+)$/i);
    return cityMatch ? cityMatch[1].trim() : null;
}

async function fetchGeminiResponse(query) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: query }] }]
            })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data.contents[0].parts[0].text;
    } catch (error) {
        console.error('Error fetching from Gemini API:', error);
        return "I'm sorry, I couldn't process that query right now. Please try again.";
    }
}

// Helper functions
function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initial load
window.addEventListener('load', () => {
    if (!cityInput.value) {
        cityInput.value = 'London';
        searchWeather();
    }
});
