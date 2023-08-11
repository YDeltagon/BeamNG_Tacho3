'use strict'
angular.module('beamng.apps')
.directive('bxftacho', [function () {
  return {
    template:
        '<object style="width:100%; height:100%; box-sizing:border-box; pointer-events: none" type="image/svg+xml" data="/ui/modules/apps/BXFtacho/tacho.svg"></object>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
      element.css({transition:'opacity 0.3s ease'})
      let visible = false
      let initialized = false
      let svg
      // every time the SVG is loaded, update the reference
      element.on('load', function () {
        svg = element[0].contentDocument
        svg.wireThroughUnitSystem((val, func) => UiUnits[func](val))
      })
      // only once do we actually need to get the streams. they are always the same names anyway.
      element.one('load', function(){
        var svg = element[0].contentDocument
        StreamsManager.add(svg.getStreams())
      })
      scope.$on('streamsUpdate', function (event, streams) {
        if(svg) {
          if (svg.update(streams)) {
            if(!visible) {
              element[0].style.opacity = 1
              visible = true
            }
          } else {
            if(visible) {
              element[0].style.opacity = 0
              visible = false
            }
          }
        }
      })

      scope.$on('VehicleChange', function() { if(svg && svg.vehicleChanged) svg.vehicleChanged(); } )
      scope.$on('VehicleFocusChanged', function (event, data) {
        if(data.mode === true && svg && svg.vehicleChanged) {
           svg.vehicleChanged()
        }
      })

      scope.$on('$destroy', function () {
        if(svg)
          StreamsManager.remove(svg.getStreams())
      })


    }
  }
}])