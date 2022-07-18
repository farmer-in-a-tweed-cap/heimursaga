import { AttributionControl } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DOMPurify from 'dompurify'
const mapboxgl = require('mapbox-gl');
import axios from 'axios'



mapboxgl.accessToken = 'pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w';


export default class Map {

constructor() {
  var map = new mapboxgl.Map({
    container: 'map',
    //style: 'mapbox://styles/mapbox/light-v10',
  	//style: 'mapbox://styles/cnh1187/ckwqxzg5w196n14ml3snpoo7m', // heimursaga custom style blue water
		style: 'mapbox://styles/cnh1187/ckwqyxju41h0c14o695dd3fdt', // heimursaga custom style grey water
    center: [-33.609412,36.749601],
    zoom: 0,
    attributionControl: false,
    dragRotate: false,
    touchPitch: false,
});

    map.on('load', () => {
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
      '#8c8c8c',
      9000,
      '#4d4d4d'
      ]
      }
      },
      'land-structure-polygon'
      );
      });



var coordinatesGeocoder = function (query) {
      // Match anything which looks like
      // decimal degrees coordinate pair.
      var matches = query.match(
      /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
      );
      if (!matches) {
      return null;
      }
      
      function coordinateFeature(lng, lat) {
      return {
      center: [lng, lat],
      geometry: {
      type: 'Point',
      coordinates: [lng, lat]
      },
      place_name: 'Lat: ' + lat + ' Lng: ' + lng,
      place_type: ['coordinate'],
      properties: {},
      type: 'Feature'
      };
      }
      
      var coord1 = Number(matches[1]);
      var coord2 = Number(matches[2]);
      var geocodes = [];
      
      if (coord1 < -90 || coord1 > 90) {
      // must be lng, lat
      geocodes.push(coordinateFeature(coord1, coord2));
      }
      
      if (coord2 < -90 || coord2 > 90) {
      // must be lat, lng
      geocodes.push(coordinateFeature(coord2, coord1));
      }
      
      if (geocodes.length === 0) {
      // else could be either lng, lat or lat, lng
      geocodes.push(coordinateFeature(coord1, coord2));
      geocodes.push(coordinateFeature(coord2, coord1));
      }
      
      return geocodes;
      };
      
var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    localGeocoder: coordinatesGeocoder,
    marker: false,
    mapboxgl: mapboxgl
  });

document.getElementById('start-geocoder').appendChild(geocoder.onAdd(map))      

map.addControl(
    new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    localGeocoder: coordinatesGeocoder,
    marker: false,
    mapboxgl: mapboxgl,
    })
  );

map.addControl(new mapboxgl.NavigationControl())

map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
    enableHighAccuracy: true
    },
    trackUserLocation: true
    })
);


var mapmarkers = JSON.parse(markers)

var entryzoom = 7

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
    minzoom: 0,
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
    minzoom: 0,
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
    minzoom: 0,
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

        console.log(map.getZoom())
        
        map.easeTo({
          center: coordinates,
          offset: [0, 50],
          zoom: 7
        })
         
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
          new mapboxgl.Popup({closeButton: false, focusAfterOpen: false})
          .setLngLat(coordinates)
          .setHTML(popup+`<a data-bs-toggle="modal" href="#sizedModalMd-${id}">Expand</a>`)
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


map.on('zoom', function() {
  document.activeElement.blur()
})
}}