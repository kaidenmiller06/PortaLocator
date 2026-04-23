let map, infoWindow, AdvancedMarkerElement, PinElement;

const portaPottyMarkers = new Map();
let tempMarkers = [];

let currentUser = null;

let originalPortaPotty = {}, selectedLatLng = null, curPanel = null;

let currentVote = null, currentPortaPottyId = null;



// -----------------------------------------------------
// User Authentication State
// -----------------------------------------------------

/**
 * Fetches the current authenticated user from the backend API and stores it in the `currentUser` variable.
 */
async function loadCurrentUser() {
  const [userRes, countRes, votesRes] = await Promise.all([
    fetch('/api/me'),
    fetch('/api/porta-potties/count'),
    fetch('/api/votes/count')
  ]);

  if (userRes.ok) {
    const [user, countData, votesData] = await Promise.all([
      userRes.json(),
      countRes.ok ? countRes.json() : Promise.resolve(null),
      votesRes.ok ? votesRes.json() : Promise.resolve(null)
    ]);

    currentUser = {
      ...user,
      portaPottyCount: countData?.[0]?.count ?? 0,
      voteCount: votesData?.[0]?.count ?? 0
    };
  }
}

loadCurrentUser();



// -----------------------------------------------------
// Google Maps Initialization
// -----------------------------------------------------

const miniMaps = {};

/**
 * Initializes the Google Map, attempts to get user's location, and sets up click listener for creating new porta potty entries.
 * If geolocation is denied or unavailable, it defaults to a center of the US.
 * Clicking on the map opens a sidebar for creating a new porta potty at the clicked location.
 */
async function initMap(theme = 'light') {
  const { Map } = await google.maps.importLibrary("maps");

  const markerLib = await google.maps.importLibrary("marker");
  AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
  PinElement = markerLib.PinElement;

  const { ColorScheme } = await google.maps.importLibrary("core")
  
  // Start with a default center in case location is denied
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 39.8283, lng: -98.5795 }, // center of US
    zoom: 4,
    mapId: "porta-potty-map",
    mapTypeId: "roadmap",
    disableDefaultUI: true,
    clickableIcons: false,
    colorScheme: theme === 'dark' 
      ? ColorScheme.DARK 
      : ColorScheme.LIGHT,
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
        infoWindow.setContent('<div style="color: #000000;">You are here.</div>');
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
    if (curPanel !== 'create') {
      clearFields();
    }
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

  const miniMarker = new AdvancedMarkerElement({
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


/**
 * Initializes the application by fetching the Google Maps API key and user theme
 * in parallel, applying the theme, dynamically loading the Maps script, and
 * initializing the map once the API is ready.
 * @returns {Promise<void>}
 */
async function init() {
  const [configRes, themeRes] = await Promise.all([
    fetch('/api/config/maps-key'),
    fetch('/api/user/theme')
  ]);

  const { key } = await configRes.json();
  const { theme } = await themeRes.json();

  document.body.setAttribute('data-bs-theme', theme);

  if (!key) throw new Error('Google Maps API key was not provided by server.');

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  // Poll until google.maps.importLibrary is available
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.google && google.maps && typeof google.maps.importLibrary === 'function') {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });

  await initMap(theme);

  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
}

init().catch((error) => {
  console.error(error);
  alert('Unable to load Google Maps. Please try again later.');
});



// -----------------------------------------------------
// Marker Creation and Management
// -----------------------------------------------------

/**
 * Creates a marker for a given porta potty object and adds a click listener for viewing/editing.
 * @param {Object} portaPotty - The porta potty object containing location data.
 * @returns {AdvancedMarkerElement} The created marker.
 */
function createMarker(portaPotty) {  
  const markerId = Number(portaPotty.id);

  // Replace any existing marker for the same porta potty id.
  if (portaPottyMarkers.has(markerId)) {
    portaPottyMarkers.get(markerId).map = null;
    portaPottyMarkers.delete(markerId);
  }

  const lat = parseFloat(portaPotty.latitude);
  const lng = parseFloat(portaPotty.longitude);

  const pin = new PinElement({
    glyphColor: '#084298',
    background: '#0d6efd',
    borderColor: '#084298',
    scale: 1.25,
  });

  const marker = new AdvancedMarkerElement({
    position: { lat, lng },
    map: map,
    gmpClickable: true,
    content: pin,
  });

  marker.portaPottyData = portaPotty;
  portaPottyMarkers.set(markerId, marker);

  // Add click listener for viewing/editing
  marker.addEventListener('gmp-click', () => {
    const data = marker.portaPottyData;
    openPanel('view', { portaPotty: data });
  });
  
  return marker;
}


