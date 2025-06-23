const JWT=require('jsonwebtoken');

const  secret="superMan@123";

function createTokenForUSer(user){
    const payload={
        _id:user._id,
        email: user.email,
        profileImage:user.profileImageURL,
        role:user.role,

    };
    const token=JWT.sign(payload,secret);
        return token;
}

function validateToken(token){
    const payload=JWT.verify(token,secret);
    return payload;
}
    module.exports={
        createTokenForUSer,
        validateToken,


    };


