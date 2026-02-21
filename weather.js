const axios = require('axios');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 1. FIXED: Added quotes around the API Key string
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY_HERE'; 

async function fetchWeatherData(city) {
    // 2. FIXED: Added encodeURIComponent to handle spaces in city names
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}`;
    
    try {
        const response = await axios.get(apiUrl);
        const weatherData = response.data;
        return {
            city: weatherData.name,
            temperature: (weatherData.main.temp - 273.15).toFixed(2) + '°C',
            description: weatherData.weather[0].description
        };
    } catch (error) {
        // This logs the exact reason (e.g., 401 for bad key, 404 for city not found) to your console
        console.error('API Error:', error.response ? error.response.data : error.message);
        return null;
    }
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Serve HTML Frontend
    if (req.method === 'GET' && parsedUrl.pathname === '/') {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error: Make sure index.html is in the same folder as this script.');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } 
    // Weather API Endpoint
    else if (req.method === 'GET' && parsedUrl.pathname === '/weather') {
        const location = parsedUrl.query.location;
        
        if (!location) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Location parameter missing' }));
        }

        const weatherData = await fetchWeatherData(location);
        
        if (weatherData) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(weatherData));
        } else {
            // 3. FIXED: If API fails, we send a 404 or 500
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Could not find weather for that location.' }));
        }
    } 
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n--- Weather App Server Running ---`);
    console.log(`Local link: http://localhost:${PORT}`);
    console.log(`Endpoint: http://localhost:${PORT}/weather?location=Chennai\n`);
});