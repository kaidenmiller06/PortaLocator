let map, miniMap, infoWindow, markers = [];

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

  map.addListener("click", (e) => {
    placeMarkerAndPanTo(e.latLng, map);
  });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation.",
  );
  infoWindow.open(map);
}

function placeMarkerAndPanTo(latLng, map) {
  clearMarkers();
  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: latLng,
    map: map,
  });
  markers.push(marker);

  // const offsetLng = latLng.lng() + 0.003;
  // map.panTo({ lat: latLng.lat(), lng: offsetLng });
  map.panTo(latLng);

  openSidebar(latLng);
}

function clearMarkers() {
  markers.forEach(marker => marker.map = null); // removes from map
  markers = [];
}

window.initMap = initMap;

const script = document.createElement("script");
script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&callback=initMap&loading=async`;
script.async = true;
script.defer = true;
document.head.appendChild(script);


// -----------------------------------------------------
// Sidebar Logic
// -----------------------------------------------------

const sidebar = document.getElementById('createPortaPottySidebar');

// Open sidebar
function openSidebar(latLng) {
  resetSidebar();
  sidebar.style.right = '25vw';

  // Initialize or re-center the mini map
  if (!miniMap) {
    miniMap = new google.maps.Map(document.getElementById('miniMap'), {
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
    miniMap.setCenter(latLng);
  }

  // Add a marker at the clicked spot
  const miniMarker = new google.maps.marker.AdvancedMarkerElement({
    position: latLng,
    map: miniMap,
  });
  markers.push(miniMarker);
}

// Close sidebar
function closeSidebar() {
  sidebar.style.right = '0px';
  clearMarkers();
}

function resetSidebar() {
  document.getElementById('createPortaPottyForm').reset();
  updateStars(0);
}

document.getElementById('closeSidebar').addEventListener('click', closeSidebar);


// form.addEventListener('submit', (e) => {
//   e.preventDefault();
//   // save logic...
//   closeSidebar();
// });


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

function updateStars(rating) {
  stars.forEach(star => {
    const val = parseInt(star.dataset.value);
    star.classList.toggle('bi-star-fill', val <= rating); // filled
    star.classList.toggle('bi-star', val > rating);       // empty
  });
}


// Get all porta potties
const response = await fetch('http://localhost:3306/api/porta-potties');
const data = await response.json();

// Add a porta potty
await fetch('http://localhost:3306/api/porta-potties', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: portaName, latitude, longitude, description, createdBy })
});