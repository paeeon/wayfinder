(function() {
  'use strict';

  angular
    .module('wayfinder')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController(MapFactory) {
    MapFactory.initiateMap();
  }
})();
