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

import Logger from './tf.logger.js';
import { merge } from './tf.js';

const log = Logger('block pool');

let blockPool = {};

export const RegisterBlock = (name, attributes) => {
  if (!name) {
    return log.error('block name is required');
  }

  if (blockPool[name]) {
    return log.error('block', name, 'already exists');
  }

  const notImplemented = () => {
    // Consider logging or something
  };

  let block = merge(
    {
      state: {},
      process: notImplemented,
      startProcess: notImplemented,
      stopProcess: notImplemented,
      construct: notImplemented,
      destroy: notImplemented,
      title: notImplemented
    },
    attributes
  );

  blockPool[name] = block;

  return block;
};

export const getBlockPrototype = name => {
  return blockPool[name] || false;
};

export default {
  RegisterBlock,
  getBlockPrototype
};
