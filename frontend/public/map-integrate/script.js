// Global variables
let map;
let markers = [];
let currentLocation = null;
let isSatelliteView = false;
let satelliteLayer;

// Jharkhand tourist places data with Wikipedia information
const locations = [
    {
        id: 'ranchi-hill',
        name: 'Ranchi Hill',
        city: 'Ranchi',
        coordinates: [23.3441, 85.3096],
        description: 'Ranchi Hill is a popular tourist destination in the capital city of Jharkhand. It offers panoramic views of the city and houses the famous Pahari Mandir (Hill Temple) dedicated to Lord Shiva.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Ranchi',
        facts: {
            'Height': '2,140 ft (650 m)',
            'Temple': 'Pahari Mandir',
            'Best time to visit': 'October to March',
            'Attraction': 'City view and religious significance'
        }
    },
    {
        id: 'dassam-falls',
        name: 'Dassam Falls',
        city: 'Ranchi',
        coordinates: [23.3441, 85.3096],
        description: 'Dassam Falls is a beautiful waterfall located near Ranchi. The falls cascade down from a height of about 44 meters, creating a spectacular sight especially during the monsoon season.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Dassam_Falls',
        facts: {
            'Height': '44 m (144 ft)',
            'Type': 'Cascade waterfall',
            'Best time': 'July to October',
            'Nearby': 'Tata Steel Zoological Park'
        }
    },
    {
        id: 'hudru-falls',
        name: 'Hundru Falls',
        city: 'Ranchi',
        coordinates: [23.3441, 85.3096],
        description: 'Hundru Falls is one of the most spectacular waterfalls in Jharkhand, formed by the Subarnarekha River. It cascades down from a height of about 98 meters, creating a magnificent natural spectacle.',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Hundru_Falls',
        facts: {
            'Height': '98 m (322 ft)',
            'River': 'Subarnarekha',
            'Best time': 'July to September',
            'Type': 'Plunge waterfall'
        }
    },
    {
        id: 'jonha-falls',
        name: 'Jonha Falls',
        city: 'Ranchi',
        coordinates: [23.3441, 85.3096],
        description: 'Jonha Falls, also known as Gautamdhara, is a beautiful waterfall located near Ranchi. It is formed by the Gunga River and is surrounded by lush green forests.',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb2dcc?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Jonha_Falls',
        facts: {
            'Height': '43 m (141 ft)',
            'River': 'Gunga River',
            'Also known as': 'Gautamdhara',
            'Best time': 'July to October'
        }
    },
    {
        id: 'patratu-valley',
        name: 'Patratu Valley',
        city: 'Ranchi',
        coordinates: [23.3441, 85.3096],
        description: 'Patratu Valley is a scenic valley located near Ranchi, known for its beautiful landscapes, dam, and the Patratu Thermal Power Station. It offers boating facilities and beautiful views.',
        image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Patratu',
        facts: {
            'Attraction': 'Patratu Dam',
            'Activities': 'Boating, Picnic',
            'Best time': 'October to March',
            'Distance from Ranchi': '40 km'
        }
    },
    {
        id: 'netarhat',
        name: 'Netarhat',
        city: 'Latehar',
        coordinates: [23.4667, 84.2667],
        description: 'Netarhat is a beautiful hill station in Jharkhand, often called the "Queen of Chotanagpur". It is known for its pleasant climate, scenic beauty, and the famous Netarhat Sunrise Point.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Netarhat',
        facts: {
            'Altitude': '1,128 m (3,701 ft)',
            'Nickname': 'Queen of Chotanagpur',
            'Famous for': 'Sunrise Point',
            'Best time': 'October to March'
        }
    },
    {
        id: 'betla-national-park',
        name: 'Betla National Park',
        city: 'Palamu',
        coordinates: [23.9167, 84.0833],
        description: 'Betla National Park is one of the first national parks in India to become a tiger reserve. It is home to diverse wildlife including tigers, elephants, leopards, and various bird species.',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Betla_National_Park',
        facts: {
            'Established': '1974',
            'Area': '1,026 km²',
            'Wildlife': 'Tigers, Elephants, Leopards',
            'Best time': 'October to June'
        }
    },
    {
        id: 'hazaribagh-national-park',
        name: 'Hazaribagh National Park',
        city: 'Hazaribagh',
        coordinates: [23.9833, 85.3500],
        description: 'Hazaribagh National Park is a wildlife sanctuary known for its diverse flora and fauna. It offers opportunities for wildlife spotting and nature walks in a serene environment.',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Hazaribagh_National_Park',
        facts: {
            'Established': '1954',
            'Area': '184 km²',
            'Wildlife': 'Spotted deer, Wild boar, Leopards',
            'Activities': 'Wildlife safari, Nature walks'
        }
    },
    {
        id: 'deoghar',
        name: 'Deoghar (Baidyanath Dham)',
        city: 'Deoghar',
        coordinates: [24.4833, 86.7000],
        description: 'Deoghar is a major pilgrimage center in Jharkhand, famous for the Baidyanath Dham temple dedicated to Lord Shiva. It is one of the twelve Jyotirlingas and attracts millions of devotees.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Deoghar',
        facts: {
            'Temple': 'Baidyanath Dham',
            'Significance': 'One of 12 Jyotirlingas',
            'Festival': 'Shravan Mela',
            'Best time': 'July to August (Shravan)'
        }
    },
    {
        id: 'giridih',
        name: 'Giridih',
        city: 'Giridih',
        coordinates: [24.1833, 86.3000],
        description: 'Giridih is known for its beautiful landscapes and the famous Parasnath Hill, which is a sacred Jain pilgrimage site. It offers scenic views and spiritual significance.',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Giridih',
        facts: {
            'Famous for': 'Parasnath Hill',
            'Height': '1,365 m (4,478 ft)',
            'Significance': 'Jain pilgrimage site',
            'Temples': '20 Jain temples'
        }
    },
    {
        id: 'jamshedpur',
        name: 'Jamshedpur (Tata Steel City)',
        city: 'Jamshedpur',
        coordinates: [22.8000, 86.1833],
        description: 'Jamshedpur is the industrial capital of Jharkhand, founded by Jamsetji Tata. It is known for its well-planned city layout, Tata Steel plant, and various tourist attractions.',
        image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Jamshedpur',
        facts: {
            'Founded': '1919',
            'Founder': 'Jamsetji Tata',
            'Nickname': 'Steel City',
            'Attractions': 'Tata Steel Zoological Park, Jubilee Park'
        }
    },
    {
        id: 'bokaro',
        name: 'Bokaro Steel City',
        city: 'Bokaro',
        coordinates: [23.6667, 86.1500],
        description: 'Bokaro is known for the Bokaro Steel Plant, one of India\'s largest steel plants. The city offers modern amenities and is surrounded by beautiful landscapes.',
        image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Bokaro',
        facts: {
            'Famous for': 'Bokaro Steel Plant',
            'Established': '1964',
            'Type': 'Industrial city',
            'Attractions': 'City Park, Steel Plant tours'
        }
    },
    {
        id: 'dhanbad',
        name: 'Dhanbad (Coal Capital)',
        city: 'Dhanbad',
        coordinates: [23.8000, 86.4500],
        description: 'Dhanbad is known as the coal capital of India. It is home to the Indian School of Mines and offers various tourist attractions including parks and cultural sites.',
        image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Dhanbad',
        facts: {
            'Nickname': 'Coal Capital of India',
            'Famous for': 'Coal mining',
            'Institution': 'Indian School of Mines',
            'Attractions': 'Topchanchi Lake, Maithon Dam'
        }
    },
    {
        id: 'chandil',
        name: 'Chandil',
        city: 'Saraikela-Kharsawan',
        coordinates: [22.9667, 86.0500],
        description: 'Chandil is famous for its beautiful dam and lake, offering scenic views and water sports activities. It is a popular picnic spot and weekend destination.',
        image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Chandil',
        facts: {
            'Famous for': 'Chandil Dam',
            'Activities': 'Boating, Water sports',
            'Best time': 'October to March',
            'Type': 'Picnic spot'
        }
    },
    {
        id: 'maithon-dam',
        name: 'Maithon Dam',
        city: 'Dhanbad',
        coordinates: [23.8000, 86.4500],
        description: 'Maithon Dam is a beautiful dam built on the Barakar River. It offers scenic views, boating facilities, and is surrounded by lush green hills.',
        image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=400&fit=crop&crop=center',
        wikipediaUrl: 'https://en.wikipedia.org/wiki/Maithon_Dam',
        facts: {
            'River': 'Barakar River',
            'Height': '50 m (164 ft)',
            'Activities': 'Boating, Picnic',
            'Best time': 'October to March'
        }
    }
];

