const express = require('express');
const router = express.Router({mergeParams: true});
const Campground = require('../models/campground');
const Comment = require('../models/comment');
const middleware = require('../middleware');
let { checkCommentOwnership, isLoggedIn, isPaid } = require("../middleware");
// router.use(isLoggedIn, isPaid);
	
router.get('/new', middleware.isLoggedIn, (req, res)=>{
	Campground.findById(req.params.id, (err, campground)=>{
		if(err){
			console.log(err);
			res.redirect('back');
		} else {
			res.render("comments/new", {campground: campground});
		}
	});
});

router.post('/', middleware.isLoggedIn, (req, res)=>{
	Campground.findById(req.params.id, (err, campground)=>{
		if(err){
			console.log(err);
		} else {
			var text = req.body.text;
			var comment = {text: text};
			//console.log(comment);
			Comment.create(comment, (err, newComment)=>{
				if(err){
					console.log(err);
					req.flash('error', 'Something went wrong!');
				} else {
					newComment.author.id = req.user._id;
					newComment.author.username =req.user.username;
					newComment.save();
					campground.comments.push(newComment);
					campground.save();
					//console.log(newComment);
					req.flash('success', 'Comment created successfully');
					res.redirect('/campgrounds/' + campground._id);
				}
			});
		}
	});
});

router.get('/:comment_id/edit', middleware.checkCommentOwnership, (req, res)=>{
	Campground.findById(req.params.id, (err, campground)=>{
		if(err){
			console.log(err || !campground);
			req.flash('error', 'Sorry, that campground does not exist!');
			res.redirect('back');
		} else {
			Comment.findById(req.params.comment_id, (error, comment)=>{
				if(error || !comment){
					console.log(error)
					req.flash('error', 'Sorry, that comment does not exist!');
					res.redirect('back');
				} else {
					res.render('comments/edit', {comment: comment, campground_id: campground._id});
				}
			});
		}
	});
});

router.put('/:comment_id', middleware.checkCommentOwnership, (req, res)=>{
	Campground.findById(req.params.id, (err, campground)=>{
		if(err){
			res.redirect('back');
		} else {
			Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, comment)=>{
				if(err){
					res.redirect('back');
				} else {
					req.flash('success', 'Comment updated');
					res.redirect('/campgrounds/' + campground._id);
				}
			});
		}
	});
});

router.delete('/:comment_id', middleware.checkCommentOwnership, (req, res)=>{
	Comment.findByIdAndRemove(req.params.comment_id, (err)=>{
        if(err){
            res.redirect("back");
        }
        else{
			req.flash('success', 'Comment deleted successfully');
            res.redirect('/campgrounds/' + req.params.id);
        }
    });
});


module.exports = router;