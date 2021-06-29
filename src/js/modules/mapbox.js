import { AttributionControl } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DOMPurify from 'dompurify'
const mapboxgl = require('mapbox-gl');
import axios from 'axios'


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

    map.addControl(
      new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: coordinatesGeocoder,
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

// map list feed

map.on('load', function(){
    this.entryFeed = document.querySelector(".dynamic-entry-feed")
    axios.get('/entry-list').then(response => {
        if (response.data.length) {
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

                                <div class="modal-body col-md-6 offset-md-3">
                                    <hr>
                                </div>
      
                                <div class="col-md-8 offset-md-2 mb-2 text-center">
                                <h5><i class="align-middle mr-5 fas fa-fw fa-map-marker-alt text-primary"></i>${entry.place}</h5>
                                </div>
      
                                <div class="col-md-8 offset-md-2 mb-2">
                                  <h5 class="text-center text-muted">on ${new Date(entry.date).toLocaleString('default', { month: 'long' })} ${new Date(entry.date).getDate()}, ${new Date(entry.date).getFullYear()} | by <a href="/journal/${entry.author.username}">${entry.author.username}</a></h5>
                                </div>
      
                                <div class="modal-body">
                                  <div class="text-center mb-1 overflow-hidden">
                                    <img src="https://api.mapbox.com/styles/v1/cnh1187/ckppoum2i01vk17mzb71uh331/static/pin-s+ac6d46(${entry.GeoJSONcoordinates.coordinates})/${entry.GeoJSONcoordinates.coordinates},6/300x300?access_token=pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w">
                                  </div>
                                  <div class="mb-4 text-center">
                                    <small>Longitude: ${entry.GeoJSONcoordinates.coordinates[0]}, Latitude: ${entry.GeoJSONcoordinates.coordinates[1]}</small>
                                  </div>
      
      
                                <div class="modal-body mb-2">
                                  ${JSON.parse(JSON.stringify(entry.body, null,1)).replace(/\n/g, "</p><p>")}
                                </div>

                                

                                    <div class="col-md-6 offset-md-3">
                                        <div class="row">
                                          <div class="col-3 offset-1 overflow-hidden" id="single-entry-likes">
            
                                            <iframe src="single-entry-likes/${entry._id}" id="single-entry-likes" height="23" allowTransparency="true"></iframe>
            
                                          </div>
            
                                          <div class="col-3 offset-4 text-right overflow-hidden" id="single-entry-flags">
            
                                            <iframe src="single-entry-flags/${entry._id}" id="single-entry-flags" height="21" allowTransparency="true"></iframe>
            
                                          </div>
                                        </div>
                                    </div>

                                
      
      
                                <div class="modal-body col-md-6 offset-md-3 mb-1">
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

                            </div>
                        </div>
                    </div>
                    </div>`}).join('')}`}
        response.data.forEach(entry => {
            var entrycoordinates = (entry.GeoJSONcoordinates.coordinates)
            map.on('move', function(){
                var bounds = map.getBounds();
                        this.entryFeed.innerHTML = `${response.data.map(entry => {
                            if(bounds.contains(new mapboxgl.LngLat(entry.GeoJSONcoordinates.coordinates[0],entry.GeoJSONcoordinates.coordinates[1]))) {
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
        
                                        <div class="modal-body col-md-6 offset-md-3">
                                            <hr>
                                        </div>
              
                                        <div class="col-md-8 offset-md-2 mb-2 text-center">
                                        <h5><i class="align-middle mr-5 fas fa-fw fa-map-marker-alt text-primary"></i>${entry.place}</h5>
                                        </div>
              
                                        <div class="col-md-8 offset-md-2 mb-2">
                                          <h5 class="text-center text-muted">on ${new Date(entry.date).toLocaleString('default', { month: 'long' })} ${new Date(entry.date).getDate()}, ${new Date(entry.date).getFullYear()} | by <a href="/journal/${entry.author.username}">${entry.author.username}</a></h5>
                                        </div>
              
                                        <div class="modal-body">
                                          <div class="text-center mb-1 overflow-hidden">
                                            <img src="https://api.mapbox.com/styles/v1/cnh1187/ckppoum2i01vk17mzb71uh331/static/pin-s+ac6d46(${entry.GeoJSONcoordinates.coordinates})/${entry.GeoJSONcoordinates.coordinates},6/300x300?access_token=pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w">
                                          </div>
                                          <div class="mb-4 text-center">
                                            <small>Longitude: ${entry.GeoJSONcoordinates.coordinates[0]}, Latitude: ${entry.GeoJSONcoordinates.coordinates[1]}</small>
                                          </div>
              
              
                                          <div class="modal-body mb-2">
                                          ${JSON.parse(JSON.stringify(entry.body, null,1)).replace(/\n/g, "</p><p>")}
                                          </div>
                                        </div>
        
                               
        
                                            <div class="col-md-6 offset-md-3">
                                                <div class="row">
                                                  <div class="col-3 offset-1 overflow-hidden" id="single-entry-likes">
                    
                                                    <iframe src="single-entry-likes/${entry._id}" id="single-entry-likes" height="23" allowTransparency="true"></iframe>
                    
                                                  </div>
                    
                                                  <div class="col-3 offset-4 text-right overflow-hidden" id="single-entry-flags">
                    
                                                    <iframe src="single-entry-flags/${entry._id}" id="single-entry-flags" height="21" allowTransparency="true"></iframe>
                    
                                                  </div>
                                                </div>
                                            </div>
        
                                        
              
              
                                        <div class="modal-body col-md-6 offset-md-3 mb-1">
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
        
                                    </div>
                                </div>
                            </div>
                                </div>`
                                }}).join('')}`
                if (this.entryFeed.innerHTML == "") {
                    this.entryFeed.innerHTML = `<div class="text-center"><p class="text-muted">Looks like there are no journal entries in this area. Be the first to document your adventures here!</p></div>`
                }           
            })
        })
    })
})


