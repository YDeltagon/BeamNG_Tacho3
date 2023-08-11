angular.module('beamng.apps')
.directive('simpleEngineDebug', [function () {
  return {
    template:
    '<div style="height:100%; width:100%;" class="bngApp">' +
      'Engine RPM: {{ streams.engineInfo[4].toFixed() }}<br />' +
      'Gear: {{ gearText }}<br />' +
      'Flywheel Torque: {{ display.eTorque }}<br />' +
      'Wheel Torque: {{ display.wTorque }}<br />' +
      'Flywheel Power: {{ display.power }}<br />' +
      'Wheel Power: {{ display.wheelPower }}<br />' +
      'Airspeed: {{ display.airspeed }} <br />' +
      'Fuel: {{ display.fuel1 }} / {{ display.fuel2}}, {{((streams.engineInfo[11]/streams.engineInfo[12])*100).toFixed(2)}}%<br />' +
      'Consumption: {{display.consumption}} <br />' +
      'Range: {{ display.range }} <br />' +
      'BSFC: {{ display.bsfc }} <br />' +
      'Load: {{ display.load }}' +
    '</div>',
    replace: true,
    restrict: 'EA',
    scope: true,
    controller: ['$log', '$scope', function ($log, $scope) {
      var streamsList = ['engineInfo', 'electrics']
      StreamsManager.add(streamsList)

      $scope.$on('$destroy', function () {
        StreamsManager.remove(streamsList)
      })

      $scope.display = {
        eTorque: '',
        wTorque: '',
        power: '',
        wheelPower: '',
        airspeed: '',
        fuel1: '',
        fuel2: '',
        consumption: '',
        range: '',
        bsfc: '',
        load: ''
      }

      $scope.gearText = ''
      var curTime = 0
      var timer = 0
      var previousFuel = 0
      $scope.fuelConsumptionRate = 0

      $scope.display2 = {  // metric
            factors: [1, 1, 1, 3.6, 1, 1000, 1, 1, 1],
            units: ['N m', 'N m', 'kW', 'km/h', 'L', 'L/100km', 'km', 'g/s/W','']
        }
        $scope.metric = true

      $scope.$on('streamsUpdate', function (event, streams) {
        $scope.$evalAsync(function () {
          if (!streams.engineInfo || !streams.electrics) { return }

          $scope.streams = streams
            $scope.display.power = UiUnits.buildString('power', streams.engineInfo[21], 2)
            $scope.display.wheelPower = UiUnits.buildString('power', streams.engineInfo[20], 2)
            $scope.display.eTorque = UiUnits.buildString('torque', streams.engineInfo[8], 0)
            $scope.display.wTorque = UiUnits.buildString('torque', streams.engineInfo[19], 0)
            $scope.display.airspeed = UiUnits.buildString('speed', streams.electrics.airspeed, 0)
            $scope.display.fuel1 = UiUnits.buildString('volume', streams.engineInfo[11], 2)
            $scope.display.fuel2 = UiUnits.buildString('volume', streams.engineInfo[12], 2)
            $scope.display.bsfc = streams.engineInfo[15]
            $scope.display.load = streams.engineInfo[18].toFixed(2)

            var gear = streams.engineInfo[16]

            if (gear > 0)
                $scope.gearText = 'F ' + gear + ' / ' + streams.engineInfo[6]
            else if (gear < 0)
                $scope.gearText = 'R ' + Math.abs(gear) + ' / ' + streams.engineInfo[7]
            else
                $scope.gearText = 'N'

            var prevTime = curTime
            curTime  = performance.now()
            var dt = (curTime - prevTime)/1000

            var fuelConsumptionRate
            timer += dt
            if(timer >= 1) {
              if (previousFuel > streams.engineInfo[11] && (previousFuel - streams.engineInfo[11]) > 0.0002) {
                fuelConsumptionRate = (previousFuel - streams.engineInfo[11]) / (timer * streams.electrics.wheelspeed); // l/(s*(m/s)) = l/m
              } else {
                fuelConsumptionRate = 0
              }
              previousFuel = streams.engineInfo[11]
              $scope.display.range = fuelConsumptionRate > 0 ? UiUnits.buildString('distance', streams.engineInfo[11] / fuelConsumptionRate, 2) : (streams.electrics.wheelspeed > 0.1 ? 'Infinity' : UiUnits.buildString('distance', 0))
              timer = 0
              $scope.display.consumption = UiUnits.buildString('consumptionRate', fuelConsumptionRate, 2)
              // TODO: improve logic below ...
              if($scope.display.consumption == 'n/a') {
                $scope.display.range = 'n/a'
              }
            }
        })
      })
    }]
  }
}])
