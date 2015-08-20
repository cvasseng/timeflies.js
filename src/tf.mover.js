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
 
 tf.Mover = function (handle, target, axis) {
  var events = tf.events(),
      moving = false,
      delta = {x: 0, y: 0},
      pos = {x: 0, y: 0},
      opos = {x: 0, y: 0},
      enabled = true
  ;

  if (!handle) {
    handle = target;
  }

  function enable() {
    enabled = true;
  }

  function disable() {
    enabled = false;
  }

  tf.on(handle, 'mousedown', function (e) {
    var upper, 
        mover
    ;

    if (!enabled || e.shiftKey) {
      return;
    }

    opos = tf.pos(target);

    delta.x = e.clientX;
    delta.y = e.clientY;

    moving = true;

    upper = tf.on(document.body, 'mouseup', function (e) {
      upper();
      mover();

      events.emit('Done', pos.x, pos.y);
      
      moving = false;
      return tf.nodefault(e);
    });

    mover = tf.on(document.body, 'mousemove', function (e) {
      if (moving) {

        if (!axis || axis === 'X') {
         pos.x = opos.x + (e.clientX - delta.x);
         if (pos.x < 0) pos.x = 0;
         tf.style(target, {
            left: pos.x + 'px'            
          });  
        }
        
        if (!axis || axis === 'Y') {
          pos.y = opos.y + (e.clientY - delta.y);
          tf.style(target, {         
            top: pos.y + 'px'
          });          
        }

        events.emit('Moving', pos.x, pos.y);
      }
      return tf.nodefault(e);
    });

    return tf.nodefault(e);
  });

  return {
    on: events.on,
    enable: enable,
    disable: disable
  };
 };