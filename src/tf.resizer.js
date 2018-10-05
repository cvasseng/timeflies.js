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

// @format

import Events from './tf.events.js';
import dom from './tf.dom.js';

export const Resizer = (handle, target, dir) => {
  const events = Events();
  let moving = false;
  let enabled = true;
  let mainHandle = false;
  let direction = dir || 'XY';
  let snap = 1;

  let delta = {
    x: 0,
    y: 0
  };

  let size = {
    w: 0,
    h: 0
  };

  let osize = {
    w: 0,
    h: 0
  };

  let minSize = {
    w: 0,
    h: 0
  };

  if (!handle) {
    handle = target;
  }

  const enable = () => {
    enabled = true;
  };

  const disable = () => {
    enabled = false;
  };

  const destroy = () => {
    if (mainHandle) {
      mainHandle();
    }
  };

  const create = () => {
    destroy();

    mainHandle = dom.on(handle, 'mousedown', e => {
      let upper;
      let mover;

      if (!enabled || e.shiftKey) {
        return;
      }

      osize = dom.size(target);

      delta.x = e.clientX;
      delta.y = e.clientY;

      moving = true;

      events.emit('Start', osize.w, osize.h);

      upper = dom.on(document.body, 'mouseup', e => {
        upper();
        mover();
        moving = false;
        events.emit('Done', size.w, size.h);

        return dom.nodefault(e);
      });

      mover = dom.on(document.body, 'mousemove', e => {
        if (moving) {
          if (direction === 'X' || direction === 'XY') {
            size.w =
              snap * Math.floor((osize.w + (e.clientX - delta.x)) / snap);
            if (size.w < minSize.w) size.w = minSize.w;
            dom.style(target, {
              width: size.w + 'px'
            });
          }

          if (direction === 'Y' || direction === 'XY') {
            size.h = osize.h + (e.clientY - delta.y);
            if (size.h < minSize.h) size.h = minSize.h;
            dom.style(target, {
              height: size.h + 'px'
            });
          }

          events.emit('Resizing', size.w, size.h);
        }
        return dom.nodefault(e);
      });
      return dom.nodefault(e);
    });
  };

  create();

  return {
    minSize: minSize,
    destroy: destroy,
    on: events.on,
    enable: enable,
    disable: disable,
    setAxis: ax => {
      direction = ax;
    }
  };
};

export default Resizer;
