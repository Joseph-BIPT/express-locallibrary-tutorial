const {body, validationResult, sanitizeBody} = require('express-validator');

var Book = require('../models/book');
var BookInstance = require('../models/bookinstance');

exports.bookinstance_list = function (req, res, next) {

    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if(err){ return next(err); }
            res.render('bookinstance_list', {title:'Book Instance List', bookinstance_list: list_bookinstances});
        })

}

exports.bookinstance_detail = function (req, res) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if(err) {return next(err);}
            if(bookinstance==null){
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }
            res.render('bookinstance_detail', {title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance});
        })
}

exports.bookinstance_create_get = function (req, res, next) {
    Book.find({}, 'title')
        .exec(function (err, books) {
            if(err){return next(err);}

            res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
        });
}

exports.bookinstance_create_post = [
    //Validate fields.
    body('book', 'Book must be specified').isLength({min: 1}).trim(),
    body('imprint', 'Imprint must be specified').isLength({min: 1}).trim(),
    body('due_back', 'Invalid date').optional({checkFalsy: true }).isISO8601(),

    //sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if(!errors.isEmpty()){
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if(err){ return next(err); }
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_books: bookinstance.book._id, errors: error.array(), bookinstance: bookinstance});
                });
            return
        }
        else {
            bookinstance.save(function (err) {
                if(err) { return next(err); }

                res.redirect(bookinstance.url);
            });
        }
    }

]

exports.bookinstance_delete_get = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .exec(function (err, book_instance) {
            if(err) {return next(err)}
            res.render('bookinstance_delete', { title: 'Deleting copy of book', copy_id: book_instance.id } )
    })
}

exports.bookinstance_delete_post = function (req, res, next) {
    BookInstance.findByIdAndRemove(req.body.copyid, function deleteBookInstance (err) {
        if (err) {return next(err)}
        res.redirect('/catalog/books')
    })
}

exports.bookinstance_update_get = function(req, res, next) {

    // Get book, authors and genres for form.
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback)
        },
        books: function(callback) {
            Book.find(callback)
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.bookinstance==null) { // No results.
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('bookinstance_form', { title: 'Update  BookInstance', book_list : results.books, selected_book : results.bookinstance.book._id, bookinstance:results.bookinstance });
    });

};

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped/trimmed data and current id.
        var bookinstance = new BookInstance(
            { book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            });

        if (!errors.isEmpty()) {
            // There are errors so render the form again, passing sanitized values and errors.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Update BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
                });
            return;
        }
        else {
            // Data from form is valid.
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err,thebookinstance) {
                if (err) { return next(err); }
                // Successful - redirect to detail page.
                res.redirect(thebookinstance.url);
            });
        }
    }
];

