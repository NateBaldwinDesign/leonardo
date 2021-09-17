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

import * as d3 from 'd3';

import * as d33d from 'd3-3d';
Object.assign(d3, d33d);

import * as contrastColors from '@adobe/leonardo-contrast-colors';
import * as data from './data';

let chart3dColorspace = document.getElementById('chart3dColorspace');
let dest = document.querySelector('.chart3D');

/*
Create 2d and 3d chart heights and widths based on known
paddings and panel dimensions, based on viewport height/width.
*/
function createChartWidth(dest) {
  // let leftPanel = 304;
  // let rightPanel = 240;
  // let paddings = 100;
  // let offset = leftPanel + rightPanel + paddings;
  // let viewportWidth = window.innerWidth;

  // if((viewportWidth - offset) / 2 > 300) {
  //   return (viewportWidth - offset) / 2;
  // } else {
  //   return 300;
  // }
  if(dest === 'interpolationChart') {console.log('INTERP'); return 500;}
  else return 366;
}

function createChartHeight() {
  // let headerHeight = 58;
  // let tabHeight = 48;
  // let paddings = 164;
  // let offset = headerHeight + tabHeight + paddings;
  // let viewportHeight = window.innerHeight;
  // let height = (viewportHeight - offset) / 3;
  // if (height < 160) {
  //   return 160;
  // }
  // else {
  //   return height;
  // }
  return 275;
}

function create3dChartWidth() {
  let leftPanel = 304;
  let rightPanel = 240;
  let paddings = 72;
  let offset = leftPanel + rightPanel + paddings;
  let viewportWidth = window.innerWidth;

  return (viewportWidth - offset);
}

function create3dChartHeight() {
  let headerHeight = 58;
  let tabHeight = 48;
  let paddings = 164/2;
  let feedbackText = 100;
  let offset = headerHeight + tabHeight + paddings + feedbackText;
  let viewportHeight = window.innerHeight;

  return (viewportHeight - offset);
}

// let chartWidth = create3dChartWidth();
// let chartHeight = create3dChartHeight();
// let modelScale;
// let yOrigin;
// let viewportHeight = window.innerHeight;

// if (viewportHeight < 640) {
//   modelScale = 20;
//   yOrigin = chartHeight;
// } else if (viewportHeight >= 640 && viewportHeight < 800) {
//   modelScale = 30;
//   yOrigin = chartHeight/1.25;
// } else if (viewportHeight >= 800 && viewportHeight < 900) {
//   modelScale = 40;
//   yOrigin = chartHeight/1.25;
// }  else if (viewportHeight >= 900) {
//   modelScale = 50;
//   yOrigin = chartHeight/1.25;
// }

// let origin = [chartWidth/1.85, chartHeight/1.25], j = 10, scale = modelScale, scatter = [], yLine = [], xGrid = [], colorPlot = [], beta = 0, alpha = 0, key = function(d){ return d.id; }, startAngle = Math.PI/10;
// dest.style.width = chartWidth;
// dest.style.height = chartHeight;

// let svg = d3.select(dest)
//   .call(
//     d3.drag()
//       .on('drag', dragged)
//       .on('start', dragStart)
//       .on('end', dragEnd)
//     )
//   .append('g');

// let mx, my, mouseX, mouseY;

// let grid3d = d3._3d()
//     .shape('GRID', 20)
//     .origin(origin)
//     .rotateY( startAngle)
//     .rotateX(-startAngle)
//     .scale(scale);

// let point3d = d3._3d()
//     .x(function(d){ return d.x; })
//     .y(function(d){ return d.y; })
//     .z(function(d){ return d.z; })
//     .origin(origin)
//     .rotateY( startAngle)
//     .rotateX(-startAngle)
//     .scale(scale);

// let yScale3d = d3._3d()
//     .shape('LINE_STRIP')
//     .origin(origin)
//     .rotateY( startAngle)
//     .rotateX(-startAngle)
//     .scale(scale);

