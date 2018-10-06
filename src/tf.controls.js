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

// @format

import dom from './tf.dom.js';
import { isFn } from './tf.js';
import Events from './tf.events.js';

export const Controls = (timeline, parentNode, props) => {
  const events = Events();

  props = Object.assign(
    {
      buttons: []
    },
    props || {}
  );

  const toolbar = dom.cr('div', 'tf-controls');

  let buttons = [
    {
      tooltip: 'Go to the start of the timeline',
      icon: 'step-backward',
      click: timeline.gotoStart
    },
    {
      tooltip: 'Start/stop playback',
      icon: 'play',
      click: btn => {
        if (timeline.isPlaying()) {
          timeline.pause();
          btn.icon = 'play';
        } else {
          timeline.play();
          btn.icon = 'pause';
        }
      }
    },
    {
      tooltip: 'Go to the end of the timeline',
      icon: 'step-forward',
      click: timeline.gotoEnd
    },
    '-',
    {
      tooltip: 'Toogle looping',
      toggle: true,
      icon: 'retweet',
      click: btn => {
        timeline.looping(btn.state);
      }
    },
    '-',
    {
      tooltip: 'Zoom out',
      icon: 'search-minus',
      click: () => {
        timeline.zoom(timeline.zoomFactor() + 10);
      }
    },
    {
      tooltip: 'Zoom in',
      icon: 'search-plus',
      click: () => {
        timeline.zoom(timeline.zoomFactor() - 10);
      }
    },
    {
      tooltip: 'Reset zoom',
      icon: 'search',
      click: () => {
        timeline.zoom(10);
      }
    },
    '-',
    {
      tooltip: 'Undo',
      icon: 'undo',
      click: timeline.undo
    },
    '-',
    {
      tooltip: 'Add a lane',
      icon: 'folder-plus',
      click: timeline.addLane
    },
    {
      tooltip: 'Collapse all lanes',
      icon: 'compress',
      click: timeline.collapseAll
    }
  ].concat(props.buttons);

  buttons.forEach(btn => {
    if (btn === '-') {
      return dom.ap(toolbar, dom.cr('span', 'control-separator', ''));
    }

    let defCSS = 'tl-transition-color control-icon fas';
    let icon = dom.cr('span', defCSS + ' fa-' + btn.icon);

    icon.title = btn.tooltip || '';

    dom.on(icon, 'click', () => {
      let css = defCSS;

      if (btn.toggle) {
        btn.state = !btn.state;
        if (btn.state) {
          css = defCSS + ' control-icon-active';
        } else {
          css = defCSS;
        }
      }

      if (isFn(btn.click)) {
        btn.click(btn);
      }

      icon.className = css + ' fa-' + btn.icon;
    });

    dom.ap(toolbar, icon);
  });

  dom.ap(parentNode, toolbar);

  return {
    on: events.on
  };
};

export default Controls;
