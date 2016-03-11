(function() {
  'use strict';

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
