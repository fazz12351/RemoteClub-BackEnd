// middleware/authenticate.js

const jwt = require('jsonwebtoken');
const secretKey = 'my_temp_key_retards'; // Replace with your actual secret key


function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        // Add other relevant claims as needed
    };
    return jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Example: Token expires in 1 hour
}


function verifyToken(req, res, next) {

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        req.user = decoded;
        next();
    });
}





module.exports = { generateToken, verifyToken }
