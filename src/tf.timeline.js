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
  var blockPool = {};
  
  //Register a block type
  tf.RegisterBlockType = function (name, attributes) {    
    if (!name) return;    
    blockPool[name] = tf.merge({
      state: {},
      process: function () {},
      startProcess: function (){},
      stopProcess: function () {},
      construct: function () {},
      destroy: function () {},
      title: function () {}  
    }, attributes);
  };
  
  tf.Sequencer = function (parent, attrs) {
    var events = tf.events(),
        container = tf.cr('div', 'timeline-js'),     
        timeContainer = tf.cr('div', 'tl-time-indicator'),
        timeMarker = tf.cr('div', 'tl-time-marker'),
        laneBox = tf.cr('div', 'tl-lane-container'),
        lanes = [],
        bcount = 0,
        currentTime = 0,
        zoomFactor = 1,
        isPlaying = false,
        playingOffset = 0,
        playHandle = 0,
        properties = tf.merge({
          initialLanes: 10
        }, attrs),
        selectedBlock = false,
        stopTime = 0,
        startTime = 50000
    ;
  
    //Create a block
    function Block(parent, attrs, data) {
      var events = tf.events(),          
          blockTime = 0,
          isProcessing = false,
          pinterface = tf.merge({
            state: {},
            type: 'Unkown Type',
            on: events.on,
            data: data,
            id: (typeof uuid !== 'undefined') ? uuid.v4() : (++bcount),
            start: 0,
            length: 100
          }, attrs),
          proto = blockPool[pinterface.type] || false,
          node = tf.cr('div', 'block tl-transition-color'),
          body = tf.cr('div', 'block-body'),
          sizer = tf.cr('div', 'block-sizer tl-transition-color'),
          title = tf.cr('span', '', pinterface.type),
          resizer = tf.Resizer(sizer, node, 'X'),
          mover = tf.Mover(node, node, 'X'),
          size = {w: 0, h: 0},
          bTime = 0,
          bTimeLast = 0
      ;
      
      function constructProto() {
        if (proto) {
          if (Object.keys(pinterface.state).length !== Object.keys(proto.state).length) {
            var curr = tf.merge({}, pinterface.state);
            tf.merge(pinterface.state, proto.state); 
            tf.merge(pinterface.state, curr);           
          }
          proto.construct.apply(pinterface.state, [body, events.on, pinterface, setTitle]);
        }
      }
      
      function resizeBody() {
        tf.style(body, {
          width: size.w - 10 + 'px',
          height: tf.size(node).h - 25 + 'px'
        });
        events.emit('Resize', pinterface.state);
      }
      
      function setTitle (txt) {
        title.innerHTML = pinterface.type + ': ' + txt;
      }
      
      function focus() {
        if (selectedBlock) {
          selectedBlock.node.className = selectedBlock.node.className.replace(' block-focused', '');
        }
        
        node.className += ' block-focused';
        
        selectedBlock = {
          node: node,
          block: pinterface
        };
        
        events.emit('Focus');
      }
      
      function checkIfNewStop() {
        if (pinterface.start + pinterface.length > stopTime) {
          stopTime = pinterface.start + pinterface.length;
        }
        
        if (pinterface.start < startTime) {
          startTime = pinterface.start;
        }
      }
      
      pinterface.resizeBody = resizeBody;
          
      //Serialize block to JSON
      pinterface.toJSON = function () {
        return {
          id: pinterface.id,
          state: pinterface.state,
          type: pinterface.type,
          start: pinterface.start,
          length: pinterface.length
        };
      };
      
      //Unpack block from json
      pinterface.fromJSON = function (obj) {
        pinterface.start = obj.start;
        pinterface.length = obj.length;
        pinterface.state = obj.state;
        pinterface.type = obj.type;
        proto = blockPool[obj.type];
        constructProto();
        pinterface.recalc();
      };
      
      //Destroy the block
      pinterface.destroy = function () {
        events.emit('Destroy', pinterface.id);
        node.parentNode.removeChild(node);
        if (proto) {
          proto.destroy.apply(pinterface.state);
        }
      };
      
      //Process
      pinterface.process = function (timeMs) {
        if (timeMs < pinterface.start || timeMs > pinterface.start + pinterface.length) {
          if (isProcessing) {
            //We just stopped processing, so remove the "active" class
            node.className = node.className.replace(' block-active', '');
            if (proto) {
              proto.stopProcess.apply(pinterface.state, [timeMs - pinterface.start]);
            }
          }
          isProcessing = false;
          return;
        }
                        
        if (!isProcessing) {
          //We just started processing, so add the "active" class
          node.className += ' block-active';
          if (proto) {
            proto.startProcess.apply(pinterface.state, [timeMs - pinterface.start]);
          }
        }
        
        isProcessing = true;
        
        if (!proto) return;
        
        //Calculate block time in [0..1] range
        bTime = (timeMs - pinterface.start) / pinterface.length;
        
        proto.process.apply(pinterface.state, [bTime, bTime !== bTimeLast, setTitle, timeMs - pinterface.start]);
        
        bTimeLast = bTime;
      };
      
      //Recalculate the x and width based on zoom factor
      pinterface.recalc = function () {
        size.w = (pinterface.length / zoomFactor);
        tf.style(node, {
          left: (pinterface.start / zoomFactor) + 'px',
          width: size.w + 'px'
        }); 
      };
                  
      /////////////////////////////////////////////////////////////////////////
      
      pinterface.recalc();    
                     
      tf.Draggable(node, 'block-move', pinterface).on('Drop', function () {
        //So we need to destroy this thing. 
        pinterface.destroy(); 
      });      
      
      tf.ap(node, 
        title,
        sizer,
        body
      );
      
      resizer.on('Resizing', function (w, h) {
        //Recalc length  
        size.w = w;
        size.h = h;
        pinterface.length = w * zoomFactor;
        resizeBody();
      });
      
      resizer.on('Done', function () {
        focus();
        checkIfNewStop();
      });
      
      mover.on('Moving', function (x, y) {
        //Recalc start
        pinterface.start = x * zoomFactor;
        
      });
      
      mover.on('Done', function () {
        focus();
        checkIfNewStop();
      });
      
      if (parent) {
        tf.ap(parent, node);
      }
      
      constructProto();
      checkIfNewStop();
      
      return pinterface;
    }
    
    /////////////////////////////////////////////////////////////////////////////
  
    //Creates a single lane
    function Lane(parent, name) {
      var events = tf.events(),       
          container = tf.cr('div', 'tl-lane tl-box-size tl-transition'),
          body = tf.cr('div', 'lane-body tl-box-size'),
          resizer = tf.Resizer(body, container, 'Y'),
          dropTarget = tf.DropTarget(body, 'block block-move'),
          blocks = []        
      ;           
            
      //Sort blocks
      function sort() {
        blocks = blocks.sort(function (a, b) {
          return a.start > b.start;
        });
      }
      
      //Add a block
      function addBlock(b) {
        b.resizeBody();
        blocks.push(b);
        b.on('Destroy', function () {
          events.emit('RemoveBlock', b); 
          blocks = blocks.filter(function (block) {
            return b.id === block.id;
          });  
        });
      }
      
      //Add a block on a given time
      function addBlockAtTime(t, attrs) {
        var b = Block(body, {
          start: t,
          length: length || 100
        });
        return addBlock(b);
      }
      
      //Add a block on a given pixel
      function addBlockAtPixel(x, attrs) {
        var b = Block(body, tf.merge(attrs || {}, {
          start: x * zoomFactor
        }));
        events.emit('AddBlock', b);
        return addBlock(b);
      }
      
      //Remove a block based on id
      function removeBlock(id) {
        blocks.some(function (block) {
          if (block.id === id) {
            events.emit('RemoveBlock', block);           
            block.destroy();
            return true;
          }
        });
      }
      
      //Set scroll position
      function scrollTo(x) {
        body.scrollLeft = x;
      }
      
      //Destroy the lane
      function destroy() {       
        container.parentNode.removeChild(container);
        container.innerHTML = '';
        events.emit('Destroy');
      }
      
      //Process lane - naive implementation. TODO: sorting, culling, etc.
      function process(timeMs) {
        blocks.forEach(function (b) {
          b.process(timeMs);
        });
      }
      
      //Called when zooming to recalc block pixel pos/size
      function zoomUpdated() {
        blocks.forEach(function (b) {
          b.recalc();
          b.resizeBody();
        });
      }
      
      function toJSON() {
        sort();
        return blocks.map(function (b) {
          return b.toJSON();
        });
      }
      
      function fromJSON(obj) {
        blocks = blocks.filter(function (b) {
          b.destroy();
          return false;
        });
        
        obj.forEach(function (b) {
          addBlock(Block(body, b));
        });
      }
      
      /////////////////////////////////////////////////////////////////////////////         
          
      resizer.on('Done', function () {
        blocks.forEach(function (b) {
          b.resizeBody();
        });
      });          
          
      dropTarget.on('Drop', function (payload, type, e) {
        if (type === 'block-move') {                
          addBlockAtPixel(e.clientX, payload);        
        } else {
          addBlockAtPixel(e.clientX + laneBox.scrollLeft, payload);        
        }
      });
      
      //Put together the DOM heirarchy 
      tf.ap(container, 
        body
      );
          
      if (parent) {
        tf.ap(parent, container);
      }
      
      return {
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
        fromJSON: fromJSON
      }
    } 
  
    /////////////////////////////////////////////////////////////////////////////
 
    //Lane iterator
    function forEachLane(fn, ctx) {
      lanes.forEach(fn, ctx);
    }  
    
    function resize() {
      var size = tf.size(container);
      
      tf.style(laneBox, {
        width: size.w + 'px',
        height: (size.h - tf.size(timeContainer).h) + 'px'
      });
      
      tf.style(timeContainer, {
        width: size.w + 'px'
      });
      
      tf.style(timeMarker, {
        height: size.h - 10 + 'px'
      });
    }
    
    function addLane() {
      var l = Lane(laneBox, 'Lane ' + i);
      lanes.push(l);
      events.emit('AddLane', l);
      return l;
    }
    
    //1 pixels = factor milliseconds
    //Also - the factor HAS to be even.
    //So if it's even, it will snap to factor + 1 
    function zoom(factor) {
      if ((Math.abs(factor) % 2 == 1)) {
        factor++;
      }
      
      if (factor < 1) factor = 1;
      
      //Need to update all the blocks..
      zoomFactor = factor;
      setTime(currentTime); //Update marker
      
      lanes.forEach(function (lane) {
        lane.zoomUpdated();
      });         
      
      buildTimeIndicators(); 
      
      events.emit('Zoom', zoomFactor);
    }        
    
    function updatePlayOffset() {
      if (isPlaying) { //Adjust the play offset
         playingOffset = (new Date()).getTime() - currentTime;
      }
    }
    
    function setTime(t, callout) {
      //Need to scroll + set marker position
      currentTime = t;
      setMarker(t);
      
      updatePlayOffset();
      
      events.emit('SetTime', currentTime);
    }
    
    function setMarker(time) {
      tf.style(timeMarker, {
        left: (time / zoomFactor) - laneBox.scrollLeft + 'px'
      });
    }
    
    function process() {
      lanes.forEach(function (l) {
        l.process(currentTime);
      });
    }
    
    function getLane(num) {
      if (num < lanes.length) return lanes[num];
      return false;
    }
    
    function toJSON() {
      return lanes.map(function (lane) {
        return lane.toJSON();
      });
    }
    
    function fromJSON(obj) {
      if (tf.isStr(obj)) {
        try {
          obj = JSON.parse(obj);
        } catch (e) {
          throw e.toString();
          return;
        }
      }
      
      lanes = lanes.filter(function (l) {
        l.destroy();
        return false;
      });
      
      obj.forEach(function (l) {
        addLane().fromJSON(l);
      });
    }
    
    function play() {
      function frame() {
        currentTime = (new Date()).getTime() - playingOffset;
        setMarker(currentTime);        
        process();
        
        if (isPlaying && tf.isFn(requestAnimationFrame)) {
          requestAnimationFrame(frame);
        }
      }
      
      pause(); //Just to clear intervals
      playingOffset = (new Date()).getTime() - currentTime;
      isPlaying = true;
      if (tf.isFn(requestAnimationFrame)) {
        requestAnimationFrame(frame);
      } else {
        playHandle = setInterval(frame, 50);
      }
      events.emit('Play', currentTime);
    }
    
    function pause() {
      isPlaying = false;
      if (!tf.isFn(requestAnimationFrame)) {
        clearInterval(playHandle);
      }
      events.emit('Pause', currentTime);
    }
    
    function buildTimeIndicators() {
      timeContainer.innerHTML = '';
      for (var i = 0; i < 500; i++) {
        tf.ap(timeContainer, tf.style(tf.cr('span', 'time', (zoomFactor * (i * 100)) / 1000 + 's'), {
          left: i * 100 + 'px'
        }));
      }
    }
    
    function gotoStart() {
      currentTime = startTime;
      setMarker(currentTime);
      updatePlayOffset();
    }
    
    function gotoEnd() {
      currentTime = stopTime;
      setMarker(currentTime);
      updatePlayOffset();
    }
    
    
    /////////////////////////////////////////////////////////////////////////////
           
    tf.ap(container, 
      timeMarker,
      timeContainer,      
      laneBox
    );
    
    //Create some lanes
    for (var i = 0; i < properties.initialLanes; i++) {
      lanes.push(Lane(laneBox, 'Lane ' + i));
    }
   
    if (tf.isStr(parent)) {
      parent = document.getElementById(parent);
    }
    
    if (parent) {
      tf.ap(parent, container);
    }
    
    tf.on(timeContainer, 'click', function (e) {      
      setTime((e.clientX + laneBox.scrollLeft) * zoomFactor);
    });
    
    tf.on(laneBox, 'scroll', function (e) {
      timeContainer.scrollLeft = laneBox.scrollLeft;
      setMarker(currentTime);
    });
    
    resize(); 
    zoom(1);
  
    //Public interface
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
      
      isPlaying: function () { return isPlaying;},
      time: function () {return currentTime;},
      zoomFactor: function () {return zoomFactor;},
      selectedBlock: function () {return selectedBlock ? selectedBlock.block : false;}
    }  
  };
})();