// Initialize the map
function initMap() {
    // Create map centered on Jharkhand
    map = L.map('map').setView([23.6102, 85.2799], 7);

    // Add OpenStreetMap tile layer
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });

    // Add satellite layer
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
    });

    // Add default layer
    osmLayer.addTo(map);

    // Add markers for each location
    addLocationMarkers();
    
    // Populate location list
    populateLocationList();
    
    // Add event listeners
    setupEventListeners();
}

// Add markers to the map
function addLocationMarkers() {
    locations.forEach(location => {
        const marker = L.marker(location.coordinates, {
            title: location.name
        }).addTo(map);

        // Add popup to marker
        marker.bindPopup(`
            <div style="text-align: center;">
                <h4 style="margin: 0 0 10px 0; color: #333;">${location.name}</h4>
                <p style="margin: 0; color: #666; font-size: 14px;">${location.city}</p>
            </div>
        `);

        // Add click event to marker
        marker.on('click', () => {
            showLocationDetails(location);
        });

        markers.push(marker);
    });
}

// Populate the location list
function populateLocationList() {
    const locationList = document.getElementById('locationList');
    
    locations.forEach(location => {
        const locationItem = document.createElement('div');
        locationItem.className = 'location-item';
        locationItem.innerHTML = `
            <h4>${location.name}</h4>
            <p>${location.city}</p>
        `;
        
        locationItem.addEventListener('click', () => {
            showLocationDetails(location);
            // Center map on location
            map.setView(location.coordinates, 12);
        });
        
        locationList.appendChild(locationItem);
    });
}

