const express = require("express");
const router = express.Router();
const dbFunctions = require("../helpers/db-functions");
const functionHelpers=require('../helpers/function-helpers')
const hbsHelpers = require("../helpers/hbs-custom-helpers");

const isAdminExist=(req,res,next)=>{
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress; 
  console.log(ip)
  dbFunctions.getAdmin().then((result)=>{
    if(!result){
      res.render('regAdmin')
    }else{
      if (req.session.adminLogin) {
        next();
      } else {
        res.render("adminLogin");
      }
    }
  })


}


router.post("/register",(req,res)=>{
    const body = Object.assign({}, req.body);
    dbFunctions.AdminRegistration(body).then((result)=>{
    })

});
router.post("/login", (req, res) => {
  const body = Object.assign({}, req.body);
  dbFunctions.adminLogin(body).then((result)=>{
    if(result.status=='Login Success'){
      req.session.adminLogin=true
      req.session.admin = result.admin;
      res.redirect('/admin')
    }
  })
});

router.get("/logout",(req,res)=>{
  req.session.destroy();
  res.redirect('/admin')
});

/* GET users listing. */
router.get("/", isAdminExist,function (req, res, next) {
  let user=req.session.admin.name
  dbFunctions.listProduct().then((products)=>{
  
      if (req.query.conform) {
        let val2=req.query.product;
        res.render("admin", { admin: true, user,products ,val1:"are you sure ?",val2});
      }else if (req.query.delete) {
        res.render("admin", { admin: true, user,products, val1:"Delete Success" });
      }else if ((req.query.update)) {
        console.log(req.query.update);
        res.render("admin", { admin: true, user,products, val1: "update Success" });
      } else {
        res.render("admin", { admin: true,user, products });
      }
    
  })
  
});

router.get("/addProducts", (req, res, next) => {
  let user = req.session.admin.name;
  res.render("add-Product", { admin: true, user});
});


router.post("/addProducts", (req, res, next) => {
  let user = req.session.admin.name;
  const body = Object.assign({}, req.body);
  const image = req.files.file;
  functionHelpers.imageMove(image).then((result)=>{
    dbFunctions.createProduct(body,result);
    res.render("add-Product", { admin: true, status: true,user });
  })  
});


router.get("/delete-product-conform/:id", (req, res) => {
  const proId = req.params.id;
  res.redirect(`/admin?conform=conform&product=${proId}`);
});



router.get("/delete-product/:id", (req, res) => {
  const proId = req.params.id;

  dbFunctions.deleteproduct(proId).then((result)=>{
    functionHelpers.deleteImage(result.imgPaths).then(() => {
      res.redirect("/admin?delete=success");
    });    
  });
});


router.get("/update-product/:id", (req, res) => {
  let user = req.session.admin.name;
  const proId = req.params.id;
  dbFunctions.getProduct(proId).then((result)=>{
     res.render("update-product", { admin: true,result ,user});
  })


  router.post("/update-product/:id",(req,res)=>{
    const productId=req.params.id;
    const body = Object.assign({}, req.body);
    const image = req.files.file;
    functionHelpers.imageMove(image).then((result)=>{
      dbFunctions.updateProduct(productId,body,result).then((product)=>{
        res.redirect("/admin?update=success");
        functionHelpers.deleteImage(product.imgPaths);
        
      })
    })
  });
 
});


router.get("/orders", isAdminExist,(req, res) => {
  let user = req.session.admin.name;
    dbFunctions.getAllorders().then((result) => {
      res.render("manageorders", { admin:true,result,user });
      hbsHelpers.resetIndex();
    });
});




module.exports = router;
