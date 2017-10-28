'use strict';

goog.provide('Blockly.Arduino.debug');

goog.require('Blockly.Arduino');


Blockly.Arduino['debug'] = function(block) {

    var variables = Blockly.Variables.allVariables(Blockly.mainWorkspace);

    Blockly.Arduino.setups_['setup_serial_' + profile.default.serial] = 'Serial.begin(' + profile.default.serial + ');\n';

    var debugFunction  = '\n\nvoid debug(int blockNumber) { \n' +
                       '\t\tString stopDebug = ""; \n';

    for (var i = 0; i < variables.length; i += 1) {
        debugFunction += '\t\tSerial.println("Variable:  name = ' + variables[i] + ' - value =  "' + ' + String(' + variables[i] + ')); \n';
    }

    debugFunction += '\t\tSerial.println("Debugging Block " + String(blockNumber) + " ");\n\n';

    debugFunction += '\t\twhile (stopDebug != "s") { \n'  +
                 '\t\t\tstopDebug = Serial.readStringUntil("s"); \n' +
                 '\t\t\tdelay(1000);  \n' +
             '\t\t}\n' ;

    debugFunction += '}\n';

    Blockly.Arduino.definitions_['debug_function'] = debugFunction;

    return 'debug(' + block.id + '); \n';
};