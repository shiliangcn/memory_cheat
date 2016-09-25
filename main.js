var spawn = require("child_process").spawn;
var spawnSync = require("child_process").spawnSync;
var exec = require("child_process").exec;
var readline = require('readline');
var binaryFile = 'test';
var gdb = spawn('lldb',[binaryFile]);
var cur_ip_port = "192.168.31.169\:1234" //ip:port
var searching_flag = 0;
var search_result = new Array();

gdb.stdout.setEncoding('utf8');
gdb.stderr.setEncoding('utf8');
gdb.stdin.setEncoding('utf8');
var rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout
});

console.log("开始调试");

var input_command = function(){
    rl.question("请输入指令\n",function(answer){
        console.log(answer);
        if(answer == 'pause'){
            answer = 'process\ i';
            gdb.stdin.write(answer + '\n');
        }else if(answer == 'searching'){
            searching_memory();
        }else if(answer == 'sr'){
            console.log(search_result);
            input_command();
        }else{
            gdb.stdin.write(answer + '\n');
        }
        // 不加close，则不会结束
        // rl.close();
    });
}

gdb.stderr.on('data',function(data)
{
    console.log(data);
    input_command();
});

gdb.stdout.on('data',function(data){
    // need = "Current\ executable\ set\ to\ \'test\'\ \(x86_64\)\."
    if (searching_flag == 0){
        console.log(data);
        // console.log(data.match('Current\ executable'));
        if(data.match('Current\ executable') != null){
            console.log('开启lldb成功，准备连接iphone！')
            console.log('process\ connect\ connect\:\/\/' + cur_ip_port);
            gdb.stdin.write('process\ connect\ connect\:\/\/' + cur_ip_port + '\n')
        }
        if(data.match('stop\ reason') != null){
            console.log('暂停进程成功！')
            input_command();
        }
        if(data.match('resuming') != null){
            console.log('恢复进程运行成功！')
            input_command();
        }
    }
});

var searching_memory = function(){
    searching_flag = 1
    var start = '10E000000';
    var end = '10EFFFFFF';
    var now_end_10 = 0
    var start_10 = parseInt(start, 16);
    var end_10 = parseInt(end, 16);
    var keep_searching = function(){
        now_end_10 = start_10 + 400;
        console.log(end_10 - start_10);
        if(end_10 - start_10 > 400){
            gdb.stdin.write('memory\ read\ 0x' + start_10.toString(16) + ' 0x' + now_end_10.toString(16) + '\n');
        }else{
            console.log('搜索完毕！')
            searching_flag = 0;
            // console.log(search_result);
            input_command();
        }
    }
    keep_searching();
    gdb.stdout.on('data',function(data){
        console.log('outing!!')
        if(searching_flag == 1){
            console.log('is searching!')
            // console.log(data);
            need_data = new Array('02','00','00','00');
            format_search_result(start_10,data,need_data);
            start_10 = now_end_10;
            keep_searching();
        }else{
            console.log('搜索完毕！');
            input_command();
        }
    });
}

var format_search_result = function(base,data,need_data){
    var cur_search_result = new Array()
    formated = data.split('\ ');
    for(var _i = 0,_j = 0;_i <= formated.length - 1;_i++){
        if(formated[_i].length == 2){
            cur_search_result[base + _j] = formated[_i];
            _j++;
        }
    }
    console.log(cur_search_result);
    for(var _k = base;_k <= cur_search_result.length - 1;_k++){
        if ((cur_search_result[_k] == need_data[0]) && (cur_search_result[_k + 1] == need_data[1]) && (cur_search_result[_k + 2] == need_data[2]) && (cur_search_result[_k + 3] == need_data[3])){
            search_result[_k] = cur_search_result[_k];
            search_result[_k + 1] = cur_search_result[_k + 1];
            search_result[_k + 2] = cur_search_result[_k + 2];
            search_result[_k + 3] = cur_search_result[_k + 3];
        }
    }
}

//command