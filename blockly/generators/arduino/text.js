/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Arduino for text blocks.
 * @author gasolin@gmail.com (Fred Lin)
 */
'use strict';

goog.provide('Blockly.Arduino.texts');

goog.require('Blockly.Arduino');


Blockly.Arduino.text = function() {
  // Text value.
  var code = Blockly.Arduino.quote_(this.getFieldValue('TEXT'));
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.text_join = function (block) {

    var result = '';
    for (var i = 0; i < block.inputList.length; i += 1) {

        if (block.getChildren()[i].type == 'text') {
            result += '"';
            result += Blockly.Arduino.valueToCode(block, block.inputList[i].name, Blockly.Arduino.ORDER_ATOMIC).replace(/"/g, '').toString();
            result += '"';
        }
        else if (block.getChildren()[i].outputConnection.check_.indexOf('String') > -1) {
            result += Blockly.Arduino.valueToCode(block, block.inputList[i].name, Blockly.Arduino.ORDER_ATOMIC).toString();
        }
        else {
            result += 'String(' +
                Blockly.Arduino.valueToCode(block, block.inputList[i].name, Blockly.Arduino.ORDER_ATOMIC).replace(/"/g, '').toString()
                + ')';
        }

        if (i < (block.inputList.length -1)) {
            result += ' + ';
        }
    }

    return [result, Blockly.Arduino.ORDER_ATOMIC];
}
