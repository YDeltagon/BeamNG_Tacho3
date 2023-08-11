angular.module('beamng.apps')
  .directive('simpleGears', ['$log', function ($log) {
    return {
      template:
      '<div style="width:100%; height:100%;" layout="column" layout-align="center center" class="bngApp">' +
      '<span style="font-size:1.3em">{{ bigGear }} {{ ltlGear }}</span>' +
      '<small style="color: rgba(255, 255, 255, 0.8); font-size: 0.75em">{{:: "ui.apps.gears.name" | translate}} ({{ gearboxType | uppercase }})</small>' +
      '</div>',
      replace: true,
      restrict: 'EA',
      link: function (scope, element, attrs) {
        StreamsManager.add(['electrics', 'engineInfo'])

        scope.bigGear = ' - '
        scope.ltlGear = ''

        var gearNames = ['P', 'R', 'N', 'D', '2', '1']

        scope.$on('VehicleReset', function () {
          scope.ltlGear = ' - '
        })

        scope.$on('streamsUpdate', function (event, streams) {
          if (streams.engineInfo != null && streams.electrics != null) {
            scope.gearboxType = streams.engineInfo[13]
            if (scope.gearboxType == 'manual') {
              var mGear = streams.engineInfo[5]
                , maxFGears = streams.engineInfo[6]
                , maxRGears = streams.engineInfo[7]
                , sign = mGear ? (mGear < 0 ? -1 : 1) : 0

              if (sign == -1) scope.bigGear = 'R'
              else if (sign == 1) scope.bigGear = 'F'

              if (mGear > 0) scope.ltlGear = Math.abs(mGear) + '/' + maxFGears
              else if (mGear < 0 && maxRGears > 1) scope.ltlGear = Math.abs(mGear) + '/' + maxRGears
              else if (mGear == 0) {
                scope.ltlGear = ''
                scope.bigGear = 'N'
              }
            } else {
              scope.ltlGear = ''
              scope.bigGear = gearNames[Math.round(streams.electrics.gear_A * 5)]
            }
            scope.$digest()
          }
        })

        scope.$on('$destroy', function () {
          $log.debug('[simple-gears] destroyed')
          StreamsManager.remove(['electrics', 'engineInfo'])
        })
      }
    }
  }]);