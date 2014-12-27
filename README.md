Socket.io-Monitor
=================


##Socket.io Monitor是什么
Socket.io Monitor是一个对Socket.io连接的监控插件，Socket.io Monitor基于Node.js开发，分为2部分，监控插件和监控平台。监控平台依赖node.js插件express, ejs
项目地址[https://github.com/luoyan35714/Socket.io-Monitor](https://github.com/luoyan35714/Socket.io-Monitor)

##Socket.io Monitor文件清单

| monitor.js |
| lib/socketio-monitor.json |
| public/css/bootstrap.css.map |
| public/css/bootstrap.min.css |
| public/css/bootstrap-theme.css.map |
| public/css/bootstrap-theme.min.css |
| public/fonts/glyphicons-halflings-regular.eot |
| public/fonts/glyphicons-halflings-regular.svg |
| public/fonts/glyphicons-halflings-regular.ttf |
| public/fonts/glyphicons-halflings-regular.woff |
| public/js/bootstrap.min.js |
| public/js/html5shiv.js |
| public/js/jquery-1.8.0.min.js |
| public/js/respond.min.js |
| views/socket-address-detail-monitor.ejs |
| views/socket-address-monitor.ejs |
| views/socket-log-monitor-dynamic.ejs |
| views/socket-log-monitor-static.ejs |
| views/socket-url-monitor.ejs |
| views/template.ejs |

##Socket.io Monitor安装
* 在运行文件同级目录下解压以上清单文件，包含

| monitor.js |
| public/* |
| view/* |
| lib/* |

* 安装第三方插件ejs，BodyParser，express-partials, log4js (如果已经安装可以跳过)

npm install express
npm install socket.io
npm install ejs
npm install body-parser
npm install express-partials
npm install log4js

* 在代码中注册此插件

{% highlight js%}
var app=require(‘express’)
var io=require(‘socket.io’)(require(‘http’).Server(app))

var monitor = require('./monitor.js')
monitor.monitor(app)
monitor.addMonitor(io) //监听根目录
monitor.addMonitor(io.of("/url_1")) //监听目录url_1
monitor.addMonitor(io.of("/url_2")) //监听目录url_2
{% endhighlight %}

##Socket.io Monitor启动

在完成步骤3之后，在启动项后添加参数 monitor，正常启动项目入口js文件（例如server.js），获得启动的Server地址[host]和端口[port]

例如执行

{% highlight c%}
node server.js monitor
{% endhighlight %}

在浏览器输入`http://[host]:[port]/monitor/socket/list`即可查看监听状态

##Sample使用
将Sample文件夹下的文件复制到主文件目录，执行
{% highlight c%}
node index.js monitor
{% endhighlight %}

然后在浏览器打开`http://localhost:3000/monitor/socket/list`

再打开一个`http://localhost:3000/server/test`，切回刚刚的monitor界面看看有什么变化。

打开多个`http://localhost:3000/server/test`，看下monitor界面会发生什么。


##Socket.io Monitor使用

* 进入系统界面为
	
	![index page](http://www.hifreud.com/images/blog/nodejs/3_socket_io_monitor/1_index_page.png)

	- Static Logs：指的是点击之后加载一次LOG，如果有新LOG需要自己手动刷新获取（经测试，当LOG文件过大，系统加崩溃， 默认20M大小。）
	- Dynamic Logs: 指的是可以每隔2秒钟读取一次LOG，页面中有提供启停LOG刷新功能，如下所示
	![dynamic log start](http://www.hifreud.com/images/blog/nodejs/3_socket_io_monitor/2_dynamic_log_start.png)
	![dynamic log stop](http://www.hifreud.com/images/blog/nodejs/3_socket_io_monitor/3_dynamic_log_stop.png)
	- 在首页中展示的项为所监听的路径，当点击View可以查看连接到此路径的IP地址列表
	![url monitor](http://www.hifreud.com/images/blog/nodejs/3_socket_io_monitor/4_url_monitor.png)
	- 继续点击View可以查看此IP地址连接到此路径下的连接数
	![monitor detail](http://www.hifreud.com/images/blog/nodejs/3_socket_io_monitor/5_monitor_detail.png)
	- 点击Back即可返回上一级

##优势
提供了可视化的Socket.io监控平台，提供了日志查看功能，最小化利用CPU和内存，支持日志配置

##缺点
* 连接信息存储在内存中，连接量在超过一定数量会导致内存溢出
* 日志文件大小超过某值之后会导致程序假死（每次读取文件时间过长，解决办法是在Log4js中限制文件大小）
* 监控和显示平台集成在一起

##有待提高
* 监控和显示分离
* 日志显示分离

注意：此插件为了最小化使用服务器CPU和内存，没有采用实时推送刷新功能，所以，当登录页面监控之后，如果要查看最新数据，请手动刷新页面。