/**
 * Deletes a marker for a given porta potty ID.
 * @param {number} portaPottyId - The ID of the porta potty for which to delete the marker.
 */
function deleteMarker(portaPottyId) {
  if (portaPottyMarkers.has(portaPottyId)) {
    portaPottyMarkers.get(portaPottyId).map = null;
    portaPottyMarkers.delete(portaPottyId);
  }
}


/**
 * Fetches all porta potties from the backend API and creates clickable markers for each on the map.
 */
async function loadMarkers() {
  const response = await fetch('/api/porta-potties');
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
async function openPanel(type, data = {}) {
  const sidebar = document.getElementById('sidebar');

  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

  if (curPanel === type && type === 'edit') {
    sidebar.classList.remove('open');
    curPanel = null;
    return;
  }

  /**
   * Helper: open sidebar, wait for 50 ms, then run callback
   */ 
  const afterSidebarOpen = (callback) => {
    if (sidebar.classList.contains('open')) {
      callback();
    } else {
      sidebar.classList.add('open');
      setTimeout(callback, 50);
    }
  };


  // -----------------------------------------------------
  // Open create panel with map click location
  // -----------------------------------------------------
  if (type === 'create') {
    const { latLng, map } = data;
    clearTempMarkers();
    selectedLatLng = { lat: latLng.lat(), lng: latLng.lng() };
    tempMarkers.push(new AdvancedMarkerElement({
      position: latLng,
      map,
      content: new PinElement({ scale: 1.25 })
    }));

    afterSidebarOpen(() => {
      map.panTo(latLng);
      map.setZoom(18);
      initMiniMap(latLng, 'miniMap-create');
    });
  }


  // -----------------------------------------------------
  // Open view panel with porta potty data
  // -----------------------------------------------------
  if (type === 'view') {
    const { portaPotty } = data;
    const voteRes = await fetch(`/api/votes/${portaPotty.id}`);
    const { upvoteCount, userVote } = await voteRes.json();
    currentVote = userVote;
    currentPortaPottyId = portaPotty.id;
    
    clearTempMarkers();

    const latLng = {
      lat: parseFloat(portaPotty.latitude),
      lng: parseFloat(portaPotty.longitude)
    };

    // Populate fields immediately
    document.getElementById('view_porta_potty_name').textContent = portaPotty.name;

    const viewDesc = document.getElementById('view_porta_potty_description');
    viewDesc.textContent = portaPotty.description;
    viewDesc.parentElement.classList.toggle('d-none', !portaPotty.description);

    document.getElementById('view_porta_potty_rating').value = portaPotty.rating;

    updateStars(viewStars, portaPotty.rating);

    // Populate vote count and button states
    voteCount.textContent = upvoteCount;

    upvoteBtn.className = 'bi bi-caret-up-square';
    downvoteBtn.className = 'bi bi-caret-down-square';

    if (userVote === 1) {
      upvoteBtn.className = 'bi bi-caret-up-square-fill';
    } else if (userVote === 0) {
      downvoteBtn.className = 'bi bi-caret-down-square-fill';
    }

    // Show/hide badges based on porta potty attributes
    const fields = [
      { id: 'view_porta_potty_private_badge', value: portaPotty.isPrivate },
      { id: 'view_porta_potty_accessible_badge', value: portaPotty.isAccessible },
      { id: 'view_porta_potty_womens_products_badge', value: portaPotty.hasWomensProducts },
    ];

    fields.forEach(({ id, value }) => {
      document.getElementById(id).classList.toggle('d-none', !value);
    });

    const allFalse = fields.every(({ value }) => !value);
    document.getElementById('view_porta_potty_badges_header').classList.toggle('d-none', allFalse);

    // Only show edit/delete buttons if current user is creator of the porta potty
    const canEdit = portaPotty.createdBy === currentUser.id;

    const editBtn = document.getElementById('editPortaPottyBtn');
    const deleteBtn = document.getElementById('deletePortaPottyBtn');

    editBtn.style.display = canEdit ? 'block' : 'none';
    deleteBtn.style.display = canEdit ? 'block' : 'none';

    if (canEdit) {
      editBtn.onclick = () => openPanel('edit', { portaPotty });
      deleteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this porta potty?')) {
          deletePortaPotty(portaPotty.id);
        }
      };
    }

    afterSidebarOpen(() => {
      map.panTo(latLng);
      map.setZoom(18);
      initMiniMap(latLng, 'miniMap-view');
    });
  }


  // -----------------------------------------------------
  // Open edit panel with porta potty data
  // -----------------------------------------------------
  if (type === 'edit') {
    const { portaPotty } = data;
    clearTempMarkers();

    const latLng = {
      lat: parseFloat(portaPotty.latitude),
      lng: parseFloat(portaPotty.longitude)
    };

    selectedLatLng = latLng;

    // Store original porta potty data for change detection
    originalPortaPotty = {
      name: portaPotty.name,
      description: portaPotty.description,
      rating: portaPotty.rating,
      isPrivate: portaPotty.isPrivate,
      isAccessible: portaPotty.isAccessible,
      hasWomensProducts: portaPotty.hasWomensProducts,
      latitude: portaPotty.latitude,
      longitude: portaPotty.longitude,
    };

    // Populate fields immediately
    document.getElementById('edit_porta_potty').value = portaPotty.id;
    document.getElementById('edit_porta_potty_name').value = portaPotty.name;
    document.getElementById('edit_porta_potty_description').value = portaPotty.description;
    document.getElementById('edit_porta_potty_rating').value = portaPotty.rating;
    updateStars(editStars, portaPotty.rating);
    document.getElementById('edit_porta_potty_private').checked = portaPotty.isPrivate === 1;
    document.getElementById('edit_porta_potty_accessible').checked = portaPotty.isAccessible === 1;
    document.getElementById('edit_porta_potty_womens_products').checked = portaPotty.hasWomensProducts === 1;

    afterSidebarOpen(() => {
      map.panTo(latLng);
      map.setZoom(18);
      initMiniMap(latLng, 'miniMap-edit');
    });
  }


  if (sidebar.classList.contains('open')) {
    sidebar.classList.add('open');
  }

  // Animate panel sliding in from right for view panel and follow default slide in for others
  const panel = document.getElementById('panel-' + type);

  if (type === 'view') {
    // animated slide-in if already on view panel to avoid jitter
    panel.style.transition = 'none';
    panel.style.transform = 'translateX(100%)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.transition = '';
        panel.style.transform = '';
        panel.classList.add('active');
      });
    });
  } else if (type === 'create' && curPanel === 'create') {
    // no animation if already on create panel to avoid jitter
    panel.style.transition = 'none';
    panel.classList.add('active');
    requestAnimationFrame(() => {
      panel.style.transition = '';
    });
  } else {
    setTimeout(() => panel.classList.add('active'), 10);
  }

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
  clearTempMarkers();
}


