import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

const getBoards = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { page, itemPerPage, q } = req.query
    const queryFilters = q
    const results = await boardService.getBoards(userId, page, itemPerPage, queryFilters)
    res.status(StatusCodes.OK).json(results)
  } catch (error) {
    next(error)
  }
}
const getBoardAnalytics = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const boardId = req.params.id
    const query = req.query
    const board = await boardService.getBoardAnalytics(userId, boardId, query)
    res.status(StatusCodes.OK).json(board)
  } catch (error) {
    next(error)
  }
}

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const createdBoard = await boardService.createNew(userId, req.body)
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) {
    next(error)
  }
}
const getDetails = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const boardId = req.params.id
    const board = await boardService.getDetails(userId, boardId)
    res.status(StatusCodes.OK).json(board)
  } catch (error) {
    next(error)
  }
}
const update = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const updatedBoard = await boardService.update(boardId, req.body)
    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) {
    next(error)
  }
}
const moveCardToDifferentColumn = async (req, res, next) => {
  try {
    const result = await boardService.moveCardToDifferentColumn(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const getRolePermissions = async (userId, boardId) => {
  try {
    const rolePermissions = await boardService.getRolePermissions(userId, boardId)
    return rolePermissions
  } catch (error) {
    return new Error(error)
  }
}
const updateUserRole = async (req, res, next) => {
  try {
    const boardId = req.header('x-board-id')
    const userId = req.body.userId
    const role = req.body.role
    const result = await boardService.updateUserRole(userId, boardId, role)
    console.log(result)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  updateUserRole,
  getRolePermissions,
  getBoards,
  createNew,
  getDetails,
  moveCardToDifferentColumn,
  update,
  getBoardAnalytics
}
