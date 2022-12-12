$('#campground-search').on('input', function() {
	var search = $(this).serialize();
	if(search === "search=") {
		search = "all"
	}
	$.get('/campgrounds?' + search, function(data) {
		$('#campground-grid').html('');
		data.forEach(function(campground) {
			$('#campground-grid').append(`
				<div class="col-lg-3 col-md-4 col-sm-6">
					<div class="card">
						<img class="card-img-top" src="${ campground.image }" alt="Campground image">
						<div class="card-body">
							<h4 class="card-tittle">${ campground.name }</h4>
							<div>
								<span class="badge label-primary"><i class="fa fa-thumbs-up"></i> ${campground.likes.length }</span>
							</div>
							<a style="margin-top: 8px" class="btn btn-primary" href="/campgrounds/${ campground._id }">More Info</a>
						</div>
					</div>
				</div>
			`);
		});
	});
});

$('#campground-search').submit(function(event) {
  event.preventDefault();
});