// Add click listeners to all close buttons in panels
document.querySelectorAll('[data-action="close-panel"]').forEach(btn => {
  btn.addEventListener('click', closePanel);
});


// Back button for edit panel to return to view panel
document.getElementById('editBackBtn').addEventListener('click', async () => {
  const res = await fetch(`/api/porta-potties/${currentPortaPottyId}`);
  const portaPotty = await res.json();
  openPanel('view', { portaPotty });
});


/**
 * * Clears all input fields in the create panel and resets the star rating.
 */
function clearFields() {
  document.getElementById('porta_potty_name').value = '';
  document.getElementById('porta_potty_description').value = '';
  document.getElementById('porta_potty_rating').value = '0';
  updateStars(stars, 0);
  document.getElementById('porta_potty_private').checked = false;
  document.getElementById('porta_potty_accessible').checked = false;
  document.getElementById('porta_potty_womens_products').checked = false;
}



// -----------------------------------------------------
// Modal Management
// -----------------------------------------------------

/**
 * Updates the user profile modal with the current user's information.
 * Attempts to load profile photo image; otherwise, it keeps the default icon visible.
 */
function updateProfileUI() {
  const img = document.getElementById('profile_picture');
  const icon = document.getElementById('profile_picture_icon');
  const name = document.getElementById('profile_name');
  const email = document.getElementById('profile_email');
  const createdAt = document.getElementById('profile_created_at');
  const potties = document.getElementById('profile_porta_potties');
  const votes = document.getElementById('profile_votes');

  // Run if these elements exist on the current page
  if (!name || !email || !potties || !votes || !createdAt) return;

  name.textContent = currentUser?.firstName + ' ' + currentUser?.lastName ?? '';
  email.textContent = currentUser?.email ?? '';
  createdAt.textContent = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '';
  potties.textContent = currentUser?.portaPottyCount ?? '0';
  votes.textContent = currentUser?.voteCount ?? '0';

  if (currentUser.profilePictureUrl) {
    img.src = currentUser.profilePictureUrl;
    img.onload = () => {
      icon.classList.add('d-none');
      img.classList.remove('d-none');
    };
  }
}


