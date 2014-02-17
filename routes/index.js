var crypto=require('crypto'),
	User=require('../models/user.js'),
	Post = require('../models/post.js'),
    Comment=require('../models/comment.js');

module.exports=function(app){
	app.get('/',function(req,res){
        var page = req.query.page?parseInt(req.query.page):1;
		Post.getTen(null,page, function(err, posts,total){
	        if(err){
	            posts = [];
	        } 
	        res.render('index',{
	            title:'主页',
	            posts:posts,
                page:page,
                isFirstPage:(page-1)==0,
                isLastPage:((page-1)*10+posts.length)==total
	        });
            console.log("index 24:postsLen   "+posts.length);
	    });
	});

	app.get('/reg', checkNotLogin);
	app.get('/reg',function(req,res){
        res.render('reg', { title: '注册' });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg',function(req,res){
    	if(req.body['password-repeat'] != req.body['password']){
	        req.session.error='两次输入的口令不一致';
	        return res.redirect('/reg');
	    }
	    var md5 = crypto.createHash('md5');
	    var password = md5.update(req.body.password).digest('base64');
	    var newUser = new User({
	        name: req.body.username,
	        password: password,
            email:req.body.email
	    });
	    User.get(newUser.name, function(err, user){
	        if(user){
	            err = '用户已存在';
	        }
	        if(err){
	            req.session.error=err;
	            return res.redirect('/reg');
	        }
	        newUser.save(function(err){
	            if(err){
	                req.session.error=err;
	                return res.redirect('/reg');
	            }
	            req.session.user = newUser;
	            req.session.success='注册成功';
	            res.redirect('/');
	        });
	    });
    });

    app.get('/login', checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login', { title: '登录' });
    });

    app.post('/login', checkNotLogin);
    app.post('/login',function(req,res){
    	var md5=crypto.createHash('md5'),
    		password=md5.update(req.body.password).digest('base64');
    	User.get(req.body.username,function(err,user){
    		if(!user){
    			req.session.error='用户不存在';
    			return res.redirect('/login');
    		}
    		if(user.password!=password){
    			req.session.error='密码错误';
    			return res.redirect('/login');
    		}
    		req.session.user=user;
    		req.session.success='登陆成功';
    		res.redirect('/');
    	})
    });

    app.get('/logout', checkLogin);
    app.get('/logout',function(req,res){
    	req.session.user=null;
    	req.session.success='成功注销 ：）';
    	res.redirect('/');
    });

    app.get('/post', checkLogin);
    app.get('/post',function(req,res){
        res.render('post', { title: '发表' });
    });

    app.post('/post', checkLogin);
    app.post('/post',function(req,res){
    	var currentUser=req.session.user;
        var tags=[{'tag':req.body.tag1},{"tag":req.body.tag2},{"tag":req.body.tag3}]
        var post=new Post(currentUser.name,req.body.title,tags,req.body.post);
        post.save(function(err){
        	if(err){
        		req.session.error=err;
        		return res.redirect('/');
        	}
        	req.session.success='发布成功!';
        	res.redirect('/');
        });
    }); 

    //存档页
    app.get('/archive',function(req,res){
        Post.getArchive(function(err,posts){
            if(err){
                req.session.error=err;
                return res.redirect('/');
            }
            res.render('archive',{
                title:'存档',
                posts:posts
            });
        });
    });

    //标签页
    app.get('/tags',function(req,res){
        Post.getTag(function(err,posts){
            if(err){
                req.session.error=err;
                return res.redirect('/');
            }
            res.render('tags',{
                title:'标签',
                posts:posts
            });
        });
    });
    app.get('/tags/:tag',function(req,res){
        Post.getAllByTag(req.params.tag,function(err,posts){
            if(err){
                req.session.error=err;
                return res.redirect('/');
            }
            res.render('tag',{
                title:'标签:'+req.params.tag,
                posts:posts
            });
        })
    })

    //友情链接
    app.get('/links', function(req,res){
        res.render('links',{
            title: '友情链接'
        });
    });

    app.get('/search', function(req,res){
        Post.search(req.query.keyword,function(err, posts){
            if(err){
                req.session.error=err;
                return res.redirect('/');
            }

            res.render('search',{
                title: "SEARCH:"+req.query.keyword,
                posts: posts
            });
        });
    });

    app.get('/:user',function(req,res){
        var page = req.query.page?parseInt(req.query.page):1;
        User.get(req.params.user,function(err,user){
            if(!user){
                req.session.error='用户不存在';
                return res.redirect('/');
            }
            Post.getTen(user.name,page,function(err,posts,total){
                if(err){
                    req.session.error=err;
                    return res.redirect('/');
                }
                res.render('user',{
                    title:user.name,
                    posts:posts,
                    page: page,
                    isFirstPage:(page-1)==0,
                    isLastPage:((page-1)*10+posts.length)==total
                });
            });
        });
       
    });

    app.get('/:user/:day/:title', function(req,res){
        console.log("index 128: "+req.params.user);
        User.get(req.params.user,function(err, user){
            if(!user){
                req.session.error='用户不存在';
                return res.redirect('/');
            }
            Post.getOne(req.params.user, req.params.day, req.params.title, function(err, post){
                if(err){
                    req.session.error=err;
                    return res.redirect('/');
                }
                console.log("(index line139)now about to get article:"+req.params.title);
                res.render('article',{
                    title:req.params.title,
                    post:post
                });
            });
        }); 
    });
    app.post('/:user/:day/:title', function(req,res){
        var comment=null,
            date=new Date(),
            time= date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + 
            " " + date.getHours() + ":" + date.getMinutes();
        if(req.session.user){
            var name=req.session.user.name;
            comment={"name":name, "email":name+"@gmail.com", "website":"www."+name+".com", 
            "time":time, "content":req.body.content};
        }else{
            comment = {"name":req.body.name, "email":req.body.email, "website":req.body.website, 
            "time":time, "content":req.body.content};
        }
        console.log("(index line160)comment:  "+comment.content+"to user: "+req.params.user);
        var oneComment = new Comment(req.params.user, req.params.day, req.params.title, comment);
        oneComment.save(function(err){
            console.log("index 163 err: "+err);
            if(err){
                req.session.error=err; 
                return res.redirect('/'+req.params.user+'/'+req.params.day+'/'+req.params.title);
            }
            req.session.success='评论成功!';
            console.log("index 169 success: "+req.session.success+"  "+req.params.user);
            res.redirect('back');
        });
    });

    app.all('*',function(req,res){
        res.render('404');
    });

    function checkLogin(req,res,next){
    	if(!req.session.user){
    		req.session.error='未登陆';
    		return res.redirect('/login');
    	}else{
    		next();
    	}
    }

    function checkNotLogin(req,res,next){
    	if(req.session.user){
	        req.session.error='已登录'; 
	        return res.redirect('/');
	    }else{
	    	next();
	    }
    }
}