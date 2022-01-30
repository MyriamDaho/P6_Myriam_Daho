const Sauce = require('../models/sauce');
const fs = require('fs');
const  jwt = require('jsonwebtoken');
 
exports.createSauce=(req, res, next) =>{
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    
    const sauce= new Sauce({
      ...sauceObject,
      imageUrl:`${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      likes:0,
      dislikes:0,
      usersLiked:[],
      usersDisliked:[]
    });

    sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistrée !'})) 
    .catch(error =>{ console.log(error); res.status(400).json({ error});});
};

exports.modifySauce=(req, res, next)=>{
   // verifier si l'utilisateur qui fait l'operation est l'utilisateur qui a crée la sauce
   const token = req.headers.authorization.split(' ')[1];
   const decodedToken = jwt.verify(token,process.env.TOKEN_SECRET);
   // utilisateur du token 
   const userId = decodedToken.userId;

 Sauce.findOne({ _id:req.params.id})
   .then(sauce =>{
     if(sauce.userId == userId){
         // proceder à la modification
         const sauceObject = req.file ?
        { ...JSON.parse(req.body.sauce),
          imageUrl:`${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : {...req.body};
        Sauce.updateOne({ _id: req.params.id}, {...sauceObject, _id: req.params.id})
         .then(() => res.status(200).json({ message:'Sauce modifiée !'}))
         .catch( error => res.status(400).json({ error }));
    
     }
     else {
       // ne pas supprimer et retourner un status non autorisé 
       res.status(401).json({ message: 'Utilisateur non autorisé pour faire la modification !'});
     }
                 
 })
 .catch(error =>{ console .log(error); res.status(500).json({ error}); });
};

 

exports.deleteSauce=( req,res, next) => {
  // verifier si l'utilisateur qui fait l'opération est l'utilisateur qui a créé la sauce
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token,process.env.TOKEN_SECRET);
    // utilisateur du token 
    const userId = decodedToken.userId;

  Sauce.findOne({ _id:req.params.id})
    .then(sauce =>{
      if(sauce.userId == userId){
          // procéder à la suppression
          const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`,() =>{
        Sauce.deleteOne({ _id: req.params.id})
         .then(() => res.status(200).json({ message: 'Sauce supprimée !'}))
         .catch(error => res.status(400).json({ error }));
    });  
      }
      else {
        // ne pas supprimer et retourner un status non autorisé
        res.status(401).json({ message: 'Utilisateur non autorisé pour faire la suppression !'});
      }
                  
  })
  .catch(error =>{ console .log(error); res.status(500).json({ error}); });
};
  exports.getOneSauce=(req,res, next) => {
    Sauce.findOne({ _id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error=> res.status(404).json({error}));
  };

  exports.getAllSauces=(req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error}));
      
  };
   
  exports.likeSauce = (req, res, next) => {
    switch (req.body.like) {
      case 0:    
        Sauce.findOne({ _id: req.params.id })    
          .then((sauce) => {
            
            if (sauce.usersLiked.find(user => user === req.body.userId)) {   
              Sauce.updateOne({ _id: req.params.id }, {
                $inc: { likes: -1 },           
                $pull: { usersLiked: req.body.userId },     
                _id: req.params.id
              })
                .then(() => { res.status(201).json({ message: 'Ton avis a été pris en compte! Merci.' }); })
                .catch((error) => { res.status(400).json({ error: error }); });
              
            } if (sauce.usersDisliked.find(user => user === req.body.userId)) {      
              Sauce.updateOne({ _id: req.params.id }, {
                $inc: { dislikes: -1 },
                $pull: { usersDisliked: req.body.userId },      
                _id: req.params.id
              })
                .then(() => { res.status(201).json({ message: 'Ton avis a été pris en compte! Merci.' }); })
                .catch((error) => { res.status(400).json({ error: error }); }); 
            }
          })
          .catch((error) => { res.status(404).json({ error: error }); });
        break;
  
        
      case 1:
        Sauce.updateOne({ _id: req.params.id }, {
          $inc: { likes: 1 },
          $push: { usersLiked: req.body.userId },
          _id: req.params.id
        })
          .then(() => { res.status(201).json({ message: 'Ton like a été pris en compte! Merci.' }); })
          .catch((error) => { res.status(400).json({ error: error }); });
        break;
  
        
      case -1:
        Sauce.updateOne({ _id: req.params.id }, {
          $inc: { dislikes: +1 },
          $push: { usersDisliked: req.body.userId },
          _id: req.params.id
        })
          .then(() => { res.status(201).json({ message: 'Ton dislike a été pris en compte!' }); })
          .catch((error) => { res.status(400).json({ error: error }); });
        break;
        default:
    }
  };