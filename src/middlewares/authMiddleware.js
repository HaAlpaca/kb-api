import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'
import ApiError from '~/utils/ApiError'

const isAuthorize = async (req, res, next) => {
  // lay accesstoken nam trong request
  const clientAccessToken = req.cookies?.accessToken
  if (!clientAccessToken) {
    next(
      new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (token not found)')
    )
    return
  }
  try {
    // giai ma access token
    const accessTokenDecoded = await JwtProvider.verifyToken(
      clientAccessToken,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    )
    req.jwtDecoded = accessTokenDecoded
    next()
  } catch (error) {
    // console.log('error in auth middleware: ', error)
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token.'))
      return
    }
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
  }
}
export const authMiddleware = { isAuthorize }
