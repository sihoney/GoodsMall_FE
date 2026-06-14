import { ApiError } from '../../api/client';
import {
  changeCurrentMemberPassword as changeGeneratedCurrentMemberPassword,
  createPresignedUploadUrl as createGeneratedPresignedUploadUrl,
  getCurrentMemberOauthAccounts as getGeneratedCurrentMemberOauthAccounts,
  getMember as getGeneratedMember,
  unlinkCurrentMemberOauthAccount as unlinkGeneratedCurrentMemberOauthAccount,
  updateCurrentMember as updateGeneratedCurrentMember,
} from '../../api/generated/member/member';

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? null;

export async function getMemberByIdApi(memberId) {
  if (!memberId) {
    return null;
  }

  const response = await getGeneratedMember(memberId);
  return unwrapResponse(response);
}

export async function updateCurrentMemberApi({
  nickname,
  phone = null,
  address = null,
  profileImageKey = null,
}) {
  const response = await updateGeneratedCurrentMember({
    nickname,
    phone,
    address,
    profileImageKey,
  });

  return unwrapResponse(response);
}

export async function changeCurrentMemberPasswordApi({
  currentPassword,
  newPassword,
}) {
  const response = await changeGeneratedCurrentMemberPassword({
    currentPassword,
    newPassword,
  });

  return unwrapResponse(response);
}

export async function getMyOauthAccountsApi() {
  const response = await getGeneratedCurrentMemberOauthAccounts();
  return unwrapResponse(response);
}

export async function unlinkMyOauthAccountApi(provider) {
  if (!provider) {
    throw new ApiError({
      status: 400,
      code: 'BAD_REQUEST',
      message: '해제할 외부 계정 정보가 필요합니다.',
    });
  }

  const response = await unlinkGeneratedCurrentMemberOauthAccount(provider);

  return unwrapResponse(response);
}

export async function presignProfileImageUploadApi({ fileName, contentType }) {
  const response = await createGeneratedPresignedUploadUrl({ fileName, contentType });

  return unwrapResponse(response);
}

export async function uploadProfileImageToS3({ uploadUrl, file, contentType }) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType || file?.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: 'S3_UPLOAD_FAILED',
      message: '프로필 이미지 업로드에 실패했습니다.',
    });
  }

  return true;
}
