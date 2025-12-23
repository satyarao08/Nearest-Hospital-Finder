let map;
let infoWindow;
let directionsService;
let directionsRenderer;
let userLocation;

// Maps for different pages
let hospitalMap, medicalMap, vetMap;
let hospitalDirections, medicalDirections, vetDirections;

// Page Navigation
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }

    // Manual Location Search
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const input = document.getElementById('manual-location');
            const address = input.value;
            if (address) {
                geocodeAddress(address);
            }
        });
    }

    // Check if Google Maps loaded
    setTimeout(() => {
        if (!window.google || !window.google.maps) {
            const status = document.getElementById('status');
            if (status && status.innerText === "Please enter your location above.") {
                status.innerText = "Error: Google Maps API failed to load. Please check your API key and internet connection.";
                status.style.color = "red";
            }
        }
    }, 3000);
});

let activePage = 'home'; // Default to home

function showPage(pageName) {
    activePage = pageName;
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.style.display = 'none');

    const selectedPage = document.getElementById(pageName + '-page');
    if (selectedPage) {
        selectedPage.style.display = 'flex';

        // Trigger resize to fix grey box issues when maps are hidden/shown
        if (pageName === 'home' && map) google.maps.event.trigger(map, 'resize');
        if (pageName === 'hospital' && !hospitalMap) initHospitalPage();
        if (pageName === 'medical' && !medicalMap) initMedicalPage();
        if (pageName === 'vet' && !vetMap) initVetPage();
    }
}

function geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': address }, (results, status) => {
        if (status === 'OK') {
            userLocation = results[0].geometry.location;

            // Show Map
            const mapDiv = document.getElementById("map");
            mapDiv.style.display = "block";
            google.maps.event.trigger(map, 'resize');

            // Update Map
            map.setCenter(userLocation);
            map.setZoom(14); // Zoom in when location is found

            // Show "You are here"
            infoWindow.setPosition(userLocation);
            infoWindow.setContent("You are here");
            infoWindow.open(map);

            new google.maps.Marker({
                map: map,
                position: userLocation,
                title: "Your Location",
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#4285F4", // Blue for user
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "white",
                }
            });

            // Reset other maps so they re-initialize with the new location when visited
            hospitalMap = null;
            medicalMap = null;
            vetMap = null;

            document.getElementById('status').innerText = "Location set: " + address;

            // Refresh current page results (Always Home since input is only there)
            findPlacesStandard(userLocation, 'hospital', map, 'hospital-list', 'status', directionsRenderer, 5);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}

// 1. Initialize Map (Attached to window so HTML callback can find it)
window.initMap = function () {
    console.log("initMap called");
    // Basic options - Default to World View
    const mapOptions = {
        zoom: 2,
        center: { lat: 20, lng: 0 }, // Default center
        mapTypeControl: false,
    };

    map = new google.maps.Map(document.getElementById("map"), mapOptions);

    infoWindow = new google.maps.InfoWindow();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Disable automatic geolocation
    // User must enter location manually
    document.getElementById('status').innerText = "Please enter your location above.";
};

function handleLocationError(browserHasGeolocation, infoWindow, pos, error) {
    let message = browserHasGeolocation
        ? "Error: The Geolocation service failed. Ensure you are using HTTPS."
        : "Error: Your browser doesn't support geolocation.";

    if (error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = "Error: User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                message = "Error: Location information is unavailable.";
                break;
            case error.TIMEOUT:
                message = "Error: The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                message = "Error: An unknown error occurred.";
                break;
        }
    }

    document.getElementById('status').innerText = message;
    infoWindow.setPosition(pos);
    infoWindow.setContent(message);
    infoWindow.open(map);
}

// 3. Standard Places Search (Fixes the object/string errors)
function findPlacesStandard(location, typeOrTypes, mapInstance, listId, statusId, directionsInstance, limit = 5) {
    const request = {
        location: location,
        radius: '5000', // 5km
    };

    if (Array.isArray(typeOrTypes)) {
        request.keyword = typeOrTypes.join(' '); // Use keyword for multiple types/terms
    } else {
        request.type = typeOrTypes;
    }

    const service = new google.maps.places.PlacesService(mapInstance);

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            calculateDistances(location, results, mapInstance, listId, statusId, directionsInstance, limit);
        } else {
            document.getElementById(statusId).innerText = "No locations found or API Error.";
            console.error("Places Search failed:", status);
        }
    });
}

function calculateDistances(origin, places, mapInstance, listId, statusId, directionsInstance, limit) {
    const destinations = places.map(p => p.geometry.location);
    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
        {
            origins: [origin],
            destinations: destinations,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status !== "OK" || !response) {
                console.warn("Distance Matrix failed or not available:", status);
                // Fallback: Display places without distance info
                const fallbackPlaces = places.slice(0, limit).map(place => ({
                    name: place.name,
                    location: place.geometry.location,
                    address: place.vicinity,
                    distanceText: "N/A",
                    distanceValue: 0, // Cannot sort by distance effectively
                    durationText: "N/A"
                }));
                displayPlaces(fallbackPlaces, mapInstance, listId, statusId, directionsInstance);
                return;
            }

            const row = response.rows[0];
            const placeData = places.map((place, i) => {
                let distText = "N/A";
                let distVal = 99999999;
                let durText = "N/A";

                if (row.elements[i] && row.elements[i].status === "OK") {
                    distText = row.elements[i].distance.text;
                    distVal = row.elements[i].distance.value;
                    durText = row.elements[i].duration.text;
                }

                return {
                    name: place.name,
                    location: place.geometry.location,
                    address: place.vicinity,
                    distanceText: distText,
                    distanceValue: distVal,
                    durationText: durText
                };
            });

            // Sort by Distance
            placeData.sort((a, b) => a.distanceValue - b.distanceValue);
            const topPlaces = placeData.slice(0, limit);

            displayPlaces(topPlaces, mapInstance, listId, statusId, directionsInstance);
        }
    );
}