function processData(data, tt){
  let colorInterpSpace = document.querySelector('select[name="mode"]').value;
  let chartColors = getChartColors(colorInterpSpace);

  let color = d3.scaleOrdinal(chartColors);

  /* ----------- GRID ----------- */

  let xGrid = svg.selectAll('path.grid').data(data[0], key);

  xGrid
    .enter()
    .append('path')
    .attr('class', '_3d grid')
    .merge(xGrid)
    .attr('d', grid3d.draw);

  xGrid.exit().remove();

  /* ----------- POINTS ----------- */

  let points = svg.selectAll('circle').data(data[1], key);

  points
    .enter()
    .append('circle')
    .attr('class', '_3d')
    .attr('opacity', 0)
    .attr('cx', posPointX)
    .attr('cy', posPointY)
    .merge(points)
    .transition().duration(tt)
    .attr('r', 5)
    // .attr('stroke', function(d){ return d3.color(color(d.id)).darker(3); })
    .attr('fill', function(d) {
      return color(d.id);
    })
    .attr('opacity', 1)
    .attr('cx', posPointX)
    .attr('cy', posPointY);

  points.exit().remove();

  /* ----------- y-Scale ----------- */

  let yScale = svg.selectAll('path.yScale').data(data[2]);

  yScale
    .enter()
    .append('path')
    .attr('class', '_3d yScale')
    .merge(yScale)
    .attr('stroke', '#6e6e6e')
    .attr('stroke-width', .5)
    .attr('d', yScale3d.draw);

  yScale.exit().remove();

   /* ----------- y-Scale Text ----------- */

  let yText = svg.selectAll('text.yText').data(data[2][0]);

  yText
    .enter()
    .append('text')
    .attr('class', '_3d yText')
    .attr('dx', '.3em')
    .merge(yText)
    .each(function(d){
        d.centroid = {x: d.rotated.x, y: d.rotated.y, z: d.rotated.z};
    })
    .attr('x', function(d){ return d.projected.x; })
    .attr('y', function(d){ return d.projected.y; })
    // .text(function(d){ return d[1]*10 <= 0 ? d[1]*-10 : ''; });
    // .text(function(d) {return d;});
    .text('-');

  yText.exit().remove();

  d3.selectAll('._3d').sort(d3._3d().sort);
}

function posPointX(d){
  return d.projected.x;
}

function posPointY(d){
  return d.projected.y;
}

let pi = Math.PI;
function init3dChart(){

  let cnt = 0;
  let xGrid = [], scatter = [], yLine = [], colorPlot = [];
  let j = 10;
  // Taking J from origin argument...
  // z = -10; z < 10; z++ is what it's saying.
  for(let z = -j; z < j; z++){
    for(let x = -j; x < j; x++){
      xGrid.push([x, 1, z]);
      // This is where the point CAMArrayAdata is gathered:
      scatter.push({x: x, y: d3.randomUniform(0, -10)(), z: z, id: 'point_' + cnt++});
      // dividing LAB data by 10 to fit current grid. Negative y let since chart is in negative space?
      // colorPlot.push({x: LABArrayA[j]/10, y: LABArrayL[j]/10 * -1, z: LABArrayB[j]/10, id: 'point_' + cnt++});
    }
  }
  let spaceOpt = document.getElementById('chartsMode').value;
  
  let pi = Math.PI;

  if (spaceOpt == 'CAM02') {
    for(let i=0; i<CAMArrayA.length; i++) {
      colorPlot.push({x: CAMArrayA[i]/10, y: CAMArrayJ[i]/10 * -1, z: CAMArrayB[i]/10, id: 'point_' + cnt++});
    }
  }
  if (spaceOpt == 'LCH') {
    for(let i=0; i<LCHArrayC.length; i++) {
      let angle = LCHArrayH[i] * (pi/180);
      let r = LCHArrayC[i];
      // Polar:
      colorPlot.push({x: (r * Math.cos(angle))/13, y: LCHArrayL[i]/13 * -1, z: (r * Math.sin(angle))/13, id: 'point_' + cnt++});
      // Cartesian:
      // colorPlot.push({x: LCHArrayH[i]/(Math.PI * 10), y: LCHArrayL[i]/10 * -1, z: LCHArrayC[i]/10, id: 'point_' + cnt++});
    }
  }
  if (spaceOpt == 'LAB') {
    for(let i=0; i<LABArrayA.length; i++) {
      colorPlot.push({x: LABArrayA[i]/13, y: LABArrayL[i]/13 * -1, z: LABArrayB[i]/13, id: 'point_' + cnt++});
    }
  }
  if (spaceOpt == 'HSL') {
    for(let i=0; i<HSLArrayL.length; i++) {
      let angle = HSLArrayH[i] * (pi/180);
      let r = HSLArrayS[i];
      // Polar:
      colorPlot.push({x: (r * Math.cos(angle))*8, y: HSLArrayL[i]*8 * -1, z: (r * Math.sin(angle))*8, id: 'point_' + cnt++});
      // Cartesian:
      // colorPlot.push({x: HSLArrayH[i]/(10*pi) - 7, y: HSLArrayL[i]*10 * -1, z: HSLArrayS[i]*10 - 7, id: 'point_' + cnt++});
    }
  }
  if (spaceOpt == 'HSLuv') {
    for(let i=0; i<HSLuvArrayL.length; i++) {
      let angle = HSLuvArrayL[i] * (pi/180);
      let r = HSLuvArrayU[i];
      // Polar:
      colorPlot.push({x: (r * Math.cos(angle))/12, y: HSLuvArrayV[i]/10 * -1, z: (r * Math.sin(angle))/12, id: 'point_' + cnt++});
      // Cartesian:
      // colorPlot.push({x: HSLuvArrayL[i]/(10*pi) - 7, y: HSLuvArrayV[i]/10 * -1, z: HSLuvArrayU[i]/10 -10, id: 'point_' + cnt++});
    }
  }
  if (spaceOpt == 'HSV') {
    for(let i=0; i<HSVArrayL.length; i++) {
      let angle = HSVArrayH[i] * (pi/180);
      let r = HSVArrayS[i];
      // Polar:
      colorPlot.push({x: (r * Math.cos(angle))*8, y: HSVArrayL[i]*8 * -1, z: (r * Math.sin(angle))*8 - 1.5, id: 'point_' + cnt++});
      // Cartesian:
      // colorPlot.push({x: HSVArrayH[i]/(10*pi) - 7, y: HSVArrayL[i]*10 * -1, z: HSVArrayS[i]*10 -7, id: 'point_' + cnt++});
    }
  }
  if (spaceOpt == 'RGB') {
    for(let i=0; i<RGBArrayR.length; i++) {
      colorPlot.push({x: RGBArrayR[i]/30 - 5, y: RGBArrayG[i]/30 * -1, z: RGBArrayB[i]/30 - 5, id: 'point_' + cnt++});
    }
  }

  d3.range(-1, 11, 1).forEach(d => yLine.push([-j, -d, -j]));

  let data = [
    grid3d(xGrid),
    point3d(colorPlot),
    yScale3d([yLine])
  ];

  processData(data, 500); // 500 is the duration
}

