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
 
tf.Resizer = function (handle, target, dir) {
  var events = tf.events(),
      moving = false,
      delta = {x: 0, y: 0},
      size = {w: 0, h: 0},
      osize = {w: 0, h: 0},
      enabled = true,
      mainHandle = false,
      direction = dir || 'XY',
      minSize = {w: 0, h: 0},
      snap = 1
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
  
  function destroy() {
    if (mainHandle) {
      mainHandle();
    }
  }

  function create() {
    destroy();
    
    mainHandle = tf.on(handle, 'mousedown', function (e) {
      var upper, 
          mover
      ;
  
      if (!enabled || e.shiftKey) {
        return;
      }
  
      osize = tf.size(target);
  
      delta.x = e.clientX;
      delta.y = e.clientY;
  
      moving = true;
      
      events.emit('Start', osize.w, osize.h);
  
      upper = tf.on(document.body, 'mouseup', function (e) {
        upper();
        mover();   
        moving = false;
        events.emit('Done', size.w, size.h);
        return tf.nodefault(e);
      });
  
      mover = tf.on(document.body, 'mousemove', function (e) {
        if (moving) {          
          
          if (direction === 'X' || direction === 'XY') {
            size.w = snap * Math.floor((osize.w + (e.clientX - delta.x)) / snap);
            if (size.w < minSize.w) size.w = minSize.w;
            tf.style(target, {
              width: size.w + 'px'
            });  
          }
          
          if (direction === 'Y' || direction === 'Y') {            
            size.h = osize.h + (e.clientY - delta.y);
            if (size.h < minSize.h) size.h = minSize.h;
            tf.style(target, {
              height: size.h + 'px'
            });
          }
  
          events.emit('Resizing', size.w, size.h);
        }
        return tf.nodefault(e);
      });
      return tf.nodefault(e);
    });
  }
  
  create();

  return {
    minSize: minSize,
    destroy: destroy,
    on: events.on,
    enable: enable,
    disable: disable
  };
};