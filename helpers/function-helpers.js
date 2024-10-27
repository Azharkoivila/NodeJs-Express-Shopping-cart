const { unlink } = require("node:fs/promises");
const { ObjectId } = require("mongodb"); 

module.exports = {
  uniqueSuffix() {
    return Date.now() + "-" + Math.round(Math.random() * 1e9);
  },
  imageMove(image) {
    return new Promise((resolve, reject) => {
      if (image.constructor === Array) {
        let imgPaths = image.map((img) => {
          const path = this.uniqueSuffix();
          img.mv(`./public/images/products/${path}.jpg`);
          return path;
        });
        resolve(imgPaths);
      } else {
        const path = this.uniqueSuffix();
        image.mv(`./public/images/products/${path}.jpg`);
        resolve([path]);
      }
     
    });
  },
  deleteImage(result) {
    return new Promise((resolve, reject) => {
      result.map(async (name) => {
        let path = `./public/images/products/${name}.jpg`;
        try {
          await unlink(path);
          console.log(`successfully deleted ${path}`);
        } catch (error) {
          console.error("there was an error:", error.message);
        }
      });
      resolve("true");
    });
  },grandTotal(array){
    return new Promise((resolve,reject)=>{
          let total = 0;
          array.forEach((element) => {
            total = total + element.productPrice * element.count;
          });
          resolve(total);
    })

},ObjectIDConvertor(objID){
    if (objID.length === 24 && /^[0-9a-f]{24}$/.test(objID)) {
      const objectId = new ObjectId(objID);
      return objectId;
    } else {
      throw new Error("Invalid ObjectID format");
    }

}
};
