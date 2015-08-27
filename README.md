# timeflies.js

![Screenshot](screenshots/alpha2.png)

**JavaScript Timeline/sequencer UI Widget**

Suggested use cases include:
  * Sequencing sound
  * Video editing timelines
  * Cutscene composing for games/real-time stuff
  
**Features**
  * Lightweight: weighs in at less than 15kb minified
  * No dependencies. Just drop it into your project, and you're good to go
  * Easy to skin (look at [./less/light.less](less/light.less) to see how)
  * Supports composite blocks, meaning you can add your own block types easily, with (optionally) their own UI inside the block (e.g. a spline editor block)    
  * Supports drag 'n dropping blocks onto lanes
  * Zooming
  * Blocks are freeform, and can be moved across lanes (by holding shift and dragging), moved (by dragging), and resized (by grabbing the resize handle on the far-right)  
  * Lanes can be vertically resized interactively, to make room for e.g. a spline editor inside a block
  * Liberally licensed    
  * Undo
      
#Building
 
To build timeflies.js, you need [bakor](https://github.com/iqumulus/bakor/) installed. Bakor is a node module, 
and must be installed globally, i.e. `npm install -g bakor`.
Once installed, build by running `bakor` in the timeflies.js root directory.

This will produce a set of files in the `./build/` directory which can be included in your application.
 
#Examples

Examples can be found in the [examples](/examples) folder. There's a simple express server in the repository ([/bin/www](/bin/www)).
To use this, first run `npm install` in the root directory (or `sudo npm install` on OSX), then run `node bin/www`.
This will start an HTTP server serving up the examples-folder on port `3050`. Note that you **have to** run this server for the examples to work
properly, as they use the "unbuilt" sources - both for the JavaSript, and for the CSS. 
 
After starting the server as descripted above, go to [http://127.0.0.1:3050/helloworld.html](http://127.0.0.1:3050/helloworld.html) in your browser for a full listing of examples.
 
#Usage and API Reference

**Creating a timeline control**
    
    var timeline = tf.Sequencer(document.body, options);

The first argument is the DOM node to attach to. Notice the lack of `new` - this is not a typo.
timeline.js is implemented in a functional-style, without prototype-based inheritance or classic OOP emulation patterns.

The second argument is an object containing the timeline options. It's an optional argument, and can contain any and all of the following:
    
    {
      initialLanes: <number of lanes to initially create (default is 10)>,
      initialZoom: <initial zoom factor (default is 1)>,
      looping: <initial loop state (default is false)>
    }
    
**A note on events**

Most things emit events which can be listened to using the `on(event, callback, [context])` function.
This function returns a function that can be called to unsubscribe from the event.
Details on which events are available can be found below. 
The context specifies what should be set as the `this` reference inside the callback. 
This argument is optional.

Example:
    
    timeline.on('AddLane', function (lane) {
      console.log('Added a lane!');
      
      lane.on('AddBlock', function (block) {
        console.log('Added a block to a lane!');
      });      
    });    
    
 With context set:
    
    timeline.on('AddLane', function (lane) {
      //this keyword now references timeline.
    }, timeline);
    
    

**Adding custom blocks**
    
    tf.RegisterBlockType('MyCustomBlock', {
      state: {
        //Put initial state here.
        //The block copy of the state can be accessed using the this keyword.
      },
      construct: function (blockNode) {
        //Called when the block is created.
        //blockNode contains the block DOM node,
        //so this function can be used to e.g. add a spline editor in a block
      },
      destroy: function () {
        //Called when the block is destroyed
      },
      startProcess: function () {
        //Called when the block becomes active
      },
      stopProcess: function () {
        //Called when the block goes inactive after being active
      },
      process: function (blockTime) {
        //This is called when the block is active.
        //blockTime contains the time relative to the block progression
        //in range [0..1]    
      }
    });
    
**Adding Blocks to a Lane**

Blocks can be added either by dragging them onto a lane, or by programatically calling `addBlockAtPixel` or `addBlockAtTime` on a lane.
To make a draggable `div` that creates a block on a lane when dropped, use `tf.Draggable`:
  
    tf.Draggable(MyDiv, 'block', {
      //Initialization arguments
    });
  
The initialization object is the same as that which can be supplied to the `addBlockAt` functions.
It can have the following options (all are optional, though type should normally be supplied).
Note that if the block is dropped, start is automatically set to the time at the drop position in the sequence.

    {
      id: <id of block, defaults to either a uuid (if uuid.js is included) or a unique number>,
      type: <type of block, corresponds with the first argument for tf.RegisterBlockType calls>,
      start: <start time in milliseconds>,
      length: <length of block in milliseconds>,
      state: <the local state, this is accessed using this in the functions supplied to tf.RegisterBlockType>
    }        
    
##API Reference
    
**tf.Sequencer Interface**
  * `lane(number)`: returns a lane based on index, or false if out of bounds.   
  * `on(event, callback, [context])`: attach an event listener to the timeline.
  * `forEachLane(callback)`: iterate through lanes 
  * `resize()`: resizes the timeline control to fit its parent
  * `setTime(timeMS)`: set the current time in milliseconds
  * `process()`: process the timeline, activates any blocks intersecting with the current time
  * `zoom(factor)`: set zoom factor. Factor is number of milliseconds per. pixel e.g. 1 means 1 pixel = 1 milliseconds, and 1000 means 1 pixel = 1 second
  * `toJSON()`: serialize the timeline to a JSON object
  * `fromJSON(obj)`: unserialize the timeline from a JSON object
  * `play()`: start playing back the sequence from current time
  * `pause()`: pause playback
  * `isPlaying()`: returns the current playback state
  * `time()`: returns the current time in milliseconds
  * `zoomFactor()`: returns the current zoom factor
  * `gotoStart()`: goto the start of the sequence
  * `gotoEnd()`: goto the end of the sequence
  * `looping(true | false)`: enable/disable looping of the sequence when playing
  * `isLooping()`: returns the current loop state  
    
*Events*
  * `Addlane : lane`: emitted when a lane is added    
  * `Play : time`: emitted when starting to play the sequence
  * `Pause : time`: emitted when stopping playback
  * `SetTime : time`: emitted when the time is **manually** set by moving the time marker
  * `Zoom : factor`: emitted when the sequencer's zoom factor changes
    
**Lane Interface**
  * `removeBlock(id)`: remove a block from the lane
  * `destroy()`: destroy the lane - removes it from the timeline control
  * `addBlockAtPixel(pixel, attributes)`: add a block on a given pixel (x-coordinate). Attributes is an object containing the block initializer (see below).
  * `addBlockAtTime(timems, attributes`: add a block on a given time
  * `body`: the body DOM node for the lane
  * `on(event, callback, [context])`: attach an event listener to the lane
  * `scrollTo(pos)`: scroll to a given pixel 
  * `process(timeMs)`: process the lane with the time supplied
  * `zoomUpdate`: updates the positions of all the child blocks to fit the current zoom factor
  * `toJSON()`: serializes the lane to a JSON object
  * `fromJSON(obj)`: unpack the lane from an object
  * `count()`: returns the number of blocks in the lane
  * `getBlock(index)`: returns the block at the given index

*Events*
  * `AddBlock : <block instance>`: emitted when a new block is added to the lane
  * `RemoveBlock : <block>`: emitted when a block is removed from the lane
  * `Destroy`: emitted when the lane is destroyed

**Block Interface**
  * `state`: an object containing the block's custom state
  * `type`: a string defining the block type
  * `id`: the id of the block
  * `start`: start of the block in milliseconds (call `recalc()` afterwards if modifying directly)
  * `length`: length of the block in milliseconds (call `recalc()` afterwards if modifying directly)
  * `on(event, callback, [context])`: attach an event listener to a block
  * `resizeBody()`: resizes the body of the node, which custom UI is attached to, to fit the block
  * `reinit()`: re-executes the blocks `construct` function
  * `setTitle(title)`: set the title of the block
  * `toJSON()`: serialize the block to a JSON object
  * `fromJSON(obj)`: init the block from a JSON object
  * `destroy()`: destroys the block - this removes it from the sequence
  * `process(timeMS)`: process the block
  * `recalc()`: recalculates the position and width of the block from the start/length
  
*Events*
  * `Resize`: emitted when `resizeBody` is called, e.g. when vertically sizing lanes
  * `Focus`: emitted when the block is selected
  * `Destroy`: emitted when the block is destroyed
  * `Resized`: emitted when the block has been resized
  * `Moved`: emitted when the block has been moved  

**The tf.* interface**

The tf namespace contains a few utility functions to perform typechecks, deal with the DOM, and handling events.
While they are primarly there to make the rest of the code easier to read, write, and maintain, they can also
be used outside the library itself.

  * `tf.ap(target, ...)`: append one or more DOM nodes to the DOM node `target`
  * `tf.cr(type, cssClass, [value], [id])`: create and return a new DOM node
  * `tf.style(node, styleObject)`: style a node. Node can be an array, in which case all nodes will be styled at once
  * `tf.on(target, event, callback, [context]`: attach an event listener to a DOM node
  * `tf.nodefault(event)`: use to cancel event propogation on the supplied DOM event handle
  * `tf.merge(a, b)`: merge object `b` into object `a`. This is essentially a deep copy.
  * `tf.size(node)`: returns an object - `{w, h}` - containing the size of the supplied DOM node
  * `tf.pos(node)`: returns an object -`{x, y}` - containing the position of the supplied DOM node
  * `tf.isNull(what)`: returns true if `what` is null or undefined
  * `tf.isStr(what)`: returns true if `what` is a string
  * `tf.isNum(what)`: returns true if `what` is a number
  * `tf.isFn(what)`: returns true if `what` is a function
  * `tf.isArr(what)`: returns true if `what` is an array
  * `tf.isBool(what)`: returns true if `what` is a boolean
  * `tf.isBasic(what)`: returns true if `what` is a basic type (number, string, function) 
  * `tf.events()`: returns an event dispatcther object
  * `tf.Mover(handle, target, axis)`: make a DOM node movable. Handle is the move handle, target is the node to move, and axis is the axis for which moving is allowed ('X', 'Y', or 'XY'). The returned object has an event emitter (`on(...)`) which can be used to listen to `Done`, `Moving`, and `Start` events.
  * `tf.Resizer(handle, target, axis)`: make a DOM node resizable. Handle is the resize handle, target is the node to resize, and axis is the axis for which resizing is allowed ('X', 'Y', or 'XY'). The returned object has an event emitter (`on(...)`) which can be used to listen to `Done`, `Resizing`, and `Start` events.
  
Example: creating a DIV and appending it to `document.body`:
    
    tf.ap(document.body, tf.cr('div', 'myclass', 'Hello world!'));    

Example: styling a DOM node:
    
    tf.style(myDOMNode, {
      color: '#FFF',
      fontSize: '10px'
    });
    
Example: attaching an event listener to `document.body`:
    
    var cancelEvent = tf.on(document.body, 'click', function (e) {
      ...
    });
    
    //cancelEvent is now a function that can be called to detach the listener
    
Example: creating an event listener:
    
    //Create an object with an event listener in it
    function MyObject() {
      var events = tf.events();
    
      function sayHello() {
        events.emit('Hello');
      }
    
      return {
        sayHello: sayHello,
        on: events.on
      }
    }
    
    //Instance the object
    var foobar = MyObject();
    
    //Attach an event listener
    foobar.on('Hello', function () {
      console.log('foobar emitted Hello!');
    });
    
    //Call the hello function, which will emit the event and trigger the above handler
    foobar.sayHello();
    
Example: create a Movable DIV:
    
    .movable {
      position: absoulte;
    }
    
    var node = tf.cr('div', 'movable', 'Move me!');   
    tf.Mover(node, node);
    tf.ap(document.body, node);
    
Example: create a resizable DIV:
    
    var node = tf.cr('div', '', 'Resize me!'); 
    tf.Resizer(node, node);
    tf.ap(document.body, node);

# License

MIT. See LICENSE.md for details.
