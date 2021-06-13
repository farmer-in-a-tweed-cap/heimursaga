import { AttributionControl } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
const mapboxgl = require('mapbox-gl');

mapboxgl.accessToken = 'pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w';

var map = new mapboxgl.Map({
    container: 'map',
   // style: 'mapbox://styles/mapbox/cjaudgl840gn32rnrepcb9b9g', // the outdoors-v10 style but without Hillshade layers
    style: 'mapbox://styles/mapbox/outdoors-v11',
    center: [-33.609412,36.749601],
    zoom: 0,
    attributionControl: false,
    dragRotate: false,
    touchPitch: false,
});

map.on('load', function () {
    map.addSource('10m-bathymetry-81bsvj', {
    type: 'vector',
    url: 'mapbox://mapbox.9tm8dx88'
    });
     
    map.addLayer(
    {
    'id': '10m-bathymetry-81bsvj',
    'type': 'fill',
    'source': '10m-bathymetry-81bsvj',
    'source-layer': '10m-bathymetry-81bsvj',
    'layout': {},
    'paint': {
    'fill-outline-color': 'hsla(337, 82%, 62%, 0)',
    // cubic bezier is a four point curve for smooth and precise styling
    // adjust the points to change the rate and intensity of interpolation
    'fill-color': [
    'interpolate',
    ['cubic-bezier', 0, 0.5, 1, 0.5],
    ['get', 'DEPTH'],
    200,
    '#78bced',
    9000,
    '#15659f'
    ]
    }
    },
    'land-structure-polygon'
    );
    });

map.addControl(
    new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    marker: false,
    mapboxgl: mapboxgl,
    })
);

//map.addControl(new mapboxgl.GeolocateControl({
    //positionOptions: {
    //enableHighAccuracy: true
    //},
   // trackUserLocation: true
  //  })
//);

var mapmarkers = JSON.parse(markers)

map.on('load', function () {
    // Add an image to use as a custom marker
    map.loadImage(
        './img/compass-marker-8.png',
        function (error, image) {
        if (error) throw error;
    map.addImage('custom-marker', image);

    map.addSource('places', {
        'type': 'geojson',
        'data': mapmarkers,
        });
     
    // Add a symbol layer
    map.addLayer({
        'id': 'places',
        'type': 'symbol',
        'source': 'places',
        'layout': {
        'icon-image': 'custom-marker',
        'icon-size': 0.05,
        'icon-offset': [0,0],

        // get the title name from the source's "title" property
       // 'text-field': ['get', 'title'],
        //'text-font': [
        //'Open Sans Semibold',
        //'Arial Unicode MS Bold'
       // ],
       // 'text-offset': [0, 1.25],
       // 'text-anchor': 'top'
        }
        });
        }
        );
    

    map.on('click', 'places', function (e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var popup = e.features[0].properties.popup;
        var id = e.features[0].properties._id;
         
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
         
        new mapboxgl.Popup({closeButton: false, focusAfterOpen: false})
        .setLngLat(coordinates)
        .setHTML(popup+"<a href='/entry/"+id+"'>Visit entry</a>")
        .addTo(map);
        });
         
        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'places', function () {
        map.getCanvas().style.cursor = 'pointer';
        });
         
        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'places', function () {
        map.getCanvas().style.cursor = '';
        });
        }); 






