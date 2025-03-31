import { StatusCodes } from 'http-status-codes'
import { checkboxService } from '~/services/checkboxService'

// Done
const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const createdCheckbox = await checkboxService.createNew(userId, req.body)
    res.status(StatusCodes.CREATED).json(createdCheckbox)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const checkboxId = req.params.id
    const updatedCheckbox = await checkboxService.update(checkboxId, req.body)
    res.status(StatusCodes.OK).json(updatedCheckbox)
  } catch (error) {
    next(error)
  }
}
const updateCheckboxChecked = async (req, res, next) => {
  try {
    const updatedCheckbox = await checkboxService.updateCheckboxChecked(
      req.body
    )
    res.status(StatusCodes.OK).json(updatedCheckbox)
  } catch (error) {
    next(error)
  }
}

const deleteCheckbox = async (req, res, next) => {
  try {
    const checkboxId = req.params.id
    const deleteCheckbox = await checkboxService.deleteCheckbox(checkboxId)
    res.status(StatusCodes.OK).json(deleteCheckbox)
  } catch (error) {
    next(error)
  }
}

export const checkboxController = {
  createNew,
  update,
  deleteCheckbox,
  updateCheckboxChecked
}
