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


function CartDAO(database) {
    "use strict";

    this.db = database;


    this.getCart = function(userId, callback) {
        "use strict";

        var userCart = {
            userId: userId,
            items: []
        }

        this.db.collection("cart").find({userId: userId}).toArray(function(err, result) {
            assert.equal(null, err);
            for(var i = 0; i < result[0].items.length; i++) {
                userCart.items.push(result[0].items[i]);
            }
            callback(userCart)
        })
    }


    this.itemInCart = function(userId, itemId, callback) {
        "use strict";

        
        this.db.collection("cart").find(
            {userId: userId},
            {"items": { $elemMatch: {"_id": itemId}}},
            {"items.$": 1}
        ).toArray(function(err, result) {
            if(result[0].items == undefined) {
                callback(null)
            } else {
                var item = result[0].items[0];
                callback(item)
            }
        })

    }

    this.addItem = function(userId, item, callback) {
        "use strict";

        // Will update the first document found matching the query document.
        this.db.collection("cart").findOneAndUpdate(
            // query for the cart with the userId passed as a parameter.
            {userId: userId},
            // update the user's cart by pushing an item onto the items array
            {"$push": {items: item}},
            // findOneAndUpdate() takes an options document as a parameter.
            // Here we are specifying that the database should insert a cart
            // if one doesn't already exist (i.e. "upsert: true") and that
            // findOneAndUpdate() should pass the updated document to the
            // callback function rather than the original document
            // (i.e., "returnOriginal: false").
            {
                upsert: true,
                returnOriginal: false
            },
            // Because we specified "returnOriginal: false", this callback
            // will be passed the updated document as the value of result.
            function(err, result) {
                assert.equal(null, err);
                // To get the actual document updated we need to access the
                // value field of the result.
                callback(result.value);
            });


    };


    this.updateQuantity = function(userId, itemId, quantity, callback) {
        "use strict";

        var userCart = {
            userId: userId,
            items: []
        }
        if(quantity === 0) {
            this.db.collection("cart").findOneAndUpdate(
                {userId: userId},
                {$pull: {'items' : {'_id': itemId}}},
                function(err, result){
                    console.log(result)
                    assert.equal(null, err);
                    for(var i = 0; i < result.value.items.length; i++) {
                        userCart.items.push(result.value.items[i])
                    }
                    callback(userCart);
                }
            )
        } else {
            this.db.collection("cart").findOneAndUpdate(
                {userId: userId, "items._id": itemId},
                {$set: {'items.$.quantity': quantity}},
                {returnOriginal: false},
                function(err, result) {
                    assert.equal(null, err);
                    console.log(err)

                   for(var i = 0; i < result.value.items.length; i++) {
                        userCart.items.push(result.value.items[i])
                    }
                    callback(userCart);
                }
            )
        }

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
            quantity: 1,
            reviews: []
        };

        return item;
    }

}


module.exports.CartDAO = CartDAO;
