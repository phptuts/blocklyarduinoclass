goog.provide('Blockly.Arduino.liquid_crystal');

goog.require('Blockly.Arduino');

Blockly.Arduino['liquid_crystal_ic2_big_lcd'] = function(block) {

    var textRow1 = Blockly.Arduino.valueToCode(block, 'Row 1', Blockly.Arduino.ORDER_ATOMIC);
    var textRow2 = Blockly.Arduino.valueToCode(block, 'Row 2', Blockly.Arduino.ORDER_ATOMIC);
    var textRow3 = Blockly.Arduino.valueToCode(block, 'Row 3', Blockly.Arduino.ORDER_ATOMIC);
    var textRow4 = Blockly.Arduino.valueToCode(block, 'Row 4', Blockly.Arduino.ORDER_ATOMIC);
    var delayMilliSeconds = Blockly.Arduino.valueToCode(block, 'Delay Time', Blockly.Arduino.ORDER_ATOMIC);

    Blockly.Arduino.definitions_['define_wire'] = '#include <Wire.h>\n';
    Blockly.Arduino.definitions_['define_liquid_crystal_i2c_big'] = '#include <LiquidCrystal_I2C.h>\n';
    Blockly.Arduino.definitions_['liquid_crystal_ic2_big_lcd_object'] = 'LiquidCrystal_I2C lcd(0x3F, 4, 20);';

    Blockly.Arduino.setups_['liquid_crystal_ic2_big_lcd'] = 'lcd.init();';

    function printRow(row, textRow) {
        return  textRow !== '""' ? 'lcd.setCursor(0, ' + row + '); \n'  + 'lcd.print(' + textRow + '); \n' : '';
    }

    return 'lcd.clear(); \n'
        + 'lcd.backlight(); \n'
        +  printRow(0, textRow1)
        +  printRow(1, textRow2)
        +  printRow(2, textRow3)
        +  printRow(3, textRow4)
        + 'delay(' + delayMilliSeconds + '); \n'
        + 'lcd.clear(); \n';
};


