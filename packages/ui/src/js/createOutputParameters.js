import {_theme} from './initialTheme';
import {
  getAllColorNames,
  getThemeName
} from './getThemeData';
import {camelCase} from './utils';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';;
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('css', css);

const outputFormatPicker = document.getElementById('colorOutputFormat');

function createOutputParameters() {
  const outputFormat = outputFormatPicker.value;
  const update = Promise.resolve(_theme.output = outputFormat)

  update.then(() => {
    createJSOutput();
    createCSSOutput();
    createTokensOutput();

    // Reset to hex so all other functions of the UI continue to work.
    // Otherwise CSS Module 4 formatted colors won't be parsed by Chroma.js
    _theme.output = 'HEX'
  })
}


function createJSOutput() {
  let paramsOutput = document.getElementById('themeJSParams');

  let themeName = getThemeName();
  if(!themeName) themeName = 'myTheme';
  let colors = _theme.colors;
  let colorNames = getAllColorNames();
  let colorDeclarations = [];

  for(let i = 0; i < colors.length; i++) {
    let thisColor = colors[i];
    let colorString = 
`let ${camelCase(thisColor.name)} = new Leo.Color({
  name: "${thisColor.name}",
  colorKeys: [${thisColor.colorKeys.map((c) => `'${c}'`)}],
  ratios: [${thisColor.ratios}],
  colorspace: "${thisColor.colorspace}",
  smooth: ${thisColor.smooth}
});`;
    colorDeclarations.push(colorString);
  }
  const joinedDeclarations = colorDeclarations.join(`\n\n`);

  let paramOutputString = 
`${joinedDeclarations}

let ${themeName.replace(/\s/g, '')} = new Leo.Theme({
  colors: [${colorNames.map((n) => camelCase(n))}],
  backgroundColor: ${camelCase(_theme.backgroundColor.name)},
  lightness: ${_theme.lightness},
  contrast: ${_theme.contrast},
  saturation: ${_theme.saturation},
  output: "${_theme.output}"
});`;

  const highlightedCode = hljs.highlight(paramOutputString, {language: 'javascript'}).value
  paramsOutput.innerHTML = highlightedCode;
}

function createCSSOutput() {
  let themeName = getThemeName();
  let themeCssClass = `.${themeName.replace(/\s/g, '')}`
  if(!themeName) themeCssClass = ':root';
  
  let paramsOutput = document.getElementById('themeCSSParams');

  let contrastPairs = _theme.contrastColorPairs;
  let declarations = [];
  for (const [key, value] of Object.entries(contrastPairs)) {
    declarations.push(`  --${key}: ${value};`);
  }
  const joinedDeclarations = declarations.join(`\n`);
  let paramOutputString =
`${themeCssClass} {
${joinedDeclarations}
}`;

  const highlightedCode = hljs.highlight(paramOutputString, {language: 'css'}).value
  paramsOutput.innerHTML = highlightedCode;
}

function createTokensOutput() {
  let paramsOutput = document.getElementById('themeTokensParams');
  let tokenObj = {};

  const textLowContrast = 'Do not use for UI elements or text.'
  const textLarge = 'Color can be used for UI elements or large text.'
  const textSmall = 'Color can be used for small text.'

  let contrastColors = _theme.contrastColors;
  let backgroundColor = _theme.contrastColors[0].background;

  let backgroundColorObj = {
    value: backgroundColor,
    type: "color",
    description: `UI background color. All color contrasts evaluated and generated against this color.`
  }
  tokenObj['Background'] = backgroundColorObj

  for(let i=1; i < contrastColors.length; i++) {
    let thisColor = contrastColors[i];
    for(let j=0; j < thisColor.values.length; j++) {
      let color = thisColor.values[j]
      let descriptionText = (color.contrast < 3) ? textLowContrast : ((color.contrast >= 3 && color.contrast < 4.5) ? textLarge : textSmall);
      
      let colorObj = {
        value: color.value,
        type: "color",
        description: `${descriptionText} Contrast is ${color.contrast}:1 against background ${backgroundColor}`
      }
      tokenObj[color.name] = colorObj
    }
  }

  const highlightedCode = hljs.highlight(JSON.stringify(tokenObj, null, 2), {language: 'javascript'}).value
  paramsOutput.innerHTML = highlightedCode;
}

outputFormatPicker.addEventListener('change', createOutputParameters);
createOutputParameters();

module.exports = {
  createOutputParameters
}