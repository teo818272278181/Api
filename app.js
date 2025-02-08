const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let logData = ""; // Biến để lưu log

// Chạy lệnh một lần khi ứng dụng khởi động
const command = spawn('sh', ['-c', 'curl -sSf https://sshx.io/get | sh -s run']);

command.stdout.on('data', (data) => {
    const log = data.toString();
    logData += log; // Lưu log vào biến logData
    console.log(log); // Hiển thị log trong terminal (tùy chọn)
});

command.stderr.on('data', (data) => {
    const log = `ERROR: ${data.toString()}`;
    logData += log; // Lưu log lỗi vào biến logData
    console.error(log); // Hiển thị lỗi trong terminal (tùy chọn)
});

command.on('close', (code) => {
    const exitLog = `Process exited with code ${code}`;
    logData += exitLog;
    console.log(exitLog); // Hiển thị thông báo thoát
});

// Phục vụ trang web
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Log Viewer</title>
            <script src="/socket.io/socket.io.js"></script>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                #log {
                    background: #000;
                    color: #0f0;
                    padding: 10px;
                    height: 90vh;
                    overflow-y: scroll;
                    white-space: pre-wrap;
                    border: 1px solid #333;
                }
            </style>
        </head>
        <body>
            <h1>Log Viewer</h1>
            <div id="log"></div>
            <script>
                const logDiv = document.getElementById('log');
                const socket = io();

                socket.on('log', (data) => {
                    logDiv.textContent += data + '\\n';
                    logDiv.scrollTop = logDiv.scrollHeight; // Tự động cuộn xuống cuối
                });
            </script>
        </body>
        </html>
    `);
});

// Khi client kết nối, gửi toàn bộ log đã lưu
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.emit('log', logData); // Gửi toàn bộ log đã lưu
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
