goog.provide('Blockly.Blocks.water_sensor');

goog.require('Blockly.Blocks');

Blockly.Blocks['water_sensor_setup'] = {
    init: function () {
        this.setColour(235);
        this.appendDummyInput()
            .appendField(new Blockly.FieldImage("/images/soil-hydro-sensor.jpg", 50, 50, "*"))
            .appendField("AnalogWrite PIN#")
            .appendField(new Blockly.FieldDropdown(profile.default.digital), "PIN");

    }
};