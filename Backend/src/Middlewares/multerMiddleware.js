import multer from "multer";


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./Public")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
    console.log("multer file Object Information",file)
  }
})

 export const upload = multer({ storage, })
