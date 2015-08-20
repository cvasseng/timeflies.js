/******************************************************************************

Timeflies.js

Copyright (c) 2015 Chris Vasseng

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

var tf = {
  
  //Append nodes to a target
  ap: function (target) {
    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 1);

    if (target && target.appendChild) {
      args.forEach(function (node) {
        target.appendChild(node);
      });
    }

    return target;
  },
  
  //Create a DOM node
  cr: function (type, cssClass, value, id) {
    var n = document.createElement(type);
    if (cssClass) {
      n.className = cssClass;
    }
    if ((value)) {
      n.innerHTML = value || '';
    }
    if ((id)) {
      n.id = id || '';
    }
    return n;
  },
  
  //Style one or more DOM nodes
  style: function (node, st) {
    if (node.forEach) {
      node.forEach(function (n) {
        tf.style(n, st);
      });
      return node;
    }

    Object.keys(st).forEach(function (e) {
      node.style[e] = st[e];
    });
    
    return node;
  },
  
  //Attach a listener to one or more DOM nodes
  on: function (target, event, func, ctx) {
   var s = [];
    
    if (target && target.forEach) {
      target.forEach(function (t) {
        s.push(tf.on(t, event, func));
      });
      return function () {
        s.forEach(function (f) {
          f();
        });
      };
    }

    function callback() {
      if (func) {
        return func.apply(ctx, arguments);
      }
      return;
    }

    if (target.addEventListener) {
      target.addEventListener(event, callback, false);
    } else {
      target.attachEvent('on' + event, callback, false);
    }   

    return function () {
      if (window.removeEventListener) {
        target.removeEventListener(event, callback, false);
      } else {
        target.detachEvent('on' + event, callback);
      }
    };
  },
  
  //Used in event handles to cancel default behaviour
  nodefault: function (e) {
    e.cancelBubble = true;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;   
  },
  
  //Merge two objects
  merge: function (a, b) {
    if (!a || !b) return a || b;    
    Object.keys(b).forEach(function (bk) {
     if (tf.isNull(b[bk]) || tf.isBasic(b[bk])) {
        a[bk] = b[bk];
     } else if (tf.isArr(b[bk])) {
       
       a[bk] = [];
       
       b[bk].forEach(function (i) {
         if (tf.isNull(i) || tf.isBasic(i)) {
           a[bk].push(i);
         } else {
           a[bk].push(tf.merge({}, i));
         }
       });
       
     } else {
        a[bk] = tf.merge({}, b[bk]);
      }
    });    
    return a;
  },
  
  //Return the size of a node
  size: function (node) {
    return {
      w: node.offsetWidth,
      h: node.offsetHeight
    }
  },
  
  pos: function (node) {
    return {
      x: node.offsetLeft,
      y: node.offsetTop
    }
  },
  
  isNull: function (what) {
    return (typeof what === 'undefined' || what == null);
  },
  
  isStr: function (what) {
    return (typeof what === 'string' || what instanceof String);
  },
  
  // Returns true if what is a number
  isNum: function(what) {
    return !isNaN(parseFloat(what)) && isFinite(what);
  },
  
  // Returns true if what is a function
  isFn: function (what) {
    return (what && (typeof what === 'function') || (what instanceof Function));
  },
  
  //Returns true if what is an array
  isArr: function (what) {
    return (!tf.isNull(what) && what.constructor.toString().indexOf("Array") > -1);
  },

  //Returns true if what is a bool
  isBool: function (what) {
    return (what === true || what === false);
  },
  
  //Returns true if what is a basic type 
  isBasic: function (what) {
    return !tf.isArr(what) && (tf.isStr(what) || tf.isNum(what) || tf.isBool(what) || tf.isFn(what));
  }
};
