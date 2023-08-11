(function () {
  'use strict'

  angular.module('beamng.apps')

    .directive('simpleTrip', [function () {
      return {
        template: '<div class="bngApp" style="width:100%; height:100%; cursor: pointer;" layout="column" ng-click="changeMode()">' +
        '<div flex layout="column" layout-align="center center">' +
        '<span style="font-weight:bold; font-size:1.2em">{{ text }}</span>' +
        '</div>' +
        '<small style="text-align:center">{{display | translate}}</small>' +
        '<span style="position:absolute; top:2px; right: 2px" class="material-icons" ng-click="resetEvent($event)">autorenew</span>' +
        '</div>',

        link: function (scope, element, attrs) {
          bngApi.activeObjectLua('extensions.load("simpleTripApp");')

          var totalDistance = 0
            , range = 0
            , avgSpeed = 0
            , fuelConsumptionRate = 0
            , avgFuelConsumptionRate = 0

          scope.$on('VehicleFocusChanged', function (event, data) {
            // Load extension in new vehicle
            bngApi.activeObjectLua('extensions.load("simpleTripApp");')
            scope.reset()
          })

          // scope.$on('$destroy', () => {
          //   bngApi.activeObjectLua('extensions.unload("simpleTripApp");')
          // })

          scope.reset = function ($event) {
            totalDistance = 0
            range = 0
            avgSpeed = 0
            fuelConsumptionRate = 0
            avgFuelConsumptionRate = 0

            bngApi.activeObjectLua('if simpleTripApp then simpleTripApp.reset() end')
            scope.updateText()
          }

          scope.resetEvent = function ($event) {
            scope.reset()
            $event.stopPropagation()
          }

          var mode = parseInt(localStorage.getItem('apps:simpleTrip.mode')) || 0

          scope.updateText = function() {
            switch (mode) {
              case 0:
                scope.text = UiUnits.buildString('distance', totalDistance, 1)
                break

              case 1:
                scope.text = UiUnits.buildString('speed', avgSpeed, 1)
                break

              case 2:
                scope.text = UiUnits.buildString('consumptionRate', avgFuelConsumptionRate, 1)
                break

              case 3:
                scope.text = UiUnits.buildString('consumptionRate', fuelConsumptionRate, 1)
                break

              case 4:
                if (range == Infinity || range == -Infinity) {
                  scope.text = Infinity
                } else {
                  scope.text = UiUnits.buildString('distance', range, 1)
                }
                break
            }
          }

          scope.changeMode = function (targetMode) {
            if (targetMode !== undefined)
              mode = targetMode
            else
              mode = (mode + 1) % 5

            switch (mode) {
              case 0: scope.display = "ui.apps.trip_computer.TotalDistance"; break
              case 1: scope.display = "ui.apps.trip_computer.AVGSpeed"; break
              case 2: scope.display = "ui.apps.trip_computer.AVGFuelConsu"; break
              case 3: scope.display = "ui.apps.trip_computer.FuelConsumption"; break
              case 4: scope.display = "ui.apps.trip_computer.Range"; break
            }

            scope.updateText()
          }

          scope.$on('tripData', function (event, data) {
            totalDistance = data.totalDistance
            avgSpeed = data.avgSpeed
            avgFuelConsumptionRate = data.avgFuelConsumptionRate
            fuelConsumptionRate = data.fuelConsumptionRate
            range = data.range
            scope.updateText()
          })

          // run on launch
          scope.changeMode(mode)
          setTimeout(function () {
            bngApi.engineLua('settings.notifyUI()')
          }, 500)
        }
      }
    }])
})();