// Show location details
function showLocationDetails(location) {
    currentLocation = location;
    
    // Update active location in list
    document.querySelectorAll('.location-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the clicked location
    const locationItems = document.querySelectorAll('.location-item');
    const locationIndex = locations.findIndex(loc => loc.id === location.id);
    if (locationItems[locationIndex]) {
        locationItems[locationIndex].classList.add('active');
    }
    
    // Show location details
    const detailsContainer = document.getElementById('locationDetails');
    detailsContainer.innerHTML = `
        <div class="location-card active">
            <div class="image-container">
                <img src="${location.image}" alt="${location.name}" class="location-image" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/400x200/6495ed/FFFFFF?text=${encodeURIComponent(location.name)}';"
                     onload="this.style.opacity='1'; this.parentElement.querySelector('.image-loading').style.display='none';">
                <div class="image-loading">
                    <i class="fas fa-spinner fa-spin"></i> Loading...
                </div>
            </div>
            <h2 class="location-title">
                <i class="fas fa-map-marker-alt"></i>
                ${location.name}
            </h2>
            <p class="location-country">
                <i class="fas fa-city"></i>
                ${location.city}, Jharkhand
            </p>
            <p class="location-description">${location.description}</p>
            
            <div class="location-facts">
                <h4><i class="fas fa-info-circle"></i> Quick Facts</h4>
                ${Object.entries(location.facts).map(([key, value]) => `
                    <div class="fact-item">
                        <span class="fact-label">${key}:</span>
                        <span class="fact-value">${value}</span>
                    </div>
                `).join('')}
            </div>
            
            <a href="${location.wikipediaUrl}" target="_blank" class="wikipedia-link">
                <i class="fab fa-wikipedia-w"></i>
                Read more on Wikipedia
            </a>
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Reset view button
    document.getElementById('resetView').addEventListener('click', () => {
        map.setView([23.6102, 85.2799], 7);
        map.removeLayer(satelliteLayer);
        isSatelliteView = false;
        
        // Clear active location
        currentLocation = null;
        document.querySelectorAll('.location-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show welcome message
        document.getElementById('locationDetails').innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Welcome to Jharkhand</h3>
                <p>Click on a location marker or select from the list to learn more about beautiful tourist places in Jharkhand.</p>
            </div>
        `;
    });
    
    // Toggle satellite view
    document.getElementById('toggleLayer').addEventListener('click', () => {
        if (isSatelliteView) {
            map.removeLayer(satelliteLayer);
            map.addLayer(L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }));
            isSatelliteView = false;
            document.getElementById('toggleLayer').innerHTML = '<i class="fas fa-layer-group"></i> Satellite';
        } else {
            map.eachLayer(layer => {
                if (layer instanceof L.TileLayer) {
                    map.removeLayer(layer);
                }
            });
            satelliteLayer.addTo(map);
            isSatelliteView = true;
            document.getElementById('toggleLayer').innerHTML = '<i class="fas fa-map"></i> Map';
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});