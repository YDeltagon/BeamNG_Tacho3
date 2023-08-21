'use strict'

angular.module('beamng.apps')
  .directive('enhancedTacho3V2', [() => {
    return {
      template:
        '<object style="width:100%; height:100%; box-sizing:border-box; point-event: none" type="image/svg+xml" data="/ui/modules/apps/enhancedTacho3V2/app.svg"></object>',
      replace: true,
      restrict: 'EA',
      link: (scope, element, attrs) => {
        element.css({ transition: 'opacity 0.3s ease' });

        // only once do we actually need to get the streams. they are always the same names anyway.
        element.one('load', () => {
          let svg = element[0].contentDocument;
          StreamsManager.add(svg.getStreams());
        });

        let svg;

        // every time the SVG is loaded, update the reference
        element.on('load', () => {
          svg = element[0].contentDocument;
          svg.wireThroughUnitSystem((val, func) => UiUnits[func](val));
        });

        scope.$on('streamsUpdate', (event, streams) => {
          if (svg) {
            element[0].style.opacity = 1;
            svg.update(streams);
          }
        });

        scope.$on('VehicleChange', () => {
          if (svg && svg.vehicleChanged) {
            svg.vehicleChanged();
          }
        });

        scope.$on('VehicleFocusChanged', (event, data) => {
          if (data.mode === true && svg && svg.vehicleChanged) {
            svg.vehicleChanged();
          }
        });

        scope.$on('$destroy', () => {
          if (svg) {
            svg.saveData();
            StreamsManager.remove(svg.getStreams());
          }
        });
      }
    }
  }]);
