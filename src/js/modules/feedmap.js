import { AttributionControl } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DOMPurify from 'dompurify'
const mapboxgl = require('mapbox-gl');
import axios from 'axios'
import GeoJSON from 'geojson'
import { map } from 'jquery';

mapboxgl.accessToken = 'pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w';


export default class FeedMap {


  constructor() {
    this.feedmap = new mapboxgl.Map({
      container: 'feedmap',
            //style: 'mapbox://styles/cnh1187/ckwqyxju41h0c14o695dd3fdt',
            style: 'mapbox://styles/cnh1187/clikkzykm00wb01qf28pz4adt',

      zoom: 0,
      center: [-33.609412,36.749601],
      attributionControl: false,
      dragRotate: false,
      touchPitch: false
    })
    this._csrf = document.querySelector('[name="_csrf"]').value
    this.feedmapcontainer = document.querySelector('#feedmap')
    this.startgeocoder = document.querySelector('#start-geocoder')
    this.overlay = document.querySelector('#overlay')
    this.feed = document.querySelector('#entry-div')
    this.entryfeed = document.querySelector('#dynamic-entry-feed')
    this.loaderIcon = document.querySelector(".spinner-border")
    this.loadzoom = 0
    this.timeout = 500
    this.events()
  }


  events() {
    window.onload = this.showLoaderIcon()
    this.feedmap.on('load', () => this.loadResources())
    this.feedmap.on('moveend', () => this.loadEntries())
    //this.feedmap.on('movestart', () => this.clearEntries())

  }


  loadResources() {
    //console.log('loading resources')
    this.loadControls()
    /*this.feedmap.addSource('10m-bathymetry-81bsvj', {
      type: 'vector',
      url: 'mapbox://mapbox.9tm8dx88'
      });
      
      this.feedmap.addLayer(
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
      '#4676ac',
      9000,
      '#385E89'
      ]
      }
      },
      'land-structure-polygon'
      );*/

    //this.feedmap.once('load', () => this.loadedFeed())
    //this.feedmap.on('load', () => 
    this.loadEntries()
    //)

  }

