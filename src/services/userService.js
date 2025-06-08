/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { BrevoProvider } from '~/providers/BrevoProvider'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { cardModel } from '~/models/cardModel'

const createNew = async reqBody => {
  try {
    //check email
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!')
    }
    // insert to db
    // cat lay dau truoc @ cua email
    const nameFromEmail = reqBody.email.split('@')[0]
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 8),
      username: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4()
    }
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)
    // send email
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const customSubject = 'KanbanBoard: Please verify your email before using our service!'
    const htmlContent = `
        <h3>Here is your verification link:</h3>
        <h3>${verificationLink}</h3>
        <h3>Sincerely,<br/> - HaAlpaca - </h3>
    `
    await BrevoProvider.sendEmail(getNewUser.email, customSubject, htmlContent)
    // return
    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}
const verifyAccount = async reqBody => {
  try {
    // query user
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    }
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is already active!')
    if (reqBody.token !== existUser.verifyToken) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid!')
    // OK thi update lai thong tin user
    const updateData = {
      isActive: true,
      verifyToken: null
    }
    const updatedUser = await userModel.update(existUser._id, updateData)
    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}
const login = async reqBody => {
  try {
    // query user
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    }
    if (!existUser.isActive)
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active! Verify account in mailbox!')
    if (!bcryptjs.compareSync(reqBody.password, existUser.password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your email or password is incorrect!')
    }
    // moi thu OK => tao token dang nhap
    const userInfo = {
      _id: existUser._id,
      email: existUser.email
    }
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
      // 5
    )
    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE
      // 15
    )
    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) {
    throw error
  }
}

const refreshToken = async clientRefreshToken => {
  try {
    const refreshTokenDecoded = await JwtProvider.verifyToken(clientRefreshToken, env.REFRESH_TOKEN_SECRET_SIGNATURE)
    // xử lí những thông tin unique
    const userInfo = {
      _id: refreshTokenDecoded._id,
      email: refreshTokenDecoded.email
    }

    // tạo access token mới
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
      // 5
    )
    return { accessToken }
  } catch (error) {
    throw error
  }
}

const update = async (userId, reqBody, userAvatarFile) => {
  try {
    const existUser = await userModel.findOneById(userId)
    if (!existUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found')
    }
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')

    let updatedUser = {}
    // change password
    if (reqBody.current_password && reqBody.new_password) {
      // check current password
      if (!bcryptjs.compareSync(reqBody.current_password, existUser.password)) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your current password is incorrect!')
      }
      // update password

      updatedUser = await userModel.update(userId, {
        password: bcryptjs.hashSync(reqBody.new_password, 8)
      })
    } else if (userAvatarFile) {
      // update avatar
      const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'KanbanBoard/images')
      // console.log('uploadResult: ', uploadResult)
      updatedUser = await userModel.update(userId, {
        avatar: uploadResult.secure_url
      })
    } else {
      // update thong tin chung
      updatedUser = await userModel.update(userId, reqBody)
      if (reqBody.displayName) {
        console.log('Update displayName: ', reqBody.displayName)
        console.log('UserId: ', userId)
        await cardModel.updateCommentDisplayName(userId, reqBody.displayName)
      }
    }

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update
}
