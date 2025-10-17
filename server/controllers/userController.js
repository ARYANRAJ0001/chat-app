const router = require('express').Router();
const User = require('./../models/user');
const authMiddleware = require('./../middlewares/authMiddleware');
const cloudinary = require('./../cloudinary');

// GET logged-in user
router.get('/get-logged-user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
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

// GET all users except current, with optional search
router.get('/get-all-users', authMiddleware, async (req, res) => {
    try {
        const { search } = req.query;
        let query = { _id: { $ne: req.userId } };

        if (search) {
            query.$or = [
                { firstname: { $regex: search, $options: 'i' } },
                { lastname: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const allUsers = await User.find(query);

        res.send({
            message: 'Users fetched successfully',
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

// Upload profile picture
router.post('/upload-profile-pic', authMiddleware, async (req, res) => {
    try {
        const image = req.body.image;

        const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: 'quick-chat'
        });

        const user = await User.findByIdAndUpdate(
            req.userId,
            { profilePic: uploadedImage.secure_url },
            { new: true }
        );

        res.send({
            message: 'Profile picture uploaded successfully',
            success: true,
            data: user
        });
    } catch (error) {
        res.send({
            message: error.message,
            success: false
        });
    }
});

module.exports = router;
