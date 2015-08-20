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
        scrollBar = tf.cr('div'),
        laneBox = tf.cr('div', 'tl-lane-container'),
        lanes = [],
        bcount = 0,
        currentTime = 0,
        zoomFactor = 1,
        properties = tf.merge({
          initialLanes: 10
        }, attrs)
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
          size = {w: 0, h: 0}
      ;
      
      function constructProto() {
        if (proto) {
          tf.merge(pinterface.state, proto.state);
          proto.construct.apply(pinterface.state, [body, events.on]);
        }
      }
      
      function resizeBody() {
        tf.style(body, {
          width: size.w - 10 + 'px',
          height: tf.size(node).h - 25 + 'px'
        });
        events.emit('Resize', pinterface.state);
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
            node.className = 'block tl-transition-color';
            if (proto) {
              proto.startProcess.apply(pinterface.state);
            }
          }
          isProcessing = false;
          return;
        }
                        
        if (!isProcessing) {
          //We just started processing, so add the "active" class
          node.className = 'block tl-transition-color block-active';
          if (proto) {
            proto.stopProcess.apply(pinterface.state);
          }
        }
        
        isProcessing = true;
        
        if (!proto) return;
        
        //Calculate block time in [0..1] range
        proto.process.apply(pinterface.state, [(timeMs - pinterface.start) / pinterface.length, function (txt) {
          title.innerHTML = pinterface.type + ': ' + txt;
        }]);
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
      
      mover.on('Moving', function (x, y) {
        //Recalc start
        pinterface.start = x * zoomFactor;
      });
      
      if (parent) {
        tf.ap(parent, node);
      }
      
      constructProto();
      
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
      
      resizer.on('Done', function () {
        blocks.forEach(function (b) {
          b.resizeBody();
        });
      });
      
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
        console.log(body.scrollLeft + ' ' + body.scrollWidth + ' ' + x);
      }
      
      //Destroy the lane
      function destroy() {       
        container.parentNode.removeChild(container);
        container.innerHTML = '';
      }
      
      //Process lane - naive implementation. TODO: sorting, culling, etc.
      function process(timeMs) {
        blocks.forEach(function (b) {
          b.process(timeMs);
        });
      }
      
      function zoomUpdated() {
        blocks.forEach(function (b) {
          b.recalc();
        });
      }
      
      function toJSON() {
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
          
      dropTarget.on('Drop', function (payload, type, e) {
        if (type === 'block-move') {                
          addBlockAtPixel(e.clientX, payload);        
        } else {
          addBlockAtPixel(e.clientX + scrollBar.scrollLeft, payload);        
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
        height: (size.h - tf.size(scrollBar).h) + 'px'
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
    function zoom(factor) {
      if (factor < 1) factor = 1;
      
      //Need to update all the blocks..
      zoomFactor = factor;
      setTime(currentTime); //Update marker
      
      lanes.forEach(function (lane) {
        lane.zoomUpdated();
      });
      
    }
    
    function setTime(t) {
      //Need to scroll + set marker position
      tf.style(timeMarker, {
        left: (t / zoomFactor) + 'px'
      });
      currentTime = t;
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
      lanes = lanes.filter(function (l) {
        l.destroy();
        return false;
      });
      
      obj.forEach(function (l) {
        addLane().fromJSON(l);
      });
    }
    
    /////////////////////////////////////////////////////////////////////////////
    
    tf.style(scrollBar, {
      'overflow-x': 'scroll',
      'overflow-y': 'hidden',
      width: '100%'
    });
           
    tf.ap(container, 
      timeMarker,
      tf.ap(scrollBar, 
        timeContainer       
      ),
      laneBox
    );
    
    //Create some lanes
    for (var i = 0; i < properties.initialLanes; i++) {
      lanes.push(Lane(laneBox, 'Lane ' + i));
    }
   
    for (var i = 0; i < 500; i++) {
      tf.ap(timeContainer, tf.cr('span', 'time', i));
    }
    
    if (parent) {
      tf.ap(parent, container);
    }
    
    tf.on(timeContainer, 'click', function (e) {
       tf.style([timeMarker], {
         left: e.clientX + 'px'
       });
       currentTime = (e.clientX + scrollBar.scrollLeft) * zoomFactor;
    });
    
    tf.on(scrollBar, 'scroll', function (e) {
      laneBox.scrollLeft = scrollBar.scrollLeft;
      timeContainer.scrollLeft = scrollBar.scrollLeft;
      tf.style(timeMarker, {
        left: (currentTime / zoomFactor) - scrollBar.scrollLeft + 'px'    
      });
    });
    
    resize(); 
  
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
      fromJSON: fromJSON
    }  
  };
})();
