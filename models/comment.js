var mongodb=require('./db');

function Comment(user,day,title,comment){
	this.user=user;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports=Comment;

Comment.prototype.save=function(callback){
	var user = this.user,
	    day = this.day,
	    title = this.title,
	    comment = this.comment;
	console.log("comment --save:line17:  "+user+day+title+comment);
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			var query_id={};
			collection.findOne({"user":user,"time.day":day,"title":title},function(err,doc){
				if(err){
					mongodb.close();
					callback(err,null);
				}

				console.log("comment: find that article: "+user+day+title+"  find: "+doc);
				query_id._id=doc._id;
				query_id.title=doc.title;
				console.log("about to save comments: "+query_id.id+query_id.title);
				collection.update(query_id,{$push:{"comments":comment}},{
					safe:true
				},function(err,comment){
					mongodb.close();
					console.log("comment 44 err: "+err);
					console.log("comment 45 comment: "+comment);
					if(err==null && comment== 0){
						err="保存留言失败";
					}
					callback(err,comment);
				});
			});
		});
	});
};