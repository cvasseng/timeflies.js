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

import Events from './tf.events.js';
import dom from './tf.dom.js';

let activePayload = false;

// Make a node draggable
export const Draggable = (target, type, payload) => {
  const events = Events();
  let callbacks = [];

  target.setAttribute('draggable', true);

  callbacks.push(
    dom.on(target, 'dragstart', function(e) {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', '-');

      activePayload = {
        type: type,
        payload: payload,
        emit: events.emit
      };

      events.emit('DragStart');
    })
  );

  callbacks.push(
    dom.on(target, 'dragend', function(e) {
      events.emit('DragEnd', e);
    })
  );

  return {
    target: target,
    on: events.on
  };
};

// Turn a node into a drop target
export const DropTarget = (target, types) => {
  const events = Events();
  let enabled = false;
  let callbacks = [];

  const nodef = e => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    e.preventDefault();
    return false;
  };

  const attach = () => {
    destroy();

    callbacks.push(
      dom.on(target, 'dragenter', function(e) {
        events.emit('DragEnter');
        return nodef(e);
      })
    );

    callbacks.push(
      dom.on(target, 'dragleave', function(e) {
        events.emit('DragLeave', e);
      })
    );

    callbacks.push(
      dom.on(target, 'dragover', function(e) {
        e.dataTransfer.dropEffect = 'copy';
        events.emit('DragOver');
        return nodef(e);
      })
    );

    callbacks.push(
      dom.on(target, 'drop', function(e) {
        if (!enabled) {
          return false;
        }

        if (!activePayload || types.indexOf(activePayload.type) === -1) {
          return;
        }

        events.emit('Drop', activePayload.payload, activePayload.type, e);
        activePayload.emit('Drop');

        return nodef(e);
      })
    );
  };

  const enable = () => {
    enabled = true;
  };

  const disable = () => {
    enabled = false;
  };

  const destroy = () => {
    callbacks.forEach(function(fn) {
      fn();
    });
    callbacks = [];
  };

  ///////////////////////////////////////////////////////////////////////////

  attach();
  // ah.dom.ap(target, markerNode);

  return {
    on: events.on,
    enable,
    disable,
    destroy
  };
};
