/** UGH - can't wait until we don't have to hard code API Keys */
const API_KEY = "6c2bd0648a2890aa7a2ee99ad2d70ce9";

/** Create variables for elements that we will be using throughout the script */
const searchFormEl = $("#search-form");
const searchInputEl = $("#search-input");
const weatherForecastEl = $("#weather-forecast");
const currentWeatherEl = $("#current-weather");
const fiveDayForecastEl = $("#five-day-forecast");
const previousCitiesEl = $("#previous-cities");

/** Create submit event for form input */
searchFormEl.on("submit", handleForm);

/**
 * Get the value of the search input(City Name), reset all the page value, unhide the loading spinner and fetch/display
 * weather data.
 * @param event
 */
async function handleForm(event) {
    event.preventDefault();

    const city = searchInputEl.val();

    searchInputEl.val("");
    currentWeatherEl.html("");
    fiveDayForecastEl.html("");
    previousCitiesEl.html("");

    const h5 = $("#five-day-forecast-title");
    h5.addClass("d-none");

    displayLoadingSpinner();

    let fiveDayForecast = getWeatherFromStorage(city);
    if (fiveDayForecast.length === 0) {
        const geocode = await getGeocodeForCity(city);
        fiveDayForecast = await getFiveDayForecast(geocode);
        localStorage.setItem(city, JSON.stringify(fiveDayForecast));
    }

    displayWeatherForecast(fiveDayForecast);
    displayPreviousCitySearches();
}

/**
 * Retrieve the weather forecast for the city passed in. IF it does not exist, return an empty array.
 * @param city
 * @returns {any|*[]}
 */
function getWeatherFromStorage(city) {
    const weatherData = localStorage.getItem(city);

    return weatherData !== null ? JSON.parse(weatherData) : [];
}

/** Create and display the loading spinner */
function displayLoadingSpinner() {
    const outerDiv = $("<div></div>");
    outerDiv.prop("id", "loading-spinner");
    outerDiv.prop("class", "d-flex align-items-center");

    const strong = $("<strong></strong>");
    strong.prop("role", "status");
    strong.text("Loading...");

    const innerDiv = $("<div></div>");
    innerDiv.prop("class", "spinner-border ms-3");
    innerDiv.prop("aria-hidden", "true");

    outerDiv.append(strong);
    outerDiv.append(innerDiv);
    weatherForecastEl.append(outerDiv);
}

/** Make call to get the latitude and longitude for the city searched for and return the response as an object */
async function getGeocodeForCity(city) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;
    let geocode = {
        latitude: 0,
        longitude: 0
    };

    try {
        const response = await fetch(url);
        const data = await response.json();

        geocode.latitude = data[0].lat;
        geocode.longitude = data[0].lon;

        return geocode;
    } catch (error) {
        console.error(error);
    }
}

/** Make call to get the weather forecast and return the response in json */
async function getFiveDayForecast(location) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.latitude}&lon=${location.longitude}&units=imperial&appid=${API_KEY}`;

    return fetch(url)
        .then(response => response.json())
        .catch(error => console.error(error));
}


/**
 * Remove loading spinner, iterate through list of forecasts, first forecast is current day. Forecast updates are sent for every 3 hours so display first
 * forecast for each day and then skip the rest for that day until you hit the next day or the end of the list.
 * @param fiveDayForecast
 */
function displayWeatherForecast(fiveDayForecast) {
    removeLoadingSpinner();

    let lastDateDisplayed = "";
    for (let i = 0; i < fiveDayForecast.list.length; i++) {
        const date = dayjs(fiveDayForecast.list[i].dt_txt.split(" ")[0]).format("YYYY-MM-DD");

        if (i === 0) {
            const weatherCardEl = $("<div></div>");
            weatherCardEl.prop("class", "row my-4 current-forecast");

            const cityNameEl = $("<h4></h4>");
            cityNameEl.text(fiveDayForecast.city.name + ` (${dayjs().format("M/D/YYYY")})`);

            const weatherDetails = createWeatherDetails(fiveDayForecast.list[i]);

            cityNameEl.append(weatherDetails.icon);
            weatherCardEl.append(cityNameEl);
            weatherCardEl.append(weatherDetails.temperature);
            weatherCardEl.append(weatherDetails.wind);
            weatherCardEl.append(weatherDetails.humidity);

            currentWeatherEl.append(weatherCardEl);
        } else {
            if (i === 1) {
                const h5 = $("#five-day-forecast-title");
                h5.removeClass("d-none");
            }

            if (date !== lastDateDisplayed) {
                const weatherCardEl = $("<div></div>");
                weatherCardEl.prop("class", "col m-2 future-forecast");

                const dateEl = $("<h5></h5>");
                dateEl.text(dayjs(date).format("M/D/YYYY"));

                const weatherDetails = createWeatherDetails(fiveDayForecast.list[i]);

                weatherCardEl.append(dateEl);
                weatherCardEl.append(weatherDetails.icon);
                weatherCardEl.append(weatherDetails.temperature);
                weatherCardEl.append(weatherDetails.wind);
                weatherCardEl.append(weatherDetails.humidity);

                fiveDayForecastEl.append(weatherCardEl);
            }
        }

        lastDateDisplayed = date;
    }
}

/**
 * We are ready to display the forecast data so remove the spinner for the page
 */
function removeLoadingSpinner() {
    const loadingSpinnerEl = $("#loading-spinner");
    loadingSpinnerEl.remove();
}

/** Retrieve the keys(City Names) from localStorage and create a button for each key */
function displayPreviousCitySearches() {
    const previousSearches = Object.keys(localStorage).sort();

    for (const city of previousSearches) {
        const previousCityEl = $("<button></button>");

        previousCityEl.attr("class", "previous-city btn btn-secondary w-100 mb-3");
        previousCityEl.text(city);
        previousCityEl.on("click", handlePreviousCitySearch);

        previousCitiesEl.append(previousCityEl);
    }
}

/**
 * Sets the input to be the city name of the button clicked and triggers the form submit to populate
 * the weather forecast for that city.
 * @param event
 */
function handlePreviousCitySearch(event) {
    event.preventDefault();

    searchInputEl.val(event.target.textContent);
    searchFormEl.trigger("submit");
}

/**
 * Create the elements for the weather icon, temperature, wind and humidity.
 * Both the current weather forecast and 5 day forecast share these elements.
 */
function createWeatherDetails(forecast) {
    const weatherIconEl = $("<img>");
    weatherIconEl.prop("src", `https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`);
    weatherIconEl.prop("alt", forecast.weather[0].description);

    const temperatureEl = $("<p></p>");
    temperatureEl.text(`Temperature: ${forecast.main.temp} °F`);

    const windEl = $("<p></p>");
    windEl.text(`Wind: ${forecast.wind.speed} mph`);

    const humidityEl = $("<p></p>");
    humidityEl.text(`Humidity: ${forecast.main.humidity}%`);

    return {
        icon: weatherIconEl,
        temperature: temperatureEl,
        humidity: humidityEl,
        wind: windEl
    };
}

/** Get list of searches already done when page loads */
$(document).ready(function () {
    displayPreviousCitySearches();
});