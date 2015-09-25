// Pickment
// https://github.com/hertzahaeon/pickment
// Mikael Tilly, MIT License

angular.module('pickment', [])
  .value('pickmentConfig', {
    options: {
      defaults: {
        preview: true,
        alpha: true,
        mode: 'hue',
        format: 'hex',
        size: 256,
        position: ['left', 'top', 'left', 'top']
      }
    },
    elements: {
      picker: '<div id="pickmentPicker" tabindex="0"></div>',
      overlay: '<div></div>'
    },
    styles: {
      picker: {
        'background-color': 'transparent',
        outline: 'none',
        position: 'absolute',
        top: '0px',
        left: '0px',
        'z-index': 100001,
        display: 'none',
        'pointer-events': 'none',
        '-moz-user-select': '-moz-none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-o-user-select': 'none',
        'user-select': 'none'
      },
      overlay: {
        'background-color': 'transparent',
        height: '100%',
        width: '100%',
        position: 'fixed',
        top: '0px',
        left: '0px',
        'z-index': 100000,
        display: 'none'
      }
    },
    resources: {
      alphaPatternImage: {
        type: 'image',
        width: 16,
        height: 16,
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABlBMVEX///+AgIBizNOVAAAAE0lEQVR4AWOAAUYoGCCBAbcfCgBFEACB1bzUwAAAAABJRU5ErkJggg=='
      }
    }
  })
  .value('pickmentModes', {})
  .directive('pickment', ['pickmentService', function(pickmentService) {
    return {
      restrict: 'E',
      scope: {
        color: "=ngModel"
      },
      replace: true,
      template: '<div class="pickment" style="background-color: {{color}};" tabindex="0"></div>',
      link: function ($scope, element, attrs) {
        // Open color picker
        element
          .on('click', function() {
            pickmentService.open(element, $scope, $scope.color, attrs);
          })
          .on('keyup', function(e) {
            if (e.keyCode == 13) {
              pickmentService.open(element, $scope, $scope.color, attrs);
            }
          });
        // Receive picked color event
        $scope.$on('pickment.pickcolor', function(event, color) {
          $scope.$apply(function() {
            $scope.color = color;
          });
        })
      }
    };
  }])
  .service('pickmentService', ['$document', '$q', 'pickmentConfig', 'pickmentModes', function($document, $q, pickmentConfig, pickmentModes) {
    var self = this;
    var color, originalColor, pickmentElement, pickerScope;
    var picker, pickerBounds, overlay, elements = {}, markers = {};
    var options;

    // Set up main elements
    picker = angular.element(pickmentConfig.elements.picker)
      .css(pickmentConfig.styles.picker)
      .on('keydown', function(e) {
        switch (e.keyCode) {
          // Select original color and close on escape
          case 27:
            pickColor(originalColor);
            self.close();
            break;
          // Select current color and close on enter
          case 13:
            pickColor(color);
            self.close();
            break;
        }
      });
    overlay = angular.element(pickmentConfig.elements.overlay)
      .css(pickmentConfig.styles.overlay)
      .on('click', function() {
        self.close();
      });
    angular.element(document.body).append(picker).append(overlay);

    /**
     * Load common resources
     *
     * @param {string|string[]} resourceIds - Single resource id or array of ids
     * @returns {promise|promise[]}
     */
    self.getResource = function(resourceIds) {
      var resourceId, resource, promise, promises = [];
      if (!resourceIds) {
        return $q().reject('No resource id provided');
      }
      if (angular.isString(resourceIds)) {
        resourceIds = [resourceIds];
      }
      for (var r = 0, rl = resourceIds.length ; r < rl ; r++) {
        resourceId = resourceIds[r];
        // Defined resource
        if (resourceId in pickmentConfig.resources) {
          resource = pickmentConfig.resources[resourceId];
        // Undefined resource is assumed to be a url to the resource
        } else {
          pickmentConfig.resources[resourceId] = resource = {
            url: resourceId,
            type: null,
            obj: null
          };
          // Determine type based on url file suffix
          switch (resource.url.toLowerCase().substr(resource.url.lastIndexOf('.'))) {
            case '.png':
            case '.jpg':
            case '.gif':
            case '.webp':
            case '.svg':
              resource.type = 'image';
              break;
            default:
              resource.type = 'html';
              break;
          }
        }
        // Return resolved promise with existing cached object
        if ('obj' in resource && resource.obj) {
          promise = (function(obj) {
            return $q.when(obj);
          })(resource.obj);
        // Return promise for loading object
        } else {
          switch (resource.type) {
            case 'image':
              promise = (function(resource) {
                return $q(function(resolve, reject) {
                  resource.obj = new Image(resource.width, resource.height);
                  resource.obj.onerror = reject;
                  resource.obj.onload = function () {
                    resolve(resource.obj)
                  };
                  resource.obj.src = resource.url;
                });
              })(resource);
              break;
            default:
              promise = (function(resource) {
                return $http.get(resource.url)
                  .then(function(response) {
                    resource.obj = response;
                    return response;
                  });
              })(resource);
          }
        }
        promises.push(promise);
      }
      return promises.length == 1 ? promises[0] : $q.all(promises);
    };

    /**
     * Register color picker mode
     *
     * @param {string} id
     * @param {Object} definition
     */
    self.registerMode = function(id, definition) {
      pickmentModes[id] = definition;
    };

    /**
     * Build & format options object from current and default options
     *
     * @param {Object} current
     * @param {Object} defaults
     * @returns {Object}
     */
    function getOptions(current, defaults) {
      var options = {};
      // Filter & combine with defaults
      for (var opt in defaults) {
        if (defaults.hasOwnProperty(opt)) {
          options[opt] = current[opt] ? current[opt] : defaults[opt];
        }
      }
      // Default to original color format
      options.format = options.format || color.getFormat();
      // Limit minimum size
      options.size = Math.max(32, parseInt(options.size, 10));
      // Parse booleans
      options.preview = typeof options.preview == "string" ? options.preview == "true" : options.preview;
      options.alpha = typeof options.alpha == "string" ? options.alpha == "true" : options.alpha;
      // Parse position string
      options.position = options.position
        .toLowerCase()
        .trim()
        .replace(',', ' ')
        .replace(/\s+/g, ' ')
        .split(' ')
        .concat([null, null, null, null])
        .slice(0, 4)
        .map(function(pos, i) {
          return pos ? pos : pickmentConfig.options.defaults.position[i];
        })
        .map(function(pos) {
          switch (pos) {
            case 'left':
            case 'top':
              return 0.0;
            case 'center':
            case 'middle':
              return 0.5;
            case 'right':
            case 'bottom':
              return 1.0;
            default:
              return isFinite(parseFloat(pos)) ? (parseFloat(pos) / 100) : 0.0;
          }
        });
      return options;
    }

    /**
     * Set up dimensions, position & show picker
     *
     * @return {Object} - Picker client bounding rectangle object
     */
    function positionPicker() {
      var pickerDimensions = {width: 0, height: 0, left: 0, top: 0};
      var pickmentElementBounds = pickmentElement[0].getBoundingClientRect();
      // Calculate dimensions from all canvases
      angular.forEach(pickmentModes[options.mode].elements, function(m) {
        if (m.display(options)) {
          var s = m.getSize(options.size);
          pickerDimensions.width += s.width;
          pickerDimensions.height = Math.max(pickerDimensions.height, s.height);
        }
      });
      // Base positioning
      pickerDimensions.left = pickmentElementBounds.left + window.scrollX;
      pickerDimensions.top = pickmentElementBounds.top + window.scrollY;
      // Origin positioning
      pickerDimensions.left += pickmentElementBounds.width * options.position[2];
      pickerDimensions.top += pickmentElementBounds.height * options.position[3];
      // Main positioning
      pickerDimensions.left -= pickerDimensions.width * options.position[0];
      pickerDimensions.top -= pickerDimensions.height * options.position[1];
      // Keep picker inside document viewport
      if (pickerDimensions.left + pickerDimensions.width > window.innerWidth) {
        pickerDimensions.left = window.innerWidth - pickerDimensions.width;
      }
      if (pickerDimensions.left < 0) {
        pickerDimensions.left = 0;
      }
      if (pickerDimensions.top + pickerDimensions.height  > window.innerHeight) {
        pickerDimensions.top = window.innerHeight - pickerDimensions.height;
      }
      if (pickerDimensions.top < 0) {
        pickerDimensions.top = 0;
      }
      // Position & show picker & overlay
      picker.css({
        height: pickerDimensions.height + 'px',
        width: pickerDimensions.width + 'px',
        left: pickerDimensions.left + 'px',
        top: pickerDimensions.top + 'px',
        display: 'block'
      });
      overlay.css({display: 'block'});
      return picker[0].getBoundingClientRect();
    }

    /**
     * Open color picker
     *
     * @param {object} el - Picker element
     * @param {object} $scope - Scope for the picker
     * @param {string|object} col - Color string definition or Tinycolor object with current color
     * @param {object} opts - Configuration object
     */
    self.open = function(el, $scope, col, opts) {
      pickmentElement = el;
      pickerScope = $scope;

      color = tinycolor(col);
      if (!color.isValid()) {
        color = tinycolor({r: 255, g: 0, b: 0, a: 1});
      }
      originalColor = tinycolor(color.toString());

      options = getOptions(opts, pickmentConfig.options.defaults);

      pickerBounds = positionPicker();

      if (options.mode in pickmentModes) {
        render(pickmentModes[options.mode]);
      } else {
        console.error('No \'' + options.mode + '\' mode defined for Pickment.');
        self.close();
      }

      // Focus on picker to receive keyboard events
      picker[0].focus();

      // Emit open event with a reference to the close method
      $scope.$emit('pickment.open', {
        close: self.close
      });
    };

    /**
     * Clean up and close picker
     */
    self.close = function() {
      picker.css({display: 'none'});
      overlay.css({display: 'none'}).off('mousedown mouseup mousemove');
      angular.forEach(elements, function(c) {c.remove()});
      angular.forEach(markers, function(m) {if (m) m.remove()});
      elements = {};
      markers = {};
      pickmentElement = null;
      pickerScope.$emit('pickment.close');
      pickerScope = null;
    };

    /**
     * Set up and render canvases
     *
     * @param {Object} mode - Picker mode configuration
     */
    function render(mode) {
      var activeElement = null, elementBounds = [];
      // Render & set up canvases
      for (var elementType in mode.elements) {
        if (mode.elements.hasOwnProperty(elementType) && mode.elements[elementType].display(options)) {
          elements[elementType] = mode.elements[elementType].createElement(elements[elementType] = mode.elements[elementType].getSize(options.size));
          elements[elementType][0].dataset.elementType = elementType;
          elements[elementType].css('pointer-events', 'auto');
          picker.append(elements[elementType]);
          elementBounds[elementType] = elements[elementType][0].getBoundingClientRect();
          markers[elementType] = mode.elements[elementType].createMarker();
          if (markers[elementType]) {
            picker.append(markers[elementType]);
            mode.elements[elementType].updateMarker(mode.elements[elementType].getPosition(color), markers[elementType], elementBounds[elementType], pickerBounds);
          }

          // Element events
          elements[elementType]
            .on('mousemove mouseup', function (event) {
              var eType = event.target.dataset.elementType;
              if (activeElement == eType) {
                onPick(mode, event, eType, elementBounds[eType], false);
              }
            })
            .on('mousedown', function (event) {
              activeElement = event.target.dataset.elementType;
              angular.forEach(elements, function(el, type) {
                if (type != activeElement) {
                  el.css('pointer-events', 'none');
                }
              });
            })
            .on('mouseup', function (event) {
              onPickStop(mode, elements, event.target.dataset.elementType);
              activeElement = null;
            });
          mode.elements[elementType].render(elements[elementType][0], tinycolor(color.toString()));
        }
      }
      // Overlay events
      overlay
        .on('mousemove mouseup', function (event) {
          if (activeElement) {
            onPick(mode, event, activeElement, elementBounds[activeElement], true);
          }
        })
        .on('mouseup', function () {
          onPickStop(mode, elements, activeElement);
          activeElement = null;
        });
      // Document events, for detecting if pointer leaves window
      $document.on('mouseout', function(e) {
        if (e.target.nodeName == 'HTML') {
          onPickStop(mode, elements, activeElement);
          activeElement = null;
        }
      });
    }

    /**
     * Stop picking color
     *
     * @param {Object} mode
     * @param {Object} elements
     * @param {string} activeElement
     */
    function onPickStop(mode, elements, activeElement) {
      if (activeElement && mode.elements[activeElement].onPick) {
        mode.elements[activeElement].onPick(self);
      }
      // Activate mouse events for all elements
      angular.forEach(elements, function(el) {
        el.css('pointer-events', 'auto');
      });
    }

    /**
     * Element pick event
     *
     * @param {Object} mode - Current mode object
     * @param {Object} event
     * @param {string} elementType
     * @param {Object} canvasBounds
     * @param {boolean} [clampCoordinates] - Restrict coordinates to element?
     */
    function onPick(mode, event, elementType, canvasBounds, clampCoordinates) {
      var x, y, updateCanvases;
      // Calculate coordinates
      if (clampCoordinates) {
        // Clamp coordinates to current canvas
        x = Math.min(Math.max(event.clientX, canvasBounds.left), canvasBounds.left + canvasBounds.width) - canvasBounds.left;
        y = Math.min(Math.max(event.clientY, canvasBounds.top), canvasBounds.top + canvasBounds.height) - canvasBounds.top;
      } else {
        x = event.clientX - canvasBounds.left;
        y = event.clientY - canvasBounds.top;
      }
      // Update marker
      if (markers[elementType]) {
        mode.elements[elementType].updateMarker({x: x / canvasBounds.width , y: y / canvasBounds.height}, markers[elementType], canvasBounds, pickerBounds);
      }
      // Pick color
      color = mode.elements[elementType].getColor(x / canvasBounds.width, y / canvasBounds.height, tinycolor(color.toString()));
      pickColor(color);
      // Update other canvases
      if (mode.elements[elementType].onSelect) {
        updateCanvases = mode.elements[elementType].onSelect();
        if (updateCanvases) {
          updateCanvases.forEach(function(updateCanvas) {
            if (mode.elements[updateCanvas].display(options)) {
              mode.elements[updateCanvas].render(elements[updateCanvas][0], tinycolor(color.toString()));
            }
          });
        }
      }
    }

    /**
     * Pick and output a color
     *
     * @param {object} col - Tinycolor color object
     * @return {string} - Formatted color string
     */
    function pickColor(col) {
      var output, outputMethod = 'to' + options.format.substr(0, 1).toUpperCase() + options.format.substr(1).toLowerCase() + 'String';
      if (outputMethod in col) {
        output = col[outputMethod]();
        // Emit color pick event with color value
        pickerScope.$emit('pickment.pickcolor', output);
      }
      return output;
    }
  }]);