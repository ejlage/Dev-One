import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    { 
      iduser: user.iduser,
      email:  user.email,
      role:   user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};