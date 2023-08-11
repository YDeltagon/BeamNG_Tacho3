class DriveModeText {
    /**
     * 
     * @param {*} textElement 
     * @param {*} textLightness 0 to 100
     */
    constructor(textElement, textLightness) {
        this.textElement = textElement
        this.textLightness = parseInt(textLightness)
        // do not make this a method, it will not work
        this.onClickListener = () => {
            this.onClick() // Need to wrap the function like this to be able to remove the event listener even though the onClick function might have changed
        }
        this.hasInitialized = false
        this.driveModesAreAvaliable = false
    }

    initialize(driveModesObject, bngApi) {
        this.textElement.removeEventListener('mousedown', this.onClickListener)
        this.textElement.innerHTML = ""
        this.driveModesAreAvaliable = false

        if (!driveModesObject) {
            bngApi.activeObjectLua("guihooks.message(\"Tabbyz's Tachometer: Could not get drive mode data. Please press [action=reset_all_physics] to fix.\")")
        } else if (driveModesObject.currentDriveMode.name) {
            this.driveModesAreAvaliable = true
            this.textElement.addEventListener('mousedown', this.onClickListener)
        }
        this.hasInitialized = true
    }

    update(text, color, switchToNextDriveMode) {
        this.onClick = switchToNextDriveMode || (() => {})
        
        let displayText = text;
        if (displayText === 'ESC & TC Off') { displayText = 'Off' }
        if (displayText.split(' ').includes('ESC')) {
            displayText = displayText.split(' ').filter(s => s !== 'ESC').join(' ')
        }

        let shouldUpdateColor = color !== "343434" || displayText === "Off"
        let displayColor = set_hsl_vals_of_rgb_str(color || "ffffff", -1, -1, this.textLightness)

        this.textElement.textContent = displayText
        if (shouldUpdateColor) {
            this.textElement.style.fill = displayColor
        }
    }
}

class FuelGauge {
    constructor(gaugeElement, gaugeBackgroundElement) {
        this.gaugeElement = gaugeElement
        this.gaugeBackgroundElement = gaugeBackgroundElement
        this.maximumCurveLength = gaugeElement.getTotalLength()
    }

    update(normalizedFuelValue) {
        setDashArrayProgressOfPath(this.gaugeElement, normalizedFuelValue, this.maximumCurveLength)
        setDashArrayProgressOfPath(this.gaugeBackgroundElement, 1 - normalizedFuelValue, this.maximumCurveLength)
    }
}

class GearText {
    constructor(textElement) {
        this.textElement = textElement
    }

    update(gearText) {
        let gearDisplayString = gearText
        if (gearDisplayString === 0) { gearDisplayString = 'N' }
        else if (gearDisplayString === -1) { gearDisplayString = 'R' }
        this.textElement.textContent = gearDisplayString
    }
}

class Indicators {
    constructor(leftIndicatorElement, rightIndicatorElement) {
        this.leftIndicatorElement = leftIndicatorElement
        this.rightIndicatorElement = rightIndicatorElement
    }

    update(leftIndicatorIsActive, rightIndicatorIsActive) {
        this.leftIndicatorElement.style.visibility = leftIndicatorIsActive ? 'visible' : 'hidden'
        this.rightIndicatorElement.style.visibility = rightIndicatorIsActive ? 'visible' : 'hidden'
    }

}

class LightsIcons {
    constructor(lowBeamIcon, highBeamIcon) {
        this.lowBeamIcon = lowBeamIcon
        this.highBeamIcon = highBeamIcon
    }

    update(highBeam, lowBeam) {
        let highBeamIsActive = Boolean(highBeam)
        let lowBeamIsActive = Boolean(lowBeam)
        if (highBeamIsActive) {
            this.highBeamIcon.style.visibility = 'visible'  
            this.lowBeamIcon.style.visibility = 'hidden'
        } else if (lowBeamIsActive) {
            this.lowBeamIcon.style.visibility = 'visible'
            this.highBeamIcon.style.visibility = 'hidden'
        } else {
            this.highBeamIcon.style.visibility = 'hidden'
            this.lowBeamIcon.style.visibility = 'hidden'
        }
    }

}

