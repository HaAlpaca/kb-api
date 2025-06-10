import { StatusCodes } from 'http-status-codes'
import { boardModel } from '~/models/boardModel'
import { invitationModel } from '~/models/invitationModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { BOARD_INVITATION_STATUS, INVITATION_TYPES } from '~/utils/constants'
import { pickUser } from '~/utils/formatters'
import { getSocketInstance } from '~/sockets/socketInstance'
/* eslint-disable no-useless-catch */
const createNewBoardInvitation = async (reqBody, inviterId) => {
  try {
    // ng di moi
    const inviter = await userModel.findOneById(inviterId)
    // ng dc moi
    const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)
    // tim board
    const board = await boardModel.findOneById(reqBody.boardId)

    if (!inviter || !invitee || !board)
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter, invitee or board not found!')

    const newInvitationData = {
      inviterId,
      inviteeId: invitee._id.toString(),
      type: INVITATION_TYPES.BOARD_INVITATION,
      boardInvitation: {
        boardId: board._id.toString(),
        status: BOARD_INVITATION_STATUS.PENDING
      }
    }

    const createdInvitation = await invitationModel.createNewBoardInvitation(newInvitationData)
    const getInvitation = await invitationModel.findOneById(createdInvitation.insertedId.toString())

    // data cho fe xu li
    const resInvitation = {
      ...getInvitation,
      board,
      inviter: pickUser(inviter),
      invitee: pickUser(invitee)
    }
    return resInvitation
  } catch (error) {
    throw error
  }
}

export const getInvitations = async userId => {
  try {
    const getInvitations = await invitationModel.findByUser(userId)
    // data dang tra ve inviter la 1 mang => can dua ve 1 object thoi
    const resInvitations = getInvitations.map(invitation => {
      return {
        ...invitation,
        inviter: invitation.inviter[0] || [],
        invitee: invitation.invitee[0] || [],
        board: invitation.board[0] || {}
      }
    })
    return resInvitations
  } catch (error) {
    throw error
  }
}

const updateBoardInvitation = async (userId, invitationId, status) => {
  try {
    //
    const getInvitation = await invitationModel.findOneById(invitationId)
    if (!getInvitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found!')
    const boardId = getInvitation.boardInvitation.boardId
    const getBoard = await boardModel.findOneById(boardId)
    if (!getBoard) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    const boardOwnerAndMemberIds = [...getBoard.ownerIds, ...getBoard.memberIds].toString()
    if (status === BOARD_INVITATION_STATUS.ACCEPTED && boardOwnerAndMemberIds.includes(userId)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are already a member of this board!')
    }
    // update data json object
    const updateData = {
      boardInvitation: {
        ...getInvitation.boardInvitation,
        status: status
      }
    }
    // update trong invitation
    const updatededInvitation = await invitationModel.update(
      invitationId,
      updateData // => status accecpt hay reject
    )
    // update trong board
    if (updatededInvitation.boardInvitation.status === BOARD_INVITATION_STATUS.ACCEPTED) {
      await boardModel.pushMemberIds(boardId, userId)
    }

    const io = getSocketInstance()
    io.to(getBoard._id.toString()).emit('BE_UPDATE_BOARD', getBoard)
    return updatededInvitation
  } catch (error) {
    throw error
  }
}

export const invitationService = {
  createNewBoardInvitation,
  getInvitations,
  updateBoardInvitation
}
