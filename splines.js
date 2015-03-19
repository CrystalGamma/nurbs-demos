/* Utility code for NURBS demos
    Copyright (C) 2015  Jona Stubbe

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.*/
"use strict";

function plotFunc(ctx, func, start, end) {
	var step = (end-start)/1000;
	ctx.beginPath();
	ctx.moveTo(0, 600-func(start)*600);
	for (var i = 1; i < 999; i = i+1|0) {
		var v = func(start+step*i);
		ctx.lineTo(.8*i, 600-v*600);
	}
	ctx.lineTo(800, 600-func(end)*600);
	ctx.stroke();
}

function lerp(a, b, pos) {
	var dimensions = a.length|0;
	if (dimensions != b.length|0)
		throw "vectors differ in dimension";
	var res = new Array(dimensions);
	var rest = 1-pos;
	for (var i = 0; i < dimensions; i = i+1|0)
		res[i] = rest*a[i] + pos*b[i];
	return res;
}

function deCasteljau(cpoints, pos) {
	var numPoints = (cpoints.length|0)-1|0;
	var res = new Array(numPoints);
	for (var i = 0; i < numPoints; i = i+1|0)
		res[i] = lerp(cpoints[i], cpoints[i+1|0], pos);
	if (numPoints == 1)
		return res[0];
	return deCasteljau(res, pos);
}

function dehomogenize(point) {
	if (!point || !point.length || point.length<2)
		throw "point must be an array of more than one element";
	var dimensions = (point.length|0)-1|0;
	var w = point[dimensions];
	var res = new Array(dimensions);
	for (var i = 0; i < dimensions; i = i+1|0)
		res[i] = point[i]/w;
	return res;
}

function rationalBezier(ctx, cpoints) {
	ctx.beginPath();
	ctx.moveTo.apply(ctx, dehomogenize(cpoints[0]));
	for (var p = 0; p < 1; p += .0001) {
		var pnt = deCasteljau(cpoints, p);
		ctx.lineTo.apply(ctx, dehomogenize(pnt));
	}
	ctx.lineTo.apply(ctx, dehomogenize(cpoints[(cpoints.length|0)-1|0]));
	ctx.stroke();
}

function bSplineBasisFuncs(degree, knotvector) {
	degree = degree|0;
	var len = (knotvector.length|0)-1|0;
	var res = new Array(len);
	
	if (degree == 0) {
		var len = (knotvector.length|0)-1|0;
		var res = new Array(len);
		for (var i = 0; i < len; i = i+1|0)
			res[i] = function(start,end){return function(x){
				return x>=start && x<end ? 1 : 0;
			};}(knotvector[i],knotvector[i+1|0]);
		return res;
	}
	var subFuncs = bSplineBasisFuncs(degree-1|0, knotvector);
	len = (subFuncs.length|0)-1|0;
	res = new Array(len);
	for (i = 0; i < len; i = i+1|0)
		res[i] = function(f, g, start, stop1, stop2, end){
			var diff1 = stop2 - start;
			var diff2 = end - stop1;
			if (diff1<=0 && diff2<=0)
				return function(){return 0};
			if (diff1<=0) 
				return function(x){return (end-x)/diff2*g(x);};
			if (diff2<=0)
				return function(x){return (x-start)/diff1*f(x);};
			return function(x){return (end-x)/diff2*g(x) + (x-start)/diff1*f(x);};
		}(subFuncs[i], subFuncs[i+1|0],
		knotvector[i], knotvector[i+1|0], knotvector[i+degree|0], knotvector[(i+degree|0)+1|0]);
	return res;
}

function bSpline(ctx, degree, cpoints, knotvector) {
	var bFuncs = bSplineBasisFuncs(degree, knotvector);
	ctx.beginPath();
	var numPoints = cpoints.length|0;
	var len = bFuncs.length|0;
	if (numPoints != bFuncs.length)
		throw null;
	ctx.moveTo.apply(ctx, dehomogenize(cpoints[0]));
	var end = knotvector[(knotvector.length|0)-1|0];
	var step = (end-knotvector[0])/100;
	for (var u = knotvector[0]+step; u < end; u += step) {
		var x = 0, y = 0, w = 0;
		for (var i = 0; i < numPoints; i = i+1|0) {
			var point = cpoints[i];
			if (point.length != 3)
				throw null;
			var weight = bFuncs[i](u);
			x += weight*point[0];
			y += weight*point[1];
			w += weight*point[2];
		}
		ctx.lineTo(x/w,y/w);
	}
	ctx.lineTo.apply(ctx, dehomogenize(cpoints[numPoints-1|0]));
	ctx.stroke();
}