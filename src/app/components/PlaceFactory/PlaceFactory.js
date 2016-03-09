(function() {
  'use strict';

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
