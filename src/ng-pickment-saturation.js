// Pickment
// https://github.com/hertzahaeon/pickment
// Mikael Tilly, MIT License

angular.module('pickment-saturation', ['pickment'])
  .run(['pickmentService', function(pickmentService) {
    var mode = function(alphaPatternImage) {
      var commonElementStyles = {
        '-moz-user-select': '-moz-none',
        '-khtml-user-select': 'none',
        '-webkit-user-select': 'none',
        '-o-user-select': 'none',
        'user-select': 'none'
      };
      var positions = {};
      this.elements = {
        preview: {
          display: function (options) {
            return options.preview;
          },
          getSize: function (baseSize) {
            return {
              width: Math.max(16, Math.round(baseSize / 8)),
              height: baseSize
            }
          },
          createElement: function (size) {
            return angular.element('<div />')
                .css(angular.extend({
                  display: 'inline-block',
                  width: size.width + 'px',
                  height: size.height + 'px',
                  cursor: 'pointer'
                }, commonElementStyles));
          },
          createMarker: function () {
            return null
          },
          updateMarker: function () {
            return null
          },
          render: function (el, col) {
            angular.element(el).css('background-color', col.toRgbString());
          },
          getColor: function (x, y, c) {
            return c;
          },
          getPosition: null,
          onSelect: null,
          onPick: function (p) {
            p.close();
          }
        },
        primary: {
          display: function () {
            return true
          },
          getSize: function (baseSize) {
            return {
              width: baseSize,
              height: baseSize
            }
          },
          createElement: function (size) {
            return angular.element('<canvas width="' + size.width + '" height="' + size.height + '"></canvas>')
                .css(angular.extend({
                  cursor: 'crosshair'
                }, commonElementStyles));
          },
          createMarker: function () {
            return angular.element('<div></div>')
                .css({
                  'background-color': 'transparent',
                  margin: '-2.5px 0 0 -2.5px',
                  border: '1px solid white',
                  'border-radius': '50%',
                  'box-shadow': '0 0 1px black',
                  height: '5px',
                  width: '5px',
                  position: 'absolute',
                  top: '0px',
                  left: '0px',
                  'z-index': 100002,
                  display: 'block',
                  'box-sizing': 'border-box',
                  'pointer-events': 'none'
                });
          },
          updateMarker: function (position, markerElement, canvasBounds, pickerBounds) {
            positions.primary = position;
            return markerElement.css({
              left: position.x * canvasBounds.width + canvasBounds.left - pickerBounds.left + 'px',
              top: position.y * canvasBounds.height + canvasBounds.top - pickerBounds.top + 'px'
            })
          },
          render: function (canvas, col) {
            var ctx = canvas.getContext('2d');
            var width = ctx.canvas.clientWidth, height = ctx.canvas.clientHeight;
            var gradientH = ctx.createLinearGradient(0, 0, width, 0);
            var gradientW = ctx.createLinearGradient(0, 0, 0, height);
            for (var h = 0, hstep = 60; h <= 360; h += hstep) {
              gradientH.addColorStop(h / 360, tinycolor({h: h, s: 1, v: 1, a: 1}).toRgbString());
            }
            ctx.fillStyle = gradientH;
            ctx.fillRect(0, 0, width, height);
            gradientW.addColorStop(0, tinycolor('rgb(255, 255, 255)').setAlpha(1 - col.toHsv().s).toRgbString());
            gradientW.addColorStop(1, tinycolor('rgb(0, 0, 0)').toRgbString());
            ctx.fillStyle = gradientH;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = gradientW;
            ctx.fillRect(0, 0, width, height);
          },
          getColor: function (x, y, c) {
            return tinycolor({h: x * 360, s: c.toHsv().s, v: 1 - y});
          },
          getPosition: function (c) {
            var hsv = c.toHsv();
            return {
              x: hsv.h / 360,
              y: 1 - hsv.v
            }
          },
          onSelect: function () {
            return ['preview', 'secondary', 'alpha'];
          },
          onPick: null
        },
        secondary: {
          display: function () {
            return true
          },
          getSize: function (baseSize) {
            return {
              width: Math.max(16, Math.round(baseSize / 8)),
              height: baseSize
            }
          },
          createElement: function (size) {
            return angular.element('<canvas width="' + size.width + '" height="' + size.height + '"></canvas>')
                .css(angular.extend({
                  cursor: 'row-resize'
                }, commonElementStyles));
          },
          createMarker: function () {
            return angular.element('<div></div>')
                .css({
                  'background-color': 'rgba(255, 255, 255, .5)',
                  'margin-top': '-1px',
                  'border-top': '1px solid rgba(0, 0, 0, .5)',
                  'border-bottom': '1px solid rgba(0, 0, 0, .5)',
                  height: '1px',
                  width: '1px',
                  position: 'absolute',
                  top: '0px',
                  left: '0px',
                  'z-index': 100003,
                  display: 'block',
                  'pointer-events': 'none'
                });
          },
          updateMarker: function (position, markerElement, canvasBounds, pickerBounds) {
            return markerElement.css({
              width: canvasBounds.width + 'px',
              left: canvasBounds.left - pickerBounds.left + 'px',
              top: position.y * canvasBounds.height + 'px'
            });
          },
          render: function (canvas, col) {
            var ctx = canvas.getContext('2d');
            var width = ctx.canvas.clientWidth, height = ctx.canvas.clientHeight;
            var gradient = ctx.createLinearGradient(0, 0, 0, height);
            col = col.toHsv();
            gradient.addColorStop(0, tinycolor({h: col.h, s: 1, v: 1, a: 1}).toRgbString());
            gradient.addColorStop(1, tinycolor({h: col.h, s: 0, v: 1, a: 1}).toRgbString());
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
          },
          getColor: function (x, y, c) {
            var hsv = c.toHsv();
            return tinycolor({h: positions.primary.x * 360, s: 1 - y, v: 1-positions.primary.y});
          },
          getPosition: function (c) {
            return {
              x: 0,
              y: 1 - c.toHsv().s
            }
          },
          onSelect: function () {
            return ['preview', 'primary', 'alpha'];
          },
          onPick: null
        },
        alpha: {
          display: function (options) {
            return options.alpha;
          },
          getSize: function (baseSize) {
            return {
              width: Math.max(16, Math.round(baseSize / 8)),
              height: baseSize
            }
          },
          createElement: function (size) {
            return angular.element('<canvas width="' + size.width + '" height="' + size.height + '"></canvas>')
                .css(angular.extend({
                  cursor: 'row-resize'
                }, commonElementStyles));
          },
          createMarker: function () {
            return angular.element('<div></div>')
                .css({
                  'background-color': 'rgba(255, 255, 255, .5)',
                  'margin-top': '-1px',
                  'border-top': '1px solid rgba(0, 0, 0, .5)',
                  'border-bottom': '1px solid rgba(0, 0, 0, .5)',
                  height: '1px',
                  width: '1px',
                  position: 'absolute',
                  top: '0px',
                  left: '0px',
                  'z-index': 100003,
                  display: 'block',
                  'pointer-events': 'none'
                });
          },
          updateMarker: function (position, markerElement, canvasBounds, pickerBounds) {
            return markerElement.css({
              width: canvasBounds.width + 'px',
              left: canvasBounds.left - pickerBounds.left + 'px',
              top: position.y * canvasBounds.height + 'px'
            });
          },
          render: function (canvas, col) {
            var ctx = canvas.getContext('2d');
            var width = ctx.canvas.clientWidth, height = ctx.canvas.clientHeight;
            var pattern;
            var gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, col.setAlpha(1).toRgbString());
            gradient.addColorStop(1, col.setAlpha(0).toRgbString());
            ctx.clearRect(0, 0, width, height);
            pattern = ctx.createPattern(alphaPatternImage, 'repeat');
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
          },
          getColor: function (x, y, c) {
            return tinycolor(c).setAlpha(1 - y);
          },
          getPosition: function (c) {
            return {
              x: 0,
              y: 1 - c.getAlpha()
            };
          },
          onSelect: function () {
            return ['preview'];
          },
          onPick: null
        }
      };
    };
    pickmentService.getResource('alphaPatternImage')
      .then(function(alphaPatternImage) {
        pickmentService.registerMode('saturation', new mode(alphaPatternImage));
      });
  }]);