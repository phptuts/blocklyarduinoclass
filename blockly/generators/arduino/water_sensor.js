goog.provide('Blockly.Arduino.water_sensor');

goog.require('Blockly.Arduino');

Blockly.Arduino['water_sensor_setup'] = function (block) {
    Blockly.Arduino._serial_setup();
    var pin =  block.getFieldValue('PIN') || 'A1';
    Blockly.Arduino.definitions_['define_water_sensor'] = "#include <HygrometerSensor.h>";
    Blockly.Arduino.definitions_['water_sensor_setup'] = "HygrometerSensor analog_rain_drop(HygrometerSensor::ANALOG, " + pin + ");\n";

};