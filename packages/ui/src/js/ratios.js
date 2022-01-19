/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import * as Leo from '@adobe/leonardo-contrast-colors';
import * as d3 from './d3';
import {
  getContrastRatioInputs, 
  getThemeContrastRatios,
  getLuminosities
} from './getThemeData';
import {_theme} from './initialTheme';
import {createOutputColors} from './createOutputColors';
import {createOutputParameters} from './createOutputParameters';
import {
  createRatioChart, 
  createLuminosityChart
} from './createRatioChart';
import {
  randomId,
  round,
  lerp
} from './utils';

function addRatio() {
  // Gather all existing ratios from _theme
  let themeRatios = getContrastRatioInputs();
  // find highest value
  var hi = Math.max(...themeRatios);
  // Assign an incremented value for the new ratio
  let value;
  if(hi < 20) value = Number(hi + 1).toFixed(2);
  if(hi == 21) value = Number(hi - 1).toFixed(2);
  // Add new value to array of existing ratios
  themeRatios.push(value);
  themeRatios = themeRatios.map((r) => {return Number(r)});
  // Pass new array to function that updates all ratio values in the _theme
  ratioUpdateValues(themeRatios);

  // createHtmlElement
  createRatioInput(value);
  // Update the rest of the components dependent upon the ratios
  ratioUpdate(themeRatios);
}


