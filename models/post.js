var mongodb=require('./db');

function Post(username,title,tags,post){
	this.user=username;
	this.title=title;
	this.tags=tags;
	this.post=post;
}

module.exports=Post;

Post.prototype.save=function save(callback){
	var date = new Date();
	var time = {
	    date: date,
	    year : date.getFullYear(),
	    month : date.getFullYear() + "-" + (date.getMonth()+1),
	    day : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(),
	    minute : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
	};
	var post={
		user: this.user,
	    title:this.title,
	    tags:this.tags,
	    post: this.post,
	    time: time,
	    pv:0,
	    comments:[]
	};
	mongodb.open(function (err, db) {
	    if (err) {
	        return callback(err);
	    }

	    db.collection('posts', function (err, collection) {
	        if (err) {
	            mongodb.close();
	            return callback(err);
	        }

	        collection.insert(post, {
	            safe: true
	        }, function (err,post) {
	            mongodb.close();
	            callback(err,post);
	        });
		});
	});
};

Post.getArchive=function(callback){
	mongodb.open(function (err, db) {
	    if (err) {
	        return callback(err);
	    }

	    db.collection('posts', function(err, collection) {
	        if (err) {
	            mongodb.close();
	            return callback(err);
	        }

	        collection.find({},{"user":1,"time":1,"title":1}).sort({
	            time:-1
	        }).toArray(function(err, docs){
	            mongodb.close();
	            if (err) {
	                callback(err, null);
	            }
	            callback(null, docs);
	        });
	    });
	});
};

Post.getTag=function(callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			collection.distinct('tags.tag',function(err,docs){
				mongodb.close();
				if(err){
					return callback(err,null);
				}
				callback(null,docs);
			});
		});
	});
};

Post.getAllByTag=function(tag,callback){
	mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.find({"tags.tag":tag},{"user":1,"time":1,"title":1}).sort({
                time:-1
            }).toArray(function(err, docs){
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                callback(null, docs);
            });
        });
    });
};

//获取某人或所有人的所有文章
Post.getAll=function(user,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			var query={};
			if(user){//因为index.js中app.get('/')为Post.getAll(null, function(err, posts){}),所以要判断user
				query.user=user;
			}

			collection.find(query).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					callback(err,null);
				}
				callback(null,docs);
			});
		});
	});
};

//获取10篇文章----分页
Post.getTen=function(user,page,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			var query={};
			if(user){
				query.user=user;
			}

			/*collection.find(query,{skip:(page-1)*10,limit:10}).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					callback(err,null);
				}
				callback(null,docs);
			});*/

			//使用 count 返回总文档数 total
			collection.count(function(err, total){
				//根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的10个结果
				collection.find(query,{skip:(page-1)*10,limit:10}).sort({
					time: -1
				}).toArray(function (err, docs) {
					mongodb.close();
					if (err) {
						callback(err, null);//失败！返回 null
					}
					callback(null, docs, total);
				});
			});
		});
	});
};

//获取一篇文章
Post.getOne=function(username,day,title,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			var query={'user':username,'time.day':day,'title':title};

			collection.findOne(query,function(err,doc){
				mongodb.close();
				if(err){
					callback(err,null);
				}
				callback(null,doc);
			});

			//pv +1
			collection.update(query,{$inc:{'pv':1}});
		});
	});
};

Post.search=function(keyword,callback){
	mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp("^.*"+keyword+".*$", "i");
            collection.find({"title":pattern},{"user":1,"time":1,"title":1}).sort({
                time:-1
            }).toArray(function(err, docs){
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                callback(null, docs);
            });
        });
    });
};