function dragStart(){
  mx = d3.event.x;
  my = d3.event.y;
}

function dragged(){
  mouseX = mouseX || 0;
  mouseY = mouseY || 0;
  beta = (d3.event.x - mx + mouseX) * Math.PI / 600 ;
  alpha = (d3.event.y - my + mouseY) * Math.PI / 600  * (-1);
  let data = [
    grid3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(xGrid),
    point3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)(colorPlot),
    yScale3d.rotateY(beta + startAngle).rotateX(alpha - startAngle)([yLine]),
  ];
  processData(data, 0);
}

function dragEnd(){
  mouseX = d3.event.x - mx + mouseX;
  mouseY = d3.event.y - my + mouseY;
}

// d3.selectAll('button').on('click', init3dChart);

// function createChartHeader(x, dest) {
//   let container = document.getElementById(dest);
//   let subhead = document.createElement('h6');
//   subhead.className = 'spectrum-Subheading';
//   subhead.innerText = x;
//   container.appendChild(subhead);
// }

// // Make 2d color charts
// function toggleGraphs() {
//   let panel = document.getElementById('colorMetrics');
//   let toggle = document.getElementById('toggleMetrics');
//   panel.classList.toggle('visible');
//   toggle.classList.toggle('is-selected');
// }

// function createAllCharts(mode, colors) {
//   // mode = document.getElementById('chart2dColorspace').value;

//   // let chart3 = document.getElementById('chart3Wrapper');
//   data.createData(colors, mode);

