/* eslint-disable no-useless-catch */
import JWT from 'jsonwebtoken'

const generateToken = async (userInfo, sercretSignature, tokenLife) => {
  try {
    return JWT.sign(userInfo, sercretSignature, {
      algorithm: 'HS256',
      expiresIn: tokenLife
    })
  } catch (error) {
    throw error
  }
}
const verifyToken = async (token, sercretSignature) => {
  try {
    //
    return JWT.verify(token, sercretSignature)
  } catch (error) {
    throw error
  }
}

export const JwtProvider = {
  generateToken,
  verifyToken
}
