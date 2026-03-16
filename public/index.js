let map, infoWindow, createPortaPottyModal;

document.addEventListener('DOMContentLoaded', () => {
  createPortaPottyModal = new bootstrap.Modal(document.getElementById('createPortaPottyModal'));
});

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
    "marker",
  );
  
  // Start with a default center in case location is denied
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.8283, lng: -98.5795 }, // center of US
    zoom: 4,
    mapId: "DEMO_MAP_ID",
    mapTypeId: "hybrid",
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
        map.setZoom(20);
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
    classModal.show();
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
  new google.maps.marker.AdvancedMarkerElement({
    position: latLng,
    map: map,
  });
  map.panTo(latLng);
}

window.initMap = initMap;

const script = document.createElement("script");
script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&callback=initMap&loading=async`;
script.async = true;
script.defer = true;
document.head.appendChild(script);

// Get all porta potties
const response = await fetch('http://localhost:3306/api/porta-potties');
const data = await response.json();

// Add a porta potty
await fetch('http://localhost:3306/api/porta-potties', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: portaName, latitude, longitude, description, createdBy })
});