import * as MembersModel from '../models/members.js';
import { validateMemberInput } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

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

/**
 * PUT /api/members/:id/leader
 * Назначить участника главой клана
 */
export const setLeader = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const memberId = parseInt(id, 10);
  
  // Проверяем существование
  const existingMember = MembersModel.getMemberById(memberId);
  if (!existingMember) {
    throw new ApiError(404, 'Member not found');
  }
  
  const member = MembersModel.setLeader(memberId);
  logger.info(`Leader set: ${member.name}`, { id: memberId });
  res.json(member);
});

/**
 * POST /api/members/import
 * Массовый импорт участников из JSON
 */
export const importMembers = asyncHandler(async (req, res) => {
  logger.request(req, 'Members import request');
  
  const { members } = req.body;
  
  // Валидация структуры JSON
  if (!members || !Array.isArray(members)) {
    throw new ApiError(400, 'Invalid JSON structure: members array is required');
  }
  
  if (members.length === 0) {
    throw new ApiError(400, 'Members array is empty');
  }
  
  // Проверяем каждого члена на наличие обязательных полей
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    if (!m.user_id || !m.nickname || !m.filename) {
      throw new ApiError(400, `Invalid member at index ${i}: user_id, nickname, and filename are required`);
    }
  }
  
  // Выполняем массовое обновление/создание
  const results = MembersModel.bulkUpsertMembers(members);
  
  res.json({
    success: true,
    updated: results.updated,
    created: results.created,
    processed: results.processed
  });
});

export default {
  getActiveMembers,
  getMemberById,
  getAllMembersAdmin,
  createMember,
  updateMember,
  deleteMember,
  reorderMember,
  setLeader,
  importMembers
};
