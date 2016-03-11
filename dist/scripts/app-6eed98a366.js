(function() {
  'use strict';

  angular
    .module('wayfinder', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngMessages', 'ngAria', 'ui.router', 'ui.bootstrap', 'toastr', 'ngLodash']);

})();

(function() {
  'use strict';

  querybox.$inject = ["MapFactory"];
  angular
    .module('wayfinder')
    .directive('querybox', querybox);

  /** @ngInject **/
  function querybox(MapFactory) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'app/components/querybox/querybox.html',
      link: function(scope, element) {

        // Set the default bounds for the searchBox
        var defaultBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(53.861378, -129.453106),
          new google.maps.LatLng(22.568883, -63.585954));

        // Pre-fill the input and options, to be passed in as arguments when
        // creating the Autocomplete object on line 22
        var input = document.getElementById('query-field');
        var options = {
          bounds: defaultBounds,
          types: ['establishment'],
          componentRestrictions: {
            country: 'us'
          }
        };

        var autocomplete = new google.maps.places.Autocomplete(input, options);

        autocomplete.addListener('place_changed', function() {
          var placeResult = autocomplete.getPlace();

          if (MapFactory.getStart() && MapFactory.getEnd()) {
            MapFactory.setPlace(placeResult);
          } else {
            if (MapFactory.getStart()) {
              MapFactory.setRouteCap(placeResult.name, placeResult.geometry.location, placeResult.formatted_address, false);
              angular.element(input).css('display', 'none');
            } else {
              MapFactory.setRouteCap(placeResult.name, placeResult.geometry.location, placeResult.formatted_address, true);
              input.value = '';
              input.placeholder = 'Enter your ending address…';
            }
          }
        });

        scope.$watch(MapFactory.routeHasBeenCalculated, function(newVal) {
          if (newVal) {
            scope.routeCalculated = true;
          } else {
            scope.routeCalculated = false;
          }
        });

        scope.restart = function() {
          MapFactory.startOver();
          input.value = '';
          input.placeholder = 'Enter your starting address…';
          angular.element(input).css('display', 'block');
        };

        scope.hide = function() {
          element.toggleClass('move-left');
          var arrow = angular.element(document.getElementById('hide-arrow'));
          if (arrow.hasClass('fa-angle-double-left')) {
            arrow.removeClass('fa-angle-double-left');
            arrow.addClass('fa-angle-double-right');
          } else {
            arrow.removeClass('fa-angle-double-right');
            arrow.addClass('fa-angle-double-left');
          }
        };

      }
    };
  };

})();

(function() {
  'use strict';

  placesToCheckOut.$inject = ["MapFactory"];
  angular
    .module('wayfinder')
    .directive('placesToCheckOut', placesToCheckOut);

  /** @ngInject **/
  function placesToCheckOut(MapFactory) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'app/components/placesToCheckout/placesToCheckOut.html',
      link: function(scope, element) {

        // uib rating variable
        scope.isReadonly = true;

        scope.$watch(MapFactory.routeHasBeenCalculated, function(newVal) {
          if (newVal) {
            var querybox = document.querySelector('#querybox-top');
            var heightCalc = 'calc(100vh - ' + querybox.offsetHeight.toString() + 'px)';
            element.css('height', heightCalc);
            scope.places = MapFactory.getPlaces();
          }
        });

        scope.highlightPlace = function(place) {
          var placeMarker = MapFactory.getMapMarkers()[place.markerPosition];
          MapFactory.openInfoWindow(placeMarker);
        };

      }
    };
  }

})();

(function() {
  'use strict';

  angular
    .module('wayfinder')
    .directive('acmeNavbar', acmeNavbar);

  /** @ngInject */
  function acmeNavbar() {
    NavbarController.$inject = ["moment"];
    var directive = {
      restrict: 'E',
      templateUrl: 'app/components/navbar/navbar.html',
      scope: {
          creationDate: '='
      },
      controller: NavbarController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

    /** @ngInject */
    function NavbarController(moment) {
      var vm = this;

      // "vm.creation" is avaible by directive option "bindToController: true"
      vm.relativeDate = moment(vm.creationDate).fromNow();
    }
  }

})();

(function() {
  'use strict';

  markerlist.$inject = ["MapFactory"];
  angular
    .module('wayfinder')
    .directive('markerlist', markerlist);

  /** @ngInject **/
  function markerlist(MapFactory) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'app/components/markerlist/markerlist.html',
      link: function(scope) {
        scope.$watch(MapFactory.getStart, function(newVal, oldVal) {
          if (newVal !== oldVal) {
            scope.start = newVal;
          }
        });

        scope.$watch(MapFactory.getEnd, function(newVal, oldVal) {
          if (newVal !== oldVal) {
            scope.end = newVal;
          }
        });
      }
    };
  }

})();

