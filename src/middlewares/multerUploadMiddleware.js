import { StatusCodes } from 'http-status-codes'
import multer from 'multer'
import ApiError from '~/utils/ApiError'
import {
  ALLOW_COMMON_FILE_TYPE,
  LIMIT_COMMON_FILE_SIZE,
  LIMIT_ATTACHMENT_FILE_SIZE
} from '~/utils/validators'

// docs multer https://www.npmjs.com/package/multer

const customFileFilter = (req, file, cb) => {
  // console.log('multer file: ', file)
  // check file type
  if (!ALLOW_COMMON_FILE_TYPE.includes(file.mimetype)) {
    const errMessage = 'File type is invalid. Only accept jpg, png, jpeg'
    return cb(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errMessage), null)
  }
  // file hợp lệ
  return cb(null, true)
}

const uploadMedia = multer({
  limits: { fileSize: LIMIT_COMMON_FILE_SIZE },
  fileFilter: customFileFilter
})
const uploadAttachment = multer({
  limits: { fileSize: LIMIT_ATTACHMENT_FILE_SIZE }
})

export const multerUploadMiddleware = { uploadMedia, uploadAttachment }
