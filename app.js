'use strict';  // Enforces strict mode in JavaScript

// Define a new AngularJS module for the BeamNG app
angular.module('beamng.apps')
.directive('Tacho2+', [function () {
  return {
    // Define the template for the directive, which is an SVG object
    template:
        '<object style="width:100%; height:100%; box-sizing:border-box; pointer-events: none" type="image/svg+xml" data="/ui/modules/apps/Tacho2+/tacho.svg"></object>',
    replace: true,  // Replace the directive with the template
    restrict: 'EA',  // Restrict the directive to elements and attributes

    // Link function to add behavior to the directive
    link: function (scope, element, attrs) {
      element.css({transition:'opacity 0.3s ease'});  // Add a transition effect to the opacity
      let visible = false;  // Track if the SVG is visible
      let initialized = false;  // Track if the SVG has been initialized
      let svg;  // Reference to the SVG element

      // Event listener for when the SVG is loaded
      element.on('load', function () {
        svg = element[0].contentDocument;  // Update the reference to the SVG
        svg.wireThroughUnitSystem((val, func) => UiUnits[func](val));  // Wire the SVG through the unit system
      });

      // Event listener for the first time the SVG is loaded
      element.one('load', function(){
        var svg = element[0].contentDocument;  // Get a reference to the SVG
        StreamsManager.add(svg.getStreams());  // Add the SVG streams to the StreamsManager
      });

      // Event listener for when streams are updated
      scope.$on('streamsUpdate', function (event, streams) {
        if(svg) {
          if (svg.update(streams)) {  // Update the SVG with the new streams
            if(!visible) {
              element[0].style.opacity = 1;  // Make the SVG visible
              visible = true;
            }
          } else {
            if(visible) {
              element[0].style.opacity = 0;  // Hide the SVG
              visible = false;
            }
          }
        }
      });

      // Event listener for when the vehicle changes
      scope.$on('VehicleChange', function() { if(svg && svg.vehicleChanged) svg.vehicleChanged(); });

      // Event listener for when the vehicle focus changes
      scope.$on('VehicleFocusChanged', function (event, data) {
        if(data.mode === true && svg && svg.vehicleChanged) {
           svg.vehicleChanged();  // Notify the SVG that the vehicle focus has changed
        }
      });

      // Cleanup when the directive is destroyed
      scope.$on('$destroy', function () {
        if(svg)
          StreamsManager.remove(svg.getStreams());  // Remove the SVG streams from the StreamsManager
      });
    }
  };
}]);