(function() {
  'use strict';

  PlaceFactory.$inject = ["lodash", "$q"];
  angular
    .module('wayfinder')
    .factory('PlaceFactory', PlaceFactory);

  /** @ngInject **/
  function PlaceFactory(lodash, $q) {

    var determineNumOfChunks = function(num) {
      if (num <= 50000) return 2;
      else if (num > 50000 && num <= 1500000) return 4;
      else if (num > 1500000) return 5;
    }

    // Chunk the number of requests to make to Yelp's API based on how far the trip is
    function chunkPathArr(a, n, balanced) {
      if (n < 2)
        return [a];

      var len = a.length,
        out = [],
        i = 0,
        size;

      if (len % n === 0) {
        size = Math.floor(len / n);
        while (i < len) {
          out.push(a.slice(i, i += size));
        }
      } else if (balanced) {
        while (i < len) {
          size = Math.ceil((len - i) / n--);
          out.push(a.slice(i, i += size));
        }
      } else {
        n--;
        size = Math.floor(len / n);
        if (len % size === 0)
          size--;
        while (i < size * n) {
          out.push(a.slice(i, i += size));
        }
        out.push(a.slice(size * n));
      }
      return out;
    }

    var placeTypes = [
      'amusement_park',
      'aquarium',
      'art_gallery',
      'campground',
      'museum',
      'shopping_mall',
      'zoo'
    ];

    var fac = {
      getPlacesAlongRoute: function(placeService, routesObj) {
        var places = [];
        var placePromises = [];

        var promisifier = function(requestObj) {
          return $q(function(resolve, reject) {
            placeService.nearbySearch(requestObj, function(results, status) {
              if (status == google.maps.places.PlacesServiceStatus.OK) {
                resolve(results);
              } else {
                console.error(status);
                reject(status);
              }
            })
          });
        }

        var tripDistance = routesObj.legs[0].distance.value;
        var numChunks = determineNumOfChunks(tripDistance);
        var chunkedPathArr = chunkPathArr(routesObj.overview_path, numChunks, true);
        chunkedPathArr.forEach(function(chunk) {
          var middle = chunk[Math.floor((chunk.length - 1) / 2)];
          var request = {
            location: middle,
            radius: (tripDistance / numChunks)/2,
            types: placeTypes,
            rankBy: google.maps.places.RankBy.PROMINENCE
          };
          placePromises.push(promisifier(request));
        });
        return $q.all(placePromises);
      }
    };

    return fac;
  }

})();

(function() {
  'use strict';

  MapFactory.$inject = ["$rootScope", "PlaceFactory"];
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
    };

    var mapRecenterWithOffset = function(latlng, offsetx, offsety) {
      var point1 = map.getProjection().fromLatLngToPoint(
        (latlng instanceof google.maps.LatLng) ? latlng : map.getCenter()
      );
      var point2 = new google.maps.Point(
        ((typeof(offsetx) == 'number' ? offsetx : 0) / Math.pow(2, map.getZoom())) || 0,
        ((typeof(offsety) == 'number' ? offsety : 0) / Math.pow(2, map.getZoom())) || 0
      );
      map.setCenter(map.getProjection().fromPointToLatLng(new google.maps.Point(
        point1.x - point2.x,
        point1.y + point2.y
      )));
    }

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
          directionsDisplay = new google.maps.DirectionsRenderer();
          directionsDisplay.setMap(map);

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
      startOver: function() {
        mapMarkers.forEach(function(marker) {
          marker.setMap(null);
        });
        directionsDisplay.setMap(null);
        start.setMap(null);
        end.setMap(null);
        routeCalculated = false;
        mapMarkers = [];
        places = [];
        start = null;
        end = null;
        map.setCenter({
          lat: 40.207518,
          lng: -97.198190
        });
        map.setZoom(4);
        $rootScope.$applyAsync();
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
          placeObj.photoUrl = placeObj.photos[0].getUrl({
            'maxWidth': 300,
            'maxHeight': 300
          });
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

(function() {
  'use strict';

  MainController.$inject = ["MapFactory"];
  angular
    .module('wayfinder')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController(MapFactory) {
    MapFactory.initiateMap();
  }
})();

(function() {
  'use strict';

  angular
    .module('wayfinder')
    .run(runBlock);

  /** @ngInject */
  function runBlock() {
  }

})();

(function() {
  'use strict';

  routerConfig.$inject = ["$stateProvider", "$urlRouterProvider"];
  angular
    .module('wayfinder')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainController',
        controllerAs: 'main'
      });

    $urlRouterProvider.otherwise('/');
  }

})();

