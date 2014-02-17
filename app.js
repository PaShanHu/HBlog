/*依赖项*/
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var MongoStore=require('connect-mongo')(express);
var settings=require('./settings');

var app = express();

// 环境变量
app.set('port', 1000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ 
	secret: settings.cookieSecret, 
	store: new MongoStore({ db: settings.db }),
	key:'node-blog', // cookie名，不要用默认的'connect.sid'，因为可能被其他网站使用
	cookie:{maxAge:1000*60*60*24*30} // 30 days
}));

app.use(express.static(path.join(__dirname, 'public')));

// 开发模式
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

//视图助手----通过它我们才能在视图中访问会话中的用户数据。
app.use(function(req,res,next){
	var err=req.session.error,
		success=req.session.success,
		user=req.session.user;
	req.session.error='';req.session.success='';
	//req.session.user=null;
	res.locals.user=user?user:null;
	res.locals.error=err?err:null;
	res.locals.success=success?success:null;
	next();
});
app.use(app.router);
routes(app);

//启动
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
