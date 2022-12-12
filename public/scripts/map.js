mapboxgl.accessToken =
    'pk.eyJ1Ijoic2hyYXdhbjciLCJhIjoiY2tjNmtlaW12MGJ5cDJzcDgxZDZ0ZXpwZCJ9.NRDVQ8K57WVHunUbY8evjQ';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 9,
    center: [lng, lat]
});

var marker = new mapboxgl.Marker()
    .setLngLat([lng, lat])
    .addTo(map);

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());