(function(){

	/** Loggers*/
	var log4js, webLogger, targetLogger

	var monitorLogFile = "/logs/monitor.log"

	/**
	 * 初始化Logger
	 */
	function initialLogger(){

		log4js = require('log4js')
		
		log4js.configure(__dirname + '/lib/socketio-monitor.json', { cwd: __dirname });

		webLogger = log4js.getLogger("monitor-web")
		targetLogger = log4js.getLogger("monitor-target")

	}

	/** store the host details */	
	var hosts = {}

	/**
	  * 判断是否开启Monitor模式
	  */
	function argumentJudge(){
		var i = process.argv.length
		while(i--){		
			if(process.argv[i]=='monitor')
				return true
		}
		return false
	}

	/**
	  * Monitor 模块Express初始化
	  */
	function monitor(app){

		if(!argumentJudge()){
			console.log("Monitor without started")
			return	
		} 

		initialLogger()
		console.log("Monitor started : please visit http://[host]:[port]/monitor/socket/list to view all of the monitor informations")

		webLogger.info("Enter into the Monitor")

		/** The page title */
		var title = ' - Monitor'
		
		/** 
		  * Web site initial
		  */
		// 设置View的默认路径
		app.set('views',__dirname+'/views')	
		// 使用ejs模版渲染
		app.set('view engine','ejs')
		// 使用express-partials来支持ejs中的变量定义
		app.use(require('express-partials')())
		// 设置静态文件路径
		app.use(require('express').static(__dirname+'/public'))

		webLogger.info("Express & ejs initialized")

		/** 列出所有被监控的URL */
		app.get('/monitor/socket/list',function(req,res){
			webLogger.info("Request to Monitor Page : /monitor/socket/list visited")
			res.render('socket-url-monitor',{
				'layout': 'template', // ejs模版
				'title' : 'Socket.io url' + title, // 标题信息
				'hosts' : hosts // hosts具体信息
			})
		})

		/** 列出监控URL下所有访问的Address */
		app.get('/monitor/socket/:urlParameter',function(req,res){
			webLogger.info("Request to Monitor Page : /monitor/socket/" + req.params.urlParameter + " visited")
			res.render('socket-address-monitor',{
				'layout': 'template', // ejs模版
				'title' : 'Socket.io Address' + title, // 标题信息
				'urlParameter' : urlTransformer(req.params.urlParameter), // 被监控的URL信息
				'addresses' : hosts[urlTransformer(req.params.urlParameter)] // hosts具体信息
			})
		})

		/** 列出监控Address下的所有Connection */
		app.get('/monitor/socket/:urlParameter/:addressname',function(req,res){
			webLogger.info("Request to Monitor Page : /monitor/socket/"+req.params.urlParameter+"/"+ req.params.addressname + " visited")
			res.render('socket-address-detail-monitor',{
				'layout'		: 'template', // ejs模版
				'title'			: 'Socket.io Connections Detail' + title, //标题信息
				'urlParameter'	: urlTransformer(req.params.urlParameter), // 被监控的URL信息
				'addressname'	: req.params.addressname, // address信息
				'connections'   : hosts[urlTransformer(req.params.urlParameter)][req.params.addressname] // address详细信息
			})
		})
		
		/** 静态日志监听 */
		app.get('/monitor/log/socket/static', function(req,res){

			// webLogger.info("Request to Monitor Page : /monitor/log/socket visited")

			var logcontent='' ,flag
			var fs = require('fs')
			var rs = fs.createReadStream(__dirname + monitorLogFile, {encoding: 'utf-8', bufferSize: 100})

			rs.on('data', function(data){
				logcontent += data
				if(!flag){
					flag = true;
				}
			})

			rs.on('error', function(err){
				webLogger.error("Cannot read the log file - [" + monitorLogFile + "], error description:" + err)
				logcontent = err
				flag = false
				res.render('socket-log-monitor-static',{
					'layout'		: 'template', // ejs模版
					'title'			: 'Socket.io Static Log' + title, //标题信息
					'flag'			: flag, //错误标签
					'logcontent'	: logcontent, //日志信息
				})
			})

			rs.on('end', function(){
				res.render('socket-log-monitor-static',{
					'layout'		: 'template', // ejs模版
					'title'			: 'Socket.io Static Log' + title, //标题信息
					'flag'			: flag, //错误标签
					'logcontent'	: logcontent, //日志信息
				})
			})
		})

		/** 动态日志监听 */
		app.get('/monitor/log/socket/dynamic', function(req,res){
			res.render('socket-log-monitor-dynamic',{
				'layout'		: 'template', // ejs模版
				'title'			: 'Socket.io Dynamic Log' + title
			})
		})

		/** 定时日志监听 */
		app.get('/monitor/log/socket/timer', function(req,res){

			var logcontent='' ,flag
			var fs = require('fs')
			var rs = fs.createReadStream(__dirname + monitorLogFile, {encoding: 'utf-8', bufferSize: 100})

			rs.on('data', function(data){
				logcontent += data
				if(!flag){
					flag = true;
				}
			})

			rs.on('end', function(){
				res.end(logcontent.replace(new RegExp('\r\n', 'g'), '<br>'))
			})
		})

		/** URL 转换器 */
		function urlTransformer(urlParameter){
			return '/' + (urlParameter == 'baseurldefaultmonitor' ? '' : urlParameter)
		}
	}

	/**
	  * Monitor 模块 - 添加监听
	  */
	function addMonitor(io){

		if(!argumentJudge()) return

		targetLogger.info("A new monitor target was listen - [" + io.name + "]")
		io.on('connection', listen)
	}

	/**
	  * 监听Socket.IO
	  */
	function listen(socket){

		// 连接之后添加Host信息
		addNewHost(socket.conn, socket.nsp.name.toString('utf-8'))

		socket.on('disconnect', function(data){
			// 断开Remove Host信息
			removeHost(socket.conn, socket.nsp.name.toString('utf-8'))		
		})

	}

	/**
	  * 添加Host到池中
	  */
	function addNewHost(conn, monitorUrl){

		if(hosts[monitorUrl] == undefined) hosts[monitorUrl] = {}

		if(hosts[monitorUrl][conn.remoteAddress] == undefined) hosts[monitorUrl][conn.remoteAddress]={}
		if(hosts[monitorUrl][conn.remoteAddress][conn.id] == undefined) hosts[monitorUrl][conn.remoteAddress][conn.id]={}

		targetLogger.info("New Connection - monitorUrl:["+monitorUrl+"], remoteAddress:["+conn.remoteAddress+"],conn.id:["+conn.id+"],target:["+conn.request.headers.referer+"],detail:["+conn.request.headers['user-agent']+"].")
		hosts[monitorUrl][conn.remoteAddress][conn.id] = new Connection(conn.request.headers['user-agent'], conn.request.headers.referer, new Date())
	}

	/**
	  * 从池中删除Host
	  */
	function removeHost(conn, monitorUrl){
		delete hosts[monitorUrl][conn.remoteAddress][conn.id]

		targetLogger.info("Remove the Connection conn.id:["+conn.id+"]")

		/** 如果Connection为空则删除所属的Address信息*/
		var count = 0
		for(item in hosts[monitorUrl][conn.remoteAddress]) count++
		if(count == 0) {
			delete hosts[monitorUrl][conn.remoteAddress]
			targetLogger.info("Remove the Address Connection remoteAddress:["+conn.remoteAddress+"]")
		}

		/** 如果Address为空则删除所属的URL信息*/
		count = 0
		for(item in hosts[monitorUrl]) count++
		if(count == 0){
			delete hosts[monitorUrl]
			targetLogger.info("Remove the Monitor URL monitorUrl:["+monitorUrl+"]")
		}
	}

	/**
	  * Connection 对象
	  */
	function Connection(detail, target, date){
		this.detail = detail
		this.target = target
		this.date = date
	}

	/** 公开内部模块 */
	exports.monitor = monitor
	exports.addMonitor = addMonitor

}());
