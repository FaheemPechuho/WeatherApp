const OPENWEATHER_API_KEY = '1b4f5be9e5ac8a3cfc91d0b819e0ff45'; // Replace with your actual API key
let forecastData = []; // This will hold the fetched forecast data
let currentPage = 1; // Initialize current page for pagination
const itemsPerPage = 5; // Number of entries to show per page

const forecastTable = document.getElementById('forecastTable');
const paginationControls = document.getElementById('paginationControls');

// Fetch forecast data for a specific city (replace with dynamic city selection)
const lat = 51.5074; // Replace with desired latitude (e.g., London)
const lon = -0.1278; // Replace with desired longitude (e.g., London)

async function fetchForecast(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;

    try {
        forecastData = await fetchData(forecastUrl); // Store the fetched forecast data
        displayForecast(forecastData);
        updatePagination(); // Update pagination controls after fetching data
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
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

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(forecastData.list.filter((item, index) => index % 8 === 0).length / itemsPerPage);
    document.getElementById('currentPage').textContent = currentPage;

    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages;

    // Add event listeners for pagination buttons
    document.getElementById('prevPageBtn').onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderForecastTable(forecastData.list.filter((item, index) => index % 8 === 0));
            updatePagination();
        }
    };

    document.getElementById('nextPageBtn').onclick = () => {
        const totalPages = Math.ceil(forecastData.list.filter((item, index) => index % 8 === 0).length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderForecastTable(forecastData.list.filter((item, index) => index % 8 === 0));
            updatePagination();
        }
    };
}

// Function to format temperature
function formatTemperature(temp) {
    return `${Math.round(temp)}°C`; // Change this according to your unit preference
}

// Function to display error messages
function displayError(message) {
    forecastTable.innerHTML = `<p style="color:red;">${message}</p>`;
}

// Call fetchForecast to load data on page load
fetchForecast(lat, lon);