function createRatioInput(v, c) {
  if(!c) {
    const AllRatios = Promise.resolve(getContrastRatioInputs());
    AllRatios.then(function(resolve) {
      let ratioIndex = resolve.length;
      let indexedColor = _theme.contrastColors[1].values[ratioIndex];
      if(!indexedColor) {
        c = '#cacaca'
      } else {
        c =  indexedColor.value;  
      }
    })
  }

  const luminosityGradient = document.getElementById('luminosityGradient');
  let luminosityValue = d3.hsluv(c).v;
  let swatchColor = d3.hsluv(0, 0, luminosityValue).formatHex();

  // let methodPicker = document.getElementById('contrastMethod');
  // let method = methodPicker.value;
  let method = "WCAG";

  var ratios = document.getElementById('ratioInput-wrapper');
  var div = document.createElement('div');

  var randId = randomId();
  div.className = 'ratio-Item ratioGrid';
  div.id = randId + '-item';
  var inputWrapper = document.createElement('span');

  var sw = document.createElement('span');
  sw.className = 'ratio-Swatch';
  sw.id = randId + '-sw';
  sw.style.backgroundColor = swatchColor;
  var ratioInput = document.createElement('input');
  let ratioInputWrapper = document.createElement('div');
  ratioInputWrapper.className = 'spectrum-Textfield ratioGrid--ratio';
  ratioInput.className = 'spectrum-Textfield-input ratio-Field';
  ratioInput.type = "number";
  ratioInput.min = (method === 'APCA') ? APCAminValue : '-10';
  ratioInput.max = (method === 'APCA') ? APCAmaxValue : '21';
  ratioInput.step = '.01';
  let ratioInputDefaultValue = (method === 'WCAG') ? 4.5 : 60;
  ratioInput.placeholder = ratioInputDefaultValue
  ratioInput.id = randId;
  ratioInput.value = v;
  ratioInput.onkeydown = checkRatioStepModifiers;

  ratioInput.oninput = syncRatioInputs;

  var luminosityInput = document.createElement('input');
  let luminosityInputWrapper = document.createElement('div');
  luminosityInputWrapper.className = 'spectrum-Textfield ratioGrid--luminosity';

  luminosityInput.className = 'spectrum-Textfield-input luminosity-Field';
  luminosityInput.type = "number";
  luminosityInput.min = '0';
  luminosityInput.max = '100';
  luminosityInput.step = '.01';
  luminosityInput.id = randId + "_luminosity";
  luminosityInput.onkeydown = checkRatioStepModifiers;
  luminosityInput.oninput = syncRatioInputs;

  // Customize swatch names input
  // var swatchNameInput = document.createElement('input');
  // let swatchNameInputWrapper = document.createElement('div');
  // swatchNameInputWrapper.className = 'spectrum-Textfield spectrum-Textfield--quiet ratioGrid--swatchName is-readonly';

  // swatchNameInput.className = 'spectrum-Textfield-input swatchName-Field is-readonly';
  // swatchNameInput.type = "text";
  // swatchNameInput.id = randId + "_swatchName";
  // swatchNameInput.readOnly = true;
  // swatchNameInput.value = '-100'
  // swatchNameInput.oninput = syncRatioInputs;

  var button = document.createElement('button');
  button.className = 'spectrum-ActionButton spectrum-ActionButton--sizeM spectrum-ActionButton--quiet ratioGrid--actions';
  button.title = 'Delete contrast ratio';
  button.innerHTML = `
  <svg class="spectrum-Icon spectrum-Icon--sizeS" focusable="false" aria-hidden="true" aria-label="Delete">
    <use xlink:href="#spectrum-icon-18-Delete" />
  </svg>`;

  button.onclick = deleteRatio;


  inputWrapper.appendChild(sw);
  ratioInputWrapper.appendChild(ratioInput);
  inputWrapper.appendChild(ratioInputWrapper);

  luminosityInputWrapper.appendChild(luminosityInput);
  // swatchNameInputWrapper.appendChild(swatchNameInput);
  div.appendChild(inputWrapper)
  div.appendChild(luminosityInputWrapper);
  // div.appendChild(swatchNameInputWrapper);
  div.appendChild(button);
  ratios.appendChild(div);

  /** 
   * Luminosity input and gradient dot need to be
   * constructed AFTER the ratio input has been
   * added to the DOM, that way we can find the 
   * index of the new ratio (from all ratios) and
   * use that index to identify a color sample from
   * the output theme to calculate the luminosity
   * value which will be populated in the luminosity
   * input and used to position the dot.
   */
  // const AllRatios = getContrastRatios();

  // let ratioIndex = AllRatios.indexOf(v);
  // TODO: Remove condition, which currently stops the ui from breaking with paramSetup values...
  // let tempColor = (_theme.contrastColors && ratioIndex > -1) ? _theme.contrastColors[1].values[ratioIndex].value : '#cacaca';
  // let luminosityValue = d3.hsluv(tempColor).v;

  let lDot = document.createElement('div');
  lDot.className = 'luminosityDot';
  lDot.id = randId.concat('_dot');

  let lightnessPerc = 100 - luminosityValue;
  let dotOffset = 0;
  let topPosition = `${Math.round(lightnessPerc)}%`;

  lDot.style.top = topPosition;
  luminosityGradient.appendChild(lDot);

  let lumInput = document.getElementById(randId + "_luminosity");
  lumInput.value = luminosityValue.toFixed(2);

  document.getElementById(randId).dispatchEvent(new Event("input"));
}

function addRatioInputs(ratios, colors) {
  ratios.forEach((ratio, index) => {
    return createRatioInput(ratio, colors[index])
  })
  let ratioFields = document.getElementsByClassName('ratio-Field');
  for(let i = 0; i < ratioFields.length; i++) {
    ratioFields[i].dispatchEvent(new Event("input"));
  }
}

