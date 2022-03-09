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

// map list feed

if (document.title === "Heimursaga | Discovery") {

map.on('load', async function(){
    this.entryFeed = document.querySelector(".dynamic-entry-feed")
    await axios.get('/entry-list').then(response => {
        if (response.data.length && map.getZoom() >= entryzoom) {
            this.entryFeed.innerHTML = `${response.data.map(entry => {
                return `<div class="list-group list-group-flush"><a data-bs-toggle="modal" href="#sizedModalMd-${entry._id}" class="list-group-item list-group-item-action">
                <strong>${entry.title}</strong><br/>
                <i class="align-middle me-0 fas fa-fw fa-map-marker-alt text-primary"></i> <small class="align-middle">${entry.place} | ${entry.date}</small><br/>
                <small>by <strong>${entry.author.username}</strong></small>
                </a>
                    <div class="modal fade" id="sizedModalMd-${entry._id}" tabindex="-1" role="dialog" aria-hidden="true">
                        <div class="modal-dialog modal-md modal-dialog-centered" role="document">
                            <div class="modal-content">
                                <div class="modal-body mb-0">
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body mt-0 pb-0">
                                    <h4 class="text-center">${entry.title}</h4>
                                </div>

                                <div class="col-8 offset-2 mb-4">
                                    <hr>
                                </div>
      
                                <div class="modal-body col-md-8 offset-md-2 pb-0 pt-0 text-center">
                                  <h5><i class="align-middle mr-5 fas fa-fw fa-map-marker-alt text-primary"></i>${entry.place}</h5>
                                </div>
      
                                <div class="modal-body col-md-8 offset-md-2 pt-0">
                                  <h5 class="text-center text-muted">on ${new Date(entry.date).toLocaleString('default', { month: 'long' })} ${new Date(entry.date).getDate()}, ${new Date(entry.date).getFullYear()} | by <a href="/journal/${entry.author.username}">${entry.author.username}</a></h5>
                                </div>
      
                                <div class="modal-body">
                                  <div class="text-center mb-1 overflow-hidden">
                                    <img src="https://api.mapbox.com/styles/v1/cnh1187/ckwqyxju41h0c14o695dd3fdt/static/pin-s+ac6d46(${entry.GeoJSONcoordinates.coordinates})/${entry.GeoJSONcoordinates.coordinates},6/300x300?access_token=pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w">
                                  </div>
                                  <div class="mb-4 text-center">
                                    <small>Longitude: ${entry.GeoJSONcoordinates.coordinates[0]}, Latitude: ${entry.GeoJSONcoordinates.coordinates[1]}</small>
                                  </div>
      
      
                                <div class="modal-body mb-2">
                                  ${JSON.parse(JSON.stringify(entry.body, null,1)).replace(/\n/g, "</p><p>")}
                                </div>


                                ${(entry.hasPhoto == true) ? `
                                <div class="modal-body">
                                  <img src="https://f002.backblazeb2.com/file/heimursaga-entry-photos/${entry._id}" class="img-fluid mb-3" alt="entry image">
                                </div> ` : ``}

                                

                              <div class="iframe-container">
                                <iframe class="button-stack-iframe" src="button-stack/${entry._id}" id="button-stack-iframe" width="100%"></iframe>
                              </div>

                              <div class="col-8 offset-2 mb-4">
                                <hr>
                              </div>

    
                              <div>
                                <p class="text-muted small mb-4 text-center">
                                <a href="/journal/${entry.author.username}"><img class="avatar img-fluid rounded-circle me-1" src="${entry.author.avatar}"></a>
                                Posted on ${new Date(entry.createdDate).getMonth() + 1}/${new Date(entry.createdDate).getDate()}/${new Date(entry.createdDate).getFullYear()}</p>
                              </div> 
                              
                              <div class="text-center mb-4">
                                  <small class="text-muted">
                                  <a href="/entry/${entry._id}">Visit entry permalink</a>
                                  </small>
                              </div>

                              <div class="">
													  
                                <iframe src="flag-button/${entry._id}" id="flag-button" height="60"></iframe>
              
                              </div>

                              <div class="modal-body m-0">
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                              </div>

                            </div>
                        </div>
                    </div>
                    </div>`}).join('')}`}
        response.data.forEach(entry => {
            map.on('move', function(){
              map.on('zoom', function(){
                var feed = document.getElementById("entry-div")
                var overlay = document.getElementById('overlay');
                overlay.style.display = "none";
                feed.style.display = "block"
              })
                var bounds = map.getBounds();
                        this.entryFeed.innerHTML = `${response.data.map(entry => {
                            if(bounds.contains(new mapboxgl.LngLat(entry.GeoJSONcoordinates.coordinates[0],entry.GeoJSONcoordinates.coordinates[1])) && map.getZoom() >= entryzoom) {
                                return `<div class="list-group list-group-flush"><a data-bs-toggle="modal" href="#sizedModalMd-${entry._id}" class="list-group-item list-group-item-action">
                                <strong>${entry.title}</strong><br/>
                                <i class="align-middle me-0 fas fa-fw fa-map-marker-alt text-primary"></i> <small class="align-middle">${entry.place} | ${entry.date}</small><br/>
                                <small>by <strong>${entry.author.username}</strong></small>
                                </a>
                                <div class="modal fade" id="sizedModalMd-${entry._id}" tabindex="-1" role="dialog" aria-hidden="true">
                                <div class="modal-dialog modal-md modal-dialog-centered" role="document">
                                    <div class="modal-content">
                                        <div class="modal-body mb-0">
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        </div>
                                        <div class="modal-body mt-0 pb-0">
                                            <h4 class="text-center">${entry.title}</h4>
                                        </div>
        
                                        <div class="col-8 offset-2 mb-4">
                                            <hr>
                                        </div>
              
                                        <div class="modal-body col-md-8 offset-md-2 pb-0 pt-0 text-center">
                                          <h5><i class="align-middle mr-5 fas fa-fw fa-map-marker-alt text-primary"></i>${entry.place}</h5>
                                        </div>
              
                                        <div class="modal-body col-md-8 offset-md-2 pt-0">
                                          <h5 class="text-center text-muted">on ${new Date(entry.date).toLocaleString('default', { month: 'long' })} ${new Date(entry.date).getDate()}, ${new Date(entry.date).getFullYear()} | by <a href="/journal/${entry.author.username}">${entry.author.username}</a></h5>
                                        </div>
              
                                        <div class="modal-body">
                                          <div class="text-center mb-1 overflow-hidden">
                                            <img src="https://api.mapbox.com/styles/v1/cnh1187/ckwqyxju41h0c14o695dd3fdt/static/pin-s+ac6d46(${entry.GeoJSONcoordinates.coordinates})/${entry.GeoJSONcoordinates.coordinates},6/300x300?access_token=pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w">
                                          </div>
                                          <div class="mb-4 text-center">
                                            <small>Longitude: ${entry.GeoJSONcoordinates.coordinates[0]}, Latitude: ${entry.GeoJSONcoordinates.coordinates[1]}</small>
                                          </div>
              
              
                                          <div class="modal-body mb-2">
                                          ${JSON.parse(JSON.stringify(entry.body, null,1)).replace(/\n/g, "</p><p>")}
                                          </div>

                                          ${(entry.hasPhoto) ? `
                                          <div class="modal-body">
                                            <img src="https://f002.backblazeb2.com/file/heimursaga-entry-photos/${entry._id}" class="img-fluid mb-3" alt="entry image">
                                          </div> ` : ``}

                                        </div>
                               
        
                                        <div class="iframe-container">
                                          <iframe class="button-stack-iframe" src="button-stack/${entry._id}" id="button-stack-iframe" width="100%"></iframe>
                                        </div>
        
                                        <div class="col-8 offset-2 mb-4">
                                          <hr>
                                        </div>
              
                                        <div>
                                          <p class="text-muted small mb-4 text-center">
                                          <a href="/journal/${entry.author.username}"><img class="avatar img-fluid rounded-circle me-1" src="${entry.author.avatar}"></a>
                                          Posted on ${new Date(entry.createdDate).getMonth() + 1}/${new Date(entry.createdDate).getDate()}/${new Date(entry.createdDate).getFullYear()}</p>
                                        </div> 
                                        
                                        <div class="text-center mb-4">
                                            <small class="text-muted">
                                            <a href="/entry/${entry._id}">Visit entry permalink</a>
                                            </small>
                                        </div>

                                        <div class="">
													  
                                          <iframe src="flag-button/${entry._id}" id="flag-button" height="60"></iframe>
                      
                                        </div>

                                        <div class="modal-body m-0">
                                          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        </div>
        
                                    </div>
                                </div>
                            </div>
                                </div>`
                                }}).join('')}`
                if (this.entryFeed.innerHTML == "" && map.getZoom() < entryzoom) {
                    this.entryFeed.innerHTML = `<div class="text-center"><p class="text-muted">The map is currently at zoom level <strong>${Math.round(map.getZoom()*10)/10}</strong>. Zoom in past level 7 to populate the entry feed and read full entries.</p></div>`
                } else if (this.entryFeed.innerHTML == "") {
                    this.entryFeed.innerHTML = `<div class="text-center"><p class="text-muted">Looks like there are no journal entries in this area. Be the first to document your adventures here!</p></div>`
                }     
            })
        })
    })
})
}