  loadControls() {
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

    this.startgeocoder.appendChild(geocoder.onAdd(this.feedmap))      

    this.feedmap.addControl(
      new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: coordinatesGeocoder,
      marker: false,
      mapboxgl: mapboxgl,
      })
    );

    this.feedmap.addControl(new mapboxgl.NavigationControl())

    this.feedmap.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
      enableHighAccuracy: true
      },
      trackUserLocation: true
      })
    );
  }




  loadEntries() {
    var bounds = this.feedmap.getBounds().toArray()
    if (this.feedmap.getZoom() >= this.loadzoom) {
      //console.log('loading entries')
      //console.log(bounds)
      this.loader = "loader"
      setTimeout(() => this.sendRequest(bounds), this.timeout)
    } else {
      this.entryfeed.innerHTML = `<div class="text-center"><p class="text-muted">The map is currently at zoom level <strong>${Math.round(this.feedmap.getZoom()*10)/10}</strong>. Zoom in past level ${this.loadzoom} to populate the entry feed and read full entries.</p></div>`
    }
  }

  clearEntries() {
    this.showLoaderIcon()
    this.entryfeed.setAttribute('hidden', true)
  }

  sendRequest(bounds) {
    //console.log('sending request')
    axios.get(`/feed-entry-list/${bounds}`).then(response => {
      this.entryfeed.removeAttribute('hidden', true)
          this.hideLoaderIcon()
          this.loadMarkers(response)
          this.renderEntryHTML(response)
    })
  }

  showLoaderIcon() {
    document.querySelector(".spinner-border").removeAttribute('hidden', true)
      document.querySelector(".loader-text").removeAttribute('hidden', true)
  }

  hideLoaderIcon() {
    document.querySelector(".spinner-border").setAttribute('hidden', true)
    document.querySelector(".loader-text").setAttribute('hidden', true)
  }


  loadMarkers(entries) {
    //console.log('loading markers')
      var markers = GeoJSON.parse(entries.data, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})
      var sourceID = Math.random().toString(36).slice(2)
      this.feedmap.addSource(`entrymarkers${sourceID}`, {
        type: 'geojson',
        data: markers,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });
    
    
         
      this.feedmap.addLayer({
        id: `clusters${sourceID}`,
        type: 'circle',
        source: `entrymarkers${sourceID}`,
        minzoom: 0,
        filter: ['has', 'point_count'],
        paint: {
        // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
        // with three steps to implement three types of circles:
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
         
      this.feedmap.addLayer({
        id: `cluster-count${sourceID}`,
        type: 'symbol',
        source: `entrymarkers${sourceID}`,
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
         
      this.feedmap.addLayer({
        id: `unclustered-point${sourceID}`,
        type: 'circle',
        source: `entrymarkers${sourceID}`,
        minzoom: 0,
        filter: ['!', ['has', 'point_count']],
        paint: { 
        'circle-color': '#ac6d46',
        'circle-radius': 5,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
        }
      })
    
        // inspect a cluster on click
      this.feedmap.on('click', `clusters${sourceID}`, function (e) {
        var features = this.queryRenderedFeatures(e.point, {
          layers: [`clusters${sourceID}`]
        })
        var clusterId = features[0].properties.cluster_id;
          
        this.getSource(`entrymarkers${sourceID}`).getClusterExpansionZoom(clusterId,  (err, zoom) => {
          if (err) return
          this.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          })
        })

      })

         
    
      this.feedmap.on('click', `unclustered-point${sourceID}`, function (e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var popup = e.features[0].properties.popup;
        var id = e.features[0].properties._id;

            
        this.easeTo({
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
         
       new mapboxgl.Popup({closeButton: false, focusAfterOpen: true})
          .setLngLat(coordinates)
          .setHTML(popup+`<a data-bs-toggle="modal" href="#sizedModalMd-${id}">Expand</a>`)
          .addTo(this);
      });
    
      this.feedmap.on('mouseenter', `unclustered-point${sourceID}`, function () {
        this.getCanvas().style.cursor = 'pointer';
      });
             
      this.feedmap.on('mouseleave', `unclustered-point${sourceID}`, function () {
        this.getCanvas().style.cursor = '';
      });
        
      this.feedmap.on('mouseenter', `clusters${sourceID}`, function () {
        this.getCanvas().style.cursor = 'pointer';
      });

      this.feedmap.on('mouseleave', `clusters${sourceID}`, function () {
        this.getCanvas().style.cursor = '';
      });
  }

  renderEntryHTML(entries) {
    if (entries.data.length) {
      this.entryfeed.innerHTML = `${entries.data.map(entry => {
        return `<div class="list-group list-group-flush"><a data-bs-toggle="modal" href="#sizedModalMd-${entry._id}" class="list-group-item list-group-item-action">
        <strong>${entry.title}</strong><br/>
        <i class="align-middle me-0 fas fa-fw fa-map-marker-alt text-primary"></i> <small class="align-middle">${entry.place} | ${new Date(entry.date).toLocaleString('default', { month: 'short' })} ${new Date(entry.date).getDate()}, ${new Date(entry.date).getFullYear()} </small><br/>
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

                        <div class="modal-body col-md-8 offset-md-2 pt-0 pb-0">
                          <h5 class="text-center text-muted">on ${new Date(entry.date).toLocaleString('default', { month: 'long' })} ${new Date(entry.date).getDate()}, ${new Date(entry.date).getFullYear()} | by <a href="/journal/${entry.author.username}">${entry.author.username}</a></h5>
                        </div>

                        ${(entry.journey) ? `

                        <div class="modal-body text-center pt-0 pb-0">
                        <a href="/journal/${entry.author.username}/${entry.journey}"><h5 class="text-center text-primary">${entry.journey}</h5></a>
                        </div>
                        ` : ``}

                        <div class="modal-body">
                          <div class="text-center mb-1 mt-1 overflow-hidden">
                            <img src="https://api.mapbox.com/styles/v1/cnh1187/clikkzykm00wb01qf28pz4adt/static/pin-s+ac6d46(${entry.GeoJSONcoordinates.coordinates})/${entry.GeoJSONcoordinates.coordinates},6/300x300?access_token=pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w">
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
                        </div>
                        

                      <div class="iframe-container">
                        <iframe class="button-stack-iframe" src="button-stack/${entry._id}" id="button-stack-iframe" width="100%" scrolling="no"></iframe>
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
                    
                        <iframe src="flag-button/${entry._id}" id="flag-button" height="60" scrolling="no"></iframe>
      
                      </div>

                      <div class="modal-body m-0">
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>

                    </div>
                </div>
            </div>
            </div>`}).join('')}`
      } else {
        this.entryfeed.innerHTML = `<div class="text-center"><p class="text-muted">None of the explorers you follow have logged journal entries in this area. Follow more explorers or be the first to document your adventures here!</p></div>` 
    }
  }
}