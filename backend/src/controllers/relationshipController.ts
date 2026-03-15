import type { RequestHandler } from "express";

const createRelationship: RequestHandler = async (req, res, next) => {};
const getRelationships: RequestHandler = async (req, res, next) => {};
const getRelationshipById: RequestHandler = async (req, res, next) => {};
const updateRelationship: RequestHandler = async (req, res, next) => {};
const deleteRelationship: RequestHandler = async (req, res, next) => {};

export {
  createRelationship,
  getRelationships,
  getRelationshipById,
  updateRelationship,
  deleteRelationship,
};
