'use strict'

angular.module('beamng.apps')
.directive('tabbyzTacho', [function () {
  return {
    template:
    '<object style="width:100%; height:100%; box-sizing:border-box;" type="image/svg+xml" data="/ui/modules/apps/tabbyzTacho/app.svg"></object>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
        let streams = ['driveModesInfo', 'electrics', 'engineInfo']
        let driveModeColor
        let switchToNextDriveMode
        StreamsManager.add(streams)

        scope.$on('$destroy', function () {
            StreamsManager.remove(streams)
        })

        scope.$on('ChangePowerTrainButtons', function (event, data) {
            if (data.color && !data.ringValue) {
                driveModeColor = data.color
                switchToNextDriveMode = () => {
                    bngApi.activeObjectLua(data.onClick)
                }
            }
        })

        element.on('load', function () {
            let svgDoc = element[0].contentDocument
            let svgElement = element[0]
            svgElement.style.opacity = 0

            scope.$on('streamsUpdate', function (event, streams) {
                let streamsAreValid = streams.electrics && streams.engineInfo && streams.engineInfo[1]
                if (streamsAreValid) {
                    svgElement.style.opacity = 1
                    if (streams.driveModesInfo) {
                        streams.driveModesInfo.currentDriveMode.color = driveModeColor
                    }
                    svgDoc.onUpdate(streams, UiUnits, switchToNextDriveMode, bngApi)
                } else {
                    svgElement.style.opacity = 0
                }
            })
    
            scope.$on('VehicleFocusChanged', function (event, data) {
                svgDoc.onVehicleFocusChanged()
            })
        })
    }
  }
}])