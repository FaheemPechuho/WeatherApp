const OPENWEATHER_API_KEY = '1b4f5be9e5ac8a3cfc91d0b819e0ff45'; // Replace with your actual API key
let isCelsius = true; // Unit toggle state

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

// Event listeners
searchBtn.addEventListener('click', () => handleSearch(fetchWeatherByCity));
sendChatBtn.addEventListener('click', handleChatSubmit);
unitToggle.addEventListener('change', toggleUnitsAndFetchWeather);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleChatSubmit();
    }
});

// Toggle between Celsius and Fahrenheit
function toggleUnitsAndFetchWeather() {
    isCelsius = !isCelsius;
    handleSearch(fetchWeatherByCity);
}

function formatTemperature(temp) {
    return isCelsius ? `${Math.round(temp)}°C` : `${Math.round(temp * 9/5 + 32)}°F`;
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
        const weatherData = await fetchData(weatherUrl);
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
        const forecastData = await fetchData(forecastUrl);
        displayForecast(forecastData);
        createCharts(forecastData);
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
    errorDiv.textContent = ''; // Clear previous errors
}

// Display 5-day forecast
function displayForecast(forecastData) {
    const dailyData = forecastData.list.filter((item, index) => index % 8 === 0);
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
    dailyData.forEach(item => {
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

    const uniqueConditions = [...new Set(weatherConditions)];
    const conditionCounts = uniqueConditions.map(condition =>
        weatherConditions.filter(c => c === condition).length
    );

    renderChart('temperatureChart', 'bar', labels, temperatures, 'Temperature (°C)', '5-Day Temperature Forecast');
    renderDoughnutChart('conditionsChart', uniqueConditions, conditionCounts, 'Weather Conditions Distribution');
    renderLineChart('temperatureTrendChart', labels, temperatures, 'Temperature Trend');
}

// Generic function to render charts
function renderChart(chartId, chartType, labels, data, label, titleText) {
    new Chart(document.getElementById(chartId), {
        type: chartType,
        data: {
            labels,
            datasets: [{
                label,
                data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: titleText
                }
            },
            animation: {
                delay: (context) => context.dataIndex * 300
            }
        }
    });
}

function renderDoughnutChart(chartId, labels, data, titleText) {
    new Chart(document.getElementById(chartId), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                ],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: titleText
                }
            },
            animation: {
                delay: (context) => context.dataIndex * 300
            }
        }
    });
}

function renderLineChart(chartId, labels, data, titleText) {
    new Chart(document.getElementById(chartId), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: titleText,
                data,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: titleText
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutBounce'
            }
        }
    });
}

// Handle chat submission
async function handleChatSubmit() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    chatInput.value = '';

    try {
        let response;
        if (message.toLowerCase().includes('weather')) {
            response = generateWeatherResponse();
        } else {
            response = await fetchGeminiResponse(message);
        }
        appendMessage('assistant', response);
    } catch (error) {
        appendMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
}

// Generate weather response
function generateWeatherResponse() {
    if (!weatherData) return "I'm sorry, I don't have any weather data at the moment.";
    
    const { main, weather } = weatherData;
    return `The current weather in ${weatherData.name} is ${weather[0].description} with a temperature of ${main.temp.toFixed(1)}°C.`;
}

// Fetch response from Gemini API (placeholder)
async function fetchGeminiResponse(query) {
    // TODO: Implement actual Gemini API call here
    return "I'm an AI assistant. How can I help you today?";
}

// Append message to chat
function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
}

// Event listener to handle "Enter" key for chat input
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleChatSubmit();
    }
});

// Handle search with loading state
async function handleSearch(action) {
    searchBtn.disabled = true;  // Disable button during search
    loadingSpinner.style.display = 'block'; // Show loading spinner
    weatherWidget.innerHTML = '<p>Loading...</p>';
    forecastTable.innerHTML = ''; // Clear forecast

    await action();  // Perform the search action (fetchWeatherByCity)

    searchBtn.disabled = false;  // Enable button after search completes
    loadingSpinner.style.display = 'none'; // Hide loading spinner
}

// Display error messages
function displayError(message) {
    errorDiv.textContent = message;
}