function distributeRatios() {
  // Temporarily "disable" wrapper
  let inputWrapper = document.getElementById('ratioInput-wrapper');
  setTimeout(() => {
    inputWrapper.classList.add('is-disabled');
  }, 100)

  let ratioFields = document.getElementsByClassName('ratio-Field');
  let ratioInputs = [];
  for(let i=0; i < ratioFields.length; i++) {
    ratioInputs.push(Number(ratioFields[i].value));
  }

  let minVal = Math.min(...ratioInputs);
  let maxVal = Math.max(...ratioInputs);
  let length = ratioInputs.length - 1;
  let newRatios = [];

  for(let i=0; i < length + 1; i++) {
    let perc = i/length;
    if(i === 0) perc = 0;
    let newVal = lerp(minVal, maxVal, perc);
    newRatios.push(round(newVal, 2))
  }  

  // Update ratio inputs with new values
  for (let i=0; i<newRatios.length; i++) {
    ratioFields[i].value = newRatios[i];
    ratioFields[i].dispatchEvent(new Event("input"));
  }
  setTimeout(() => {
    ratioUpdate();
    inputWrapper.classList.remove('is-disabled');
  }, 500)
}

function distributeLuminosity() {
  let LumFields = document.getElementsByClassName('luminosity-Field');
  let LumInputs = [];
  for(let i=0; i < LumFields.length; i++) {
    LumInputs.push(Number(LumFields[i].value));
  }

  let inputWrapper = document.getElementById('ratioInput-wrapper');
  inputWrapper.classList.add('is-disabled');


  let minVal = Math.min(...LumInputs);
  let maxVal = Math.max(...LumInputs);
  let length = LumInputs.length - 1;
  let newLums = [];

  for(let i=0; i < length + 1; i++) {
    let perc = i/length;
    if(i === 0) perc = 0;
    let newVal = lerp(minVal, maxVal, perc);
    newLums.push(round(newVal, 2))
  }  
  newLums.reverse();

  // newLums.sort(function(a, b){return a-b});
  // Update ratio inputs with new values
  for (let i=0; i<newLums.length; i++) {
    LumFields[i].value = newLums[i];
  }

  setTimeout(() => {
    for (let i=0; i<LumFields.length; i++) {
      LumFields[i].dispatchEvent(new Event("input"));
    }
  }, 200)
  setTimeout(() => {
    sortRatios();
  }, 200);
  setTimeout(() => {
    ratioUpdate();
  }, 500)

  setTimeout(() => {
    inputWrapper.classList.remove('is-disabled');
  }, 900)
}

document.getElementById('distribute').addEventListener('input', function(e) {
  let value = e.target.value;
  if(value === 'ratios') distributeRatios();
  if(value === 'luminosity') distributeLuminosity();
  e.target.value = 'none'
})

// Sort swatches in UI
function sort() {
  let ratioFields = document.getElementsByClassName('ratio-Field');
  let ratioInputs = [];
  for(let i=0; i < ratioFields.length; i++) {
    ratioInputs.push(ratioFields[i].value);
  }

  ratioInputs.sort(function(a, b){return a-b});

  // Update ratio inputs with new values
  for (let i=0; i<ratioInputs.length; i++) {
    ratioFields[i].value = ratioInputs[i];
  }
  setTimeout(() => {
    for (let i=0; i<ratioInputs.length; i++) {
      ratioFields[i].dispatchEvent(new Event("input"));
    }
  }, 200)
}

function sortRatios() {
  sort();
  // ratioUpdate();
}

