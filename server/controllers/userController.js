const router = require('express').Router();
const User = require('./../models/user');
const authMiddleware = require('./../middlewares/authMiddleware');
const message = require('../models/message');
const cloudinary = require('./../cloudinary');
const user = require('./../models/user');


//GET Details of current logged-in user
// GET logged-in user
router.get('/get-logged-user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);  // ✅ use req.userId

        res.send({
            message: 'User fetched successfully',
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).send({
            message: error.message,
            success: false
        });
    }
});

// GET all users except current
router.get('/get-all-users', authMiddleware, async (req, res) => {
    try {
        const allUsers = await User.find({ _id: { $ne: req.userId } }); // ✅ use req.userId

        res.send({
            message: 'All users fetched successfully',
            success: true,
            data: allUsers
        });
    } catch (error) {
        res.status(400).send({
            message: error.message,
            success: false
        });
    }
});

router.post('/upload-profile-pic', authMiddleware, async (req, res) => {
    try{
        const image = req.body.image;

        //UPLOAD THE IMAGE TO CLODINARY
        const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: 'quick-chat'
        });

        //UPDATE THE USER MODEL & SET THE PROFILE PIC PROPERTY
     const user = await User.findByIdAndUpdate(
  req.userId,
  { profilePic: uploadedImage.secure_url },
  { new: true }
);

        res.send({
            message: 'Profic picture uploaded successfully',
            success: true,
            data: user
        })
    }catch(error){
        res.send({
            message: error.message,
            success: false
        })
    }
})

module.exports = router;