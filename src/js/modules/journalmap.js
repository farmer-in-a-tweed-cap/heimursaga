import { AttributionControl } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DOMPurify from 'dompurify'
const mapboxgl = require('mapbox-gl');
import axios from 'axios'
import GeoJSON from 'geojson'
import { map } from 'jquery';

mapboxgl.accessToken = 'pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w';


export default class JournalMap {


  constructor() {
    this.journalmap = new mapboxgl.Map({
      container: 'journalmap',
      style: 'mapbox://styles/cnh1187/ckwqyxju41h0c14o695dd3fdt',
      zoom: 0,
      center: [-33.609412,36.749601],
      attributionControl: false,
      dragRotate: false,
      touchPitch: false
    })
    this._csrf = document.querySelector('[name="_csrf"]').value
    this.journalmapcontainer = document.querySelector('#journalmap')
    this.startgeocoder = document.querySelector('#start-geocoder')
    this.profileusername = document.querySelector('.profile-username').innerHTML
    this.loadzoom = 0
    this.timeout = 500
    this.events()
  }


  events() {
    this.journalmap.on('load', () => this.loadResources())
    this.journalmap.on('moveend', () => this.loadEntries())
  }


  loadResources() {
    //console.log('loading resources')
    this.loadControls()
    this.journalmap.addSource('10m-bathymetry-81bsvj', {
      type: 'vector',
      url: 'mapbox://mapbox.9tm8dx88'
      });
      
      this.journalmap.addLayer(
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

    this.startgeocoder.appendChild(geocoder.onAdd(this.journalmap))      

    this.journalmap.addControl(
      new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: coordinatesGeocoder,
      marker: false,
      mapboxgl: mapboxgl,
      })
    );

    this.journalmap.addControl(new mapboxgl.NavigationControl())

    this.journalmap.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
      enableHighAccuracy: true
      },
      trackUserLocation: true
      })
    );
  }

  loadedFeed() {
    //console.log('loaded')
    this.entryfeed.innerHTML = '<div class="text-center text-muted">Loading...</div>'
  }


  loadEntries() {
    var bounds = this.journalmap.getBounds().toArray()
    if (this.journalmap.getZoom() >= this.loadzoom) {
      //console.log('loading entries')
      //console.log(bounds)
      this.loader = "loader"
      setTimeout(() => this.sendRequest(bounds), this.timeout)
    } else {
      this.entryfeed.innerHTML = `<div class="text-center"><p class="text-muted">The map is currently at zoom level <strong>${Math.round(this.journalmap.getZoom()*10)/10}</strong>. Zoom in past level ${this.loadzoom} to populate the entry feed and read full entries.</p></div>`
    }
  }

  sendRequest(bounds) {
    //console.log('sending request')
    //console.log(this.profileusername)
    axios.get(`/journal-entry-list/${this.profileusername}/${bounds}`).then(response => {
          this.loadMarkers(response)
    })
  }

  loadMarkers(entries) {
    //console.log('loading markers')
      var markers = GeoJSON.parse(entries.data, {GeoJSON: 'GeoJSONcoordinates', include: ['popup','_id']})
      var sourceID = Math.random().toString(36).slice(2)
      this.journalmap.addSource(`entrymarkers${sourceID}`, {
        type: 'geojson',
        data: markers,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });
    
    
         
      this.journalmap.addLayer({
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
         
      this.journalmap.addLayer({
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
         
      this.journalmap.addLayer({
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
      this.journalmap.on('click', `clusters${sourceID}`, function (e) {
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

         
    
      this.journalmap.on('click', `unclustered-point${sourceID}`, function (e) {
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
    
      this.journalmap.on('mouseenter', `unclustered-point${sourceID}`, function () {
        this.getCanvas().style.cursor = 'pointer';
      });
             
      this.journalmap.on('mouseleave', `unclustered-point${sourceID}`, function () {
        this.getCanvas().style.cursor = '';
      });
        
      this.journalmap.on('mouseenter', `clusters${sourceID}`, function () {
        this.getCanvas().style.cursor = 'pointer';
      });

      this.journalmap.on('mouseleave', `clusters${sourceID}`, function () {
        this.getCanvas().style.cursor = '';
      });
  }

}