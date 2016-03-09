(function() {
  'use strict';

  angular
    .module('wayfinder')
    .factory('MapFactory', MapFactory);

  /** @ngInject **/
  function MapFactory($rootScope, PlaceFactory) {
    var map;
    var start;
    var end;
    var mapMarkers = [];
    var bounds = new google.maps.LatLngBounds();
    var directionsService = new google.maps.DirectionsService();
    var places = [];
    var placeService;
    var directionsDisplay;
    var routeCalculated = false;
    var mapStyleArr = [{
      "featureType": "administrative",
      "elementType": "all",
      "stylers": [{
        "visibility": "on"
      }, {
        "lightness": 33
      }]
    }, {
      "featureType": "landscape",
      "elementType": "all",
      "stylers": [{
        "color": "#f2e5d4"
      }]
    }, {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{
        "color": "#c5dac6"
      }]
    }, {
      "featureType": "poi.park",
      "elementType": "labels",
      "stylers": [{
        "visibility": "on"
      }, {
        "lightness": 20
      }]
    }, {
      "featureType": "road",
      "elementType": "all",
      "stylers": [{
        "lightness": 20
      }]
    }, {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [{
        "color": "#c5c6c6"
      }]
    }, {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [{
        "color": "#e4d7c6"
      }]
    }, {
      "featureType": "road.local",
      "elementType": "geometry",
      "stylers": [{
        "color": "#fbfaf7"
      }]
    }, {
      "featureType": "water",
      "elementType": "all",
      "stylers": [{
        "visibility": "on"
      }, {
        "color": "#acbcc9"
      }]
    }];

    var initMap = function() {
      directionsDisplay = new google.maps.DirectionsRenderer();
      map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {
          lat: 40.207518,
          lng: -97.198190
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        styles: mapStyleArr
      });
      placeService = new google.maps.places.PlacesService(map);
      directionsDisplay.setMap(map);
    };

    var fitMapToBounds = function(position) {
      bounds.extend(position);
      map.fitBounds(bounds);
    };

    var sortArrayByRatingDescending = function(a, b) {
      if (a.rating < b.rating) return -1;
      else if (a.rating > b.rating) return 1;
      else return 0;
    }

    var calculateRoute = function(start, end) {
      var requestObj = {
        origin: start.getPosition(),
        destination: end.getPosition(),
        travelMode: google.maps.TravelMode.DRIVING
      };
      directionsService.route(requestObj, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(result);

          return PlaceFactory.getPlacesAlongRoute(placeService, result.routes[0])
            .then(function(arrOfPlaceArrays) {
              var placesToMap = [];
              arrOfPlaceArrays.forEach(function(placeArr) {
                fac.setPlace(placeArr[0]);
              });
              routeCalculated = true;
            }).then(null, console.error);
        }
      });
    };

    var fac = {
      initiateMap: function() {
        return initMap();
      },
      getMap: function() {
        return map;
      },
      removeMapMarker: function(idx) {
        mapMarkers.splice(idx, 1);
        $rootScope.$applyAsync();
      },
      clearMapMarkers: function() {
        mapMarkers.forEach(function(marker) {
          marker.setMap(null);
        });
        mapMarkers = [];
      },
      getStart: function() {
        return start;
      },
      getEnd: function() {
        return end;
      },
      getMapMarkers: function() {
        return mapMarkers;
      },
      getPlaces: function() {
        return places;
      },
      routeHasBeenCalculated: function() {
        return routeCalculated;
      },
      createMarker: function(title, latLngObj, address) {
        var marker = new google.maps.Marker({
          position: latLngObj,
          map: map,
          title: title,
          address: address
        });

        var infowindow = new google.maps.InfoWindow({
          content: '<div class="info-window">' + '<h3 class="info-title">' +
            title + '</h3>' + '<p class="info-description">' + address + '</p>' + '</div>'
        });

        marker.infowindow = infowindow;

        marker.addListener('click', function() {
          infowindow.open(map, marker);
        });

        marker.setMap(map);
        mapMarkers.push(marker);

        return marker;
      },
      openInfoWindow: function(marker) {
        // Close all currently open infowindows
        mapMarkers.forEach(function(mapMarker) {
          mapMarker.infowindow.close();
        })

        map.setCenter(marker.getPosition());
        marker.infowindow.open(map, marker);
      },
      setPlace: function(placeObj) {
        var marker = this.createMarker(placeObj.name, placeObj.geometry.location, placeObj.vicinity);

        mapMarkers.push(marker);

        if (placeObj.photos) {
          placeObj.photoUrl = placeObj.photos[0].getUrl({'maxWidth': 300, 'maxHeight': 300});
        }
        placeObj.markerPosition = mapMarkers.length - 1;

        places.push(placeObj);
      },
      setRouteCap: function(title, latLngObj, address, startLocation) {
        var marker = this.createMarker(title, latLngObj, address);

        if (startLocation) {
          start = marker;
        } else {
          end = marker;
        }

        if (start && end && !routeCalculated) {
          calculateRoute(start, end);
        }

        fitMapToBounds(latLngObj);
        $rootScope.$applyAsync();
      }
    };

    return fac;
  }
})();
