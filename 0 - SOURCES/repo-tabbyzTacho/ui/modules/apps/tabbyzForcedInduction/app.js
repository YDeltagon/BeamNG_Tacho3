'use strict'

angular.module('beamng.apps')
.directive('tabbyzForcedInduction', [function () {
  return {
    template:
    '<object style="width:100%; height:100%; box-sizing:border-box;" type="image/svg+xml" data="/ui/modules/apps/tabbyzForcedInduction/app.svg"></object>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
        let streams = ['forcedInductionInfo']
        StreamsManager.add(streams)

        scope.$on('$destroy', function () {
            StreamsManager.remove(streams)
        })

        element.on('load', function () {
            let svgDoc = element[0].contentDocument
            let svgElement = element[0]
            
            svgElement.style.opacity = 0

            scope.$on('streamsUpdate', function (event, streams) {
                let streamIsValid = false
                if (streams.forcedInductionInfo) {
                    streamIsValid = true
                }

                if (!streamIsValid) {
                    svgElement.style.opacity = 0
                } else {
                    svgElement.style.opacity = 1
                    svgDoc.onUpdate(streams, UiUnits)
                }
            })
    
            scope.$on('VehicleFocusChanged', function (event, data) {
                svgDoc.onVehicleFocusChanged()
            })
        })
    }
  }
}])