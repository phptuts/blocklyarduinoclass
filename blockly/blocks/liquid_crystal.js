'use strict';

goog.provide('Blockly.Blocks.liquid_crystal');

goog.require('Blockly.Blocks');


Blockly.Blocks['liquid_crystal_ic2_big_lcd'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("LCD 20 Columns by 4 Rows \n")
            .appendField(new Blockly.FieldImage("https://images-na.ssl-images-amazon.com/images/I/51YdOkZkUuL.jpg", 100, 100, "*"));

        this.appendValueInput("Row 1")
            .setCheck("String")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Row One Text.");

        this.appendValueInput("Row 2")
            .setCheck("String")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Row Two Text.");

        this.appendValueInput("Row 3")
            .setCheck("String")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Row Three Text.");

        this.appendValueInput("Row 4")
            .setCheck("String")
            .setCheck()
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("Row Four Text.");


        this.appendValueInput("Delay Time")
            .setCheck("Number")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("The number of milli seconds you want to delay.");


        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(210);
        this.setTooltip("Print Something to the lcd Screen.");
        this.setHelpUrl("");
    }
};
