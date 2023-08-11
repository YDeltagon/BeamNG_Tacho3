'use strict'

class BoostTexts {
    constructor(boostTextElement, boostUnitTextElement) {
        this.boostTextElement = boostTextElement
        this.boostUnitTextElement = boostUnitTextElement
    }

    update(rawBoostAmount, UiUnits) {
        let UiUnitsResult = UiUnits.pressure(rawBoostAmount)
        let boost = UiUnitsResult.val
        let unit = UiUnitsResult.unit
        let roundingNumber = boost < 100 ? 10 : 1
        let boostDisplayNumber = Math.round(boost * roundingNumber) / roundingNumber
        if (roundingNumber == 10) {
            boostDisplayNumber = boostDisplayNumber.toFixed(1) // Forces one decimal, example: 1 converts to 1.0
        }
        this.boostTextElement.textContent = boostDisplayNumber
        this.boostUnitTextElement.textContent = unit
    }
}

let boostArcNegativeElem = document.getElementById('boostCurveNegative')
let boostArcPositiveElem = document.getElementById('boostCurvePositive')
let boostArcs = new SignedArcGauges(boostArcNegativeElem, boostArcPositiveElem)
let boostCurveMarkers = document.getElementById('boostCurveMarkers')
let secondBoostCurveMarkers = document.getElementById('secondBoostCurveMarkers')
let boostArcMarkers = new DynamicArcMarkers(boostCurveMarkers, 0.2, secondBoostCurveMarkers, 0.2, boostArcNegativeElem.getTotalLength())

let boostText = document.getElementById('boostText')
let boostUnitText = document.getElementById('boostUnitText')
let boostTexts = new BoostTexts(boostText, boostUnitText)

let previousPressureUnit;

document.onUpdate = function(streams, UiUnits) {
    let currentPressureUnit = UiUnits.pressure(0).unit;
    if (currentPressureUnit !== previousPressureUnit) {
        // Don't need to reninitialize BoostArcs since they use raw boost, and therefore don't care about the unit
        addToReinitializationQueue([boostArcMarkers])
    }
    
    if (!boostArcs.hasInitialized || !boostArcMarkers.hasInitialized) {
        let rawMinBoostDisplayed = streams.forcedInductionInfo.maxBoost * -(60 / 180)
        let rawMaxBoostDisplayed = streams.forcedInductionInfo.maxBoost * (240 / 180)

        if (!boostArcs.hasInitialized) {
            boostArcs.initialize(rawMinBoostDisplayed, rawMaxBoostDisplayed)
        }
        if (!boostArcMarkers.hasInitialized) {
            let minBoostDisplayed = UiUnits.pressure(rawMinBoostDisplayed).val
            let maxBoostDisplayed = UiUnits.pressure(rawMaxBoostDisplayed).val
            boostArcMarkers.initialize(minBoostDisplayed, maxBoostDisplayed)
        }
    }

    let rawBoost = streams.forcedInductionInfo.boost
    boostTexts.update(rawBoost, UiUnits)
    boostArcs.update(rawBoost)

    previousPressureUnit = currentPressureUnit;
}

document.onVehicleFocusChanged = function() {
    addToReinitializationQueue([boostArcs, boostArcMarkers])
}
