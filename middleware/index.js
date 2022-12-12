const Campground = require('../models/campground');
const Comment = require('../models/comment');

var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, (err, campground)=>{
			if(err || !campground){
				req.flash("error", 'Sorry, that campground does not exist!');
				res.redirect('back');
			} else {
				//console.log(campground);
				if(campground.author.id.equals(req.user._id)){
					next();
				} else {
					req.flash('error', 'You are not allowed to do that');
					res.redirect('back');
				}
			}
		})
	} else {
		req.flash('error', 'You need to be logged in to do that!');
		res.redirect('/login');
	}
}

middlewareObj.checkCommentOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, (err, comment)=>{
			if(err || !comment){
				req.flash('error', 'Sorry, that comment does not exist!');
				res.redirect('back');
			} else {
				if(comment.author.id.equals(req.user._id)){
					next();
				} else {
					req.flash('error', 'You are not authorized to do that');
					res.redirect('back');
				}
			}
		});
	} else {
		req.flash('error', 'You need to be logged in to do that!');
		res.redirect('/login');
	}
}


middlewareObj.isPaid = function(req, res, next){
    if (req.user.isPaid) return next();
    req.flash("error", "Please pay registration fee before continuing");
    res.redirect("/checkout");
}

middlewareObj.isLoggedIn = function (req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
	req.flash("error", "You need to be logged in to do that");
    res.redirect('/login');
}

module.exports = middlewareObj;