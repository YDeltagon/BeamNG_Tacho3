angular.module('beamng.apps')
.directive('simpleDigSpeedoAir', [function () {
  return {
    template: '<div><simpledigitalspeedoair></simpledigitalspeedoair></div>',
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {
      let vueApp = createVueApp()
      vueApp.component('simpledigitalspeedoair', {
        mixins: [BeamNGBaseAppMixin],
        inject: ['GStore'],
        template:
        /*html*/
        `
        <div style="width:100%; height:100%;" class="bngApp" layout="column">
          <div style="display:flex; justify-content: center; align-items: baseline;">
            <span style="font-size:1.3em; font-weight:bold;">
              <span style="color: rgba(255, 255, 255, 0.8)"> {{speed.leadingZeros}}</span>
              <span>{{speed.val}}</span>
            </span>
            <span style="font-size:0.9em; font-weight:bold; margin-left:2px">{{speed.unit}}</span>
          </div>
          <small style="text-align:center; color: rgba(255, 255, 255, 0.8); font-size: 0.75em">{{ $t('ui.apps.digSpeedoAir.airspeed') }}</small>
        </div>
        `,
        data: function() {
          return {
            streams: ['electrics']
          }
        },
        computed: {
          speed() {
            if(this.GStore.streams === undefined) return {val:0, unit:'', leadingZeros: ''}
            let speedMs = this.GStore.streams.electrics.airspeed
            let res = UiUnits.speed(speedMs)
            res.val = res.val.toFixed().slice(-4)
            if (!isNaN(res.val)) {
              res.leadingZeros = ('0000').slice(res.val.length)
            }
            return res
          },
        },
      })
      vueApp.mount(element[0])
      scope.$on('$destroy', function () {
        vueApp.unmount()
      })
    }
  }
}])
