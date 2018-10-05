/******************************************************************************

Timeflies.js

Copyright (c) 2015-2018 Chris Vasseng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


******************************************************************************/

export const isNull = what => {
  return typeof what === 'undefined' || what === null;
};

export const isStr = what => {
  return typeof what === 'string' || what instanceof String;
};

// Returns true if what is a number
export const isNum = what => {
  return !isNaN(parseFloat(what)) && isFinite(what);
};

// Returns true if what is a function
export const isFn = what => {
  return (what && typeof what === 'function') || what instanceof Function;
};

// Returns true if what is an array
export const isArr = what => {
  return !isNull(what) && what.constructor.toString().indexOf('Array') > -1;
};

// Returns true if what is a bool
export const isBool = what => {
  return what === true || what === false;
};

// Returns true if what is a basic type
export const isBasic = what => {
  return (
    !isArr(what) && (isStr(what) || isNum(what) || isBool(what) || isFn(what))
  );
};

// Merge two objects
export const merge = (a, b) => {
  if (!a || !b) return a || b;
  Object.keys(b).forEach(bk => {
    if (isNull(b[bk]) || isBasic(b[bk])) {
      a[bk] = b[bk];
    } else if (isArr(b[bk])) {
      a[bk] = [];

      b[bk].forEach(i => {
        if (isNull(i) || isBasic(i)) {
          a[bk].push(i);
        } else {
          a[bk].push(merge({}, i));
        }
      });
    } else {
      a[bk] = merge({}, b[bk]);
    }
  });
  return a;
};

export default {
  merge,
  isNull,
  isStr,
  isNum,
  isFn,
  isArr,
  isBool
};
