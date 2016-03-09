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
        var unbindStart = scope.$watch(MapFactory.getStart, function(newVal) {
          if (newVal) {
            scope.start = newVal;
            // unbindStart();
          }
        });

        var unbindEnd = scope.$watch(MapFactory.getEnd, function(newVal) {
          if (newVal) {
            scope.end = newVal;
            // unbindEnd();
          }
        });
      }
    };
  }

})();
