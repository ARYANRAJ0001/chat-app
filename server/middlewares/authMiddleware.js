const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).send({
                message: "No token provided",
                success: false
            });
        }

        const token = authHeader.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

        req.userId = decodedToken.userId;   // ✅ attach here

        next();
    } catch (error) {
        res.status(401).send({
            message: error.message,
            success: false
        });
    }
};
