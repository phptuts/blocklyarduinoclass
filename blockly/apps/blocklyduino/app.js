const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;


const SerialPort = require('SerialPort');
const Readline = SerialPort.parsers.Readline;

const os = require('os');
const cmd = require('node-cmd');
const fs = require('fs');

const RX = require('rxjs');
require('rxjs/Operator/distinctUntilChanged');
require('rxjs/Operator/map');
require('rxjs/Operator/take');

/**
 * Guess of where the arduino executable is for windows
 * @type string[]
 */
const windowsArduinoExecutableGuesses = [
    "c:\Program Files\Arduino\Arduino_debug.exe",
    "c:\Program Files\Arduino\Arduino.exe",
    "c:\Program Files (x86)\Arduino\Arduino_debug.exe",
    "c:\Program Files (x86)\Arduino\Arduino.exe"
];

const macArduinoExecutableGuess = '/Applications/Arduino.app/Contents/MacOS/Arduino';

app.use('/blocks', express.static(__dirname + '/../../'));
app.use('/public', express.static(__dirname + '/'));
app.use('/msg', express.static(__dirname + '/../../msg'));
app.use('/media', express.static(__dirname + '/../../media'));
app.use('/library', express.static(__dirname + '/node_modules/socket.io-client/dist'));

app.use('/media', express.static(__dirname + '/../../media'));
app.use(bodyParser.text());


const observableUSBPorts$ = RX.Observable
    .interval(500)
    .flatMap(() => RX.Observable.fromPromise(SerialPort.list()))
    .distinctUntilChanged(null, (ports) => ports.length)
    .map(ports => ports.filter(port => port.comName.indexOf('tooth') == -1));

/**
 * Is true if the socket is open
 * @type {boolean}
 */
let isSocketConnected = false;

io.on('connection', () => {
    console.log("CONNECTED TO SOCKET");
    isSocketConnected = true;
    observableUSBPorts$.subscribe(usbPorts => io.emit('usb-ports', usbPorts));
});


/**
 * Tries to guess where the arduino executable is.
 * @returns string
 */
let getArduinoFile = () => {
    let arduinoFile = null;

    if (os.platform() == 'darwin') {
        arduinoFile = macArduinoExecutableGuess;
    }
    else if (os.platform() == 'win32') {
        arduinoFile = windowsArduinoExecutableGuesses.filter((file) => fs.existsSync(file)).pop();
    }
    else {
        // This means it's running linux and we can just use the command
        arduinoFile = 'arduino';
    }

    if (arduinoFile === null || arduinoFile === undefined) {
        throw new Error('There was an error trying to find the arduino executable file.');
    }

    return arduinoFile;
};

/**
 * Writes the arduino code
 */
let writeArduinoCode = (code) => {
    if (fs.existsSync('sketch.ino')) {
        fs.unlinkSync('sketch.ino');
    }
    fs.writeFileSync('sketch.ino', code);
};

/**
 * Runs the command to upload the code and returns an observable
 *
 * @param usbPort the name of the usb port to upload the code
 * @returns Observable<string[]>
 */
let uploadCode = (usbPort) => {
    let getCommand = RX.Observable.bindCallback(cmd.get);
    return getCommand(`${getArduinoFile()} --upload sketch.ino --port ${usbPort}`);
};

/**
 * This end point serves up the main page
 */
app.get('/',  (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/serial-monitor/:port',  (req, res) => {

    let behaviorSubjectSerialMonitor = new RX.Subject();
    let observableSubjectSerialMonitor$ = behaviorSubjectSerialMonitor.asObservable();

    observableUSBPorts$
        .flatMap(usbPorts => RX.Observable.of(new SerialPort(usbPorts[req.params['port']].comName, { autoOpen: true})))
        .do(serialPort => serialPort.pipe(new Readline()))
        .subscribe(serialPort => serialPort.on('data', (line) => behaviorSubjectSerialMonitor.next(line)));

    observableSubjectSerialMonitor$
        .map(bytes => new Buffer(bytes).toString('utf8'))
        .subscribe(line => {
            io.emit('serial-monitor', line);
            console.log('sent');
        });

    res.send('look in console');

});

/**
 * This is the end point for uploading the code
 */
app.post('/upload-code/:port', (req, res) => {

    observableUSBPorts$
        .take(1)
        .do(() => writeArduinoCode(req.body))
        .flatMap((usbPorts) => uploadCode(usbPorts[req.params['port']].comName))
        .do(() => fs.unlinkSync('sketch.ino'))
        .do((args) => args[0] !== null ? console.error(args) : undefined)
        .map((args) => args[0] === null)
        .subscribe(uploadedSuccessfully => io.emit('uploaded', uploadedSuccessfully));

    res.send('');
});

http.listen(port, () => console.log('listening on port ' + port));
