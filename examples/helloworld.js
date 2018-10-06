import { tf } from './../src/timeflies.js';

// Create a timeline instance, and add it to document.body
const timeline = tf.Timeline(document.getElementById('timeline'), {
  initialLanes: 5
});

// Create timeline controls
// tf.Controls(timeline, document.getElementById('controls'));

// Add a custom block to the block pool
tf.RegisterBlock('My Block Type', {
  process: ( /* blockTime */ ) => {
    // This function is called when the block is "active".
    // blockTime contains the current time from 0..1, where 0 is the start
    // of the block, and 1 is the end.
  }
});

// Proces the timeline every 100ms (NOTE: should use requestAnimationFrame
// instead, with a fallback to setInterval)
setInterval(timeline.process, 100);

// Create a draggable div that creates a My Block Type block on the
// lane it's dropped on
tf.dom.ap(
  document.body,
  tf.dom.ap(
    tf.dom.style(tf.dom.cr('div'), {
      position: 'fixed',
      bottom: '40px',
      right: '0px'
    }),
  tf.Draggable(
    tf.dom.cr('div', 'draggable', 'Drag me on to a lane!'),
    'block',
    {
      type: 'My Block Type'
    }
  ).target)
);

