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

/* @global requestAnimationFrame */

// @format

import Resizer from './tf.resizer.js';
import Mover from './tf.mover.js';
import tf from './tf.js';
import { Draggable, DropTarget } from './tf.dnd.js';

import Events from './tf.events.js';
import dom from './tf.dom.js';
import library from './tf.library.js';

export const Timeline = (parent, attrs) => {
  const events = Events();
  let container = dom.cr('div', 'timeline-js');
  let timeContainer = dom.cr('div', 'tl-time-indicator');
  let timeMarker = dom.cr('div', 'tl-time-marker');
  let laneBox = dom.cr('div', 'tl-lane-container');

  let properties = tf.merge(
    {
      initialLanes: 10,
      initialZoom: 1,
      looping: false
    },
    attrs
  );

  let lanes = [];
  let bcount = 0;
  // let lcount = 0;
  let currentTime = 0;
  let isPlaying = false;
  let playingOffset = 0;
  let playHandle = 0;
  let zoomFactor = properties.initialZoom;
  let selectedBlock = false;
  let stopTime = 0;
  let startTime = 50000;
  let looping = properties.looping;
  let undoStack = [];

  // Create a block
  const Block = (parent, attrs, plane) => {
    const events = Events();

    let pinterface = tf.merge(
      {
        state: {},
        type: 'Unkown Type',
        on: events.on,
        id: typeof uuid !== 'undefined' ? uuid.v4() : ++bcount, // eslint-disable-line no-undef
        start: 0,
        length: 100
      },
      attrs
    );

    let proto = library.getBlockPrototype(pinterface.type);
    let node = dom.cr('div', 'block tl-transition-color');
    let body = dom.cr('div', 'block-body');
    let sizer = dom.cr('div', 'block-sizer tl-transition-color');
    let title = dom.cr('span', '', pinterface.type);

    let resizer = Resizer(sizer, node, 'X');
    let mover = Mover(node, node, 'X');

    let bTime = 0;
    let bTimeLast = 0;
    let isProcessing = false;

    let size = {
      w: 0,
      h: 0
    };

    // let opos = {
    //   x: 0,
    //   y: 0
    // };

    // let osize = {
    //   w: 0,
    //   h: 0
    // };

    const constructProto = () => {
      body.innerHTML = '';

      if (proto) {
        let curr = tf.merge({}, pinterface.state);
        tf.merge(pinterface.state, proto.state);
        tf.merge(pinterface.state, curr);
        proto.construct.apply(pinterface.state, [pinterface, body]);
      }
    };

    const resizeBody = () => {
      dom.style(body, {
        width: size.w - 10 + 'px',
        height: dom.size(node).h - 25 + 'px'
      });

      events.emit('Resize', pinterface.state);
    };

    const setTitle = txt => {
      title.innerHTML = pinterface.type + ': ' + txt;
    };

    const focus = () => {
      if (selectedBlock) {
        selectedBlock.node.className = selectedBlock.node.className.replace(
          ' block-focused',
          ''
        );
      }

      node.className += ' block-focused';

      selectedBlock = {
        node: node,
        block: pinterface
      };

      events.emit('Focus');
    };

    pinterface.resizeBody = resizeBody;
    pinterface.reinit = constructProto;
    pinterface.setTitle = setTitle;

    // Serialize block to JSON
    pinterface.toJSON = () => {
      return {
        id: pinterface.id,
        state: pinterface.state,
        type: pinterface.type,
        start: pinterface.start,
        length: pinterface.length
      };
    };

    // Unpack block from json
    pinterface.fromJSON = obj => {
      pinterface.start = obj.start;
      pinterface.length = obj.length;
      pinterface.state = obj.state;
      pinterface.type = obj.type;
      proto = library.getBlockPrototype(obj.type);
      constructProto();
      pinterface.recalc();
    };

    // Destroy the block
    pinterface.destroy = () => {
      events.emit('Destroy', pinterface.id);
      node.parentNode.removeChild(node);
      if (proto) {
        proto.destroy.apply(pinterface.state);
      }
    };

    // Process
    pinterface.process = timeMs => {
      if (
        timeMs < pinterface.start ||
        timeMs > pinterface.start + pinterface.length
      ) {
        if (isProcessing) {
          // We just stopped processing, so remove the "active" class
          node.className = node.className.replace(' block-active', '');
          if (proto) {
            proto.stopProcess.apply(pinterface.state, [
              timeMs - pinterface.start
            ]);
          }
        }
        isProcessing = false;
        return;
      }

      if (!isProcessing) {
        // We just started processing, so add the "active" class
        node.className += ' block-active';
        if (proto) {
          proto.startProcess.apply(pinterface.state, [
            timeMs - pinterface.start
          ]);
        }
      }

      isProcessing = true;

      if (!proto) return;

      // Calculate block time in [0..1] range
      bTime = (timeMs - pinterface.start) / pinterface.length;

      proto.process.apply(pinterface.state, [
        bTime,
        bTime !== bTimeLast,
        setTitle,
        timeMs - pinterface.start
      ]);

      bTimeLast = bTime;
    };

    // Recalculate the x and width based on zoom factor
    pinterface.recalc = () => {
      size.w = pinterface.length / zoomFactor;
      dom.style(node, {
        left: pinterface.start / zoomFactor + 'px',
        width: size.w + 'px'
      });
    };

    /////////////////////////////////////////////////////////////////////////

    pinterface.recalc();

    Draggable(node, 'block-move', pinterface).on('Drop', () => {
      // So we need to destroy this thing.
      pinterface.destroy();
    });

    dom.ap(node, title, sizer, body);

    resizer.on('Start', (w, h) => {
      undoStack.push(() => {
        size.w = w;
        size.h = h;
        pinterface.length = w * zoomFactor;
        dom.style(node, {
          width: size.w + 'px'
        });
        resizeBody();
        calcStartEnd();
        events.emit('Resized');
      });
    });

    resizer.on('Resizing', (w, h) => {
      // Recalc length
      size.w = w;
      size.h = h;
      pinterface.length = w * zoomFactor;
      resizeBody();
    });

    resizer.on('Done', () => {
      focus();
      events.emit('Resized');
      calcStartEnd();
    });

    mover.on('Start', x => {
      undoStack.push(() => {
        pinterface.start = x * zoomFactor;
        dom.style(node, {
          left: x + 'px'
        });
        resizeBody();
        calcStartEnd();
        events.emit('Moved');
      });
    });

    mover.on('Moving', x => {
      // Recalc start
      pinterface.start = x * zoomFactor;
    });

    mover.on('Done', () => {
      focus();
      events.emit('Moved');
      calcStartEnd();
    });

    dom.on(node, 'contextmenu', e => {
      // Add undo command
      undoStack.push(() => {
        plane.addBlockAtTime(pinterface.start, pinterface.toJSON());
      });

      // Delete the block..
      pinterface.destroy();
      return dom.nodefault(e);
    });

    if (parent) {
      dom.ap(parent, node);
    }

    constructProto();

    return pinterface;
  };

  /////////////////////////////////////////////////////////////////////////////

  // Creates a single lane
  const Lane = parent => {
    const events = Events();

    let container = dom.cr('div', 'tl-lane tl-box-size tl-transition');
    let body = dom.cr('div', 'lane-body tl-box-size');

    let dropTarget = DropTarget(body, 'block block-move');
    let resizer = Resizer(body, container, 'Y');

    let blocks = [];
    let bottomBlock = false;
    // let id = typeof uuid !== 'undefined' ? uuid.v4() : ++lcount; // eslint-disable-line no-undef
    let exports = {};

    // Sort blocks
    const sort = () => {
      blocks = blocks.sort((a, b) => {
        return a.start > b.start;
      });
      recalcBottomBlock();
    };

    // Add a block
    const addBlock = b => {
      b.resizeBody();
      blocks.push(b);

      b.on('Destroy', () => {
        events.emit('RemoveBlock', b);
        blocks = blocks.filter(block => {
          return b.id !== block.id;
        });
      });

      // Keep blocks sorted
      b.on('Moved', sort);
      b.on('Resized', sort);
      sort();

      events.emit('AddBlock', b);

      if (!bottomBlock) {
        bottomBlock = b;
      }

      calcStartEnd();

      undoStack.push(() => {
        b.destroy();
      });

      return b;
    };

    // Add a block on a given time
    const addBlockAtTime = (t, attrs) => {
      let b = Block(
        body,
        tf.merge(
          {
            start: t,
            length: t + 1000
          },
          attrs
        ),
        exports
      );

      return addBlock(b);
    };

    // Add a block on a given pixel
    const addBlockAtPixel = (x, attrs) => {
      const b = Block(
        body,
        tf.merge(attrs || {}, {
          start: x * zoomFactor
        }),
        exports
      );

      return addBlock(b);
    };

    // Remove a block based on id
    const removeBlock = id => {
      blocks.some(block => {
        if (block.id === id) {
          events.emit('RemoveBlock', block);
          block.destroy();
          return true;
        }
        return false;
      });
    };

    // Set scroll position
    const scrollTo = x => {
      body.scrollLeft = x;
    };

    // Destroy the lane
    const destroy = () => {
      container.parentNode.removeChild(container);
      container.innerHTML = '';
      events.emit('Destroy');

      undoStack.push(function() {});
    };

    // Recalc the bottom block based on the current time
    const recalcBottomBlock = () => {
      blocks.forEach(function(b) {
        if (b.start - 10 > currentTime) {
          return false;
        }
        bottomBlock = b;
      });
    };

    // Process lane - naive implementation. TODO: sorting, culling, etc.
    /*
        Blocks are always sorted.
        So we can keep track of the current block, and iterate from there,
        until we hit a block that that starts - 10 ms from timeMs.
        When scrubbing, we need to recalc the from block.

        The problem is that if a block is active, and we're scrubbing
        backwards, it never gets told that it's no longer active.
        So while it won't process anymore, it will be marked as active..
      */
    const process = timeMs => {
      blocks.forEach(b => {
        // if (b.start - 10 > timeMs) {
        //   return true;
        // }
        b.process(timeMs);
      });
    };

    // Called when zooming to recalc block pixel pos/size
    const zoomUpdated = () => {
      blocks.forEach(b => {
        b.recalc();
        b.resizeBody();
      });
    };

    const toJSON = () => {
      sort();
      return blocks.map(b => {
        return b.toJSON();
      });
    };

    const fromJSON = obj => {
      blocks = blocks.filter(b => {
        b.destroy();
        return false;
      });

      obj.forEach(b => {
        addBlock(Block(body, b));
      });
    };

    const count = () => {
      return blocks.length;
    };

    const getBlock = b => {
      if (tf.isNum(b)) {
        if (b < 0 || b >= blocks.length) {
          return false;
        }
        return blocks[b];
      }
    };

    /////////////////////////////////////////////////////////////////////////////

    resizer.on('Done', () => {
      blocks.forEach(b => {
        b.resizeBody();
      });
    });

    dropTarget.on('Drop', (payload, type, e) => {
      if (type === 'block-move') {
        addBlockAtPixel(e.clientX, payload);
      } else {
        addBlockAtPixel(e.clientX + laneBox.scrollLeft, payload);
      }
    });

    // Put together the DOM heirarchy
    dom.ap(container, body);

    if (parent) {
      dom.ap(parent, container);
    }

    exports = {
      recalcBottomBlock: recalcBottomBlock,
      removeBlock: removeBlock,
      destroy: destroy,
      addBlockAtPixel: addBlockAtPixel,
      addBlockAtTime: addBlockAtTime,
      body: body,
      on: events.on,
      scrollTo: scrollTo,
      process: process,
      zoomUpdated: zoomUpdated,
      toJSON: toJSON,
      fromJSON: fromJSON,
      count: count,
      getBlock: getBlock
    };

    return exports;
  };

  /////////////////////////////////////////////////////////////////////////////

  // Lane iterator
  const forEachLane = (fn, ctx) => {
    lanes.forEach(fn, ctx);
  };

  const resize = () => {
    let size = dom.size(container);

    dom.style(laneBox, {
      width: size.w + 'px',
      height: size.h - dom.size(timeContainer).h + 'px'
    });

    dom.style(timeContainer, {
      width: size.w + 'px'
    });

    dom.style(timeMarker, {
      height: size.h - 10 + 'px'
    });
  };

  const addLane = () => {
    let l = Lane(laneBox, 'Lane ' + i); // eslint-disable-line block-scoped-var
    lanes.push(l);
    events.emit('AddLane', l);
    return l;
  };

  // 1 pixels = factor milliseconds
  // Also - the factor HAS to be even.
  // So if it's even, it will snap to factor + 1
  const zoom = factor => {
    if (Math.abs(factor) % 2 === 1) {
      factor++;
    }

    if (factor < 1) factor = 1;

    // Need to update all the blocks..
    zoomFactor = factor;
    setTime(currentTime); // Update marker

    lanes.forEach(lane => {
      lane.zoomUpdated();
    });

    buildTimeIndicators();

    events.emit('Zoom', zoomFactor);
  };

  const updatePlayOffset = () => {
    if (isPlaying) {
      // Adjust the play offset
      playingOffset = new Date().getTime() - currentTime;
    }
  };

  const setTime = (t, callout) => {
    // Need to scroll + set marker position
    currentTime = t;
    setMarker(t);

    updatePlayOffset();

    lanes.forEach(lane => {
      lane.recalcBottomBlock();
    });

    events.emit('SetTime', currentTime);
  };

  const setMarker = time => {
    dom.style(timeMarker, {
      left: time / zoomFactor - laneBox.scrollLeft + 'px'
    });
  };

  const process = () => {
    lanes.forEach(l => {
      l.process(currentTime);
    });
  };

  const getLane = num => {
    if (num < lanes.length) return lanes[num];
    return false;
  };

  const toJSON = () => {
    return lanes.map(lane => {
      return lane.toJSON();
    });
  };

  const fromJSON = obj => {
    if (tf.isStr(obj)) {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        throw e.toString();
      }
    }

    lanes = lanes.filter(function(l) {
      l.destroy();
      return false;
    });

    obj.forEach(function(l) {
      addLane().fromJSON(l);
    });
  };

  const play = () => {
    const frame = () => {
      currentTime = new Date().getTime() - playingOffset;
      setMarker(currentTime);
      process();

      if (isPlaying && tf.isFn(requestAnimationFrame)) {
        requestAnimationFrame(frame);
      }

      if (looping && currentTime > stopTime) {
        gotoStart();
      }
    };

    // Calc end in case we're looping
    calcEnd();

    pause(); // Just to clear intervals
    playingOffset = new Date().getTime() - currentTime;
    isPlaying = true;
    if (tf.isFn(requestAnimationFrame)) {
      requestAnimationFrame(frame);
    } else {
      playHandle = setInterval(frame, 50);
    }
    events.emit('Play', currentTime);
  };

  const pause = () => {
    isPlaying = false;
    if (!tf.isFn(requestAnimationFrame)) {
      clearInterval(playHandle);
    }
    events.emit('Pause', currentTime);
  };

  const buildTimeIndicators = () => {
    timeContainer.innerHTML = '';
    for (let i = 0; i < 500; i++) {
      dom.ap(
        timeContainer,
        dom.style(
          dom.cr('span', 'time', (zoomFactor * (i * 100)) / 1000 + 's'),
          {
            left: i * 100 + 'px'
          }
        )
      );
    }
  };

  const calcStart = () => {
    startTime = 500000;
    lanes.forEach(function(lane) {
      if (lane.count() > 0) {
        if (lane.getBlock(0).start < startTime) {
          startTime = lane.getBlock(0).start;
        }
      }
    });
  };

  function calcEnd() {
    stopTime = 0;
    lanes.forEach(function(lane) {
      if (lane.count() > 0) {
        let i = lane.count() - 1;
        if (lane.getBlock(i).start + lane.getBlock(i).length > stopTime) {
          stopTime = lane.getBlock(i).start + lane.getBlock(i).length;
        }
      }
    });
  }

  function calcStartEnd() {
    calcStart();
    calcEnd();
  }

  function gotoStart() {
    calcStart();
    currentTime = startTime;
    setMarker(currentTime);
    updatePlayOffset();
  }

  function gotoEnd() {
    calcEnd();
    currentTime = stopTime;
    setMarker(currentTime);
    updatePlayOffset();
  }

  function undo() {
    if (undoStack.length > 0) {
      undoStack[undoStack.length - 1]();
      undoStack.splice(undoStack.length - 1, 1);
    }
  }

  /////////////////////////////////////////////////////////////////////////////

  dom.ap(container, timeMarker, timeContainer, laneBox);

  // Create some lanes
  for (let i = 0; i < properties.initialLanes; i++) {
    lanes.push(Lane(laneBox, 'Lane ' + i));
  }

  if (tf.isStr(parent)) {
    parent = document.getElementById(parent);
  }

  if (parent) {
    dom.ap(parent, container);
  }

  dom.on(timeContainer, 'click', function(e) {
    setTime((e.clientX + laneBox.scrollLeft) * zoomFactor);
  });

  dom.on(laneBox, 'scroll', function() {
    timeContainer.scrollLeft = laneBox.scrollLeft;
    setMarker(currentTime);
  });

  resize();
  zoom(1);

  // Public interface
  return {
    lane: getLane,
    on: events.on,
    forEachLane: forEachLane,
    addLane: addLane,
    resize: resize,
    setTime: setTime,
    process: process,
    zoom: zoom,
    toJSON: toJSON,
    fromJSON: fromJSON,
    play: play,
    pause: pause,
    gotoStart: gotoStart,
    gotoEnd: gotoEnd,
    undo: undo,

    looping: function(flag) {
      looping = flag;
      calcEnd();
    },
    isLooping: function() {
      return looping;
    },
    isPlaying: function() {
      return isPlaying;
    },
    time: function() {
      return currentTime;
    },
    zoomFactor: function() {
      return zoomFactor;
    },
    selectedBlock: function() {
      return selectedBlock ? selectedBlock.block : false;
    }
  };
};

export default Timeline;
