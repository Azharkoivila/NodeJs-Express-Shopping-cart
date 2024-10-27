const express = require("express");
const router = express.Router();
const productFunctions = require("../helpers/db-functions");
const dbFunctions = require("../helpers/db-functions");
const functionHelpers = require("../helpers/function-helpers");
const hbsHelpers = require("../helpers/hbs-custom-helpers");
const { ObjectId } = require("mongodb");

let isUserExist = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.render("login", { admin: false });
  }
};
/* GET home page. */
router.get("/", function (req, res, next) {
  let user = req.session.user;
  let status = req.session.LoginStatus;
  productFunctions.listProduct().then((products) => {
    if (user) {
      productFunctions.getCartCount(req.session.user._id).then((cartCount) => {
        res.render("index", {
          products,
          admin: false,
          user,
          status,
          cartCount,
        });
        req.session.LoginStatus = false;
      });
    } else if (req.query.status == "logout") {
      res.render("index", { products, admin: false, status: "Logout success" });
    } else {
      res.render("index", { products, admin: false });
    }
  });
});

router.get("/login", function (req, res, next) {
  if (req.session.LoggedIn) {
    res.redirect("/");
  } else {
    res.render("login", { admin: false });
  }
});

router.get("/signup", function (req, res, next) {
  res.render("signup", { admin: false });
});

router.post("/login", (req, res) => {
  const body = Object.assign({}, req.body);
  productFunctions.doLogin(body).then((result) => {
    console.log(result.status);
    if (result.status == "Login Success") {
      req.session.LoggedIn = true;
      req.session.user = result.user;
      req.session.LoginStatus = "Login Success";
      res.redirect("/");
    } else if (result.status == "Enter Valid Password") {
      res.render("login", { admin: false, status: result.status });
    } else if (result.status == "Enter Valid Email") {
      res.render("login", { admin: false, status: result.status });
    }
  });
});

router.post("/signup", (req, res) => {
  const body = Object.assign({}, req.body);
  productFunctions.doSignup(body).then((result) => {
    if (result.status) {
      res.render("login", { admin: false, status: result.status });
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/?status=logout");
});

router.get("/cart", isUserExist, (req, res) => {
  let userId = req.session.user._id;
  let user = req.session.user;
  productFunctions.getCart(userId).then((userCart) => {
    functionHelpers.grandTotal(userCart).then((grandTotal) => {
      req.session.user.grandTotal = grandTotal;
      if (userCart.length) {
        res.render("cart", { admin: false, userCart, user, grandTotal });
      } else {
        res.render("cart", {
          admin: false,
          status: "Your cart is Empty",
          user,
        });
      }
    });
  });
});

router.get("/addToCart/:id", (req, res) => {
  if (req.session.user) {
    let userId = req.session.user._id;
    let productId = req.params.id;
    dbFunctions.addToCart(userId, productId, "+").then((result) => {});
    res.json({ status: "update" });
  } else {
    res.json({ status: false });
  }
});

router.get("/updateCount/", (req, res) => {
  if (req.session.user) {
    let userId = req.session.user._id;
    let productId = req.query.ProductId;
    if (req.query.Action == "inc") {
      dbFunctions.addToCart(userId, productId, "+").then((result) => {
        productFunctions.getCart(userId).then((userCart) => {
          functionHelpers.grandTotal(userCart).then((grandTotal) => {
            req.session.user.grandTotal = grandTotal;
            res.json({ status: "update", grandTotal });
          });
        });
      });
    } else {
      dbFunctions.addToCart(userId, productId, "-").then((result) => {
        productFunctions.getCart(userId).then((userCart) => {
          functionHelpers.grandTotal(userCart).then((grandTotal) => {
            req.session.user.grandTotal = grandTotal;
            res.json({ status: "update", grandTotal });
          });
        });
      });
    }
  } else {
    res.json({ status: false });
  }
});

router.get("/removeProduct/:id", (req, res) => {
  let userId = req.session.user._id;
  let productId = req.params.id;
  productFunctions.removeProduct(userId, productId).then((response) => {
    res.redirect("/cart");
  });
});

router.get("/checkOut", isUserExist, (req, res) => {
  let grandTotal = req.session.user.grandTotal;
  let user = req.session.user;
  let userId = req.session.user._id;
  productFunctions.getCart(userId).then((response) => {
    if (response.length) {
      res.render("checkout", { user, grandTotal });
    } else {
      res.redirect("/cart");
    }
  });
});

router.post("/checkOut", isUserExist, (req, res) => {
  let userId = req.session.user._id;
  let user = req.session.user;
  const body = Object.assign({}, req.body);
  productFunctions.getCart(userId).then((userCart) => {
    functionHelpers.grandTotal(userCart).then((grandTotal) => {
      let checkOut = {
        userId: new ObjectId(userId),
        userOrders: [
          {
            userCart,
            grandTotal,
            paymentMode: "COD",
            time: new Date(),
            status: "Placed",
            address: body,
          },
        ],
      };
      dbFunctions.checkout(checkOut, userId).then(() => {
        dbFunctions.clearCart(userId).then(() => {
          res.render("cart", {
            admin: false,
            user,
            status: "Order Placed Successfully",
            message: true,
          });
        });
      });
    });
  });
});

router.get("/orders", (req, res) => {
  let user = req.session.user;
  if (user) {
    let userId = req.session.user._id;
    dbFunctions.getOrders(userId).then((result) => {
      console.log(result);
      res.render("orders", { result, user });
    });
    hbsHelpers.resetIndex();
  } else {
    res.redirect("/login");
  }
});

router.get("/viewProduct/:id", (req, res) => {
  let user = req.session.user;

  dbFunctions
    .viewProduct(functionHelpers.ObjectIDConvertor(req.params.id))
    .then((result) => {
      if (user) {
        productFunctions
          .getCartCount(req.session.user._id)
          .then((cartCount) => {
            res.render("productView", { result, user, cartCount });
          });
      } else {
        res.render("productView", { result });
      }
    });
});

router.post("/search", (req, res) => {
  const body = Object.assign({}, req.body);
  dbFunctions.searchProduct(body).then((products) => {
    res.render("searchProduct", { products });
  });
});
router.get("/search", (req, res) => {
  res.redirect("/");
});
module.exports = router;
