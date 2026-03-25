let map, infoWindow, tempMarkers = [], selectedLatLng = null, curPanel = null;
const miniMaps = {};

// -----------------------------------------------------
// Google Maps Initialization
// -----------------------------------------------------

/**
 * Initializes the Google Map, attempts to get user's location, and sets up click listener for creating new porta potty entries.
 * If geolocation is denied or unavailable, it defaults to a center of the US.
 * Clicking on the map opens a sidebar for creating a new porta potty at the clicked location.
 */
async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
    "marker",
  );
  
  // Start with a default center in case location is denied
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.8283, lng: -98.5795 }, // center of US
    zoom: 4,
    mapId: "porta-potty-map",
    mapTypeId: "roadmap",
    disableDefaultUI: true,
  });
  infoWindow = new google.maps.InfoWindow();

  // Automatically try to get location on load
  // TODO: add a check for access to user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        map.setCenter(pos);
        map.setZoom(18);
        infoWindow.setPosition(pos);
        infoWindow.setContent("You are here.");
        infoWindow.open(map);
      },
      () => {
        handleLocationError(true, infoWindow, map.getCenter());
      }
    );
  } else {
    handleLocationError(false, infoWindow, map.getCenter());
  }

  loadMarkers();

  // Single click on map to open sidebar for creating new porta potty
  map.addListener("click", (e) => {
    clearTempMarkers();
    updateStars(0);
    openPanel('create', { latLng: e.latLng, map });
  });
}


/**
 * Initializes the mini map for displaying a smaller view of the location.
 * @param {google.maps.LatLng|Object} latLng - The location to center the mini map on.
 * @param {string} containerId - The mini map container element id.
 */
function initMiniMap(latLng, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!miniMaps[containerId]) {
    miniMaps[containerId] = new google.maps.Map(container, {
      center: latLng,
      zoom: 16,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true,
      gestureHandling: 'none',
      keyboardShortcuts: false,
      scrollwheel: false,
      mapId: 'sidebar-map',
      mapTypeId: 'hybrid',
    });
  } else {
    miniMaps[containerId].setCenter(latLng);
    miniMaps[containerId].setZoom(16);
  }

  const miniMarker = new google.maps.marker.AdvancedMarkerElement({
    position: latLng,
    map: miniMaps[containerId],
  });
  tempMarkers.push(miniMarker);
}


/**
 * Handles location errors by displaying an appropriate error message in the info window.
 * @param {boolean} browserHasGeolocation - Indicates if the browser supports geolocation.
 * @param {google.maps.InfoWindow} infoWindow - The info window to display the error message.
 * @param {google.maps.LatLng} pos - The position where the error occurred.
 */
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation.",
  );
  infoWindow.open(map);
}


// Initialize the map after the page has loaded
window.initMap = initMap;

