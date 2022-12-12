const express = require('express');
//const app = express();
const router = express.Router();
const Campground = require('../models/campground');
const Comment = require('../models/comment');
const middleware = require('../middleware');
var NodeGeocoder = require('node-geocoder');

let { checkCampgroundOwnership, isLoggedIn, isPaid } = require("../middleware");
// router.use(isLoggedIn, isPaid);
 
var options = {
  provider: 'openstreetmap',
  httpAdapter: 'https',
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

router.get('/campgrounds', (req, res)=>{
	
	if (req.query.paid) res.locals.success = 'Payment succeeded, welcome to YelpCamp!';
	
	var perPage = 8;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	
	var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
		Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec((err, campgrounds)=> {
			Campground.countDocuments({name: regex}).exec((err, count)=> {
				if(err){
					console.log(err);
				} else {
					if(campgrounds.length < 1) {
						noMatch = "No campgrounds match that query, please try again.";
					}
					res.render("campgrounds/index", {
						campgrounds: campgrounds, 
						current: pageNumber, 
						page: 'campgrounds', 
						noMatch: noMatch,
						pages: Math.ceil(count / perPage)
					});
				}
			});
        });
    } else {
		Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec((err, campgrounds)=> {
			
			Campground.countDocuments().exec((err, count)=> {
				if (err) {
					console.log(err);
				} else {
					res.render("campgrounds/index", {
						campgrounds: campgrounds,
						current: pageNumber,
						noMatch: noMatch, 
						page: 'campgrounds',
						pages: Math.ceil(count / perPage)
					});
				}
			});
		});
	}
});

router.get('/campgrounds/new', middleware.isLoggedIn, (req, res)=>{
	res.render("campgrounds/new")
})

router.post('/campgrounds', middleware.isLoggedIn, (req, res)=> {
	var name = req.body.name;
	var image = req.body.image;
	var price = req.body.price;
	var desc = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	// var location = req.body.location;
	desc = req.sanitize(req.body.description);
	
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || !data.length) {
			console.log(data);
			console.log(err);
		    req.flash('error', 'Invalid address');
		    return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;
		
		var isLatInvalid = false;
		var isLngInvalid = false;

		if (lat <= -90 || lat >= 90)
		isLatInvalid = true;
		if (lat <= -180 || lat >= 80)
		isLngInvalid = true;
	
		var camp = {name: name, image: image, price: price, location: location, lat: lat, lng: lng, description: desc, author: author}

		Campground.create(camp, (err, newCamp)=>{
			if(err){
				console.log(err);
				res.redirect('back');
			} else {
				//console.log(newCamp);
				req.flash('success', "campground created successfully");
				res.redirect('/campgrounds');
			}
		});
	});
});

router.get('/campgrounds/:id', (req, res)=>{
	Campground.findById(req.params.id).populate("comments likes").exec((err, camp)=>{
		if(err || !camp){
			//console.log(err);
			req.flash('error', 'Sorry, that campground does not exist!');
			return res.redirect('/campgrounds');
		} else {
			//console.log(camp);
			res.render("campgrounds/show", {campground: camp});
		}
	});
});

// Campground Like Route
router.post("/campgrounds/:id/like", middleware.isLoggedIn, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
        }

        // Check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function(like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // User has already liked, so removing the like
            foundCampground.likes.pull(req.user._id);
        } else {
            // Adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function(err) {
            if (err) {
                console.log(err);
                return res.redirect("/campgrounds");
            }
            return res.redirect("/campgrounds/" + foundCampground._id);
        });
    });
});

router.get('/campgrounds/:id/edit', middleware.checkCampgroundOwnership, (req, res)=>{
	Campground.findById(req.params.id, (err, campground)=>{
		if(err || !campground){
			//console.log(err);
			req.flash('error', 'Sorry, that campground does not exist!');
			return res.redirect('/campgrounds');
		} else {
			res.render("campgrounds/edit", {campground: campground});
		}
	});
});

router.put('/campgrounds/:id', middleware.checkCampgroundOwnership, (req, res)=>{
	req.body.campground.description = req.sanitize(req.body.campground.description);
	
	geocoder.geocode(req.body.campground.location, function (err, data) {
		if (err || !data.length) {
			//console.log(data);
			console.log(err);
		    req.flash('error', 'Invalid address');
		    return 
		}
		//console.log(data);
		req.body.campground.lat = data[0].latitude;
		req.body.campground.lng = data[0].longitude;
		req.body.campground.location = data[0].formattedAddress;
	
		Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, campground)=>{
			if(err){
				console.log(err);
			} else {
				req.flash('success', 'Campground updated successfully');
				res.redirect('/campgrounds/' + req.params.id);
			}
		});
	});
});

router.delete('/campgrounds/:id', middleware.checkCampgroundOwnership, (req, res)=>{
	Campground.findByIdAndRemove(req.params.id, (err, campground)=>{
		if(err){
			console.log(err);
		} else {
			//delete comment also after deleting the campground
			Comment.deleteMany( {_id: { $in: campground.comments } }, (err) => {
				if (err) {
                console.log(err);
				}
				req.flash('success', 'Campground deleted successfully');
				res.redirect("/campgrounds");
			});
		}
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;