[![npm version](https://badge.fury.io/js/codelyzer.svg)](https://badge.fury.io/js/codelyzer)
[![Downloads](https://img.shields.io/npm/dt/codelyzer.svg)](https://img.shields.io/npm/dt/codelyzer.svg)
[![Build Status](https://travis-ci.org/mgechev/codelyzer.svg?branch=master)](https://travis-ci.org/mgechev/codelyzer)
[![Build status](https://ci.appveyor.com/api/projects/status/7xj7qs0a0h0ald53?svg=true)](https://ci.appveyor.com/project/mgechev/codelyzer)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Gitter Chat](https://camo.githubusercontent.com/da2edb525cde1455a622c58c0effc3a90b9a181c/68747470733a2f2f6261646765732e6769747465722e696d2f4a6f696e253230436861742e737667)](https://gitter.im/mgechev/codelyzer)

<p align="center">
  <img src="https://raw.githubusercontent.com/mgechev/codelyzer/master/assets/logo.png" alt="" width="200">
</p>

# codelyzer

A set of tslint rules for static code analysis of Angular TypeScript projects.

You can run the static code analyzer over web apps, NativeScript, Ionic, etc.

**Vote for your favorite feature [here](https://github.com/mgechev/codelyzer/issues?utf8=%E2%9C%93&q=label%3A%22votes+needed%22+sort%3Areactions-%2B1-desc+). For more details about the feature request process see [this document](https://github.com/mgechev/codelyzer/blob/master/CONTRIBUTING.md#-missing-a-feature)**

[![](https://raw.githubusercontent.com/mgechev/codelyzer/master/assets/ngconf.png)](https://youtu.be/bci-Z6nURgE)

## How to use?

### Angular CLI

[Angular CLI](https://cli.angular.io) has support for codelyzer. In order to validate your code with CLI and the custom Angular specific rules just use:

```shell
ng new codelyzer
ng lint
```

Note that by default all components are aligned with the style guide so you won't see any errors in the console.

### Angular Seed

Another project which has out of the box integration with codelyzer is [angular-seed](https://github.com/mgechev/angular-seed). In order to run the linter you should:

```shell
# Skip if you've already cloned Angular Seed
git clone https://github.com/mgechev/angular-seed

# Skip if you've already installed all the dependencies of Angular Seed
cd angular-seed && npm i

# Run all the tslint and codelyzer rules
npm run lint
```

Note that by default all components are aligned with the style guide so you won't see any errors in the console.

### Custom Setup

#### Preset

You can use the [`tslint-angular`](https://github.com/mgechev/tslint-angular) preset. All you need is:

```shell
npm i tslint-angular
```

After that create a `tslint.json` file with the following configuration:

```json
{
  "extends": ["tslint-angular"]
}
```

Run the linter with:

```bash
./node_modules/.bin/tslint -c tslint.json
```

TSLint will now complain that there are rules which require type checking. In order to fix this, use thw `-p` config option:

```bash
./node_modules/.bin/tslint -p tsconfig.json -c tslint.json
```

#### Custom Installation

You can easily use codelyzer with your custom setup:

```shell
npm i codelyzer tslint @angular/compiler @angular/core
```

A. Using codelyzer package in PATH

Create the following `tslint.json` file like:

```json
{
  "extends": ["codelyzer"],
  "rules": {
    "angular-whitespace": [true, "check-interpolation", "check-semicolon"],
    "banana-in-box": true,
    "templates-no-negated-async": true,
    "directive-selector": [true, "attribute", "sg", "camelCase"],
    "component-selector": [true, "element", "sg", "kebab-case"],
    "max-inline-declarations": true,
    "no-life-cycle-call": true,
    "prefer-output-readonly": true,
    "no-conflicting-life-cycle-hooks": true,
    "enforce-component-selector": true,
    "no-queries-parameter": true,
    "prefer-inline-decorator": true,
    "use-input-property-decorator": true,
    "use-output-property-decorator": true,
    "use-host-property-decorator": true,
    "use-view-encapsulation": true,
    "no-attribute-parameter-decorator": true,
    "no-output-named-after-standard-event": true,
    "no-input-rename": true,
    "no-output-rename": true,
    "no-output-on-prefix": true,
    "no-forward-ref": true,
    "no-unused-css": true,
    "use-life-cycle-interface": true,
    "contextual-life-cycle": true,
    "trackBy-function": true,
    "use-pipe-transform-interface": true,
    "component-class-suffix": true,
    "directive-class-suffix": true,
    "pipe-impure": true,
    "i18n": [true, "check-id", "check-text"],
    "template-cyclomatic-complexity": [true, 5],
    "template-conditional-complexity": [true, 4]
  }
}
```

To run TSLint with this setup you can use one of the following alternatives:

1.  Install codelyzer globally `npm install -g codelyzer`

2.  Run TSLint from a package.json script by adding a script like `tslint .` to your package.json, similar to:

```json
"scripts": {
  ...
  "lint": "tslint .",
  ...
},
```

Then run `npm run lint`

B. Using codelyzer from node_modules directory

Now create the following `tslint.json` file where your `node_modules` directory is:

```json
{
  "rulesDirectory": ["node_modules/codelyzer"],
  "rules": {
    "angular-whitespace": [true, "check-interpolation", "check-semicolon"],
    "banana-in-box": true,
    "templates-no-negated-async": true,
    "directive-selector": [true, "attribute", "sg", "camelCase"],
    "component-selector": [true, "element", "sg", "kebab-case"],
    "max-inline-declarations": true,
    "no-life-cycle-call": true,
    "prefer-output-readonly": true,
    "no-conflicting-life-cycle-hooks": true,
    "enforce-component-selector": true,
    "no-queries-parameter": true,
    "prefer-inline-decorator": true,
    "use-input-property-decorator": true,
    "use-output-property-decorator": true,
    "use-host-property-decorator": true,
    "use-view-encapsulation": true,
    "no-attribute-parameter-decorator": true,
    "no-output-named-after-standard-event": true,
    "no-input-rename": true,
    "no-output-rename": true,
    "no-output-on-prefix": true,
    "no-forward-ref": true,
    "no-unused-css": true,
    "use-life-cycle-interface": true,
    "contextual-life-cycle": true,
    "trackBy-function": true,
    "use-pipe-transform-interface": true,
    "component-class-suffix": true,
    "directive-class-suffix": true,
    "pipe-impure": true,
    "i18n": [true, "check-id", "check-text"],
    "template-cyclomatic-complexity": [true, 5],
    "template-conditional-complexity": [true, 4]
  }
}
```

Next you can create a component file in the same directory with name `component.ts` and the following content:

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'codelyzer',
  template: `
    <h1>Hello {{ name }}!</h1>
  `
})
class Codelyzer {
  name: string = 'World';

  ngOnInit() {
    console.log('Initialized');
  }
}
```

As last step you can execute all the rules against your code with tslint:

```shell
./node_modules/.bin/tslint -c tslint.json component.ts
```

You should see the following output:

```text
component.ts[4, 13]: The selector of the component "Codelyzer" should have prefix "sg" (https://goo.gl/cix8BY)
component.ts[12, 3]: Implement lifecycle hook interface OnInit for method ngOnInit in class Codelyzer (https://goo.gl/w1Nwk3)
component.ts[9, 7]: The name of the class Codelyzer should end with the suffix Component (https://goo.gl/5X1TE7)
```

### Editor Configuration

**Note that you need to have tslint plugin install on your editor**.

Codelyzer should work out of the box with Atom but for VSCode you will have to open `Code > Preferences > User Settings`, and enter the following config:

```json
{
  "tslint.rulesDirectory": "./node_modules/codelyzer",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

Now you should have the following result:

![VSCode Codelyzer](http://gifyu.com/images/cd.gif)

Enjoy!

## Changelog

You can find it [here](https://github.com/mgechev/codelyzer/blob/master/CHANGELOG.md).

## Recommended configuration

Below you can find a recommended configuration which is based on the [Angular Style Guide](https://angular.io/styleguide).

```js
{
  // The rule have the following arguments:
  // [ENABLED, "attribute" | "element", "selectorPrefix" | ["listOfPrefixes"], "camelCase" | "kebab-case"]
  "directive-selector": [true, "attribute", ["dir-prefix1", "dir-prefix2"], "camelCase"],
  "component-selector": [true, "element", ["cmp-prefix1", "cmp-prefix2"], "kebab-case"],

  "angular-whitespace": [true, "check-interpolation", "check-semicolon"],

  "use-input-property-decorator": true,
  "use-output-property-decorator": true,
  "use-host-property-decorator": true,
  "no-attribute-parameter-decorator": true,
  "no-input-rename": true,
  "no-output-on-prefix": true,
  "no-output-rename": true,
  "no-forward-ref": true,
  "use-life-cycle-interface": true,
  "use-pipe-transform-interface": true,
  "no-output-named-after-standard-event": true,
  "max-inline-declarations": true,
  "no-life-cycle-call": true,
  "prefer-output-readonly": true,
  "no-conflicting-life-cycle-hooks": true,
  "enforce-component-selector": true,
  "no-queries-parameter": true,
  "prefer-inline-decorator": true,

  // [ENABLED, "SUFFIX"]
  // Where "SUFFIX" is your custom suffix, for instance "Page" for Ionic 2 components.
  "component-class-suffix": [true, "Component"],
  "directive-class-suffix": [true, "Directive"]
}
```

## Rules Status

| Rule                                   |     Status     |
| -------------------------------------- | :------------: |
| `banana-in-box`                        |     Stable     |
| `contextual-life-cycle`                |     Stable     |
| `decorator-not-allowed`                |     Stable     |
| `pipe-impure`                          |     Stable     |
| `templates-no-negated-async`           |     Stable     |
| `no-attribute-parameter-decorator`     |     Stable     |
| `no-forward-ref`                       |     Stable     |
| `no-input-prefix`                      |     Stable     |
| `no-input-rename`                      |     Stable     |
| `no-output-on-prefix`                  |     Stable     |
| `no-output-rename`                     |     Stable     |
| `use-life-cycle-interface`             |     Stable     |
| `use-pipe-decorator`                   |     Stable     |
| `use-pipe-transform-interface`         |     Stable     |
| `use-view-encapsulation`               |     Stable     |
| `component-class-suffix`               |     Stable     |
| `component-selector`                   |     Stable     |
| `directive-class-suffix`               |     Stable     |
| `directive-selector`                   |     Stable     |
| `use-host-property-decorator`          |     Stable     |
| `use-input-property-decorator`         |     Stable     |
| `use-output-property-decorator`        |     Stable     |
| `trackBy-function`                     |     Stable     |
| `import-destructuring-spacing`         |     Stable     |
| `no-output-named-after-standard-event` |     Stable     |
| `max-inline-declarations`              |     Stable     |
| `prefer-output-readonly`               |     Stable     |
| `enforce-component-selector`           |     Stable     |
| `no-life-cycle-call`                   |     Stable     |
| `no-template-call-expression`          |     Stable     |
| `no-queries-parameter`                 |     Stable     |
| `prefer-inline-decorator`              |     Stable     |
| `no-conflicting-life-cycle-hooks`      | _Experimental_ |
| `i18n`                                 | _Experimental_ |
| `no-unused-css`                        | _Experimental_ |
| `angular-whitespace`                   | _Experimental_ |
| `template-cyclomatic-complexity`       | _Experimental_ |
| `template-conditional-complexity`      | _Experimental_ |
| `pipe-naming`                          |  _Deprecated_  |

## Disable a rule that validates Template or Styles

Lint rules can be disabled by adding a marker in TypeScript files. More information [here](https://palantir.github.io/tslint/usage/rule-flags/).

To disable rules that validate templates or styles you'd need to add a marker in the TypeScript file referencing them.

```ts
import { Component } from '@angular/core';

/* tslint:disable:trackBy-function */
@Component({
  selector: 'codelyzer',
  templateUrl: './codelyzer.component.html'
})
class Codelyzer {}
```

## Advanced configuration

Codelyzer supports any template and style language by custom hooks. If you're using Sass for instance, you can allow codelyzer to analyze your styles by creating a file `.codelyzer.js` in the root of your project (where the `node_modules` directory is). In the configuration file can implement custom pre-processing and template resolution logic:

```js
// Demo of transforming Sass styles
var sass = require('node-sass');

module.exports = {
  // Definition of custom interpolation strings
  interpolation: ['{{', '}}'],

  // You can transform the urls of your external styles and templates
  resolveUrl(url, decorator) {
    return url;
  },

  // Transformation of the templates. This hooks is quite useful
  // if you're using any other templating language, for instance
  // jade, markdown, haml, etc.
  //
  // NOTE that this method WILL NOT throw an error in case of invalid template.
  //
  transformTemplate(code, url, decorator) {
    return { code: code, url: url };
  },

  // Transformation of styles. This hook is useful is you're using
  // any other style language, for instance Sass, Less, etc.
  //
  // NOTE that this method WILL NOT throw an error in case of invalid style.
  //
  transformStyle(code, url, decorator) {
    var result = { code: code, url: url };
    if (url && /\.scss$/.test(url)) {
      var transformed = sass.renderSync({ data: code, sourceMap: true, outFile: '/dev/null' });
      result.source = code;
      result.code = transformed.css.toString();
      result.map = transformed.map.toString();
    }
    return result;
  },

  // Custom predefined directives in case you get error for
  // missing property and you are using a template reference
  predefinedDirectives: [{ selector: 'form', exportAs: 'ngForm' }],

  // None = 0b000, Error = 0b001, Info = 0b011, Debug = 0b111
  logLevel: 0b111
};
```

## Contributors

| [<img alt="mgechev" src="https://avatars1.githubusercontent.com/u/455023?v=4&s=117" width="117">](https://github.com/mgechev) | [<img alt="wKoza" src="https://avatars2.githubusercontent.com/u/11403260?v=4&s=117" width="117">](https://github.com/wKoza) | [<img alt="preslavsh" src="https://avatars2.githubusercontent.com/u/6237138?v=4&s=117" width="117">](https://github.com/preslavsh) | [<img alt="rafaelss95" src="https://avatars0.githubusercontent.com/u/11965907?v=4&s=117" width="117">](https://github.com/rafaelss95) | [<img alt="rokerkony" src="https://avatars3.githubusercontent.com/u/156132?v=4&s=117" width="117">](https://github.com/rokerkony) | [<img alt="GregOnNet" src="https://avatars3.githubusercontent.com/u/444278?v=4&s=117" width="117">](https://github.com/GregOnNet) |
| :---------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: |
|                                             [mgechev](https://github.com/mgechev)                                             |                                              [wKoza](https://github.com/wKoza)                                              |                                             [preslavsh](https://github.com/preslavsh)                                              |                                              [rafaelss95](https://github.com/rafaelss95)                                              |                                             [rokerkony](https://github.com/rokerkony)                                             |                                             [GregOnNet](https://github.com/GregOnNet)                                             |

| [<img alt="alan-agius4" src="https://avatars3.githubusercontent.com/u/17563226?v=4&s=117" width="117">](https://github.com/alan-agius4) | [<img alt="kevinphelps" src="https://avatars1.githubusercontent.com/u/7399499?v=4&s=117" width="117">](https://github.com/kevinphelps) | [<img alt="eppsilon" src="https://avatars1.githubusercontent.com/u/5643?v=4&s=117" width="117">](https://github.com/eppsilon) | [<img alt="ghsyeung" src="https://avatars0.githubusercontent.com/u/1243185?v=4&s=117" width="117">](https://github.com/ghsyeung) | [<img alt="csvn" src="https://avatars2.githubusercontent.com/u/8770194?v=4&s=117" width="117">](https://github.com/csvn) | [<img alt="Kobzol" src="https://avatars0.githubusercontent.com/u/4539057?v=4&s=117" width="117">](https://github.com/Kobzol) |
| :-------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------: |
|                                              [alan-agius4](https://github.com/alan-agius4)                                              |                                             [kevinphelps](https://github.com/kevinphelps)                                              |                                            [eppsilon](https://github.com/eppsilon)                                            |                                             [ghsyeung](https://github.com/ghsyeung)                                              |                                             [csvn](https://github.com/csvn)                                              |                                             [Kobzol](https://github.com/Kobzol)                                              |

| [<img alt="lazarljubenovic" src="https://avatars3.githubusercontent.com/u/7661457?v=4&s=117" width="117">](https://github.com/lazarljubenovic) | [<img alt="sagittarius-rev" src="https://avatars0.githubusercontent.com/u/23564517?v=4&s=117" width="117">](https://github.com/sagittarius-rev) | [<img alt="connor4312" src="https://avatars0.githubusercontent.com/u/2230985?v=4&s=117" width="117">](https://github.com/connor4312) | [<img alt="Foxandxss" src="https://avatars2.githubusercontent.com/u/1087957?v=4&s=117" width="117">](https://github.com/Foxandxss) | [<img alt="gbilodeau" src="https://avatars2.githubusercontent.com/u/532543?v=4&s=117" width="117">](https://github.com/gbilodeau) | [<img alt="NagRock" src="https://avatars2.githubusercontent.com/u/5803314?v=4&s=117" width="117">](https://github.com/NagRock) |
| :--------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
|                                             [lazarljubenovic](https://github.com/lazarljubenovic)                                              |                                              [sagittarius-rev](https://github.com/sagittarius-rev)                                              |                                             [connor4312](https://github.com/connor4312)                                              |                                             [Foxandxss](https://github.com/Foxandxss)                                              |                                             [gbilodeau](https://github.com/gbilodeau)                                             |                                             [NagRock](https://github.com/NagRock)                                              |

| [<img alt="Hotell" src="https://avatars0.githubusercontent.com/u/1223799?v=4&s=117" width="117">](https://github.com/Hotell) | [<img alt="Martin-Wegner" src="https://avatars1.githubusercontent.com/u/8995517?v=4&s=117" width="117">](https://github.com/Martin-Wegner) | [<img alt="comfroels" src="https://avatars2.githubusercontent.com/u/4616177?v=4&s=117" width="117">](https://github.com/comfroels) | [<img alt="plantain-00" src="https://avatars0.githubusercontent.com/u/7639395?v=4&s=117" width="117">](https://github.com/plantain-00) | [<img alt="nexus-uw" src="https://avatars2.githubusercontent.com/u/3188890?v=4&s=117" width="117">](https://github.com/nexus-uw) | [<img alt="piyukore06" src="https://avatars0.githubusercontent.com/u/17766092?v=4&s=117" width="117">](https://github.com/piyukore06) |
| :--------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------: |
|                                             [Hotell](https://github.com/Hotell)                                              |                                             [Martin-Wegner](https://github.com/Martin-Wegner)                                              |                                             [comfroels](https://github.com/comfroels)                                              |                                             [plantain-00](https://github.com/plantain-00)                                              |                                             [nexus-uw](https://github.com/nexus-uw)                                              |                                              [piyukore06](https://github.com/piyukore06)                                              |

| [<img alt="alexkpek" src="https://avatars0.githubusercontent.com/u/8692873?v=4&s=117" width="117">](https://github.com/alexkpek) | [<img alt="alisd23" src="https://avatars2.githubusercontent.com/u/5804010?v=4&s=117" width="117">](https://github.com/alisd23) | [<img alt="sneas" src="https://avatars2.githubusercontent.com/u/144651?v=4&s=117" width="117">](https://github.com/sneas) | [<img alt="Gillespie59" src="https://avatars2.githubusercontent.com/u/555768?v=4&s=117" width="117">](https://github.com/Gillespie59) | [<img alt="eromano" src="https://avatars1.githubusercontent.com/u/1030050?v=4&s=117" width="117">](https://github.com/eromano) | [<img alt="Manduro" src="https://avatars0.githubusercontent.com/u/2545042?v=4&s=117" width="117">](https://github.com/Manduro) |
| :------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
|                                             [alexkpek](https://github.com/alexkpek)                                              |                                             [alisd23](https://github.com/alisd23)                                              |                                             [sneas](https://github.com/sneas)                                             |                                             [Gillespie59](https://github.com/Gillespie59)                                             |                                             [eromano](https://github.com/eromano)                                              |                                             [Manduro](https://github.com/Manduro)                                              |

| [<img alt="karol-depka" src="https://avatars1.githubusercontent.com/u/958486?v=4&s=117" width="117">](https://github.com/karol-depka) | [<img alt="leosvelperez" src="https://avatars3.githubusercontent.com/u/12051310?v=4&s=117" width="117">](https://github.com/leosvelperez) | [<img alt="muhammadghazali" src="https://avatars3.githubusercontent.com/u/863947?v=4&s=117" width="117">](https://github.com/muhammadghazali) | [<img alt="PapsOu" src="https://avatars3.githubusercontent.com/u/5792207?v=4&s=117" width="117">](https://github.com/PapsOu) | [<img alt="loktionov129" src="https://avatars1.githubusercontent.com/u/20480552?v=4&s=117" width="117">](https://github.com/loktionov129) | [<img alt="rwlogel" src="https://avatars2.githubusercontent.com/u/3373178?v=4&s=117" width="117">](https://github.com/rwlogel) |
| :-----------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------: |
|                                             [karol-depka](https://github.com/karol-depka)                                             |                                              [leosvelperez](https://github.com/leosvelperez)                                              |                                             [muhammadghazali](https://github.com/muhammadghazali)                                             |                                             [PapsOu](https://github.com/PapsOu)                                              |                                              [loktionov129](https://github.com/loktionov129)                                              |                                             [rwlogel](https://github.com/rwlogel)                                              |

| [<img alt="robzenn92" src="https://avatars0.githubusercontent.com/u/3225625?v=4&s=117" width="117">](https://github.com/robzenn92) | [<img alt="rtfpessoa" src="https://avatars0.githubusercontent.com/u/902384?v=4&s=117" width="117">](https://github.com/rtfpessoa) | [<img alt="scttcper" src="https://avatars3.githubusercontent.com/u/1400464?v=4&s=117" width="117">](https://github.com/scttcper) | [<img alt="lacolaco" src="https://avatars3.githubusercontent.com/u/1529180?v=4&s=117" width="117">](https://github.com/lacolaco) | [<img alt="tmair" src="https://avatars2.githubusercontent.com/u/1596276?v=4&s=117" width="117">](https://github.com/tmair) | [<img alt="cexbrayat" src="https://avatars3.githubusercontent.com/u/411874?v=4&s=117" width="117">](https://github.com/cexbrayat) |
| :--------------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------: |
|                                             [robzenn92](https://github.com/robzenn92)                                              |                                             [rtfpessoa](https://github.com/rtfpessoa)                                             |                                             [scttcper](https://github.com/scttcper)                                              |                                             [lacolaco](https://github.com/lacolaco)                                              |                                             [tmair](https://github.com/tmair)                                              |                                             [cexbrayat](https://github.com/cexbrayat)                                             |

| [<img alt="clydin" src="https://avatars2.githubusercontent.com/u/19598772?v=4&s=117" width="117">](https://github.com/clydin) | [<img alt="reduckted" src="https://avatars0.githubusercontent.com/u/10321525?v=4&s=117" width="117">](https://github.com/reduckted) | [<img alt="someblue" src="https://avatars1.githubusercontent.com/u/5562124?v=4&s=117" width="117">](https://github.com/someblue) |
| :---------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------: |
|                                              [clydin](https://github.com/clydin)                                              |                                              [reduckted](https://github.com/reduckted)                                              |                                             [someblue](https://github.com/someblue)                                              |

## License

MIT