//   if (mode=="LCH") {
//     createChartHeader('Chroma / Lightness', 'chart1');
//     createChart(lchDataC, 'Chroma', 'Lightness', "#chart1", 0, 100);
//     createChartHeader('Hue / Lightness', 'chart2');
//     createChart(lchDataH, 'Hue', 'Lightness', "#chart2", 0, 360);
//     createChartHeader('Chroma / Hue', 'chart3');
//     createChart(lchDataCH, 'Chroma', 'Hue', "#chart3", 0, 100);
//   }
//   if (mode=="LAB") {
//     createChartHeader('Green Red / Lightness', 'chart1');
//     createChart(labDataA, 'Green - Red', 'Lightness', "#chart1");
//     createChartHeader('Blue Yellow / Lightness', 'chart2');
//     createChart(labDataB, 'Blue - Yellow', 'Lightness', "#chart2");
//     createChartHeader('Green Red / Blue Yellow', 'chart3');
//     createChart(labDataAB, 'Green - Red', 'Blue - Yellow', "#chart3");
//   }
//   if (mode=="CAM02") {
//     createChartHeader('Green Red / Lightness', 'chart1');
//     createChart(camDataA, 'Green - Red', 'Lightness', "#chart1");
//     createChartHeader('Blue Yellow / Lightness', 'chart2');
//     createChart(camDataB, 'Blue - Yellow', 'Lightness', "#chart2");
//     createChartHeader('Green Red / Blue Yellow', 'chart3');
//     createChart(camDataAB, 'Green - Red', 'Blue - Yellow', "#chart3");
//   }
//   if (mode=="HSL") {
//     createChartHeader('Hue / Lightness', 'chart1');
//     createChart(hslDataH, 'Hue', 'Lightness', "#chart1", 0, 360);
//     createChartHeader('Saturation / Lightness', 'chart2');
//     createChart(hslDataS, 'Saturation', 'Lightness', "#chart2", 0, 1);
//     createChartHeader('Saturation / Hue', 'chart3');
//     createChart(hslDataHS, 'Saturation', 'Hue', "#chart3", 0, 1);
//   }
//   if (mode=="HSLuv") {
//     createChartHeader('Hue / Lightness', 'chart1');
//     createChart(hsluvDataL, 'Hue', 'Lightness', "#chart1", 0, 360);
//     createChartHeader('Saturation / Lightness', 'chart2');
//     createChart(hsluvDataU, 'Saturation', 'Lightness', "#chart2", 0, 100);
//     createChartHeader('Saturation / Hue', 'chart3');
//     createChart(hsluvDataLU, 'Saturation', 'Hue', "#chart3", 0, 100);
//   }
//   if (mode=="HSV") {
//     createChartHeader('Hue / Lightness', 'chart1');
//     createChart(hsvDataH, 'Hue', 'Lightness', "#chart1", 0, 360);
//     createChartHeader('Saturation / Lightness', 'chart2');
//     createChart(hsvDataS, 'Saturation', 'Lightness', "#chart2", 0, 1);
//     createChartHeader('Saturation / Hue', 'chart3');
//     createChart(hsvDataHS, 'Saturation', 'Hue', "#chart3", 0, 1);
//   }
//   if (mode=="RGB") {
//     createChartHeader('Red / Green', 'chart1');
//     createChart(rgbDataR, 'Red', 'Green', "#chart1", 0, 255);
//     createChartHeader('Green / Blue', 'chart2');
//     createChart(rgbDataG, 'Green', 'Blue', "#chart2", 0, 255);
//     createChartHeader('Blue / Red', 'chart3');
//     createChart(rgbDataB, 'Blue', 'Red', "#chart3", 0, 255);
//   }

//   // createChartHeader('Contrast Ratios', 'contrastChart');
//   // createChart(window.contrastData, 'Contrast', 'Swatches', "#contrastChart");

//   init3dChart();
// }


let chartColors = [];

function getChartColors(mode) {
  // let shift = document.getElementById('shiftInput').value;
  let shift = 1;

  let chartColors = [];

  // GENERATE PROPER SCALE OF COLORS FOR 3d CHART:
  let chartRGB = contrastColors.createScale({swatches: 340, colorKeys: colorArgs, colorspace: mode, shift: shift});

  for (let i=0; i<chartRGB.length; i++) {
    chartColors.push(chartRGB[i]);
  }

  return chartColors;
}


function showCharts(mode, interpolation) {
  // document.getElementById('chart1').innerHTML = ' ';
  // document.getElementById('chart2').innerHTML = ' ';
  // document.getElementById('chart3').innerHTML = ' ';
  // document.getElementById('contrastChart').innerHTML = ' ';

  // chartColors = getChartColors(interpolation);
  createAllCharts(mode);
};

function showContrastChart() {
  document.getElementById('contrastChart').innerHTML = ' ';
  createChartHeader('Contrast Ratios', 'contrastChart');
  createChart(window.contrastData, 'Contrast', 'Swatches', "#contrastChart");
}

exports.init3dChart = init3dChart;
// exports.update3dChart = update3dChart;
// exports.updateCharts = updateCharts;
// exports.showCharts = showCharts;
// window.update3dChart = update3dChart;
// window.updateCharts = updateCharts;
// exports.showContrastChart = showContrastChart;
// exports.createChartHeader = createChartHeader;
// exports.createAllCharts = createAllCharts;
// exports.createChart = createChart;