// When profile button is clicked, load current user data and update the profile modal UI
document.getElementById('profileBtn').addEventListener('click', async () => {
  await loadCurrentUser();
  updateProfileUI();
});


// Remove focus from modal when clicking off
document.getElementById('profileModal').addEventListener('hide.bs.modal', () => {
  document.activeElement.blur();
});


// Send POST request to logout endpoint, then redirect to homepage
document.getElementById('logoutBtn').addEventListener('click', () => {
  window.location.href = '/logout';
});



// -----------------------------------------------------
// Porta Potty API Calls
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

  const meRes = await fetch('/api/me');
  if (!meRes.ok) {
    alert('You must be logged in to create a porta potty.');
    window.location.href = '/';
    return;
  }
  const user = await meRes.json();

  const latitude = selectedLatLng.lat;
  const longitude = selectedLatLng.lng;
  const description = document.getElementById('porta_potty_description').value;
  const rating = document.getElementById('porta_potty_rating').value;
  const isPrivate = document.getElementById('porta_potty_private').checked ? 1 : 0;
  const isAccessible = document.getElementById('porta_potty_accessible').checked ? 1 : 0;
  const hasWomensProducts = document.getElementById('porta_potty_womens_products').checked ? 1 : 0;
  const createdBy = user.id;
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  try {
    const response = await fetch('/api/porta-potties', {
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


/**
 * Handles form submission for editing a pre-existing porta potty.
 * Validates input, sends data to backend, and updates the map with the new location.
 */
const editPortaPottyForm = document.getElementById('editPortaPottyForm');
editPortaPottyForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  // Validate changes before making API call
  const current = {
    name: document.getElementById('edit_porta_potty_name').value.trim(),
    description: document.getElementById('edit_porta_potty_description').value,
    rating: document.getElementById('edit_porta_potty_rating').value,
    isPrivate: document.getElementById('edit_porta_potty_private').checked ? 1 : 0,
    isAccessible: document.getElementById('edit_porta_potty_accessible').checked ? 1 : 0,
    hasWomensProducts: document.getElementById('edit_porta_potty_womens_products').checked ? 1 : 0,
    latitude: selectedLatLng.lat,
    longitude: selectedLatLng.lng,
  };

  const hasChanged = Object.keys(current).some(key => current[key] != originalPortaPotty[key]);
  if (!hasChanged) {
    alert('No changes detected.');
    return;
  }

  // Get porta potty ID and updated values from form
  const portaPottyId = document.getElementById('edit_porta_potty').value;
  const portaName = document.getElementById('edit_porta_potty_name').value.trim();

  if (!portaName) {
    alert('Please enter a name for the porta potty.');
    return;
  }

  const latitude = selectedLatLng.lat;
  const longitude = selectedLatLng.lng;
  const description = document.getElementById('edit_porta_potty_description').value;
  const rating = document.getElementById('edit_porta_potty_rating').value;
  const isPrivate = document.getElementById('edit_porta_potty_private').checked ? 1 : 0;
  const isAccessible = document.getElementById('edit_porta_potty_accessible').checked ? 1 : 0;
  const hasWomensProducts = document.getElementById('edit_porta_potty_womens_products').checked ? 1 : 0;

  try {
    const response = await fetch('/api/porta-potties/' + portaPottyId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: portaName,
        latitude,
        longitude,
        description,
        rating,
        isPrivate,
        isAccessible,
        hasWomensProducts
      }),
    });

    if (response.ok) {
      const updatedPortaPotty = await response.json();
      const existingPortaPotty = portaPottyMarkers.get(Number(portaPottyId))?.portaPottyData || {};

      // Keep ownership metadata if PUT response omits it.
      createMarker({ ...existingPortaPotty, ...updatedPortaPotty });
      clearTempMarkers();
      closePanel();
    } else {
      alert('Failed to edit porta potty. Please try again.');
    }
  } catch (error) {
    console.error('Error editing porta potty:', error);
    alert('Network error. Please try again later.');
  }
});


/**
 * Deletes a porta potty by ID, removes the marker from the map, and closes the sidebar panel.
 * @param {string} portaPottyId 
 */
