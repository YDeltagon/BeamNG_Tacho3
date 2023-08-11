angular.module('beamng.apps')
.directive('bxfinduction', ['$log', 'Utils', function ($log, Utils) {
  return {
    template:
        '<object style="width:100%; height:100%; opacity: 0; box-sizing:border-box; pointer-events: none" type="image/svg+xml" data="/ui/modules/apps/BXFinduction/forcedinduction.svg"></object>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {

      element.on('load', function () {
        var svg = element[0].contentDocument
        svg.roundDec = Utils.roundDec


        element.css({transition:'opacity 0.3s ease'})

        scope.$on('VechicleChange', svg.reset)

        scope.$on('VehicleFocusChanged', function (event, data) {
          if(data.mode == 1 && svg && svg.reset) {
             svg.reset()
          }
        })

        var enabled = false

        scope.$on('streamsUpdate', (ev, streams) => {
          var newEnabled = svg.isStreamValid(streams)
          if (newEnabled) {
            if(newEnabled && !enabled) {
              element[0].style.opacity = 1
            }
            svg.update(streams)
          } else {
            if(!newEnabled && enabled) {
              element[0].style.opacity = 0
            }
          }
          enabled = newEnabled
        })

        svg.wireThroughUnitSystem((val, func) => UiUnits[func](val))

        StreamsManager.add(svg.getStreams())
        scope.$on('$destroy', function () {
          StreamsManager.remove(svg.getStreams())
        })
      })
    }
  }
}])