class ShowHideIcon {
    constructor(iconElement) {
        this.iconElement = iconElement
    }
    update(inputValue) {
        this.iconElement.style.visibility = inputValue ? 'visible' : 'hidden'
    }
}

class SpeedTexts {
    constructor(speedTextElement, unitTextElement) {
        this.speedTextElement = speedTextElement
        this.unitTextElement = unitTextElement
    }

    /**
     * @param {Number} speed - In m/s (meters per second).
     */
    update(wheelspeed, airspeed, UiUnits) {
        let speed = wheelspeed
        if (!wheelspeed && !isNaN(airspeed)) { speed = airspeed }
        let UiUnitsResult = UiUnits.speed(speed)
        this.speedTextElement.textContent = Math.round(UiUnitsResult.val)
        this.unitTextElement.textContent = UiUnitsResult.unit
    }
}

class ArcGauge {
    constructor(svgCurve) {
        this.svgCurve = svgCurve
        this.maximumCurveLength = svgCurve.getTotalLength()
        this.hasInitialized = false
    }

    initialize(min, max) {
        this.min = min
        this.max = max
        this.valueRange = max - min
        this.hasInitialized = true
    }

    update(number) {
        number = Math.min(Math.max(this.min, number), this.max)
        let normalized = (number - this.min) / this.max
        let desiredCurveLength = this.maximumCurveLength * normalized
        let dashArray = desiredCurveLength + ',' + this.maximumCurveLength
        this.svgCurve.setAttribute('stroke-dasharray', dashArray)
    }
}

class SignedArcGauges {
    constructor(negArcGaugeElem, posArcGaugeElem) {
        this.negArcGauge = new ArcGauge(negArcGaugeElem)
        this.posArcGauge = new ArcGauge(posArcGaugeElem)
        this.hasInitialized = false
    }

    initialize(min, max) {
        if (!(min < 0 && max > 0)) { throw Error('Min has to be smaller than 0, max has to be bigger than 0') }

        this.negArcGauge.initialize(0, -min)
        this.posArcGauge.initialize(0, max)
        this.hasInitialized = true
    }

    update(number) {
        this.negArcGauge.update(-number)
        this.posArcGauge.update(number)
    }
}

class ArcMarkers {
    constructor(arcMarkersElement, markerDisplayWidth, markerEveryXInputValue, startOffset) {
        this.curveLength = arcMarkersElement.getTotalLength()
        this.arcMarkersElement = arcMarkersElement
        this.markerDisplayWidth = markerDisplayWidth
        this.markerEveryXInputValue = markerEveryXInputValue
        this.hasInitialized = false

        let dashOffset = markerDisplayWidth / 2 - startOffset
        this.arcMarkersElement.setAttribute('stroke-dashoffset', dashOffset)
    }

    initialize(min, max) {
        let range = max - min
        let sectionLength = this.curveLength / (range / (this.markerEveryXInputValue))
        let dashLength = this.markerDisplayWidth
        let noDashLength = sectionLength - dashLength

        this.arcMarkersElement.setAttribute('stroke-dasharray', dashLength + ' ' + noDashLength)

        if (range == 0) {
            this.arcMarkersElement.setAttribute('stroke-dasharray', '0 9999')
        }

        this.hasInitialized = true
    }
}

class DynamicArcMarkers {
    constructor(arcMarkersElement, markerDisplayWidth, smallArcMarkersElement, smallMarkerDisplayWidth, startOffset) {
        this.curveLength = arcMarkersElement.getTotalLength()
        this.smallCurveLength = smallArcMarkersElement.getTotalLength()
        this.arcMarkersElement = arcMarkersElement
        this.smallArcMarkersElement = smallArcMarkersElement
        this.smallMarkerDisplayWidth = smallMarkerDisplayWidth
        this.markerDisplayWidth = markerDisplayWidth
        this.hasInitialized = false

        this.dashOffset = markerDisplayWidth / 2 - startOffset
        this.arcMarkersElement.setAttribute('stroke-dashoffset', this.dashOffset)
    }

