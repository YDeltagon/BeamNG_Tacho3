angular.module('beamng.apps')
.directive('nodeBeamDebug', [function () {
  return {
    template:
    '<div style="height:100%; width:100%;" class="bngApp">' +
      '{{ beams.total }} {{:: "ui.apps.node_beam_info.Beams" | translate}}<br>' +
      ' - {{ beams.deformed.number }}  ({{ beams.deformed.percentage.toFixed(2) }} %) {{:: "ui.apps.node_beam_info.deformed" | translate}}<br>' +
      ' - {{ beams.broken.number }} ({{ beams.broken.percentage.toFixed(2) }} %) {{:: "ui.apps.node_beam_info.broken" | translate}}<br><br>' +
      '{{ numNodes }} {{:: "ui.apps.node_beam_info.Nodes" | translate}}<br>' +
      ' - {{ weight.total}} {{:: "ui.apps.node_beam_info.totalweight" | translate}} <br>' +
      ' - {{ weight.wheels.average}} {{"ui.apps.node_beam_info.per wheel" | translate }}<br>' +
      ' - ({{ weight.wheels.total}} {{:: "ui.apps.node_beam_info.all" | translate}} {{ weight.wheels.count }} {{:: "ui.apps.node_beam_info.wheels" | translate}})<br>' +
      ' - {{ (weight.chassis)}} {{:: "ui.apps.node_beam_info.chassisweight" | translate}}<br><br>' +
      '{{ triCount }} {{:: "ui.apps.node_beam_info.Triangles" | translate}}<br>' +
      ' - {{ (collTriCount)}} {{:: "ui.apps.node_beam_info.collidable" | translate}}<br><br>' +
      '{{ torsionbars.total }} {{:: "ui.apps.node_beam_info.Torsionbars" | translate}}<br>' +
      ' - {{ torsionbars.deformed.number}} ({{ torsionbars.deformed.percentage.toFixed(2) }} %) {{:: "ui.apps.node_beam_info.deformed" | translate}} <br>' +
      ' - {{ torsionbars.broken.number}} ({{ torsionbars.broken.percentage.toFixed(2) }} %) {{:: "ui.apps.node_beam_info.broken" | translate}} <br>' +
    '</div>',
    replace: true,
    restrict: 'EA',
    scope: true,
    controller: ['$log', '$scope', function ($log, $scope) {
      var streamsList = ['stats']
      StreamsManager.add(streamsList)
      $scope.$on('$destroy', function () {
        StreamsManager.remove(streamsList)
      })

      $scope.numNodes = 0
      $scope.weight = {
        total: '',
        wheels: { average: '', total: '', count: ''}
      }

      $scope.beams = {
        total: '-',
        deformed: { number: '', percentage: ''},
        broken: { number: '', percentage: ''}
      }

      $scope.torsionbars = {
        total: '-',
        deformed: { number: '', percentage: ''},
        broken: { number: '', percentage: ''}
      }

      $scope.$on('streamsUpdate', function (event, data) {
        $scope.$evalAsync(function () {
          if (data.stats != null) {
            $scope.beams.total    = data.stats.beam_count
            $scope.beams.deformed = { number: data.stats.beams_deformed, percentage: data.stats.beams_deformed/data.stats.beam_count * 100 }
            $scope.beams.broken   = { number: data.stats.beams_broken, percentage: data.stats.beams_broken/data.stats.beam_count * 100 }

            $scope.numNodes      = data.stats.node_count
            $scope.weight.total  = UiUnits.buildString('weight', data.stats.total_weight, 2)
            $scope.weight.wheels = {
              total: UiUnits.buildString('weight', data.stats.wheel_weight, 2),
              count: data.stats.wheel_count,
              average: UiUnits.buildString('weight', (data.stats.wheel_weight / data.stats.wheel_count), 2)
            }
            $scope.weight.chassis = UiUnits.buildString('weight', data.stats.total_weight - data.stats.wheel_weight, 2)

            $scope.triCount = data.stats.tri_count
            $scope.collTriCount = data.stats.collidable_tri_count

            $scope.torsionbars.total = data.stats.torsionbar_count
            $scope.torsionbars.deformed = { number: data.stats.torsionbars_deformed, percentage: data.stats.torsionbars_deformed/data.stats.torsionbar_count * 100 }
            $scope.torsionbars.broken = { number: data.stats.torsionbars_broken, percentage: data.stats.torsionbars_broken/data.stats.torsionbar_count * 100 }

          }
          else {
            return
          }
        })
      })
    }]
  }
}]);