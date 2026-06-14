import { ApiError } from "../../api/client";
import {
  getCurrentSeller as getGeneratedCurrentSeller,
  registerSeller as registerGeneratedSeller,
} from "../../api/generated/member/member";

const unwrapResponse = (response) => response?.data?.data ?? null;

async function registerSellerApi({ bankName, account }) {
  const response = await registerGeneratedSeller({ bankName, account });

  return unwrapResponse(response);
}

async function getMySellerInfoApi() {
  try {
    const response = await getGeneratedCurrentSeller();
    return unwrapResponse(response);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return null;
    }

    throw error;
  }
}

export { getMySellerInfoApi, registerSellerApi };