(function() {
  'use strict';

  angular
    .module('wayfinder')

})();

(function() {
  'use strict';

  config.$inject = ["$logProvider", "toastrConfig"];
  angular
    .module('wayfinder')
    .config(config);

  /** @ngInject */
  function config($logProvider, toastrConfig) {
    // Enable log
    $logProvider.debugEnabled(true);

    // Set options third-party lib
    toastrConfig.allowHtml = true;
    toastrConfig.timeOut = 3000;
    toastrConfig.positionClass = 'toast-top-right';
    toastrConfig.preventDuplicates = true;
    toastrConfig.progressBar = true;
  }

})();

angular.module("wayfinder").run(["$templateCache", function($templateCache) {$templateCache.put("app/main/main.html","<div id=\"map\"></div>");
$templateCache.put("app/components/navbar/navbar.html","<nav class=\"navbar navbar-static-top navbar-inverse\"><div class=\"container-fluid\"><div class=\"navbar-header\"><a class=\"navbar-brand\" href=\"https://github.com/Swiip/generator-gulp-angular\"><span class=\"glyphicon glyphicon-home\"></span> Gulp Angular</a></div><div class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-6\"><ul class=\"nav navbar-nav\"><li class=\"active\"><a ng-href=\"#\">Home</a></li><li><a ng-href=\"#\">About</a></li><li><a ng-href=\"#\">Contact</a></li></ul><ul class=\"nav navbar-nav navbar-right acme-navbar-text\"><li>Application was created {{ vm.relativeDate }}.</li></ul></div></div></nav>");
$templateCache.put("app/components/markerlist/markerlist.html","<ul class=\"marker-list list-group\"><li class=\"marker list-group-item clearfix\" ng-show=\"start\"><div class=\"marker-info pull-left\"><i class=\"fa fa-map-marker pull-left\"></i><p class=\"starting-with\">Starting at</p><p class=\"marker-title\">{{ start.title }}</p><p class=\"marker-address\">{{ start.address }}</p></div></li><li class=\"marker list-group-item clearfix\" ng-show=\"end\"><div class=\"marker-info pull-left\"><i class=\"fa fa-map-marker pull-left\"></i><p class=\"ending-with\">Ending at</p><p class=\"marker-title\">{{ end.title }}</p><p class=\"marker-address\">{{ end.address }}</p></div></li></ul>");
$templateCache.put("app/components/placesToCheckout/placesToCheckOut.html","<h2 class=\"place-list-header\"><i class=\"fa fa-map-signs\"></i>You should check out…</h2><ul class=\"place-list list-group\"><li class=\"place list-group-item clearfix\" ng-repeat=\"place in places\" ng-click=\"highlightPlace(place)\"><div class=\"place-pic pull-left\" ng-show=\"place.photoUrl\"><img ng-src=\"{{ place.photoUrl }}\"></div><div class=\"place-info\" ng-class=\"{\'place-columnized\': place.photoUrl}\"><p class=\"place-title\">{{ place.name }}</p><p class=\"place-address\">{{ place.vicinity }}</p><div class=\"place-ratings\"><uib-rating ng-model=\"place.rating\" read-only=\"isReadonly\"></uib-rating></div></div></li></ul>");
$templateCache.put("app/components/querybox/querybox.html","<div id=\"querybox-wrapper\"><div id=\"querybox-top\" class=\"clearfix\"><button id=\"restart-search\" ng-show=\"routeCalculated\" ng-click=\"restart()\"><i class=\"fa fa-undo\"></i>Restart search</button><div id=\"querybox-title\"><img class=\"logo\" src=\"assets/images/logo.png\"><h1 class=\"app-title\">WayFinder</h1><p class=\"slogan\">Find cool places to stop by on a road trip</p><markerlist></markerlist></div></div><button id=\"hide-button\" ng-click=\"hide()\"><i id=\"hide-arrow\" class=\"fa fa-angle-double-left\"></i></button> <input type=\"text\" id=\"query-field\" placeholder=\"Enter your starting address…\"><places-to-check-out ng-show=\"routeCalculated\"></places-to-check-out></div>");}]);
//# sourceMappingURL=../maps/scripts/app-6eed98a366.js.map
