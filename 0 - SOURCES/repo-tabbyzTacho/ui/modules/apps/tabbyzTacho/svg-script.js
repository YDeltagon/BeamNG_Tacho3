'use strict'

let driveModeText = new DriveModeText(document.getElementById('driveModeText'), 70)
let fuelGauge = new FuelGauge(document.getElementById('fuelGauge'), document.getElementById('fuelGaugeBackground'))
let gearText = new GearText(document.getElementById('gearText'))
let pBrake = new ShowHideIcon(document.getElementById('pBrakeIcon'))
let tachometerArc = new ArcGauge(document.getElementById('rpmCurve'))
let tachometerArcMarkers = new ArcMarkers(document.getElementById('rpmCurveMarkers'), 0.5, 1000, 0)

let absIcon = new ShowHideIcon(document.getElementById('absIcon'))
let escIcon = new ShowHideIcon(document.getElementById('escIcon'))
let tcIcon = new ShowHideIcon(document.getElementById('tcIcon'))

let leftSignalIcon = document.getElementById('leftSignalIcon')
let rightSignalIcon = document.getElementById('rightSignalIcon')
let indicators = new Indicators(leftSignalIcon, rightSignalIcon)

let lowBeamIcon = document.getElementById('lowBeamIcon')
let highBeamIcon = document.getElementById('highBeamIcon')
let lightIcons = new LightsIcons(lowBeamIcon, highBeamIcon)

let speedText = document.getElementById('speedText')
let speedUnitText = document.getElementById('speedUnitText')
let speedTexts = new SpeedTexts(speedText, speedUnitText)


document.onUpdate = function(streams, UiUnits, switchToNextDriveMode, bngApi) {
    let maxRpmDisplayed = streams.engineInfo[1] * (300 / 240)
    if (!tachometerArc.hasInitialized) { tachometerArc.initialize(0, maxRpmDisplayed) }
    if (!tachometerArcMarkers.hasInitialized) { tachometerArcMarkers.initialize(0, maxRpmDisplayed) }
    if (!driveModeText.hasInitialized) { driveModeText.initialize(streams.driveModesInfo, bngApi) }

    indicators.update(streams.electrics.signal_L, streams.electrics.signal_R)
    fuelGauge.update(streams.electrics.fuel)
    gearText.update(streams.engineInfo[5])
    lightIcons.update(streams.electrics.highbeam, streams.electrics.lowbeam)
    pBrake.update(streams.electrics.parkingbrake)
    speedTexts.update(streams.electrics.wheelspeed, streams.electrics.airspeed, UiUnits)
    tachometerArc.update(streams.electrics.rpmTacho)

    absIcon.update(streams.electrics.absActive)
    escIcon.update(streams.electrics.escActive)
    tcIcon.update(streams.electrics.tcsActive)

    if (driveModeText.hasInitialized && driveModeText.driveModesAreAvaliable) {
        let color = streams.driveModesInfo.currentDriveMode.color
        let name = streams.driveModesInfo.currentDriveMode.name
        driveModeText.update(name, color, switchToNextDriveMode)
    }
}

document.onVehicleFocusChanged = function() {
    addToReinitializationQueue([driveModeText, tachometerArc, tachometerArcMarkers])
}
