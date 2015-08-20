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
 
 (function () {
  var activePayload = false;

  ///////////////////////////////////////////////////////////////////////////
  //Make a node draggable
  tf.Draggable = function(target, type, payload) {
    var events = tf.events(),
        callbacks = []
    ;

    target.setAttribute('draggable', true);

    callbacks.push(tf.on(target, 'dragstart', function (e) {
      e.dataTransfer.effectAllowed = 'copy';

      activePayload = {
        type: type,
        payload: payload,
        emit: events.emit
      };

      events.emit('DragStart');
    }));

    callbacks.push(tf.on(target, 'dragend', function (e) {
      events.emit('DragEnd');
    }));

    return {
      on: events.on
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  //Turn a node into a drop target
  tf.DropTarget = function(target, types) {
    var enabled,
        events = tf.events(),
        callbacks = [],
        tarray = types.split(' ')
    ;

    function nodef(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      e.preventDefault();
      return false;
    } 

    function attach() {
      destroy();

      callbacks.push(tf.on(target, 'dragenter', function (e) {
        events.emit('DragEnter');
        return nodef(e);
      }));

      callbacks.push(tf.on(target, 'dragleave', function (e) {
        events.emit('DragLeave');
      }));

      callbacks.push(tf.on(target, 'dragover', function (e) {
        e.dataTransfer.dropEffect = 'copy';
        events.emit('DragOver');
        return nodef(e);
      }));

      callbacks.push(tf.on(target, 'drop', function (e) {
        if (!activePayload || types.indexOf(activePayload.type) === -1) {
          return;
        }
        
        //Handle it.
        events.emit('Drop', activePayload.payload, activePayload.type, e);
        activePayload.emit('Drop');

        return nodef(e);
      }));
    }

    function enable() {
      enabled = true;
    }

    function disable() {
      enabled = false;
    }

    function destroy() {
      callbacks.forEach(function (fn) {
        fn();
      });
      callbacks = [];
    }

    ///////////////////////////////////////////////////////////////////////////

    attach();
    //ah.dom.ap(target, markerNode);

    return {
      on: events.on,
      enable: enable,
      disable: disable,
      destroy: destroy
    }
  }
})();
