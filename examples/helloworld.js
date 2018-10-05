
import { tf } from './../src/timeflies.js';

console.log(tf);

// Zoom the sequencer
window.doZoom = (sender) => {
  timeline.zoom(parseFloat(400 - parseInt(sender.value, 10)) / 10);
};

// Create a timeline instance, and add it to document.body
const timeline = window.sequencer = tf.Timeline(document.body, {
  initialLanes: 5
});

// Add a custom block to the block pool
tf.RegisterBlock('My Block Type', {
  process: function(blockTime) {
    // This function is called when the block is "active".
    // blockTime contains the current time from 0..1, where 0 is the start
    // of the block, and 1 is the end.
    // For a list of all possible callbacks in tf.R:egisterBlockType,
    // refer to the README in the root directory.
  }
});

// Proces the timeline every 100ms (NOTE: should use requestAnimationFrame instead, with a fallback to setInterval)
setInterval(timeline.process, 100);

// Create a draggable div that creates a My Block Type block on the lane it's dropped on
tf.dom.ap(
  document.body,
  tf.Draggable(tf.dom.cr('div', 'draggable', 'Drag me on to a lane!'), 'block', {
    type: 'My Block Type'
  }).target
);

tf.dom.ap(document.body, tf.dom.cr('h1', '', 'test'));

// Set the time to 0
timeline.setTime(0);
// Resize the timeline
timeline.resize();