/*map.on('load', () => {

  console.log([-22.406929064318945, 63.87905672678207])
  console.log(mapmarkers.features[1].geometry.coordinates)

  map.addSource('route', {
    'type': 'geojson',
    'data': {
    'type': 'Feature',
    'properties': {},
    'geometry': {
    'type': 'LineString',
    'coordinates': [
      [-22.406929064318945, 63.87905672678207],
      [2.238697195895327, 41.37022151440331],
      [mapmarkers.features[0].geometry.coordinates],
      [mapmarkers.features[1].geometry.coordinates]
    ]
    }
    }
    });

  map.addLayer({
      'id': 'route',
      'type': 'line',
      'source': 'route',
      'layout': {
      'line-join': 'round',
      'line-cap': 'round'
      },
      'paint': {
      'line-color': '#3C73AA',
      'line-width': 3
      }
      });

      var url = 'https://f002.backblazeb2.com/file/heimursaga-entry-photos/line+pointer+heimursaga.png';
      map.loadImage(url, function(err, image) {
        if (err) {
          console.error('err image', err);
          return;
        }
        map.addImage('arrow', image);
        map.addLayer({
          'id': 'arrow-layer',
          'type': 'symbol',
          'source': 'route',
          'layout': {
            'symbol-placement': 'line',
            'symbol-spacing': 1,
            'icon-allow-overlap': true,
            // 'icon-ignore-placement': true,
            'icon-image': 'arrow',
            'icon-size': 0.08,
            'visibility': 'visible'
          }
        });
      });
})*/
}
}

