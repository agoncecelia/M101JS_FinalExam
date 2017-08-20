/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');


function ItemDAO(database) {
    "use strict";

    
    this.db = database;

    this.getCategories = function(callback) {
        "use strict";

        var categories = [];
        var category = {
            _id: "All",
            num: 0
        };

        database.collection("item").aggregate([
            {$project: {category:1, _id: 0}},
            {$group: {
                _id: "$category",
                num: {$sum: 1}
            }},
            {$project: {
                _id:1,
                num: 1
            }}
        ], function(err, result) {
            assert.equal(null, err);

            for(var i = 0; i < result.length; i++) {
                categories.push(result[i]);
                category.num += result[i].num;
            }
            categories.push(category);
            categories.sort(function(a,b) {
                return (a._id > b._id) ? 1 : ((b._id > a._id) ? -1 : 0);
            });
            callback(categories);
        })
    }


    this.getItems = function(category, page, itemsPerPage, callback) {
        "use strict";
        if(category == "All") {
            var pageItems = [];
            
            var items = database.collection('item');
            var cursor = items.find({});
            cursor.sort('_id', 1);
            cursor.skip(page * itemsPerPage);
            cursor.limit(itemsPerPage);
            
            cursor.each(function(err, doc) {
                assert.equal(null, err);
                if(doc != null) {
                    pageItems.push(doc);
                } else {
                    callback(pageItems);
                }
            });
        } else {
            var pageItems = [];
            var items = database.collection('item');
            var cursor = items.find({"category": category});
            cursor.sort('_id', 1);
            cursor.skip(page * itemsPerPage);
            cursor.limit(itemsPerPage);
            
            cursor.each(function(err, doc) {
                assert.equal(null, err);
                if(doc != null) {
                    pageItems.push(doc);
                } else {
                    callback(pageItems);
                }
            });
        }
    }


    this.getNumItems = function(category, callback) {
        "use strict";

        if(category == "All") {
            database.collection("item").find({}).sort('_id',1).count(function(err, count) {
                assert.equal(null, err);
                callback(count);
            });
        } else {
            database.collection("item").find({category: category}).sort('_id',1).count(function(err, count) {
                assert.equal(null, err);
                callback(count);
            });
        }
    }


    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";

        var items = [];
        
        var queryObj = [
            {$match: {$text: {$search: query}}},
            {$sort: {_id: 1}},
            {$skip: (page * itemsPerPage)},
            {$limit: itemsPerPage}
        ];

        database.collection("item").aggregate(queryObj, function(err, result) {
            assert.equal(null, err);
            for (var i=0; i<result.length; i++) {
                items.push(result[i]);
            }
            callback(items);
        });
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";

        var numItems = 0;

        database.collection("item").aggregate([
            {$match: {$text: {$search : query}}},
            {$sort: {_id: 1}}],
            function(err, result) {
                assert.equal(null, err);
                numItems = result.length;
                callback(numItems);
        });


    }


    this.getItem = function(itemId, callback) {
        "use strict";

        this.db.collection("item").findOne({_id: itemId}, function(err, result){
            assert.equal(null, err);
            callback(result)
        })

    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        var reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        }

        this.db.collection("item").updateOne({_id: itemId}, {$push: {reviews: reviewDoc}},
            function(err, result){
                assert.equal(null, err);
                callback(result);
        })

    }


    this.createDummyItem = function() {
        "use strict";

        var item = {
            _id: 1,
            title: "Gray Hooded Sweatshirt",
            description: "The top hooded sweatshirt we offer",
            slogan: "Made of 100% cotton",
            stars: 0,
            category: "Apparel",
            img_url: "/img/products/hoodie.jpg",
            price: 29.99,
            reviews: []
        };

        return item;
    }
}


module.exports.ItemDAO = ItemDAO;