async function deletePortaPotty(portaPottyId) {
  try {
    const response = await fetch('/api/porta-potties/' + portaPottyId, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      console.log('Deleted porta potty with ID:', portaPottyId);
      deleteMarker(Number(portaPottyId));
      closePanel();
    } else {
      alert('Failed to delete porta potty. Please try again.');
    }
  } catch (error) {
    console.error('Error deleting porta potty:', error);
    alert('Network error. Please try again later.');
  }
}



// -----------------------------------------------------
// Vote API Calls
// -----------------------------------------------------

const upvoteBtn = document.getElementById('upvoteBtn');
const downvoteBtn = document.getElementById('downvoteBtn');
const voteCount = document.getElementById('voteCount');

document.addEventListener('DOMContentLoaded', () => {
  upvoteBtn.addEventListener('click', () => handleVote(1));
  downvoteBtn.addEventListener('click', () => handleVote(0));
});


/**
 * Handles the vote action for a porta potty.
 * @param {number} voteType - 1 for upvote, 0 for downvote, null for no vote
 */
async function handleVote(voteType) {
  const newVote = currentVote === voteType ? null : voteType;

  if (newVote === null) {
    // Delete existing vote
    await fetch(`/api/votes/${currentPortaPottyId}`, { method: 'DELETE' });
  } else if (currentVote === null) {
    // Create user vote
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voteType: newVote,
        portaPottyId: currentPortaPottyId,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })
    });
  } else {
    // Switching user vote
    await fetch(`/api/votes/${currentPortaPottyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType: newVote })
    });
  }

  currentVote = newVote;

  // Refresh the count from the server to stay in sync
  const voteRes = await fetch(`/api/votes/${currentPortaPottyId}`);
  const { upvoteCount } = await voteRes.json();
  voteCount.textContent = upvoteCount;

  // UI updates based on new vote state
  if (newVote === 1) {
    upvoteBtn.className = 'bi bi-caret-up-square-fill';
    downvoteBtn.className = 'bi bi-caret-down-square';
  } else if (newVote === 0) {
    upvoteBtn.className = 'bi bi-caret-up-square';
    downvoteBtn.className = 'bi bi-caret-down-square-fill';
  } else {
    upvoteBtn.className = 'bi bi-caret-up-square';
    downvoteBtn.className = 'bi bi-caret-down-square';
  }
}



// -----------------------------------------------------
// Star Rating Logic
// -----------------------------------------------------

const stars = document.querySelectorAll('#star-rating .star');
const viewStars = document.querySelectorAll('#view-star-rating .star');
const editStars = document.querySelectorAll('#edit-star-rating .star');

document.addEventListener('DOMContentLoaded', () => {
  initStars(stars, 'porta_potty_rating');
  initStars(viewStars, 'view_porta_potty_rating');
  initStars(editStars, 'edit_porta_potty_rating');
});


/**
 * Initializes the star rating functionality for a given container and input.
 * @param {NodeList} stars - The list of star elements to initialize.
 * @param {string} inputId - The ID of the hidden input field to update.
 */
function initStars(stars, inputId) {
  const ratingInput = document.getElementById(inputId);

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.dataset.value);
      ratingInput.value = value;
      updateStars(stars, value);
    });

    star.addEventListener('mouseover', () => {
      updateStars(stars, parseInt(star.dataset.value));
    });

    star.addEventListener('mouseout', () => {
      updateStars(stars, parseInt(ratingInput.value));
    });
  });
}


/**
 * Updates the star icons based on the current rating value.
 * Stars with a value less than or equal to the rating are filled, while others are empty.
 * @param {NodeList} stars - The list of star elements to update.
 * @param {number} rating - The current rating value to display.
 */
function updateStars(stars, rating) {
  stars.forEach(star => {
    const val = parseInt(star.dataset.value);
    star.classList.toggle('bi-star-fill', val <= rating);
    star.classList.toggle('bi-star', val > rating);
  });
}



// -----------------------------------------------------
// Theme Logic
// -----------------------------------------------------

/**
 * Toggles the website theme between light and dark modes,
 * updates the data attribute on the body,
 * and persists the user's preference to the backend.
 */
async function toggleTheme() {
  closePanel();

  // Toggle the data attribute for immediate UI feedback
  const current = document.body.getAttribute('data-bs-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-bs-theme', next);

  // Re-initialize the map with the new theme
  await initMap(next);

  await fetch('/api/user/theme', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: next })
  });
}