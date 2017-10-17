const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;


const SerialPort = require('SerialPort');
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

app.use('/media', express.static(__dirname + '/../../media'));
app.use(bodyParser.text());

const serialPortBehaviorSubject = new RX.BehaviorSubject([]);
const observableUSBPorts = serialPortBehaviorSubject
                            .asObservable()
                            .map(ports => ports.filter(port => port.comName.indexOf('tooth') == -1));

var isConnected = false;

setInterval(() => {
    SerialPort
        .list()
        .then(newPorts => serialPortBehaviorSubject.next(newPorts))
        .catch(error => serialPortBehaviorSubject.error(error));
}, 500);

// This is used to update the webpage when a usb device enter or leaves
io.on('connection', function () {
    console.log("CONNECTED TO SOCKET");
    isConnected = true;
    observableUSBPorts
        .distinctUntilChanged(null, (ports) => ports.length)
        // this is to filter out blue tooth ports
        .subscribe(usbPorts => {
            io.emit('usb-ports', usbPorts);
        });
});



let uploadCode = (code, port) => {


    if (os.platform() == 'darwin') {

        if (fs.existsSync('sketch.ino')) {
            fs.unlinkSync('sketch.ino');
        }
        fs.writeFileSync('sketch.ino', code);

        var arduinoFile = '/Applications/Arduino.app/Contents/MacOS/Arduino';
        cmd.get(`
        ${arduinoFile} --upload sketch.ino --port ${port}
    `, (err, data, stderr) => {

            fs.unlinkSync('sketch.ino');
            io.emit('uploaded', err === null);
            console.log(err);
        });
    }
};

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload-code/:port', function (req, res) {
    observableUSBPorts
        .take(1)
        .subscribe((ports) => {
         uploadCode(req.body, ports[req.params['port']].comName);
    });
    res.status(200);
    res.send('');
});

http.listen(port, () => console.log('listening on port ' + port));
