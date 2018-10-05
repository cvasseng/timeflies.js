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

import tf from './tf.js';
import dom from './tf.dom.js';
import Events from './tf.events.js';

export const Mover = (handle, target, axis, isSVG) => {
  const events = Events();

  let moving = false;
  let enabled = true;
  let snap = 1;

  let delta = {
    x: 0,
    y: 0
  };

  let pos = {
    x: 0,
    y: 0
  };

  let opos = {
    x: 0,
    y: 0
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

  dom.on(handle, 'mousedown', function (e) {
    let upper;
    let mover;

    if (!enabled || e.shiftKey) {
      return;
    }

    if (isSVG) {
      opos = {
        x: target.x.baseVal.value,
        y: target.y.baseVal.value
      };
    } else {
      opos = dom.pos(target);
    }

    delta.x = e.clientX;
    delta.y = e.clientY;

    moving = true;

    upper = dom.on(document.body, 'mouseup', function (e) {
      if (moving) {
        upper();
        mover();

        events.emit('Done', pos.x, pos.y);

        moving = false;
        return dom.nodefault(e);
      }
    });

    mover = dom.on(document.body, 'mousemove', (e) => {
      if (moving) {

        if (!axis || axis === 'X' || axis === 'XY') {
          pos.x = snap * Math.floor( (opos.x + (e.clientX - delta.x)) / snap);
          if (pos.x < 0) pos.x = 0;
          if (isSVG) {
            target.setAttributeNS(null, 'x', pos.x);
          } else {
            tf.style(target, {
              left: pos.x + 'px'
            });
          }
        }

        if (!axis || axis === 'Y' || axis === 'XY') {
          pos.y = opos.y + (e.clientY - delta.y);
          if (isSVG) {
            target.setAttributeNS(null, 'y', pos.y);
          } else {
            tf.style(target, {
              top: pos.y + 'px'
            });
          }
        }

        events.emit('Moving', pos.x, pos.y);
        return tf.nodefault(e);
      }
    });

    events.emit('Start', opos.x, opos.y);

    return tf.nodefault(e);
  });

  return {
    on: events.on,
    enable: enable,
    disable: disable,
    setAxis: function (ax) {
      axis = ax;
    }
  };
 };

export default Mover;
