import {
  cancelAccountVerification as cancelGeneratedAccountVerification,
  confirmAccountVerification as confirmGeneratedAccountVerification,
  getCurrentAccountVerification as getGeneratedCurrentAccountVerification,
  resendAccountVerification as resendGeneratedAccountVerification,
} from "../../api/generated/member/member";

const unwrapResponse = (response) => response?.data?.data ?? null;

async function getCurrentAccountVerificationApi() {
  const response = await getGeneratedCurrentAccountVerification();

  return unwrapResponse(response);
}

async function confirmAccountVerificationApi({ sessionId, code }) {
  const response = await confirmGeneratedAccountVerification(sessionId, { code });

  return unwrapResponse(response);
}

async function resendAccountVerificationApi(sessionId) {
  const response = await resendGeneratedAccountVerification(sessionId);

  return unwrapResponse(response);
}

async function cancelAccountVerificationApi(sessionId) {
  const response = await cancelGeneratedAccountVerification(sessionId);

  return unwrapResponse(response);
}

export {
  cancelAccountVerificationApi,
  confirmAccountVerificationApi,
  getCurrentAccountVerificationApi,
  resendAccountVerificationApi,
};
