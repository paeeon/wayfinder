(function() {
  'use strict';

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
