import jwt from "jsonwebtoken";
import env from "dotenv";
env.config();

export const verifyToken = async (req, res, next) => {
  let token = req.header("Authorization");
  
  try {
    if (!token)
      return res
        .status(404)
        .json({status:false,token:false, message: "Authentication failed: no token provided." });

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }
    const verified = jwt.verify(token,process.env.secretKey);
    req.user = verified;
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .json({ message: "Authentication failed: invalid token." });
  }
};

export const generateToken = (user) => {
  const token = jwt.sign(
    { _id: user._id, name: user.name, email: user.email,role: "user" },
    process.env.secretKey,
    { expiresIn: "2h" }
  );
  return token;
};

export const generateProToken = (data) => {
  console.log(data._id);
  const token = jwt.sign(
    { _id: data._id, email: data.email, name: data.name, role: "professional" },
    process.env.secretKey,{expiresIn:'2h'}
  );
  console.log(token);
  return token;
};


export const generateAdminToken = (data) => {
  console.log(data, "token data");
  const token = jwt.sign(
    { _id: data._id, email: data.email, role: "admin" },
    process.env.secretKey,{expiresIn:'2h'}
  );
  return token;
};

export const verifyAdminToken = async (req, res, next) => {
  try {
    // Use the verifyToken function to verify the token first
    await verifyToken(req, res, async () => {
      // Check if the user role is 'admin'
      if (req.user && req.user.role === 'admin') {
        next(); // If admin, proceed to the next middleware
      } else {
        res.status(403).json({ message: 'Access denied: Not an admin.' });
      }
    });
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .json({ message: 'Authentication failed: invalid token.' });
  }
};

export const verifyProToken = async (req, res, next) => {
  try {
    // Use the verifyToken function to verify the token first
    await verifyToken(req, res, async () => {
      // Check if the user role is 'professional'
      if (req.user && req.user.role === 'professional') {
        next(); // If professional, proceed to the next middleware
      } else {
        res.status(403).json({ message: 'Access denied: Not an professional.' });
      }
    });
  } catch (error) {
    console.log(error,'mmmmmmmmmmmmmmmmm');
    return res
      .status(404)
      .json({ message: 'Authentication failed: invalid token.' });
  }
};

