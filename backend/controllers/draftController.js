import WorkflowDraft from '../models/WorkflowDraft.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';

const EDIT_EMPLOYEE_PROFILE = 'edit_employee_profile';

// Edit-profile drafts must always be tied to an employee in the active organization.
const validateReferenceOwnership = async (workflowType, referenceId, organizationId) => {
  if (workflowType !== EDIT_EMPLOYEE_PROFILE) return { valid: true };

  if (!referenceId || !mongoose.Types.ObjectId.isValid(referenceId)) {
    return {
      valid: false,
      status: 400,
      error: 'A valid employee referenceId is required for an employee profile draft'
    };
  }

  const employee = await Employee.findOne({ _id: referenceId, organizationId });
  if (!employee) return { valid: false, status: 404, error: 'Employee not found' };

  return { valid: true };
};

// GET /api/drafts?workflowType={type}&referenceId={id}
export const getDraft = async (req, res) => {
  try {
    const { workflowType, referenceId } = req.query;

    if (!workflowType) {
      return res.status(400).json({ success: false, error: 'workflowType is required' });
    }

    const ownership = await validateReferenceOwnership(workflowType, referenceId, req.organizationId);
    if (!ownership.valid) {
      return res.status(ownership.status).json({ success: false, error: ownership.error });
    }

    const query = {
      userId: req.user.id,
      organizationId: req.organizationId,
      workflowType,
      referenceId: referenceId && mongoose.Types.ObjectId.isValid(referenceId) ? referenceId : null
    };

    const draft = await WorkflowDraft.findOne(query);

    if (!draft) {
      return res.status(404).json({ success: false, error: 'Draft not found' });
    }

    return res.status(200).json({ success: true, data: draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch draft' });
  }
};

// PUT /api/drafts
export const upsertDraft = async (req, res) => {
  try {
    const { workflowType, referenceId, data } = req.body;

    if (!workflowType || !data) {
      return res.status(400).json({ success: false, error: 'workflowType and data are required' });
    }

    const ownership = await validateReferenceOwnership(workflowType, referenceId, req.organizationId);
    if (!ownership.valid) {
      return res.status(ownership.status).json({ success: false, error: ownership.error });
    }

    const query = {
      userId: req.user.id,
      organizationId: req.organizationId,
      workflowType,
      referenceId: referenceId && mongoose.Types.ObjectId.isValid(referenceId) ? referenceId : null
    };

    const draft = await WorkflowDraft.findOneAndUpdate(
      query,
      { data },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, data: draft });
  } catch (error) {
    console.error('Error saving draft:', error);
    return res.status(500).json({ success: false, error: 'Failed to save draft' });
  }
};

// DELETE /api/drafts?workflowType={type}&referenceId={id}
export const deleteDraft = async (req, res) => {
  try {
    const { workflowType, referenceId } = req.query;

    if (!workflowType) {
      return res.status(400).json({ success: false, error: 'workflowType is required' });
    }

    const ownership = await validateReferenceOwnership(workflowType, referenceId, req.organizationId);
    if (!ownership.valid) {
      return res.status(ownership.status).json({ success: false, error: ownership.error });
    }

    const query = {
      userId: req.user.id,
      organizationId: req.organizationId,
      workflowType,
      referenceId: referenceId && mongoose.Types.ObjectId.isValid(referenceId) ? referenceId : null
    };

    const result = await WorkflowDraft.deleteOne(query);

    return res.status(200).json({ success: true, deleted: result.deletedCount > 0 });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete draft' });
  }
};
