var http = require('http'),
	fs = require('fs'),
	connect = require('connect'),	
	httpProxy = require('http-proxy'),
	Cookies = require('cookies'),
	 util = require('util'),
  RedisStore = require('connect-redis')(connect),
  uuid = require('node-uuid'),
  redback = require('redback').createClient(),
httpProxy = require('http-proxy'),
ratelimit = redback.createRateLimit('requests', {bucket_interval: 5, 
	bucket_span:7*24*3600}),
redis = require("redis"),
client = redis.createClient(),
i18n = require('connect-i18n');  
var app = connect()   
  .use(connect.cookieParser())
  .use(connect.cookieSession({store: new RedisStore(6379,'localhost'), secret: 'proxy'
			, cookie: {httpOnly: true, maxAge: 5 * 60 * 1000 }})) 
  .use(i18n({default_locale: 'vi-vi'}))  
  .use(connect.vhost('dkstatus.hpu.edu.vn', tinhtrang))  
  .use(connect.vhost('dieukien.hpu.edu.vn', kiemtra))  
  .use(myProxy);


 var proxy3 = new httpProxy.RoutingProxy();
function tinhtrang(req, res){
	var buffer = httpProxy.buffer(req);
		proxy3.proxyRequest(req, res, {
								host: '127.0.0.1',
								port: 8000,								
	});
}
var proxy2 = new httpProxy.RoutingProxy();
function kiemtra(req, res){
	
	
		var buffer = httpProxy.buffer(req);
			proxy2.proxyRequest(req, res, {
									host: '127.0.0.1',
									port: 8080,
									buffer: buffer
		});
	
}



var proxy = new httpProxy.RoutingProxy();
var serveronline='dk3online';
function myProxy(req, res){
	
	
	
	var myip = req.connection.remoteAddress || req.headers.host || req.headers['x-forwarded-for'];
	ratelimit.add(myip);
		
	var buffer = httpProxy.buffer(req);
		
		
	
	ratelimit.count(myip, 2, function(error2, c2){
		if (c2 > 10) {
			res.end('IP: ' + myip + ' too much requests(' + c2 + ')');
		} else {
			console.log('myip: ' + myip);
			//req.session.uuid = req.session.uuid || uuid.v1();	
			var cooki = new Cookies( req, res );
			var aspnetid = cooki.get('ASP.NET_SessionId');
			var myid = aspnetid || uuid.v1() ;
			cooki.set('ASP.NET_SessionId', myid);
			ratelimit.add(myid);
			ratelimit.count(myid, 4, function (err, count) {		
			if (count > 20) {
				res.end('Bạn vui lòng không refresh (reload) trang web liên tục. ' + '(' + count + ')');
			} else {							
					
					
					console.log('myid: ' + myid);
					
					client.zcard(serveronline, function(error, card){
						
						
						
						if (card < 500) {
									
								if (card > 450) {		
									var min = 120 * 1000;
									var ago = Date.now() - min;
									var args1 = [serveronline, '-inf', ago];
									client.zremrangebyscore(args1, function(err, countusers){
											console.log('removed ' + countusers );										
									});		
								}	
									
								var args = [ serveronline, Date.now(), myid ];
								
								client.zadd(args, function(err, response){
									if (err) throw err;
									proxy.proxyRequest(req, res, {
										host: '127.0.0.1',
										port: 81,
										buffer: buffer
									});
								});
								
						} else {
							
							client.get('ip', function(error, resp){
									if (!error) {
										if (resp){	
											client.get('val', function(er, val){
												if (!er) {
													if (val < 450) {
															var url = './' + val;
															var s1 = fs.readFile(url, function(errr, content){															
															return res.end(content);
														});
														//res.end('Máy chủ quá tải, vui lòng đến địa chỉ sau để tiếp tục đăng ký:  ' + resp);
													} else {
														return res.end('Hệ thống đang quá tải, bạn vui lòng nhấn F5 sau ít phút. ');
													}
												}
											});														
										} 
									}
								});
									
							
						}
					});
				}
			});	
		}
	});
}
http.createServer(app).listen(80);