function displayPlaces(places, mapInstance, listId, statusId, directionsInstance) {
    const list = document.getElementById(listId);
    const status = document.getElementById(statusId);

    list.innerHTML = '';
    status.innerText = `Found ${places.length} nearest locations:`;

    const bounds = new google.maps.LatLngBounds();
    if (userLocation) {
        bounds.extend(userLocation);
    }

    places.forEach((place, index) => {
        const li = document.createElement('li');
        li.className = 'hospital-item';

        // Create unique IDs for route elements
        const routeInfoId = `route-info-${listId}-${index}`;
        const distId = `dist-${listId}-${index}`;
        const durId = `dur-${listId}-${index}`;
        const stepsId = `steps-${listId}-${index}`;

        li.innerHTML = `
            <div class="hospital-name">${index + 1}. ${place.name}</div>
            <div class="hospital-info">
                📍 ${place.address}<br>
                🚗 ${place.distanceText} (${place.durationText})
            </div>
            <div class="route-info" id="${routeInfoId}" style="display: none;">
                <div class="route-details">
                    <h4>Route Details:</h4>
                    <p><strong>Distance:</strong> <span id="${distId}">-</span></p>
                    <p><strong>Duration:</strong> <span id="${durId}">-</span></p>
                    <div id="${stepsId}" class="route-steps"></div>
                </div>
            </div>
        `;

        li.addEventListener('click', () => {
            getRoute(userLocation, place.location, directionsInstance, routeInfoId, distId, durId, stepsId, listId);
        });

        list.appendChild(li);

        new google.maps.Marker({
            map: mapInstance,
            position: place.location,
            title: place.name,
            label: (index + 1).toString()
        });

        bounds.extend(place.location);
    });

    // Fit bounds to show all markers
    if (places.length > 0) {
        mapInstance.fitBounds(bounds);
    }
}

function getRoute(origin, destination, directionsInstance, infoId, distId, durId, stepsId, listId) {
    directionsService.route(
        {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === "OK") {
                directionsInstance.setDirections(response);

                const leg = response.routes[0].legs[0];

                document.getElementById(distId).textContent = leg.distance.text;
                document.getElementById(durId).textContent = leg.duration.text;

                let stepsHTML = '<ol class="direction-steps">';
                leg.steps.forEach((step) => {
                    stepsHTML += `<li>${step.instructions} <small>(${step.distance.text})</small></li>`;
                });
                stepsHTML += '</ol>';
                document.getElementById(stepsId).innerHTML = stepsHTML;

                // Show this route info, hide others
                document.querySelectorAll(`#${listId} .route-info`).forEach(el => el.style.display = 'none');
                document.getElementById(infoId).style.display = 'block';
            } else {
                alert("Directions request failed: " + status);
            }
        }
    );
}

// Page Specific Initializers
function initHospitalPage() {
    if (!userLocation) return;

    const mapDiv = document.getElementById("hospital-map");
    mapDiv.style.display = "block";

    hospitalMap = new google.maps.Map(mapDiv, {
        center: userLocation,
        zoom: 14,
        mapTypeControl: false
    });

    hospitalDirections = new google.maps.DirectionsRenderer();
    hospitalDirections.setMap(hospitalMap);

    // Add user marker
    new google.maps.Marker({
        position: userLocation, map: hospitalMap,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
    });

    findPlacesStandard(userLocation, 'hospital', hospitalMap, 'hospital-list-page', 'hospital-status', hospitalDirections, 5);
}

function initMedicalPage() {
    if (!userLocation) return;

    const mapDiv = document.getElementById("medical-map");
    mapDiv.style.display = "block";

    medicalMap = new google.maps.Map(mapDiv, {
        center: userLocation,
        zoom: 14,
        mapTypeControl: false
    });

    medicalDirections = new google.maps.DirectionsRenderer();
    medicalDirections.setMap(medicalMap);

    new google.maps.Marker({
        position: userLocation, map: medicalMap,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
    });

    findPlacesStandard(userLocation, ['doctor', 'health'], medicalMap, 'medical-list', 'medical-status', medicalDirections, 5);
}

function initVetPage() {
    if (!userLocation) return;

    const mapDiv = document.getElementById("vet-map");
    mapDiv.style.display = "block";

    vetMap = new google.maps.Map(mapDiv, {
        center: userLocation,
        zoom: 14,
        mapTypeControl: false
    });

    vetDirections = new google.maps.DirectionsRenderer();
    vetDirections.setMap(vetMap);

    new google.maps.Marker({
        position: userLocation, map: vetMap,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" }
    });

    findPlacesStandard(userLocation, 'veterinary_care', vetMap, 'vet-list', 'vet-status', vetDirections, 5);
}