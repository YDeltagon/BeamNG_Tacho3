angular.module('beamng.apps')
.directive('torqueCurve2', ['$log', 'CanvasShortcuts',
function ($log, CanvasShortcuts) {
  return {
    template:`
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; color: white; background-color: rgba(0,0,0,0.75);">

        <div style="flex: 0 0 content;">
          <md-input-container style="padding: 0" md-no-ink ng-hide="engines.length <= 1">
            <md-select ng-model="selectedEngine" aria-label="_" ng-change="onEngineSelection()">
              <md-option ng-repeat="eng in engines">{{ eng }}</md-option>
            </md-select>
          </md-input-container>
        </div>

        <div style="position: relative; flex: 1 0 100px; margin: 0.5rem 0.5rem 0 0.5rem;" >
          <canvas style="position: absolute; top: 0; left: 0;"></canvas>
          <canvas style="position: absolute; top: 0; left: 0;"></canvas>
        </div>

        <div style="position: relative; flex: 0 0 content; overflow-x: auto; overflow-y: hidden;" layout="row" layout-align="left center">
          <div layout="row" flex layout-padding style="padding-top:0">
            <table ng-repeat="(key, obj) in config" style="vertical-align: center; font-size: 12px; margin: 0 4px 0 4px; padding: 0 3px 0 3px; border-left: 1px solid grey; border-right: 1px solid grey; border-radius: 2px;">
              <tr>
                <th colspan="2" align="left"><md-checkbox style="line-height: 100%;" md-no-ink ng-change="graph()" ng-model="obj.isPresent" aria-label="_">{{ obj.name }}</md-checkbox></th>
              </tr>
              <tr ng-if="obj.isPresent">
                <td style="display: flex; align-items: center;"><div style="display: inline-block; margin-right: 4px; width: 10px; height: 4px; border-radius: 2px; background-color: {{ ::obj.torque.color }};"></div> {{:: "ui.apps.torquecurve.Torque" | translate}}</td>
                <td style="font-family: monospace">{{ obj.torque.val.toFixed(2) }}/{{ obj.torque.max.toFixed(0) }}</td>
                <td style="font-family: monospace; padding: 0 3px">[{{ obj.torque.units }}]</td>
              </tr>
              <tr ng-if="obj.isPresent">
                <td style="display: flex; align-items: center;"><div style="display: inline-block; margin-right: 4px; width: 10px; height: 4px; border-radius: 2px; background-color: {{ ::obj.power.color }}"></div> {{:: "ui.apps.torquecurve.Power" | translate}}</td>
                <td style="font-family: monospace">{{ obj.power.val.toFixed(2) }}/{{ obj.power.max.toFixed(0) }}</td>
                <td style="font-family: monospace; padding: 0 3px">[{{ obj.power.units }}]</td>
              </tr>
            </table>
          </div>
        </div>

      </div>`,
    replace: true,
    restrict: 'EA',
    link: function (scope, element, attrs) {

      var streamsList = ['engineInfo']
      StreamsManager.add(streamsList)
      scope.$on('$destroy', function () {
        StreamsManager.remove(streamsList)
      })

      var margins = { top: 0, bottom: 0, left: 0, right: 0 }

      var canvasWrapper = element[0].children[1]
      , staticCanvas = canvasWrapper.getElementsByTagName('canvas')[0]
      , sctx = staticCanvas.getContext('2d')
      , dynamicCanvas = canvasWrapper.getElementsByTagName('canvas')[1]
      , dctx = dynamicCanvas.getContext('2d')
      , maxRpm = 1, xFactor = -1
      , torqueData = [], torqueCurve = [], powerData = [], powerCurve = []
      , torqueData_forcedInduction = [], torqueCurve_forcedInduction = [], powerData_forcedInduction = [], powerCurve_forcedInduction = []

      var plotMargins = {top: 15, bottom: 25, left: 25, right: 25}
      var gridParams = {color: 'rgba(255,255,255,0.1)', width: 1}

      scope.config = {}

      var currentVehicle = {
        id: '',
        engines: []
      }

      scope.engineIndex = -1
      scope.engines = []

      scope.selectedEngine = ''

      scope.$on('VehicleChange', () => {
        currentVehicle.id = ''
      })


      scope.$on('TorqueCurveChanged', function (_, data) {
        // console.log('ALL DATA:', data)
        setTimeout(function () {
          if (data.vehicleID !== currentVehicle.id) {
            // console.log('new vehicle!!')
            currentVehicle.id = data.vehicleID
            currentVehicle.engines = []
            scope.engines = []
            scope.engineIndex = -1
            scope.selectedEngine = ''
            // console.log('new vehicle', data.vehicleID)
          }

          if (! currentVehicle.engines.find(engine => engine.name === data.deviceName)) {
            currentVehicle.engines.push({name: data.deviceName, curves: data.curves, maxRPM: data.maxRPM})
            scope.curves = data.curves
            // scope.engines.push({index: currentVehicle.engines.length - 1, name: data.deviceName})
            scope.engines.push(data.deviceName)
            // console.log('new engine:', data.deviceName)
          } else {
            // console.log('already have', data.deviceName)
          }

          scope.$evalAsync(() => {
            if (scope.engineIndex < 0) {
              scope.selectEngine(0)
            }
          })

          scope.graph();

        }, 0)

      })

      scope.onEngineSelection = () => {
        // console.log('changed to engine', scope.selectedEngine)
        var ind = scope.engines.indexOf(scope.selectedEngine)
        if (ind > -1)
          scope.selectEngine(ind)
      }

      scope.selectEngine = (engineIndex) => {
        // console.log('selecting', engineIndex, currentVehicle.engines[engineIndex])
        for (var key in scope.config) {
          scope.config[key].power.data = []
          scope.config[key].power.max = 0
          scope.config[key].torque.data = []
          scope.config[key].torque.max = 0
          scope.config[key].isPresent = false
        }

        maxRpm = currentVehicle.engines[engineIndex].maxRPM
        updateScopeData(currentVehicle.engines[engineIndex].curves)
        scope.engineIndex = engineIndex
        plotStaticGraphs()

        scope.selectedEngine = currentVehicle.engines[engineIndex].name
        scope.engineIndex = engineIndex
      }

      scope.$on('SettingsChanged', function () {
        bngApi.activeObjectLua('controller.mainController.sendTorqueData()')
      })

      var updateScopeData = function (curves) {
        for (let key in scope.config)
          if (!curves.hasOwnProperty(key))
            delete scope.config[key];
        for (var key in curves) {
          var mp = Math.max.apply(Math, curves[key].power),
              mt = Math.max.apply(Math, curves[key].torque)

          scope.config[key] = {
            torque: {
              color: 'white',
              dashArray: curves[key].dash ? curves[key].dash : [],
              width: curves[key].width,
              data: curves[key].torque.map(key => UiUnits.torque(key).val ),
              max: UiUnits.torque(mt).val ,
              units: UiUnits.torque(mp).unit
            },
            power: {
              color: 'red',
              dashArray: curves[key].dash ? curves[key].dash : [],
              width: curves[key].width,
              data: curves[key].power.map(key => UiUnits.power(key).val ),
              max: UiUnits.power(mp).val,
              units: UiUnits.power(mp).unit
            },
            isPresent: key < 2 ? true : false,  // only displays first two curves by default
            name: curves[key].name
          }
        }
      }

      function plotStaticGraphs() {
        xFactor = (dynamicCanvas.width - plotMargins.left - plotMargins.right) / maxRpm
        sctx.clearRect(0, 0, staticCanvas.width, staticCanvas.height)

        var maxPower = 0 , maxTorque = 0

        for (var key in scope.config) {
          if (scope.config[key].isPresent) {
            maxPower  = Math.max(maxPower,  scope.config[key].power.max)
            maxTorque = Math.max(maxTorque, scope.config[key].torque.max)
          }
        }

        var maxPower  = Math.ceil(maxPower / 250) * 250
        var maxTorque = Math.ceil(maxTorque / 250) * 250
        var powerTicks  = Array(6).fill().map((x, i, a) => i * maxPower / (a.length - 1))
        var torqueTicks = Array(6).fill().map((x, i, a) => i * maxTorque / (a.length - 1))
        var rpmTicks    = Array( Math.floor(maxRpm/1000) + 1 ).fill().map((x, i) => i*1000)

        CanvasShortcuts.plotAxis(sctx, 'left',  [0, maxTorque], torqueTicks, plotMargins, {numLines: torqueTicks.length, color: 'lightgrey', dashArray: [2, 3]}, 'white')
        CanvasShortcuts.plotAxis(sctx, 'right', [0, maxPower],  powerTicks,  plotMargins,  null,                          'red')
        CanvasShortcuts.plotAxis(sctx, 'top',     [0, maxRpm],          [], plotMargins,      null)
        CanvasShortcuts.plotAxis(sctx, 'bottom',  [0, maxRpm], rpmTicks, plotMargins, {values: rpmTicks, color: 'lightgrey', dashArray: [2, 3]} , 'white')

        for (let x in scope.config) {
          var cc = scope.config[x]
          if (!cc.isPresent) return
          CanvasShortcuts.plotData(sctx, cc.torque.data, 0, maxTorque, {margin: plotMargins, lineWidth: cc.torque.width, lineColor: cc.torque.color, dashArray: cc.torque.dashArray })
          CanvasShortcuts.plotData(sctx, cc.power.data,  0, maxPower,  {margin: plotMargins, lineWidth: cc.power.width,  lineColor: cc.power.color,  dashArray: cc.power.dashArray  })
        }
      }

      scope.graph = function () {
        setTimeout(() => {
          cvsResize();
          plotStaticGraphs();
        }, 50);
      }

      scope.$on('streamsUpdate', function (event, streams) {
        dctx.clearRect(0, 0, dynamicCanvas.width, dynamicCanvas.height)
        if (streams.engineInfo) {
          var _rpm = streams.engineInfo[4]
        }

        if (_rpm >= maxRpm) { return; }

        var rpmX = plotMargins.left + Math.floor(_rpm * xFactor)

        dctx.beginPath()
        dctx.moveTo(rpmX, plotMargins.top)
        dctx.lineTo(rpmX, dynamicCanvas.height - plotMargins.bottom)

        dctx.lineWidth = 2
        dctx.strokeStyle = 'orange'
        dctx.shadowBlur = 30
        dctx.shadowColor = 'black'
        dctx.stroke()

        var rpmInd = Math.floor(_rpm)
        scope.$evalAsync(function () {
          for (var key in scope.config) {
            if (scope.config[key].isPresent) {
              scope.config[key].power.val = scope.config[key].power.data[rpmInd]
              scope.config[key].torque.val = scope.config[key].torque.data[rpmInd]
            }
          }
        })
      })

      var _ready = false

      function cvsResize() {
        staticCanvas.width = canvasWrapper.clientWidth;
        staticCanvas.height = canvasWrapper.clientHeight;
        // staticCanvas.height = canvasWrapper.offsetHeight+plotMargins.bottom;
        dynamicCanvas.width = canvasWrapper.clientWidth;
        dynamicCanvas.height = canvasWrapper.clientHeight;
        // dynamicCanvas.height = canvasWrapper.offsetHeight+plotMargins.bottom;
      }

      scope.$on('app:resized', function (event, data) {
        // We can use this event as initialization trigger since it is emitted from
        // the app-container for this reason
        cvsResize();

        if (!_ready) {
          _ready = true
          bngApi.activeObjectLua('controller.mainController.sendTorqueData()')
          // setTimeout(() => scope.graph(), 100);
        } else {
          plotStaticGraphs()
        }
      })

      scope.$on('VehicleFocusChanged', function() {
        bngApi.activeObjectLua('controller.mainController.sendTorqueData()')
      })

    }
  }
}])
