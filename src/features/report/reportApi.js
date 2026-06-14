import {
  approveReport as approveGeneratedReport,
  createReport as createGeneratedReport,
  createRestriction as createGeneratedRestriction,
  deactivateRestriction as deactivateGeneratedRestriction,
  getAllReports as getGeneratedAllReports,
  getMemberRestrictions as getGeneratedMemberRestrictions,
  getMyReports as getGeneratedMyReports,
  getReportDetail as getGeneratedReportDetail,
  rejectReport as rejectGeneratedReport,
} from '../../api/generated/member/member';

const unwrapResponse = (response, fallback = undefined) =>
  response?.data?.data ?? response?.data ?? fallback;

export async function createMemberReport(payload) {
  const response = await createGeneratedReport(payload, {});

  return unwrapResponse(response);
}

export async function getMyMemberReports() {
  const response = await getGeneratedMyReports({});

  return unwrapResponse(response, []);
}

export async function getAdminMemberReports() {
  const response = await getGeneratedAllReports({});

  return unwrapResponse(response, []);
}

export async function getAdminMemberReportDetail(reportId) {
  const response = await getGeneratedReportDetail(reportId, {});

  return unwrapResponse(response);
}

export async function approveAdminMemberReport(reportId, payload) {
  const response = await approveGeneratedReport(reportId, payload, {});

  return unwrapResponse(response);
}

export async function rejectAdminMemberReport(reportId, payload) {
  const response = await rejectGeneratedReport(reportId, payload, {});

  return unwrapResponse(response);
}

export async function getAdminMemberRestrictions(memberId) {
  const response = await getGeneratedMemberRestrictions(memberId, {});

  return unwrapResponse(response, []);
}

export async function createAdminMemberRestriction(payload) {
  const response = await createGeneratedRestriction(payload, {});

  return unwrapResponse(response);
}

export async function deactivateAdminMemberRestriction(restrictionId) {
  const response = await deactivateGeneratedRestriction(restrictionId, {});

  return unwrapResponse(response);
}
