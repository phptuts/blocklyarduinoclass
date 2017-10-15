var SerialPort = require('SerialPort');
var RX = require('rxjs');
var os = require('os');
var cmd = require('node-cmd');
var fs = require('fs');

var ports = null;

var serialPortBehaviorSubject = new RX.BehaviorSubject(ports);
var observableUSBPorts = serialPortBehaviorSubject.asObservable();


setInterval(function () {
    SerialPort.list()
        .then(function (newPorts) {
            if (JSON.stringify(ports) !== JSON.stringify(newPorts)) {
                ports = newPorts;
                serialPortBehaviorSubject.next(ports);
            }
        })
        .catch(function (error) {
            serialPortBehaviorSubject.error(error);
        });
}, 100);

observableUSBPorts
    .subscribe(val => console.log('USB:', val));

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
    `, function (err, data, stderr) {
        fs.unlinkSync('sketch.ino');
        console.log(err);
    });
}