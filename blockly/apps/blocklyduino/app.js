var SerialPort = require('SerialPort');

var os = require('os');
var cmd = require('node-cmd');
var fs = require('fs');

var RX = require('rxjs');
require('rxjs/Operator/distinctUntilChanged');


var serialPortBehaviorSubject = new RX.BehaviorSubject([]);
var observableUSBPorts = serialPortBehaviorSubject.asObservable();


setInterval(() => {
    SerialPort
        .list()
        .then(newPorts => serialPortBehaviorSubject.next(newPorts))
        .catch(error => serialPortBehaviorSubject.error(error));
}, 100);

observableUSBPorts
    .distinctUntilChanged(null, (ports) => ports.length)
    .subscribe(usbPorts => console.log('USB:', usbPorts));


let uploadCode = () => {
    var code = `void setup()
                {
                  pinMode(13, OUTPUT);
                }
                
                
                void loop()
                {
                   digitalWrite(13, HIGH);
                   delay(100);
                   digitalWrite(13, LOW);
                   delay(100);
                }`;

    if (os.platform() == 'darwin') {

        if (fs.existsSync('sketch.ino')) {
            fs.unlinkSync('sketch.ino');
        }
        fs.writeFileSync('sketch.ino', code);

        var arduinoFile = '/Applications/Arduino.app/Contents/MacOS/Arduino';
        cmd.get(`
        ${arduinoFile} --upload sketch.ino --port /dev/tty.usbmodem1411
    `, (err, data, stderr) => {
            fs.unlinkSync('sketch.ino');
            console.log(err);
        });
    }
};
