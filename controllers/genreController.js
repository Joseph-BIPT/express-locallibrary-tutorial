const { body, validationResult } = require('express-validator')
const {sanitizeBody} = require('express-validator')
var Genre = require('../models/genre');
var Book = require('../models/book');


var Async = require('async');


// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function (err, callback) {
            if(err) {return next(err)}
            res.render('genre_list', { title: 'Genre List', genre_list: callback })
        })
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    Async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
                .exec(callback)
        },
        genre_books: function (callback) {
            Book.find({'genre': req.params.id })
                .exec(callback);
        }
    }, function (err, results) {
        if (err) { return next(err);}
        if (results.genre == null){
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail', {title:'Genre Detail', genre: results.genre, genre_books: results.genre_books});
    })

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    body('name', 'Genre name required').isLength({min: 1}).trim(),
    sanitizeBody('name').escape(),
    (req, res, next) => {
        const errors = validationResult(req);

        var genre = new Genre(
            { name: req.body.name }
        );

        if(!errors.isEmpty()){
            res.render('genre_form', {title:'Create Genre', genre: genre, errors: errors.array()});
            return;
        }
        else{
            Genre.findOne({'name': req.body.name})
                .exec(function (err, found_genre) {
                    if(err){ return next(err);}

                    if(found_genre){
                        res.redirect(found_genre.url);
                    }
                    else{
                        genre.save(function(err){
                            if(err){ return next(err);}
                            res.redirect(genre.url);
                        })
                    }
                })
        }
    }
]

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    Async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id).exec(callback)
        },
        book: function (callback) {
            Book.find({
                genre: req.params.id
            }).exec(callback)
        }
    }, function (err, results) {
        if(err) { return next(err)}
        if(results.book == null){
            res.redirect('/catalog/genres')
        }
        res.render('genre_delete', { title: 'Deleting Genre', books: results.book, genre: results.genre })
    })
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    Async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
                .exec(callback)
        },
        books: function (callback) {
            Book.find({
                genre: req.params.id
            }).exec(callback)
        }
    }, function (err, results) {
        if(err) {return next(err)}
        console.log(results.genre)
        console.log(results.books)
        if(results.books.length > 0){
            console.log('books')
            res.render('genre_delete', { title: 'Deleting Genre', books: results.book, genre: results.genre })
        }
        Genre.findByIdAndRemove(req.params.id, function deleteGenre(err) {
            if(err){return next(err)}
            res.redirect('/catalog/genres')
        })
        console.log('no books')
        // else if(results.books.length > 0){
        //     res.render('genre_delete', { title: 'Deleting Genre', books: results.book, genre: results.genre })
        // }
    })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id, function(err, genre) {
        if (err) { return next(err); }
        if (genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('genre_form', { title: 'Update Genre', genre: genre });
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    // Validate that the name field is not empty.
    body('name', 'name is required').isLength({ min: 1 }).trim(),
    // // Sanitize (escape) the name field.
    sanitizeBody('name').escape(),
    // // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request .
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data (and the old id!)
        var genre = new Genre(
            {
                name: req.body.name,
                _id: req.params.id
            }
        );
        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                res.redirect(thegenre.url);
            });
        }
    }
];