async function loadGoogleMapsScript() {
  const response = await fetch('http://localhost:3000/api/config/maps-key');

  if (!response.ok) {
    throw new Error('Failed to load Google Maps API key from server config endpoint.');
  }

  const { key } = await response.json();

  if (!key) {
    throw new Error('Google Maps API key was not provided by server.');
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=initMap&loading=async`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

loadGoogleMapsScript().catch((error) => {
  console.error(error);
  alert('Unable to load Google Maps. Please try again later.');
});



// -----------------------------------------------------
// Marker Creation and Management
// -----------------------------------------------------

/**
 * Creates a marker for a given porta potty object and adds a click listener for viewing/editing.
 * @param {Object} portaPotty - The porta potty object containing location data.
 * @returns {google.maps.marker.AdvancedMarkerElement} The created marker.
 */
function createMarker(portaPotty) {  
  const lat = parseFloat(portaPotty.latitude);
  const lng = parseFloat(portaPotty.longitude);

  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: { lat, lng },
    map: map,
    gmpClickable: true,
  });

  marker.portaPottyData = portaPotty;

  // Add click listener for viewing/editing
  marker.addEventListener('gmp-click', () => {
    const data = marker.portaPottyData;
    openPanel('view', { portaPotty: data });
  });
  
  return marker;
}


/**
 * Fetches all porta potties from the backend API and creates clickable markers for each on the map.
 */
async function loadMarkers() {
  const response = await fetch('http://localhost:3000/api/porta-potties');
  const portaPotties = await response.json();
  console.log('Fetched porta potties:', portaPotties);
  portaPotties.forEach(p => createMarker(p));
}


/**
 * Clears temporary markers from the map and resets the tempMarkers array.
 */
function clearTempMarkers() {
  tempMarkers.forEach(marker => marker.map = null);
  tempMarkers = [];
}



// -----------------------------------------------------
// Sidebar/Panel Management
// -----------------------------------------------------

/**
 * Opens a panel in the sidebar.
 * @param {string} type - The type of panel to open.
 * @param {Object} data - The data to populate the panel with.
 * @returns {void}
 */
function openPanel(type, data = {}) {
  const sidebar = document.getElementById('sidebar');

  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

  if (curPanel === type) {
    sidebar.classList.remove('open');
    curPanel = null;
    return;
  }

  // Panel-specific setup before opening
  if (type === 'create') {
    const { latLng, map } = data;
    clearTempMarkers();
    selectedLatLng = latLng;
    tempMarkers.push(new google.maps.marker.AdvancedMarkerElement({ position: latLng, map }));
    map.panTo(latLng);
    initMiniMap(latLng, 'miniMap-create');
  }

  if (type === 'view') {
    const { portaPotty } = data;
    clearTempMarkers();

    const latLng = {
      lat: parseFloat(portaPotty.latitude),
      lng: parseFloat(portaPotty.longitude)
    };

    map.panTo(latLng);
    initMiniMap(latLng, 'miniMap-view');

    document.getElementById('view_porta_potty_name').value        = portaPotty.name;
    document.getElementById('view_porta_potty_description').value = portaPotty.description;
    document.getElementById('view_porta_potty_rating').value      = portaPotty.rating;
    updateStars(portaPotty.rating);
    document.getElementById('view_porta_potty_private').checked          = portaPotty.isPrivate === 1;
    document.getElementById('view_porta_potty_accessible').checked       = portaPotty.isAccessible === 1;
    document.getElementById('view_porta_potty_womens_products').checked  = portaPotty.hasWomensProducts === 1;

    const canEdit = portaPotty.createdBy === 1;
    document.getElementById('editPortaPottyBtn').style.display   = canEdit ? 'block' : 'none';
    document.getElementById('deletePortaPottyBtn').style.display = canEdit ? 'block' : 'none';
  }

  sidebar.classList.add('open');
  setTimeout(() => {
    document.getElementById('panel-' + type).classList.add('active');
  }, curPanel ? 0 : 10);

  curPanel = type;
}


/**
 * Closes the sidebar panel and resets the current panel state.
 * This function is called when the close button is clicked on any panel.
 */
function closePanel() {
  document.getElementById('sidebar').classList.remove('open');
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  curPanel = null;
}

document.querySelectorAll(".btn-close").forEach(btn => {
  btn.addEventListener("click", closePanel);
});



// -----------------------------------------------------
// API Calls
// -----------------------------------------------------

/**
 * Handles form submission for creating a new porta potty.
 * Validates input, sends data to backend, and updates the map with the new location.
 */
const createPortaPottyForm = document.getElementById('createPortaPottyForm');
createPortaPottyForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const portaName = document.getElementById('porta_potty_name').value.trim();
  if (!portaName) {
    alert('Please enter a name for the porta potty.');
    return;
  }
  const latitude = selectedLatLng.lat();
  const longitude = selectedLatLng.lng();
  const description = document.getElementById('porta_potty_description').value;
  const rating = document.getElementById('porta_potty_rating').value;
  const isPrivate = document.getElementById('porta_potty_private').checked ? 1 : 0;
  const isAccessible = document.getElementById('porta_potty_accessible').checked ? 1 : 0;
  const hasWomensProducts = document.getElementById('porta_potty_womens_products').checked ? 1 : 0;
  const createdBy = 1; // Placeholder user ID
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  try {
    const response = await fetch('http://localhost:3000/api/porta-potties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: portaName,
        latitude,
        longitude,
        description,
        rating,
        isPrivate,
        isAccessible,
        hasWomensProducts,
        createdBy,
        createdAt
      }),
    });

    if (response.ok) {
      const newPortaPotty = await response.json();
      createMarker(newPortaPotty);
      clearTempMarkers();
      closePanel();
    } else {
      alert('Failed to create porta potty. Please try again.');
    }
  } catch (error) {
    console.error('Error creating porta potty:', error);
    alert('Network error. Please try again later.');
  }
});



// -----------------------------------------------------
// Star Rating Logic
// -----------------------------------------------------

const stars = document.querySelectorAll('#star-rating .star');
const ratingInput = document.getElementById('porta_potty_rating');


stars.forEach(star => {
  // Click to set rating
  star.addEventListener('click', () => {
    const value = parseInt(star.dataset.value);
    ratingInput.value = value;
    updateStars(value);
  });

  // Hover to preview
  star.addEventListener('mouseover', () => {
    updateStars(parseInt(star.dataset.value));
  });

  // Reset to selected on mouse out
  star.addEventListener('mouseout', () => {
    updateStars(parseInt(ratingInput.value));
  });
});


/**
 * Updates the star icons based on the current rating value.
 * Stars with a value less than or equal to the rating are filled, while others are empty.
 * @param {number} rating - The current rating value to display.
 */
function updateStars(rating) {
  stars.forEach(star => {
    const val = parseInt(star.dataset.value);
    star.classList.toggle('bi-star-fill', val <= rating); // filled
    star.classList.toggle('bi-star', val > rating);       // empty
  });
}