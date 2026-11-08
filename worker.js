#!/usr/bin/env node
'use strict';
/**
 * Compatibility entrypoint: the HTTP server and the task worker now share
 * one TaskEngine instance. Do not run a second independent queue.
 */
require('./src/index').start();
