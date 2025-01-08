const db = require("../config/connection");
const collections = require("../config/collections");
const { ObjectId} = require("mongodb");
const bcrypt = require("bcrypt");
const saltRounds = 10;

module.exports = {
  createProduct(product, imgPaths) {
    product.productPrice = parseFloat(product.productPrice);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.productCollection)
        .insertOne({ ...product, imgPaths })
        .then((result) => {
          resolve(result);
        });
    });
  },
  listProduct() {
    return new Promise(async (resolve, reject) => {
      let productList = await db
        .get()
        .collection(collections.productCollection)
        .find()
        .toArray();
      resolve(productList);
    });
  },
  doSignup(userData) {
    return new Promise(async (resolve, reject) => {
      await bcrypt.hash(userData.password, saltRounds, function (err, hash) {
        userData.password = hash;
        db.get()
          .collection(collections.UsersCollection)
          .insertOne(userData)
          .then((result) => {
            resolve({ result, status: "Account Creation Success" });
          });
      });
    });
  },
  doLogin(userData) {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collections.UsersCollection)
        .findOne({ email: userData.email });

      if (user) {
        await bcrypt.compare(
          userData.password,
          user.password,
          function (err, result) {
            if (result) {
              resolve({ user, status: "Login Success" });
            } else {
              reject({ status: "Enter Valid Password" });
            }
          }
        );
      } else {
        reject({ status: "Enter Valid Email" });
      }
    });
  },
  deleteproduct(productId) {
    return new Promise(async (resolve, reject) => {
      let product = await db
        .get()
        .collection(collections.productCollection)
        .findOne({ _id: new ObjectId(productId) });
      await db
        .get()
        .collection(collections.productCollection)
        .deleteOne({ _id: new ObjectId(productId) })
        .then((result) => {
          resolve(product);
        });
    });
  },
  getProduct(productId) {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collections.productCollection)
        .findOne({ _id: new ObjectId(productId) })
        .then((result) => {
          resolve(result);
        });
    });
  },
  updateProduct(productId, product, imagePath) {
    product.productPrice = parseFloat(product.productPrice);
    return new Promise(async (resolve, reject) => {
      let collection = await db
        .get()
        .collection(collections.productCollection)
        .findOne({ _id: new ObjectId(productId) });
      await db
        .get()
        .collection(collections.productCollection)
        .updateOne(
          { _id: new ObjectId(productId) },
          {
            $set: {
              productName: product.productName,
              productBrand: product.productBrand,
              productPrice: product.productPrice,
              imgPaths: imagePath,
            },
          }
        )
        .then(() => {
          resolve(collection);
        });
    });
  },
  getCartCount(userId) {
    return new Promise(async (resolve, reject) => {
      let cartCount = await db
        .get()
        .collection(collections.UsersCart)
        .aggregate([
          {
            $match: {
              userId: userId,
            },
          },
          {
            $project: {
              products: 1,
            },
          },
          {
            $unwind: "$products",
          },
          {
            $group: {
              _id: null,
              totalCount: { $sum: "$products.count" },
            },
          },
        ])
        .toArray();
      if (cartCount.length) {
        resolve(cartCount[0].totalCount);
      } else {
        resolve("0");
      }
    });
  },
  addToCart(UserId, ProductId, action) {
    return new Promise(async (resolve, reject) => {
      let isUserExist = await db
        .get()
        .collection(collections.UsersCart)
        .findOne({ userId: UserId });
      if (isUserExist) {
        await db
          .get()
          .collection(collections.UsersCart)
          .updateOne({ userId: UserId }, [
            {
              $set: {
                products: {
                  $map: {
                    input: "$products",
                    as: "product",
                    in: {
                      $cond: [
                        {
                          $eq: ["$$product.productId", new ObjectId(ProductId)],
                        },
                        {
                          productId: "$$product.productId",
                          count: {
                            $cond: [
                              { $eq: [action, "+"] },
                              { $add: ["$$product.count", 1] },
                              {
                                $let: {
                                  vars: {
                                    newCount: {
                                      $subtract: ["$$product.count", 1],
                                    },
                                  },
                                  in: {
                                    $cond: [
                                      { $lt: ["$$newCount", 1] },
                                      "$$product.count",
                                      "$$newCount",
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                        },
                        "$$product",
                      ],
                    },
                  },
                },
              },
            },
            {
              $set: {
                products: {
                  $cond: [
                    { $in: [new ObjectId(ProductId), "$products.productId"] },
                    "$products",
                    {
                      $concatArrays: [
                        "$products",
                        [
                          {
                            productId: new ObjectId(ProductId),
                            count: action === "+" ? 1 : action === "-" ? -1 : 0,
                          },
                        ],
                      ],
                    },
                  ],
                },
              },
            },
          ]);

        resolve();
      } else {
        await db
          .get()
          .collection(collections.UsersCart)
          .insertOne({
            userId: UserId,
            products: [{ productId: new ObjectId(ProductId), count: 1 }],
          })
          .then((result) => {
            resolve(result);
          });
      }
    });
  },
  getCart(UserId) {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collections.UsersCart)
        .aggregate([
          {
            $match: {
              userId: UserId,
            },
          },
          {
            $unwind: "$products",
          },
          {
            $lookup: {
              from: "products",
              localField: "products.productId",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $unwind: "$productDetails",
          },
          {
            $project: {
              _id: 0,
              productId: "$products.productId",
              count: "$products.count",
              productName: "$productDetails.productName",
              productBrand: "$productDetails.productBrand",
              productPrice: "$productDetails.productPrice",
              imgPaths: "$productDetails.imgPaths",
            },
          },
        ])
        .toArray();
      resolve(cart);
    });
  },
  removeProduct(UserId, productId) {
    console.log(UserId);
    console.log(productId);
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collections.UsersCart)
        .updateOne(
          { userId: UserId },
          { $pull: { products: { productId: new ObjectId(productId) } } }
        )
        .then((result) => {
          resolve(result);
        });
    });
  },
  checkout(userOder, userId) {
    return new Promise(async (resolve, reject) => {
      let isCartExist = await db
        .get()
        .collection(collections.UserOrders)
        .findOne({ userId: new ObjectId(userId) });
      if (isCartExist) {
        db.get()
          .collection(collections.UserOrders)
          .updateOne(
            { userId: new ObjectId(userId) },
            { $push: { userOrders: userOder.userOrders[0] } }
          );
          resolve()
      } else {
        db.get()
          .collection(collections.UserOrders)
          .insertOne(userOder)
          .then((result) => {
            resolve();
          });
      }
    });
  },
  clearCart(userId) {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collections.UsersCart)
        .deleteOne({ userId: userId })
        .then((result) => {
          resolve();
        });
    });
  },
  getOrders(userId) {
    return new Promise(async(resolve, reject) => {
       await db.get()
        .collection(collections.UserOrders)
        .findOne({ userId: new ObjectId(userId) }).then((result)=>{
            resolve(result)
        })
    ;
    });
  },viewProduct(productId){
    return new Promise(async(resolve,reject)=>{
  const product = await db
    .get()
    .collection(collections.productCollection)
    .findOne({ _id: new ObjectId(productId) });
        console.log(product);
        resolve(product);
    })

  },searchProduct(query){
    return new Promise(async (resolve,reject)=>{
    let products = await db
      .get()
      .collection(collections.productCollection)
      .aggregate([
        {
          $match: {
            $or: [{ productName: query.query }, { productBrand: query.query }],
          },
        },
      ])
      .toArray();

       resolve(products);
    })
  },getAdmin(){
    return new Promise(async(resolve,reject)=>{
     let Admins=await db.get().collection(collections.AdminCollection).find().toArray();
     resolve(Admins)
    })
  },AdminRegistration(body){
        return new Promise(async (resolve, reject) => {
      await bcrypt.hash(body.password, saltRounds, function (err, hash) {
        body.password = hash;
        db.get()
          .collection(collections.AdminCollection)
          .insertOne(body)
          .then((result) => {
            resolve({ result, status: "Account Creation Success" });
          });
      });
    });
  },adminLogin(body){
     return new Promise(async (resolve, reject) => {
       let admin = await db
         .get()
         .collection(collections.AdminCollection)
         .findOne({ email: body.email });

       if (admin) {
         await bcrypt.compare(
           body.password,
           admin.password,
           function (err, result) {
             if (result) {
               resolve({ admin, status: "Login Success" });
             } else {
               reject({ status: "Enter Valid Password" });
             }
           }
         );
       } else {
         reject({ status: "Enter Valid Email" });
       }
     });
  },getAllorders(){
    return new Promise(async(resolve,reject)=>{
     let allorders=await db.get().collection(collections.UserOrders).find().toArray();
     console.log(allorders)
     resolve(allorders);
    })
  }
};
