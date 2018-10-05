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

// Append nodes to a target
export const ap = (target, ...args) => {
  if (target && target.appendChild) {
    args.forEach(node => {
      target.appendChild(node);
    });
  }
  return target;
};

// Create a DOM node
export const cr = (type, cssClass, value, id) => {
  let n = document.createElement(type);

  if (cssClass) {
    n.className = cssClass;
  }

  if (value) {
    n.innerHTML = value || '';
  }

  if (id) {
    n.id = id || '';
  }

  return n;
};

export const style = (node, st) => {
  if (node.forEach) {
    node.forEach(n => {
      style(n, st);
    });
    return node;
  }

  Object.keys(st).forEach(e => {
    node.style[e] = st[e];
  });

  return node;
};

export const on = (target, event, func, ctx) => {
  let s = [];

  if (target && target.forEach) {
    target.forEach(t => {
      s.push(on(t, event, func));
    });
    return () => {
      s.forEach(f => {
        f();
      });
    };
  }

  const callback = (...args) => {
    if (func) {
      return func.apply(ctx, args);
    }
  };

  if (target.addEventListener) {
    target.addEventListener(event, callback, false);
  } else {
    target.attachEvent('on' + event, callback, false);
  }

  return () => {
    if (window.removeEventListener) {
      target.removeEventListener(event, callback, false);
    } else {
      target.detachEvent('on' + event, callback);
    }
  };
};

export const nodefault = e => {
  e.cancelBubble = true;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  return false;
};

export const size = node => {
  return {
    w: node.offsetWidth,
    h: node.offsetHeight
  };
};

export const pos = node => {
  return {
    x: node.offsetLeft,
    y: node.offsetTop
  };
};

export default {
  ap,
  cr,
  style,
  on,
  nodefault,
  size,
  pos
};