function syncRatioInputs(e) {
  let thisId = e.target.id;
  let baseId = (thisId.includes('_luminosity')) ? thisId.replace('_luminosity', '') : thisId;
  let swatchId = baseId.concat('-sw');

  let val = e.target.value;
  let targetContrast, luminosity, swatchColor;
  let swatch = document.getElementById(swatchId);

  if (thisId.includes('_luminosity')) { // Luminosity input
    baseId = thisId.replace('_luminosity', '');
    let ratioInput = document.getElementById(baseId);
    luminosity = val;

    let currentSwatchColor = window.getComputedStyle(swatch).getPropertyValue('background-color');
    let tempColorHsluv = d3.hsluv(currentSwatchColor);
    swatchColor = d3.hsluv(tempColorHsluv.l, tempColorHsluv.u, val).formatHex();

    let bg = _theme.contrastColors[0].background;
    let fgArray = [d3.rgb(swatchColor).r, d3.rgb(swatchColor).g, d3.rgb(swatchColor).b]
    let bgArray = [d3.rgb(bg).r, d3.rgb(bg).g, d3.rgb(bg).b]
    targetContrast = round(Leo.contrast(fgArray, bgArray), 2);

    ratioInput.value = targetContrast;
  }
  else { // Ratio input
    targetContrast = val;
    baseId = thisId;
  }

  let themeRatios = Promise.resolve(getContrastRatioInputs());
  themeRatios.then(function(resolve) {
    const index = resolve.indexOf(targetContrast);
    if (index > -1) {
      resolve[index] = targetContrast;
    }
  
    ratioUpdateValues(resolve);
    ratioUpdate();

    if(!thisId.includes('_luminosity')) {
      let luminosityInputId = `${thisId}_luminosity`;
      let luminosityInput = document.getElementById(luminosityInputId);
      // Must calculate luminosity of respective contrast value 

      let tempColor = _theme.contrastColors[1].values[index].value;
      luminosity = d3.hsluv(tempColor).v;
      luminosityInput.value = round(luminosity, 2);

      swatchColor = d3.hsluv(0, 0, luminosity).formatHex();
    }

    swatch.style.backgroundColor = swatchColor;
  });

  setTimeout(() => {
    let lDotId = baseId.concat('_dot');
    let lDot = document.getElementById(lDotId);
    let lumReversed = 100 - luminosity;
    let dotPercentOffset = (lumReversed/100) * 8;
    let dotPosition = `calc(${Math.round(lumReversed)}% - ${Math.round(dotPercentOffset)}px)`;
    lDot.style.top = dotPosition;
  }, 250)
}


function checkRatioStepModifiers(e) {
  if (!e.shiftKey) return;
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const value = Number(e.target.value);
  let newValue;
  switch (e.key) {
    case 'ArrowDown':
      newValue = value - 1;
      e.target.value = newValue.toFixed(2);
      e.target.oninput(e);
      break;
    case 'ArrowUp':
      newValue = value + 1;
      e.target.value = newValue.toFixed(2);
      e.target.oninput(e);
      break;
    default:
  }
}

// Delete ratio
function deleteRatio(e) {
  let id = e.target.parentNode.id;
  let inputId = id.replace('-item', '');
  let input = document.getElementById(inputId);
  let value = input.value;
  let self = document.getElementById(id);
  // var sliderid = id.replace('-item', '') + '-sl';
  // var slider = document.getElementById(sliderid);
  let dotId = inputId.concat('_dot');
  let dot = document.getElementById(dotId);
  dot.remove();
  self.remove();
  // slider.remove();
  let themeRatios = getContrastRatioInputs();
  const index = themeRatios.indexOf(value);
  if (index > -1) {
    themeRatios.splice(index, 1);
  }

  ratioUpdateValues();
  ratioUpdate();
}

function ratioUpdate(chartRatios = Promise.resolve(getThemeContrastRatios()), chartLuminosities = Promise.resolve(getLuminosities())) {
  Promise.all([chartRatios, chartLuminosities]).then(function(values) {
    createOutputColors();
    createRatioChart(values[0]);
    createLuminosityChart(values[1]);
    createOutputParameters();
  })
}

function ratioUpdateValues(themeRatios = getThemeContrastRatios()) {
  themeRatios = themeRatios.map((r) => {return Number(r)});
  let argArray = [];
  _theme.colors.forEach((c) => {
    argArray.push( {color: c.name, ratios: themeRatios} )
  })

  _theme.updateColor = argArray;
}

window.addRatio = addRatio;
window.sortRatios = sortRatios;
window.distributeRatios = distributeRatios;

module.exports = {
  addRatio,
  createRatioInput,
  addRatioInputs,
  sort,
  sortRatios,
  syncRatioInputs,
  distributeRatios,
  checkRatioStepModifiers,
  deleteRatio
}