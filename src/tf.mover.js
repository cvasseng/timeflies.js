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
 
 tf.Mover = function (handle, target, axis, isSVG) {
  var events = tf.events(),
      moving = false,
      delta = {x: 0, y: 0},
      pos = {x: 0, y: 0},
      opos = {x: 0, y: 0},
      enabled = true,
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

  tf.on(handle, 'mousedown', function (e) {
    var upper, 
        mover
    ;

    if (!enabled || e.shiftKey) {
      return;
    }

    if (isSVG) {
      opos = {
        x: target.x.baseVal.value,
        y: target.y.baseVal.value
      };
    } else {
      opos = tf.pos(target);      
    }

    delta.x = e.clientX;
    delta.y = e.clientY;

    moving = true;

    upper = tf.on(document.body, 'mouseup', function (e) {
      if (moving) {
        upper();
        mover();
  
        events.emit('Done', pos.x, pos.y);
        
        moving = false;
        return tf.nodefault(e);
      }
    });

    mover = tf.on(document.body, 'mousemove', function (e) {
      console.log('moving! ' + moving);
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