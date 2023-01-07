// ----------- Main Program --------------- //
const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');
const qs = require('querystring');
const { Console, timeStamp } = require('console');

const index_page = fs.readFileSync('./index.ejs', 'utf8');
const login_page = fs.readFileSync('./login.ejs', 'utf8');

const max_num = 1000; // 最大保管数
const filename = './talk.dat' // データファイル名
var message_data; // データ
readFromFile(filename);

var Server = http.createServer(getFromClient);

Server.listen(3000);
console.log('Server Start!');
// ----------- Main Program --------------- //

// ----------- createServerの処理 --------------- //
function getFromClient(request, response) {
    var url_parts = url.parse(request.url, true);
    switch(url_parts.pathname) {
        // Top Page
        case '/':
            console.log('/ access');
            response_index(request, response);
            break;

        // Login Page
        case '/login':            
            console.log('/login access');
            response_login(request, response);
            break;

        default:
            console.log('default access');
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end('no pages...');
            break;
    }
}

// loginのアクセス処理
function response_login(request, response) {
    var content = ejs.render(login_page, {});
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(content);
    response.end();
}

// indexのアクセス処理
function response_index(request, response) {
    // Postアクセス時の処理
    console.log(request.method);
    if (request.method == 'POST') {
        console.log('Post method');
        var body='';

        // データ受信のイベント処理
        request.on('data', function(data) {
            body += data;
        });

        // データ受信終了のイベント処理
        request.on('end', function () {
            data = qs.parse(body);
            console.log(data);
            addToData(data.timestamp, data.id, data.msg, filename, request);
            write_index(request, response);
        });
    } else {
        console.log('Other method');
        write_index(request, response);
    }
}

// indexページの作成
function write_index(request, response) {
    var msg = 'What are you thinking?';
    var content = ejs.render(index_page, {
        title: 'Index',
        content: msg, 
        data: message_data,
        filename: 'data_item',
    });
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(content);
    response.end();
}

// テキストファイルをロード
function readFromFile(fname) {
    fs.readFile(fname, 'utf8', (err, data) => {
        message_data = data.split('\n');
    })
}

// データの更新
function addToData(timestamp, id, msg, fname, request) {
    var current_time = new Date(parseInt(timestamp, 10));
    var obj = {'timestamp': current_time, 'id': id, 'msg': msg};
    var obj_str = JSON.stringify(obj);
    console.log('add data: ' + obj_str);
    message_data.unshift(obj_str);
    if (message_data.length > max_num) {
        message_data.pop();
    }
    saveToFile(fname);
}

// データを保存
function saveToFile(fname) {
    var data_str = message_data.join('\n');
    fs.writeFile(fname, data_str, (err) => {
        if(err) {throw err;}
    })
}