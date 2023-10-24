import { AttributionControl } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DOMPurify from 'dompurify'
const mapboxgl = require('mapbox-gl');
import axios from 'axios'
import GeoJSON from 'geojson'

mapboxgl.accessToken = 'pk.eyJ1IjoiY25oMTE4NyIsImEiOiJja28wZTZpNGowY3RoMnBvaTgxZ2M5c3ljIn0.t3_T3EN00e5w7D0et4hf-w';

export default class EntryMap {

    constructor() {
        this.entrymap = new mapboxgl.Map({
            container: 'entrymap',
            //style: 'mapbox://styles/cnh1187/ckwqyxju41h0c14o695dd3fdt',
            style: 'mapbox://styles/cnh1187/clikkzykm00wb01qf28pz4adt',
            zoom: 0,
            center: [-33.609412,36.749601], 
            attributionControl: false,
            dragRotate: false,
            touchPitch: false,
            doubleClickZoom: false,
          })
          this.marker = new mapboxgl.Marker({
            color: '#ac6d46',
            draggable: false,
            })
          this._csrf = document.querySelector('[name="_csrf"]').value
          this.entrymapcontainer = document.querySelector('#entrymap')
          this.startgeocoder = document.querySelector('#start-geocoder')
          this.overlay = document.querySelector('#overlay')
          this.feed = document.querySelector('#entry-div')
          this.entryfeed = document.querySelector('#dynamic-entry-feed')
          this.loaderIcon = document.querySelector(".spinner-border")
          this.coordinatesfield = document.querySelector('#lnglatcoordinates')
          this.entrycoordinates = document.querySelector('#lnglatcoordinates').value
          this.pagetitle = document.title
          this.loadzoom = 0
          this.timeout = 500
          this.events()
        }

        events() {
            this.entrymap.on('load', () => this.loadResources())
            this.entrymap.on('dblclick', (e) => this.setMarker(e))
			this.entrymap.on('doubletap', (e) => this.setMarker(e))
          }

        setMarker(e) {
            var coordinates = e.lngLat;
            var marker = this.marker
            marker.setLngLat(coordinates).addTo(this.entrymap);
            this.coordinatesfield.value = coordinates.lng + ',' + coordinates.lat
        }

        loadResources() {

            if (this.pagetitle == 'Heimursaga | Edit Entry' || this.pagetitle == 'Heimursaga | Edit Draft Entry') {
                this.marker.setLngLat(this.entrycoordinates.split(',')).addTo(this.entrymap);
                this.entrymap.setCenter(this.entrycoordinates.split(','))
                this.entrymap.setZoom(6)
            }

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

            this.entrymap.addControl(
				new MapboxGeocoder({
				accessToken: mapboxgl.accessToken,
				localGeocoder: coordinatesGeocoder,
				marker: false,
				mapboxgl: mapboxgl,
				})
			);

           this.entrymap.addControl(new mapboxgl.GeolocateControl({
				positionOptions: {
				enableHighAccuracy: true
				},
				trackUserLocation: true
				})
			);
        }


}
