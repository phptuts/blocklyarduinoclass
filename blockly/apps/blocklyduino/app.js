const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const Avrgirl = require('avrgirl-arduino');
const axios = require('axios');


const SerialPort = require('SerialPort');
const Readline = SerialPort.parsers.Readline;

const os = require('os');
const cmd = require('node-cmd');
const fs = require('fs');

const RX = require('rxjs');
require('rxjs/Operator/distinctUntilChanged');
require('rxjs/Operator/map');
require('rxjs/Operator/take');


app.use('/blocks', express.static(__dirname + '/../../'));
app.use('/public', express.static(__dirname + '/'));
app.use('/msg', express.static(__dirname + '/../../msg'));
app.use('/media', express.static(__dirname + '/../../media'));
app.use('/library', express.static(__dirname + '/node_modules/socket.io-client/dist'));
app.use('/library', express.static(__dirname + '/node_modules/file-saver'));
app.use('/images', express.static(__dirname + '/images'));

app.use('/media', express.static(__dirname + '/../../media'));
app.use(bodyParser.text());


const observableUSBPorts$ = RX.Observable
    .interval(500)
    .flatMap(() => RX.Observable.fromPromise(SerialPort.list()))
    .distinctUntilChanged(null, (ports) => ports.length)
    .map(ports => ports.filter(port => port.comName.indexOf('tooth') == -1));

const subjectSerialMonitor = new RX.Subject();
const observableSubjectSerialMonitor$ = subjectSerialMonitor.asObservable();

let serialPortStringStream = '';
const behaviorSubjectForDebugBlocks = new RX.BehaviorSubject('');
behaviorSubjectForDebugBlocks
    .asObservable()
    .filter(line => /Debugging Block [0-9]+ /.test(line))
    .map(line => line.match(/Debugging Block [0-9]+ /)[0].replace('Debugging Block', ''))
    .map(line => parseInt(line))
    .subscribe(blockNumber => {
        io.emit('debug-block', blockNumber);
        serialPortStringStream = '';
    });

/**
 * Builds the stream for Reading the serial port
 */
observableSubjectSerialMonitor$
    .map(bytes => new Buffer(bytes).toString('utf8'))
    .do(line => serialPortStringStream += line)
    .do(() => behaviorSubjectForDebugBlocks.next(serialPortStringStream))
    .subscribe(line => io.emit('serial-monitor', line));

/**
 * The serial port object
 */
let serialPort = null;

/**
 * Is true if the socket is open
 */
let isSocketConnected = false;


io.on('connection', () => {
    console.log("CONNECTED TO SOCKET");
    isSocketConnected = true;
    observableUSBPorts$.subscribe(usbPorts => io.emit('usb-ports', usbPorts));
});


/**
 * Writes the arduino code
 */
let writeArduinoHexFile = (code) => {
    if (fs.existsSync('arduino.hex')) {
        fs.unlinkSync('arduino.hex');
    }
    fs.writeFileSync('arduino.hex', code);
};

/**
 * Runs the command to upload the code and returns an observable
 *
 * @param usbPort the name of the usb port to upload the code
 * @returns Observable<string[]>
 */
let uploadCode = (usbPort) => {
    const avrgirl = new Avrgirl({
        board: 'uno',
        port: usbPort
    });

  return RX.Observable.create( (observer)  => {
        serialPort.close(() => {
            avrgirl.flash('arduino.hex', (err) => {
                if (err) {
                    console.log(err, 'AVR GIRL ERROR');
                    observer.error(err);
                } else {
                    observer.next(undefined)
                    observer.complete();
                }
            });
        });
    });

};

/**
 * This opens the serial port and feed the behavior subject information
 * @param selectedUSBInputPortName
 */
let readSerialPort = (selectedUSBInputPortName) => {
    if (serialPort !== null) {
        serialPort.close(() => {
            console.log('Closed On Purpose')
        });
    }

    serialPort = new SerialPort(selectedUSBInputPortName, {autoOpen: true});
    serialPort.pipe(new Readline())
    serialPort.on('data', line => subjectSerialMonitor.next(line));
    serialPort.on('close', () => {
        console.log('Serial Port was closed')
    });
};

/**
 * This end point serves up the main page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * This is end point to move forward with the debug process
 */
app.get('/continue', (req, res) => {

    if (serialPort !== null) {
        serialPort.write("s");
    }

    res.send(serialPort === null ? 'serial-port-not-there' : '');
});

/**
 * This end point writes the Arduino Serial Monitor
 */
app.get('/serial-monitor-write/:message', (req, res) => {
    if (serialPort !== null) {
        serialPort.write(req.params['message']);
    }
    res.send(serialPort === null ? 'serial-port-not-there' : '');
});

/**
 * This end point writes the Arduino Serial Monitor
 */
app.get('/serial-monitor', (req, res) => {
    res.sendFile(path.join(__dirname, 'serial-monitor.html'));
});

/**
 * This is the end point for uploading the code
 */
app.post('/upload-code/:port', (req, res) => {


    observableUSBPorts$
        .take(1)
        .do(usbPorts => readSerialPort(usbPorts[req.params['port']].comName))
        .flatMap(usbPorts => RX.Observable.fromPromise(axios.post('http://arduino-compile.noahglaser.net/upload-code/uno', req.body, {
                    headers: {'Content-Type': 'text/plain'}
            }))
            .do(res => writeArduinoHexFile(res.data))
            .map(() => usbPorts)
        )
        .flatMap(usbPorts => uploadCode(usbPorts[req.params['port']].comName))
        .do(() => fs.unlinkSync('arduino.hex'))
        .map(() => true)
        .catch((err) => {
            console.log(err);
            return RX.Observable.of(false);
        })
        .subscribe((uploadedSuccessfully) => io.emit('uploaded', uploadedSuccessfully));

    res.send('');
});

http.listen(port, () => console.log('listening on port ' + port));
