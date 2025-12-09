import * as MembersModel from '../models/members.js';
import { validateMemberInput } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/members
 * Получить всех активных участников (публичный)
 */
export const getActiveMembers = asyncHandler(async (req, res) => {
  const members = MembersModel.getActiveMembers();
  res.json(members);
});

/**
 * GET /api/members/:id
 * Получить одного участника (публичный)
 */
export const getMemberById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = MembersModel.getMemberById(parseInt(id, 10));
  
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }
  
  res.json(member);
});

/**
 * GET /api/members/admin/list
 * Получить всех участников для админки
 */
export const getAllMembersAdmin = asyncHandler(async (req, res) => {
  const members = MembersModel.getAllMembersAdmin();
  res.json(members);
});

/**
 * POST /api/members
 * Создать нового участника
 */
export const createMember = asyncHandler(async (req, res) => {
  // Валидация
  const validatedData = validateMemberInput(req.body);
  
  // Создаём участника
  const member = MembersModel.createMember(validatedData);
  
  res.status(201).json(member);
});

/**
 * PUT /api/members/:id
 * Обновить участника
 */
export const updateMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const memberId = parseInt(id, 10);
  
  // Проверяем существование
  const existingMember = MembersModel.getMemberById(memberId);
  if (!existingMember) {
    throw new ApiError(404, 'Member not found');
  }
  
  // Валидация
  const validatedData = validateMemberInput(req.body, true);
  
  // Обновляем
  const member = MembersModel.updateMember(memberId, validatedData);
  
  res.json(member);
});

/**
 * DELETE /api/members/:id
 * Удалить участника (жёсткое удаление)
 */
export const deleteMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const memberId = parseInt(id, 10);
  
  // Проверяем существование
  const existingMember = MembersModel.getMemberById(memberId);
  if (!existingMember) {
    throw new ApiError(404, 'Member not found');
  }
  
  const result = MembersModel.deleteMember(memberId);
  res.json(result);
});

/**
 * PATCH /api/members/:id/reorder
 * Изменить порядок участника
 */
export const reorderMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { order_index } = req.body;
  const memberId = parseInt(id, 10);
  
  // Проверяем существование
  const existingMember = MembersModel.getMemberById(memberId);
  if (!existingMember) {
    throw new ApiError(404, 'Member not found');
  }
  
  // Валидация order_index
  const newOrder = parseInt(order_index, 10);
  if (isNaN(newOrder) || newOrder < 0) {
    throw new ApiError(400, 'Invalid order_index');
  }
  
  const member = MembersModel.reorderMember(memberId, newOrder);
  res.json(member);
});

export default {
  getActiveMembers,
  getMemberById,
  getAllMembersAdmin,
  createMember,
  updateMember,
  deleteMember,
  reorderMember
};
