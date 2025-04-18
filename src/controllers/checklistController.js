import { StatusCodes } from 'http-status-codes'
import { checklistService } from '~/services/checklistService'

// Tạo mới checklist
const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const createdChecklist = await checklistService.createNew(userId, req.body)
    res.status(StatusCodes.CREATED).json(createdChecklist)
  } catch (error) {
    next(error)
  }
}

// Cập nhật checklist
const update = async (req, res, next) => {
  try {
    const checklistId = req.params.id
    const updatedChecklist = await checklistService.update(
      checklistId,
      req.body
    )
    res.status(StatusCodes.OK).json(updatedChecklist)
  } catch (error) {
    next(error)
  }
}

// Xóa checklist
const deleteChecklist = async (req, res, next) => {
  try {
    const checklistId = req.params.id
    const deleteChecklist = await checklistService.deleteChecklist(checklistId)
    res.status(StatusCodes.OK).json(deleteChecklist)
  } catch (error) {
    next(error)
  }
}

// Thêm check item vào checklist
const addCheckItem = async (req, res, next) => {
  try {
    const checklistId = req.params.id
    const newCheckItem = await checklistService.addCheckItem(
      checklistId,
      req.body
    )
    res.status(StatusCodes.CREATED).json(newCheckItem)
  } catch (error) {
    next(error)
  }
}

// Cập nhật check item
const updateCheckItem = async (req, res, next) => {
  try {
    const { checklistId, itemId } = req.params
    const updatedCheckItem = await checklistService.updateCheckItem(
      checklistId,
      itemId,
      req.body
    )
    res.status(StatusCodes.OK).json(updatedCheckItem)
  } catch (error) {
    next(error)
  }
}

// Xóa check item
const deleteCheckItem = async (req, res, next) => {
  try {
    const { checklistId, itemId } = req.params
    const deletedCheckItem = await checklistService.deleteCheckItem(
      checklistId,
      itemId
    )
    res.status(StatusCodes.OK).json(deletedCheckItem)
  } catch (error) {
    next(error)
  }
}

// Cập nhật thứ tự check item
const updateCheckItemOrder = async (req, res, next) => {
  try {
    const checklistId = req.params.id
    const { itemOrder } = req.body
    const updatedOrder = await checklistService.updateCheckItemOrder(
      checklistId,
      itemOrder
    )
    res.status(StatusCodes.OK).json(updatedOrder)
  } catch (error) {
    next(error)
  }
}

export const checklistController = {
  createNew,
  update,
  deleteChecklist,
  addCheckItem,
  updateCheckItem,
  deleteCheckItem,
  updateCheckItemOrder
}