    initialize(min, max) {
        let range = max - min
        let exp = Math.log(range) / Math.log(10)
        let sections = Math.pow(10, exp - Math.floor(exp))
        if (sections < 1.5) {
            sections *= 10
        }

        let sectionLength = this.curveLength / sections
        let dashLength = this.markerDisplayWidth
        let noDashLength = sectionLength - dashLength

        this.arcMarkersElement.setAttribute('stroke-dasharray', dashLength + ' ' + noDashLength)

        if (sections < 4 && sections >= 1.5) {
            this.smallArcMarkersElement.setAttribute('stroke-dasharray', this.smallMarkerDisplayWidth + ' ' + noDashLength)
            this.smallArcMarkersElement.setAttribute('stroke-dashoffset', this.dashOffset -sectionLength / 2)

        } else {
            this.smallArcMarkersElement.setAttribute('stroke-dasharray', '0 9999')
        }
        
        this.hasInitialized = true
    }
}

function numberToVisibility(number) {
    return number > 0 ? 'visible' : 'hidden'
}

/**
 * Sets hasInitialized field of each class instance to false
 */
function addToReinitializationQueue(classInstanceArray) {
    classInstanceArray.forEach(classInstance => {
        if (typeof classInstance.hasInitialized !== undefined) {
            classInstance.hasInitialized = false
        } else {
            throw 'Class instance has no hasInitialized property.'
        }
    })
}

function setDashArrayProgressOfPath(path, normalizedValue, maximumCurveLength) {
    let desiredCurveLength = maximumCurveLength * normalizedValue
    let dashArray = desiredCurveLength + ',' + maximumCurveLength
    path.setAttribute('stroke-dasharray', dashArray)
}

/* ------- color functions ------- */
function rgb_str_to_rgb_values(str) {
    str = str.replace('#', '')
    let r = parseInt(str.substring(0, 2), 16)
    let g = parseInt(str.substring(2, 4), 16)
    let b = parseInt(str.substring(4, 6), 16)
    return [r, g, b]
}

function hsl_values_to_hsl_str(h, s, l) {
    return `hsl(${h}, ${s}%, ${l}%)`
}

function rgb_to_hsl(r, g, b) {
    // formulas from https://en.wikipedia.org/wiki/HSL_and_HSV
    r = r / 255
    g = g / 255
    b = b / 255

    let min = Math.min(r, g, b)
    let max = Math.max(r, g, b)
    let range = max - min

    // lightness and saturation
    let l = max * 0.5 + min * 0.5
    let s = range / (1 - Math.abs(2 * l - 1))
    if (l == 0 || l == 1) {s = 0}

    // hue
    let h6 = 0
    if (range == 0) {
        h6 = s = 0
    } else {
        if (max == r) {
            h6 = ((g - b) / range) % 6
        } else if (max == g) {
            h6 = (b - r) / range + 2
        } else if (max == b) {
            h6 = (r - g) / range + 4

        }
    }

    return [h6 * 60 , s * 100, l * 100]

}

/**
 * Use -1 on any of hue, saturation and lighness to keep the value from the color string. 
 * @param {*} str 
 * @param {*} hue 0-360 or -1
 * @param {*} saturation 0-100 or -1
 * @param {*} lightness 0-100 or -1
 * @returns {String} A string with the format `hsl(h, s% l%)`
 */
function set_hsl_vals_of_rgb_str(str, hue, saturation, lightness) {
    let colorValues = rgb_str_to_rgb_values(str)
    let newColorValues = rgb_to_hsl(...colorValues)

    if (hue >= 0) { newColorValues[0] = hue }
    if (saturation >= 0) { newColorValues[1] = saturation }
    if (lightness >= 0) { newColorValues[2] = lightness }

    return hsl_values_to_hsl_str(...newColorValues)
}