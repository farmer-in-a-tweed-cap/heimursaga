import { AttributionControl } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DOMPurify from 'dompurify'
const mapboxgl = require('mapbox-gl');

mapboxgl.accessToken = 'pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/cnh1187/ckppoum2i01vk17mzb71uh331',
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

map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
    enableHighAccuracy: true
    },
    trackUserLocation: true
    })
);

var mapmarkers = JSON.parse(markers)

map.on('load', function () {
    // Add a new source from our GeoJSON data and
    // set the 'cluster' option to true. GL-JS will
    // add the point_count property to your source data.
    map.addSource('entrymarkers', {
    type: 'geojson',
    data: mapmarkers,
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });
     
    map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'entrymarkers',
    filter: ['has', 'point_count'],
    paint: {
    // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
    // with three steps to implement three types of circles:
    //   * Blue, 20px circles when point count is less than 100
    //   * Yellow, 30px circles when point count is between 100 and 750
    //   * Pink, 40px circles when point count is greater than or equal to 750
    'circle-color': [
    'step',
    ['get', 'point_count'],
    '#ac6d46',
    100,
    '#ac6d46',
    750,
    '#ac6d46'
    ],
    'circle-radius': [
    'step',
    ['get', 'point_count'],
    15,
    100,
    25,
    750,
    35
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff'
    }
    });
     
    map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'entrymarkers',
    filter: ['has', 'point_count'],
    layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
    },
    paint: {
        "text-color": "#fff"
    }
    });
     
    map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'entrymarkers',
    filter: ['!', ['has', 'point_count']],
    paint: {
    'circle-color': '#ac6d46',
    'circle-radius': 5,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff'
    }
    });
     
    // inspect a cluster on click
    map.on('click', 'clusters', function (e) {
    var features = map.queryRenderedFeatures(e.point, {
    layers: ['clusters']
    });
    var clusterId = features[0].properties.cluster_id;
    map.getSource('entrymarkers').getClusterExpansionZoom(
    clusterId,
    function (err, zoom) {
    if (err) return;
     
    map.easeTo({
    center: features[0].geometry.coordinates,
    zoom: zoom
    });
    }
    );
    });
     
    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at
    // the location of the feature, with
    // description HTML from its properties.
    map.on('click', 'unclustered-point', function (e) {
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
        .setHTML(popup+`<a href="/entry/${id}">Visit entry</a>`)
        .addTo(map);
        });
         
        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'unclustered-point', function () {
        map.getCanvas().style.cursor = 'pointer';
        });
         
        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'unclustered-point', function () {
        map.getCanvas().style.cursor = '';
        });

   
     
    map.on('mouseenter', 'clusters', function () {
    map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', function () {
    map.getCanvas().style.cursor = '';
    });
    });

/*map.on('load', function () {
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
        );*/
    

// map list feed


map.on('move', function(){
    var bounds = map.getBounds();
    console.log(bounds)
    var marker = new mapboxgl.LngLat(-73.9567, 40.7789);
    console.log(bounds.contains(marker));
})





