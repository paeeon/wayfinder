(function() {
  'use strict';

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
            var querybox = document.querySelector('#querybox-title');
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
