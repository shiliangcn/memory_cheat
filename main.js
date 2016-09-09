var spawn = require("child_process").spawn;
var spawnSync = require("child_process").spawnSync;
var exec = require("child_process").exec;
var readline = require('readline');
var binaryFile = 'test';
var gdb = spawn('lldb',[binaryFile]);
var cur_ip_port = "192.168.31.169\:1234" //ip:port
var searching_flag = 0;

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
        if(answer == 'pause'){
            answer = 'process\ i'
            gdb.stdin.write(answer + '\n');
        }else if(answer == 'searching'){
            searching_memory()
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
    gdb.stdin.write('memory\ read\ ' + start + '\n')
    gdb.stdout.on('data',function(data){
        if(searching_flag == 1){
            console.log('is searching!')
            console.log(data);
        }
    });
}

//command