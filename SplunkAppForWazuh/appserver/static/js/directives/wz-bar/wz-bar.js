/*
 * Wazuh app - Filter bar directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
define(['../module'], function (directives) {
  'use strict'
  directives.directive('wazuhBar', function ($filterService) {
    return {
      restrict: 'E',
      controller: function ($scope, $filterService) {

        /**
         * Prettifies filters for md-chips
         */
        const getPrettyFilters = () => {
          const prettyFilters = []
          const uglyFilters = $filterService.getFilters()
          if (uglyFilters && uglyFilters.length > 0) {
            for (const filter of uglyFilters) {
              const key = Object.keys(filter)[0]
              prettyFilters.push(`${key}:${filter[key]}`)
            }
          }
          return prettyFilters
        }

        $scope.filters = getPrettyFilters()

        /**
         * Removes a filter on click
         * @param {String}: The filter to be removed 
         */
        $scope.removeFilter = (filter) => {
          const index = $scope.filters.indexOf(filter)
          if (index > -1) {
            $filterService.removeFilter($scope.filters[index])
            $scope.filters.splice(index, 1)
          }
          $scope.$emit('deletedFilter', {})

        }

        /**
         * Applies the written filter to visualizations
         * @param {Object | String} filter 
         */
        $scope.applyFilters = (customSearch) => {
          $filterService.addFilter(customSearch)
          $scope.$emit('barFilter', {})
          $scope.filters = getPrettyFilters()
          if (!$scope.$$phase) $scope.$digest()
        }
      },
      templateUrl: '/static/app/SplunkAppForWazuh/js/directives/wz-bar/wz-bar.html'
    }
  })
})