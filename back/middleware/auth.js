const jwt = require('jsonwebtoken');

module.exports = (req, res, next) =>{
  try{
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token,process.env.TOKEN_SECRET);
    const userId = decodedToken.userId;
   
    if(req.body.userId && req.body.userId !== userId){
      throw 'invalid user ID';
    }else {
      next();
    }
  } catch (error) {
   
    res.status(403).json({ error:error | 'Invalid request!'});
  }
};