/*
 * GET home page.
 */
exports.index = function(req, res){
    res.render('index', { title: 'AdCrafted', domain: req.app.get("domain") });
};
