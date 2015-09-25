# Pickment 0.9.0

A minimalistic Angular color picker directive. 

~12 kb minified. Only depends on [TinyColor](https://github.com/bgrins/TinyColor).

## Demo

## Documentation

### Usage

Include Pickment files and dependencies.

```html
<script type="text/javascript" src="tinycolor.js"></script>
<script type="text/javascript" src="pickment.js"></script>
<!-- Color modes are optional, but you need at least one -->
<script type="text/javascript" src="pickment-hue.js"></script>
```

Inject Pickment and one or more Pickment modes into your Angular app:

```javascript
angular.module('app', ['pickment', 'pickment-hue']);
```

Pickment is used with the pickment element with its ng-model holding the CSS color value.

```html
<pickment ng-model="color" preview="true" alpha="true" size="256" mode="hue" format="rgb" position="left top, left top"></pickment>
```

Using the element requires appropriate styles for the pickment class element it's transformed to. For example:

```css
.pickment {
  min-width: 1em;
  min-height: 1em;
  vertical-align: middle;
  display: inline-block;
  cursor: pointer;
}
```

### Options

| Option        | Default              | Explanation  |
| ------------- |----------------------| --- |
| preview       | true                 | Show color preview element |
| alpha         | true                 | Show alpha selection element |
| size          | 256                  | Base size of the picker element |
| mode          | 'hue'                | Color selection mode (hue, brightness or saturation) |
| format        | 'rgb'                | Color format (anything Tinycolor supports) |
| position      | 'left top, left top' | Position and origin of the color picker element |